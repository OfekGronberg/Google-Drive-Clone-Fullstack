import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ImageMenuModal } from "../components/ImageMenu";
import { uploadImage } from "../api/FileManager";

const API = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export default function SignupPage() {
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const nameRef = useRef(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Image menu state
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [chosenImage, setChosenImage] = useState(null); // { kind, src, name?, file?, blob? }

  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const username = usernameRef.current.value.trim();
    const password = passwordRef.current.value.trim();
    const name = nameRef.current.value.trim();

    if (!username) {
      setError("username is required");
      return;
    }
    if (!password) {
      setError("password is required");
      return;
    }
    let errors = "";
    if(username.length < 8)
      errors += "username must be at least 8 characters long\n";
    for(let i = 0; i < username.length; i++){
      if (!("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._".includes(username[i]))) {
        errors += "username can only contain English letters, numbers, periods, and underscores\n";
        break;
      }
    }
    if (password.length < 8 || password.length > 20) {
      errors += "password must contain between 8 and 20 characters (inc.)\n";
    }
    for(let i = 0; i < password.length; i++){
      if (!("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.!@#$%^&*()-_+=".includes(password[i]))) {
        errors += "password can only contain English letters, numbers, and the symbols .!@#$%^&*()-_+=\n";
        break;
      }
    }
    if (errors.length > 0) { setError(errors); return; }

    setLoading(true);

    try {
      const body = {
        username: username,
        password: password,
        ...(name ? { name } : {}),
      };

      const res = await fetch(`${API}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // After signup, automatically request a token and log the user in
        try {
          const tokenResp = await fetch(`${API}/api/tokens`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username, password: password }),
          });

          if (tokenResp.ok) {
            const tokenData = await tokenResp.json();
            if (tokenData.token) {
              try {
                const b = tokenData.token.split(".")[1];
                const payload = JSON.parse(
                  atob(b.replace(/-/g, "+").replace(/_/g, "/"))
                );

                // Store token in localStorage FIRST so uploadImage can use it
                localStorage.setItem("token", tokenData.token);
                if (payload?.userId) {
                  localStorage.setItem("userId", payload.userId);
                }

                // Upload image if one was selected
                if (chosenImage?.file || chosenImage?.blob || chosenImage?.src) {
                  try {
                    console.log("Image payload:", chosenImage);
                    let uploadPromise;

                    // Handle file/blob uploads (from upload or camera)
                    if (chosenImage?.file || chosenImage?.blob) {
                      const fileOrBlob = chosenImage.file || chosenImage.blob;
                      uploadPromise = uploadImage(fileOrBlob);
                    }
                    // Handle default icons (convert data URL to blob and upload)
                    else if (chosenImage?.kind === "default" && chosenImage?.src) {
                      // Convert data URL to blob
                      const response = await fetch(chosenImage.src);
                      const blob = await response.blob();
                      uploadPromise = uploadImage(blob);
                    }

                    if (uploadPromise) {
                      const result = await uploadPromise;
                      console.log("Image upload result:", result);
                      if (result?.url && payload?.userId) {
                        // Update user profile with the image URL
                        const profileResp = await fetch(`${API}/api/users/${payload.userId}`, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${tokenData.token}`
                          },
                          body: JSON.stringify({ imageUrl: result.url })
                        });
                        if (profileResp.ok) {
                          console.log("Profile image set successfully:", result.url);
                          // Give backend time to process before navigation
                          await new Promise(resolve => setTimeout(resolve, 500));
                        } else {
                          const errorText = await profileResp.text();
                          console.error("Failed to update profile:", errorText);
                        }
                      }
                    }
                  } catch (imgErr) {
                    console.error("Image upload failed:", imgErr);
                  }
                }

                // Login (triggers auth context update)
                auth.login(tokenData.token, payload?.userId);

              } catch (e) {
                auth.login(tokenData.token);
              }
            }
          }

          navigate("/files");
        } catch (e) {
          navigate("/login");
        }
      } else {
        try {
          const data = await res.json();
          if (data.error) setError(data.error);
          else setError(`signup failed (status: ${res.status})`);
        } catch (err) {
          setError(`signup failed (status: ${res.status})`);
        }
      }
    } catch (err) {
      setError(`server error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          margin: "0 auto",
          padding: "40px 20px",
          backgroundColor: "white",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "32px",
          }}
        >
          Sign up
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Username
            </label>
            <input
              type="text"
              ref={usernameRef}
              placeholder="Enter your username"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Password
            </label>
            <input
              type="password"
              ref={passwordRef}
              placeholder="Enter your password"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Name
            </label>
            <input
              type="text"
              ref={nameRef}
              placeholder="Enter your name (optional)"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                fontSize: "12px",
                color: "#666",
                marginTop: "4px",
              }}
            >
              Leave blank to keep the current name
            </div>
          </div>

          {/* Avatar / Image picker */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Profile image (optional)
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "#fafafa",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                title={chosenImage?.name ?? ""}
              >
                {chosenImage?.src ? (
                  <img
                    src={chosenImage.src}
                    alt="Selected"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 12, color: "#888" }}>none</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setImageMenuOpen(true)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Choose image…
              </button>

              {chosenImage?.src && (
                <button
                  type="button"
                  onClick={() => setChosenImage(null)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    backgroundColor: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#b00020",
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            <div style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
              You can pick a default icon, upload an image, or take a picture.
            </div>
          </div>

          {error && (
            <div
              style={{
                color: "red",
                marginBottom: "16px",
                fontSize: "14px",
                whiteSpace: "pre-line",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              width: "100%",
              backgroundColor: loading ? "#ccc" : "#4285f4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Loading..." : "Sign Up"}
          </button>
        </form>

        <p
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "14px",
            color: "#666",
          }}
        >
          Already have an account?{" "}
          <a href="/login" style={{ color: "#4285f4" }}>
            Login
          </a>
        </p>

        {/* Modal */}
        <ImageMenuModal
          open={imageMenuOpen}
          onCancel={() => setImageMenuOpen(false)}
          onConfirm={(payload) => {
            setChosenImage(payload);
            setImageMenuOpen(false);
          }}
        />
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import "./ImageMenu.css";

/**
 * Captcha-style image chooser modal.
 * - choose: grid of images from ../default_icons
 * - upload: file picker (preview)
 * - take: camera capture (preview)
 *
 * Props:
 * - open: boolean
 * - onCancel: () => void
 * - onConfirm: (payload) => void
 *      payload = { kind: "default"|"upload"|"camera", src: string, name?: string, file?: File, blob?: Blob }
 */
export function ImageMenuModal({ open, onCancel, onConfirm }) {
  const [tab, setTab] = useState("choose"); // "choose" | "upload" | "take"
  const [selected, setSelected] = useState(null); // {kind, src, name?, file?, blob?}
  const [uploadPreview, setUploadPreview] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Load default icons from ../default_icons (CRA/Webpack)
  const defaultIcons = useMemo(() => {
    try {
      // change path if your folder differs
      const ctx = require.context("../default_icons", false, /\.(png|jpe?g|svg|webp)$/i);
      return ctx.keys().map((k) => {
        const src = ctx(k);
        const name = k.replace("./", "");
        return { src, name };
      });
    } catch {
      return [];
    }
  }, []);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (uploadPreview?.startsWith("blob:")) URL.revokeObjectURL(uploadPreview);
    };
  }, [uploadPreview]);

  // Start/stop camera when modal/tab changes
  useEffect(() => {
    const stopCamera = () => {
      try {
        streamRef.current?.getTracks?.().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;
      setCameraReady(false);
    };

    if (!open) {
      stopCamera();
      setCameraError("");
      return;
    }

    if (tab !== "take") {
      stopCamera();
      setCameraError("");
      return;
    }

    (async () => {
      try {
        setCameraError("");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (e) {
        setCameraError(e?.message ?? String(e));
        stopCamera();
      }
    })();

    return () => stopCamera();
  }, [open, tab]);

  // Reset selection when opening (optional)
  useEffect(() => {
    if (!open) return;
    setTab("choose");
    setSelected(null);
    setUploadPreview(null);
    setCameraError("");
  }, [open]);

  if (!open) return null;

  const canConfirm = Boolean(selected?.src);

  function confirm() {
    if (!selected) return;
    onConfirm?.(selected);
  }

  function chooseDefault(icon) {
    setSelected({ kind: "default", src: icon.src, name: icon.name });
  }

  function onUploadFile(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
    setSelected({ kind: "upload", src: url, name: file.name, file });
  }

  async function takePicture() {
    setCameraError("");
    try {
      const v = videoRef.current;
      if (!v) return;

      const w = v.videoWidth || 640;
      const h = v.videoHeight || 480;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(v, 0, 0, w, h);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Failed to capture image.");

      const url = URL.createObjectURL(blob);
      setSelected({ kind: "camera", src: url, name: "camera.png", blob });
    } catch (e) {
      setCameraError(e?.message ?? String(e));
    }
  }

  return (
    <div
      className="imageMenuOverlay"
      onMouseDown={(e) => {
        // click-outside closes (optional)
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div className="imageMenuDialog" role="dialog" aria-modal="true">
        {/* Header tabs */}
        <div className="imageMenuTabs">
          {[
            { key: "choose", label: "Choose" },
            { key: "upload", label: "Upload" },
            { key: "take", label: "Take" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`imageMenuTab ${tab === t.key ? "isActive" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="imageMenuMain">
          {tab === "choose" && (
            <>
              {defaultIcons.length === 0 ? (
                <div className="imageMenuEmpty">
                  No images found in <code>../default_icons</code>.
                  <br />
                  (Check the folder path and that CRA can import them.)
                </div>
              ) : (
                <div className="imageMenuGrid">
                  {defaultIcons.map((ic) => {
                    const active = selected?.kind === "default" && selected?.name === ic.name;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => chooseDefault(ic)}
                        className={`imageMenuGridBtn ${active ? "isActive" : ""}`}
                        title={ic.name}
                      >
                        <div className="imageMenuGridBtnInner">
                          <img
                            src={ic.src}
                            alt={ic.name}
                            className="imageMenuGridImg"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {tab === "upload" && (
            <div className="imageMenuStack">
              <label className="imageMenuUploadLabel">
                Upload image…
                <input
                  type="file"
                  accept="image/*"
                  className="imageMenuHiddenInput"
                  onChange={(e) => onUploadFile(e.target.files?.[0])}
                />
              </label>

              {uploadPreview && (
                <div className="imageMenuCard">
                  <div className="imageMenuCardTitle">Preview</div>
                  <div className="imageMenuPreviewBox">
                    <img
                      src={uploadPreview}
                      alt="Upload preview"
                      className="imageMenuPreviewImg"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "take" && (
            <div className="imageMenuStack">
              {cameraError && (
                <div className="imageMenuError">Camera error: {cameraError}</div>
              )}

              <div className="imageMenuCard">
                <div className="imageMenuCardTitle">Camera preview</div>

                <div className="imageMenuVideoBox">
                  <video ref={videoRef} playsInline className="imageMenuVideo" />
                </div>

                <button
                  type="button"
                  onClick={takePicture}
                  disabled={!cameraReady}
                  className="imageMenuTakeBtn"
                >
                  Take a picture
                </button>
              </div>

              {selected?.kind === "camera" && selected?.src && (
                <div className="imageMenuCard">
                  <div className="imageMenuCardTitle">Captured</div>
                  <div className="imageMenuPreviewBox">
                    <img
                      src={selected.src}
                      alt="Captured"
                      className="imageMenuPreviewImg"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="imageMenuFooter">
          <button type="button" onClick={onCancel} className="imageMenuBtn">
            Cancel
          </button>

          <button
            type="button"
            onClick={confirm}
            disabled={!canConfirm}
            className="imageMenuBtn imageMenuBtnPrimary"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import "./UploadWindow.css";


/**
 * UploadWindow
 * Props:
 * - open: boolean
 * - onCancel: () => void
 * - onUpload: ({ name, content, file }) => Promise<void> | void
 */
export default function UploadWindow({ open, onCancel, onUpload }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setDragOver(false);
    setBusy(false);
    setErr("");
  }, [open]);

  if (!open) return null;

  function chooseFile() {
    inputRef.current?.click?.();
  }

  function onPick(f) {
    if (!f) return;
    setErr("");
    setFile(f);
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    onPick(f);
  }

  function readAsTextOrDataUrl(f) {
    const isTextLike =
      f.type?.startsWith("text/") ||
      /\.(txt|md|js|ts|jsx|tsx|json|html|css|csv|xml)$/i.test(f.name);

    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(new Error("Failed to read file"));
      r.onload = () => resolve(String(r.result ?? ""));
      if (isTextLike) r.readAsText(f);
      else r.readAsDataURL(f); // data:*;base64,...
    });
  }

  async function upload() {
    if (!file) {
      setErr("Choose a file first.");
      return;
    }
    setBusy(true);
    setErr("");

    try {
      const content = await readAsTextOrDataUrl(file);
      await Promise.resolve(onUpload?.({ name: file.name, content, file }));
    } catch (e) {
      setErr(e?.message ?? String(e));
      setBusy(false);
      return;
    }

    setBusy(false);
  }

  return (
    <div
      className="uploadOverlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div className="uploadWindow" role="dialog" aria-modal="true">
        <div className="uploadHeader">
          <div className="uploadTitle">Upload</div>
        </div>

        <div
          className={`uploadDrop ${dragOver ? "isDragOver" : ""}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={onDrop}
        >
          <div className="uploadHint">
            {file ? `Selected: ${file.name}` : "Drag a file here or choose one."}
          </div>

          <div className="uploadActionsRow">
            <button type="button" className="uploadBtn" onClick={chooseFile} disabled={busy}>
              Choose file
            </button>

            <input
              ref={inputRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => onPick(e.target.files?.[0])}
            />
          </div>

          {err && <div className="uploadError">{err}</div>}
        </div>

        <div className="uploadFooter">
          <button type="button" className="uploadBtn cancel" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="uploadBtn primary" onClick={upload} disabled={busy || !file}>
            {busy ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

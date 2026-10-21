import React from "react";
import "./InfoMenu.css";

function formatDate(isoString) {
  const d = new Date(isoString);

  const pad = (n) => String(n).padStart(2, "0");

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();

  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());

  return `${day}/${month}/${year} -  ${hours}:${mins}`;
}

function formatBytes(input) {
  const bytes = new TextEncoder().encode(String(input)).length;

  const units = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0B";

  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** i;
  const shown =
    value >= 10 || Number.isInteger(value) ? Math.round(value).toString() : value.toFixed(1);
  return `${shown}${units[i]}`;
}

/**
 * Usage:
 *  <InfoMenu file={selectedFile} isOpen={showInfo} onClose={() => setShowInfo(false)} />
 */
export default function InfoMenu({ file, isOpen = !!file, onClose }) {
  if (!isOpen || !file) return null;
  const title = `${file.name ?? "Untitled"} (id: ${file.id ?? "none"})`;

  return (
    <div className="infoMenuOverlay" onMouseDown={onClose}>
      <div
        className="infoMenuModal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="File info"
      >
        <div className="infoMenuHeader">
          <div className="infoMenuTitle" title={title}>
            {title}
          </div>

          <button
            className="infoMenuCloseBtn"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="infoMenuBody">
          <InfoRow label="Type" value={file.type} />
          <InfoRow label="Parent" value={file.parentId} />
          {file.createdAt ? <InfoRow label="Created" value={formatDate(file.createdAt)} /> : null}
          {file.lastViewed ? <InfoRow label="Last viewed" value={formatDate(file.lastViewed)} /> : null}
          {file.lastChange ? <InfoRow label="Last change" value={formatDate(file.lastChange)} /> : null}
          {file.type === 'file' ? <InfoRow label="Size" value={formatBytes(file.content)} /> : null}
          {file.type === 'folder' ? <InfoRow label="Size" value={(file.content ?? []).length + " items"} /> : null}
        </div>

        <div className="infoMenuFooter">
          <button className="infoMenuOkBtn" onClick={onClose} type="button">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="infoMenuRow">
      <div className="infoMenuLabel">{label}</div>
      <div className="infoMenuValue">{value ?? "—"}</div>
    </div>
  );
}

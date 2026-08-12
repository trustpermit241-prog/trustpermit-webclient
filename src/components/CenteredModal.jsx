import React from "react";
import "./CenteredModal.css";

export default function CenteredModal({
  open,
  title,
  message,
  buttonText = "OK",
  cancelText = "Cancel",
  onClose,
  onConfirm,
  onCancel,
  variant = "default",
  hideActions = false,
  className = "",
  overlayClassName = "",
  children,
}) {
  if (!open) return null;

  const handleClose = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  return (
    <div className={`cm-overlay ${overlayClassName}`.trim()} role="dialog" aria-modal="true">
      <div className={`cm-card cm-${variant} ${className}`.trim()}>
        {(onClose || onCancel) && (
          <button type="button" className="cm-close-btn" onClick={handleClose} aria-label="Close modal">
            ×
          </button>
        )}
        {title && <div className="cm-icon">{variant === "success" ? "✔️" : variant === "error" ? "⚠️" : ""}</div>}
        {title && <h3 className="cm-title">{title}</h3>}
        {children ? (
          <div className="cm-content">{children}</div>
        ) : (
          <div className="cm-message">{message}</div>
        )}
        {!hideActions && (
          <div className="cm-actions">
            {onConfirm ? (
              <>
                <button type="button" className="cm-btn cm-btn-cancel" onClick={onCancel || handleClose}>
                  {cancelText}
                </button>
                <button type="button" className="cm-btn" onClick={onConfirm}>
                  {buttonText}
                </button>
              </>
            ) : (
              <button type="button" className="cm-btn" onClick={handleClose}>{buttonText}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

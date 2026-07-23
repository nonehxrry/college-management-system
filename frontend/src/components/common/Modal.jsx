import { useEffect, useRef } from "react";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
  showClose = true,
  closeOnOverlay = true,
  icon,
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape" && isOpen) onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-6xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`${sizes[size]} w-full bg-white rounded-2xl shadow-2xl animate-slide-up overflow-hidden outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xl">
                {icon}
              </div>
            )}
            <h2 className="font-display font-bold text-gray-900 text-lg">{title}</h2>
          </div>
          {showClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-150"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">{children}</div>

        {footer && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", confirmClass = "btn-danger", loading = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} icon="⚠️" size="sm">
    <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
    <div className="flex gap-3 mt-6">
      <button onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
      <button onClick={onConfirm} className={`${confirmClass} flex-1`} disabled={loading}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : confirmText}
      </button>
    </div>
  </Modal>
);

export default Modal;
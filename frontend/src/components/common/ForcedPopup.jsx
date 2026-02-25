import { useState, useEffect } from "react";
import { useNotifications }    from "../../context/NotificationContext";

const PRIORITY_STYLES = {
  urgent:    { border: "border-red-400",   bg: "bg-red-50",    icon: "🚨", headerBg: "bg-red-600",    btnClass: "bg-red-600 hover:bg-red-700" },
  important: { border: "border-amber-400", bg: "bg-amber-50",  icon: "⚠️", headerBg: "bg-amber-500",  btnClass: "bg-amber-500 hover:bg-amber-600" },
  normal:    { border: "border-blue-400",  bg: "bg-blue-50",   icon: "📢", headerBg: "bg-blue-600",   btnClass: "bg-blue-600 hover:bg-blue-700" },
};

const ForcedPopup = () => {
  const { forcedPopup, dismissForcedPopup } = useNotifications();
  const [countdown, setCountdown] = useState(5);
  const [canDismiss, setCanDismiss] = useState(false);

  // Reset countdown whenever a new popup appears
  useEffect(() => {
    if (!forcedPopup) return;
    setCountdown(5);
    setCanDismiss(false);

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          setCanDismiss(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [forcedPopup?._id]);

  if (!forcedPopup) return null;

  const priority = forcedPopup.priority || "normal";
  const style    = PRIORITY_STYLES[priority] || PRIORITY_STYLES.normal;

  return (
    /* Full-screen overlay — pointer-events-none is NOT set, so clicks on overlay do nothing */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-lg rounded-2xl border-2 ${style.border} ${style.bg} shadow-2xl overflow-hidden animate-slide-up`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="forced-popup-title"
      >
        {/* Coloured header bar */}
        <div className={`${style.headerBg} px-6 py-4 flex items-center gap-3`}>
          <span className="text-2xl">{style.icon}</span>
          <div className="flex-1">
            <p className="text-white font-display font-bold text-base leading-tight" id="forced-popup-title">
              {forcedPopup.title}
            </p>
            <p className="text-white/70 text-xs mt-0.5 capitalize">
              {priority} notice — acknowledgement required
            </p>
          </div>
          {/* Live "must read" indicator */}
          {!canDismiss && (
            <span className="text-white/80 text-xs font-bold font-mono bg-white/20 px-2.5 py-1 rounded-full">
              {countdown}s
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-800 text-sm leading-relaxed">{forcedPopup.message}</p>

          {forcedPopup.attachmentUrl && (
            <a
              href={forcedPopup.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2"
            >
              📎 View Attachment
            </a>
          )}

          {/* Source info */}
          {(forcedPopup.createdBy || forcedPopup.sender) && (
            <p className="text-xs text-gray-400 mt-4 border-t border-gray-200 pt-3">
              From: <span className="font-medium text-gray-600">{forcedPopup.createdBy || forcedPopup.sender}</span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            disabled={!canDismiss}
            onClick={() => dismissForcedPopup(forcedPopup._id)}
            className={`w-full py-3 px-6 rounded-xl text-white font-bold text-sm transition-all duration-200
              ${canDismiss
                ? `${style.btnClass} shadow-lg hover:shadow-xl active:scale-[0.98]`
                : "bg-gray-300 cursor-not-allowed opacity-60"
              }`}
          >
            {canDismiss ? "✓ I have read and acknowledge this notice" : `Please wait ${countdown}s…`}
          </button>

          {!canDismiss && (
            <p className="text-center text-xs text-gray-400 mt-2">
              You must read the notice before dismissing it
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForcedPopup;
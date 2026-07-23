import { useState } from "react";
import { formatDateTime } from "../../utils/helpers";
import { studentService } from "../../services/studentService";
import toast from "react-hot-toast";

const mockNotices = [
  { _id: "1", title: "Fee Payment Deadline Extended", content: "The last date for fee submission has been extended to 15th February 2024. Please ensure timely payment to avoid late fees.", createdBy: "Administration", priority: "urgent", createdAt: new Date(Date.now() - 3600000), isRead: false, attachmentUrl: null, targetType: "global" },
  { _id: "2", title: "End Semester Examination Schedule Released", content: "The date sheet for End Semester Examinations has been published. Students are advised to check the examination portal and prepare accordingly.", createdBy: "Examination Cell", priority: "important", createdAt: new Date(Date.now() - 86400000), isRead: false, attachmentUrl: "#", targetType: "global" },
  { _id: "3", title: "Library Book Return Notice", content: "All students are requested to return borrowed library books before 28th February. A fine of ₹5 per day will be levied after the due date.", createdBy: "Library", priority: "normal", createdAt: new Date(Date.now() - 3 * 86400000), isRead: true, attachmentUrl: null, targetType: "global" },
  { _id: "4", title: "Class Cancelled Tomorrow — OS Lab", content: "Operating Systems Lab class scheduled for tomorrow (2pm-5pm) stands cancelled. A makeup class will be announced shortly.", createdBy: "Dr. Kumar", priority: "normal", createdAt: new Date(Date.now() - 5 * 86400000), isRead: true, attachmentUrl: null, targetType: "section" },
];

const priorityConfig = {
  urgent:    { badge: "badge-danger",  borderClass: "border-l-red-500",   icon: "🚨" },
  important: { badge: "badge-warning", borderClass: "border-l-amber-500", icon: "⚠️" },
  normal:    { badge: "badge-info",    borderClass: "border-l-blue-400",  icon: "📢" },
};

const Notices = () => {
  const [notices, setNotices] = useState(mockNotices);
  const [filter, setFilter]   = useState("all");
  const [expanded, setExpanded] = useState(null);

  const markRead = async (noticeId) => {
    try { await studentService.markNoticeRead(noticeId); } catch {}
    setNotices((prev) => prev.map((n) => n._id === noticeId ? { ...n, isRead: true } : n));
  };

  const handleExpand = (notice) => {
    setExpanded(expanded === notice._id ? null : notice._id);
    if (!notice.isRead) markRead(notice._id);
  };

  const markAllRead = () => {
    setNotices((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All notices marked as read");
  };

  const filtered = notices.filter((n) => {
    if (filter === "unread")    return !n.isRead;
    if (filter === "urgent")    return n.priority === "urgent";
    if (filter === "important") return n.priority === "important";
    return true;
  });

  const unreadCount = notices.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Notices</h1>
          <p className="page-subtitle">{unreadCount > 0 ? `${unreadCount} unread notice${unreadCount > 1 ? "s" : ""}` : "All caught up!"}</p>
        </div>
        {unreadCount > 0 && <button onClick={markAllRead} className="btn-secondary text-sm py-2">✓ Mark All Read</button>}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all",       label: "All",          count: notices.length },
          { key: "unread",    label: "Unread",        count: unreadCount },
          { key: "urgent",    label: "🚨 Urgent",     count: notices.filter((n) => n.priority === "urgent").length },
          { key: "important", label: "⚠️ Important",  count: notices.filter((n) => n.priority === "important").length },
        ].map(({ key, label, count }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all
              ${filter === key ? "bg-primary-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300"}`}>
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>{count}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16"><div className="text-5xl mb-3">📭</div><p className="font-semibold text-gray-700">No notices</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notice) => {
            const pConf = priorityConfig[notice.priority];
            const isExpanded = expanded === notice._id;
            return (
              <div key={notice._id} className={`border-l-4 ${pConf.borderClass} rounded-2xl overflow-hidden bg-white border border-gray-100 ${!notice.isRead ? "shadow-md" : ""}`}>
                <div className="p-5 cursor-pointer hover:bg-black/[0.01]" onClick={() => handleExpand(notice)}>
                  <div className="flex items-start gap-4">
                    <div className="text-2xl flex-shrink-0">{pConf.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {!notice.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />}
                        <p className={`font-semibold text-gray-900 text-sm ${!notice.isRead ? "font-bold" : ""}`}>{notice.title}</p>
                        <span className={`badge ${pConf.badge} text-[10px] capitalize`}>{notice.priority}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span>📌 {notice.createdBy}</span>
                        <span>🕐 {formatDateTime(notice.createdAt)}</span>
                      </div>
                      {!isExpanded && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{notice.content}</p>}
                    </div>
                    <span className="text-gray-400 text-xs">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 animate-fade-in">
                    <p className="text-sm text-gray-700 leading-relaxed mt-3">{notice.content}</p>
                    {notice.attachmentUrl && (
                      <a href={notice.attachmentUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-1.5 px-3 mt-4 inline-flex items-center gap-1.5">📎 View Attachment</a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notices;
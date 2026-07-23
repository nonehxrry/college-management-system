import { useState } from "react";
import FileUploader from "../common/FileUploader";
import toast from "react-hot-toast";
import { professorService } from "../../services/professorService";
import { formatDateTime } from "../../utils/helpers";

const mockSent = [
  { _id: "1", title: "Assignment Deadline Extended", targetType: "section", targetSection: "A", priority: "important", createdAt: new Date(Date.now() - 86400000), readBy: 45 },
  { _id: "2", title: "Class Cancelled Tomorrow", targetType: "global", priority: "urgent", createdAt: new Date(Date.now() - 3 * 86400000), readBy: 60 },
];

const SendNotice = () => {
  const [form, setForm] = useState({
    title: "", content: "", targetType: "section", targetSection: "A", targetSemester: 4,
    priority: "normal", isForced: false, isScheduled: false, scheduledAt: "", expiresAt: "",
  });
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);

  const priorityConfig = {
    normal: { label: "Normal", icon: "📢", desc: "Regular notice" },
    important: { label: "Important", icon: "⚠️", desc: "Highlighted notice" },
    urgent: { label: "Urgent", icon: "🚨", desc: "Red banner notice" },
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error("Title and content are required"); return; }
    setSending(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (file) formData.append("attachment", file);
      await professorService.sendNotice(formData);
      toast.success("Notice sent successfully! 📢");
      setForm({ title: "", content: "", targetType: "section", targetSection: "A", targetSemester: 4, priority: "normal", isForced: false, isScheduled: false, scheduledAt: "", expiresAt: "" });
      setFile(null);
    } catch {
      toast.error("Failed to send notice");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Send Notice</h1>
        <p className="page-subtitle">Send announcements to your class or individual students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-4">
            <h3 className="font-display font-bold text-gray-900">Compose Notice</h3>
            <div>
              <label className="label">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Notice title..." maxLength={150} />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/150</p>
            </div>
            <div>
              <label className="label">Content *</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-field resize-none" rows={6} placeholder="Write your notice here..." />
            </div>
            <div>
              <label className="label">Attach File (Optional)</label>
              <FileUploader onFilesSelected={setFile} accept=".pdf,.jpg,.jpeg,.png" allowedFormats={["pdf", "jpg", "jpeg", "png"]} maxSize={10} label="Attach document or image" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card space-y-4">
            <h3 className="font-display font-bold text-gray-900">Send To</h3>
            <div>
              <label className="label">Target Audience</label>
              <div className="space-y-2">
                {[
                  { value: "section", label: "My Section", icon: "👥" },
                  { value: "department", label: "Entire Department", icon: "🏛️" },
                  { value: "global", label: "All Students", icon: "🌐" },
                ].map(({ value, label, icon }) => (
                  <label key={value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${form.targetType === value ? "border-primary-300 bg-primary-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <input type="radio" name="targetType" value={value} checked={form.targetType === value} onChange={(e) => setForm({ ...form, targetType: e.target.value })} className="text-primary-600" />
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            {form.targetType === "section" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Section</label>
                  <input type="text" value={form.targetSection} onChange={(e) => setForm({ ...form, targetSection: e.target.value })} className="input-field" placeholder="A" />
                </div>
                <div>
                  <label className="label">Semester</label>
                  <input type="number" value={form.targetSemester} onChange={(e) => setForm({ ...form, targetSemester: Number(e.target.value) })} className="input-field" min={1} max={8} />
                </div>
              </div>
            )}
          </div>

          <div className="card space-y-4">
            <h3 className="font-display font-bold text-gray-900">Settings</h3>
            <div>
              <label className="label">Priority</label>
              <div className="space-y-2">
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <label key={key} className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all
                    ${form.priority === key ? "border-primary-300 bg-primary-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <input type="radio" name="priority" value={key} checked={form.priority === key} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
                    <span>{config.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{config.label}</p>
                      <p className="text-xs text-gray-400">{config.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.isForced ? "border-amber-300 bg-amber-50" : "border-gray-100"}`}>
              <input type="checkbox" checked={form.isForced} onChange={(e) => setForm({ ...form, isForced: e.target.checked })} className="w-4 h-4" />
              <div>
                <p className="text-sm font-medium text-gray-700">🔒 Force Acknowledgment</p>
                <p className="text-xs text-gray-400">Students must acknowledge before continuing</p>
              </div>
            </label>
            <div>
              <label className="label">Expiry Date (Optional)</label>
              <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="input-field" />
            </div>
          </div>

          <button onClick={handleSend} disabled={sending} className="btn-primary w-full py-3 text-base font-bold flex items-center justify-center gap-2">
            {sending ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
            ) : "📢 Send Notice"}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-display font-bold text-gray-900 mb-4">Recently Sent</h3>
        <div className="space-y-3">
          {mockSent.map((notice) => (
            <div key={notice._id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                ${notice.priority === "urgent" ? "bg-red-100" : notice.priority === "important" ? "bg-amber-100" : "bg-blue-100"}`}>
                {notice.priority === "urgent" ? "🚨" : notice.priority === "important" ? "⚠️" : "📢"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{notice.title}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="badge badge-primary text-[10px]">{notice.targetType}</span>
                  {notice.targetSection && <span className="badge bg-gray-100 text-gray-600 text-[10px]">Section {notice.targetSection}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400">{formatDateTime(notice.createdAt)}</p>
                <p className="text-xs text-emerald-600 mt-0.5">{notice.readBy} read</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SendNotice;
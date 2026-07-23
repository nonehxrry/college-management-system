import { useState } from "react";
import Modal from "../../components/common/Modal";
import { ConfirmModal } from "../../components/common/Modal";
import FileUploader from "../../components/common/FileUploader";
import Table from "../../components/common/Table";
import { formatDateTime } from "../../utils/helpers";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";

const mockNotices = [
  { _id: "n1", title: "Fee Payment Deadline Extended", createdBy: "Admin", targetType: "global", priority: "urgent", isForced: true, createdAt: new Date(Date.now() - 3600000), readBy: 1240, totalTargets: 2430 },
  { _id: "n2", title: "Annual Sports Day Registration Open", createdBy: "Sports Dept", targetType: "global", priority: "normal", isForced: false, createdAt: new Date(Date.now() - 2 * 86400000), readBy: 980, totalTargets: 2430 },
  { _id: "n3", title: "Library Closed for Maintenance", createdBy: "Library", targetType: "global", priority: "important", isForced: false, createdAt: new Date(Date.now() - 5 * 86400000), readBy: 2100, totalTargets: 2430 },
];

const priorityConf = {
  normal:    { badge: "badge-info",    icon: "📢" },
  important: { badge: "badge-warning", icon: "⚠️" },
  urgent:    { badge: "badge-danger",  icon: "🚨" },
};

const Notices = () => {
  const [createModal,     setCreateModal]     = useState(false);
  const [deleteModal,     setDeleteModal]     = useState(false);
  const [selectedNotice,  setSelectedNotice]  = useState(null);
  const [saving,          setSaving]          = useState(false);
  const [file,            setFile]            = useState(null);
  const [form,            setForm]            = useState({
    title: "", content: "", targetType: "global", targetDepartment: "",
    priority: "normal", isForced: false, scheduledAt: "", expiresAt: "",
  });

  const handleCreate = async () => {
    if (!form.title || !form.content) { toast.error("Title and content required"); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (file) formData.append("attachment", file);
      await adminService.createNotice(formData);
      toast.success("Notice sent to all targets! 📢");
      setCreateModal(false);
    } catch { toast.error("Failed to send notice"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await adminService.deleteNotice(selectedNotice._id);
      toast.success("Notice deleted");
      setDeleteModal(false);
    } catch { toast.error("Delete failed"); }
    finally { setSaving(false); }
  };

  const columns = [
    {
      header: "Notice", accessor: "title", sortable: true,
      render: (val, row) => (
        <div>
          <div className="flex items-center gap-2">
            <span>{priorityConf[row.priority]?.icon}</span>
            <p className="font-semibold text-gray-800 text-sm">{val}</p>
            {row.isForced && <span className="badge bg-red-100 text-red-700 text-[10px]">🔒 Forced</span>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">By: {row.createdBy}</p>
        </div>
      ),
    },
    {
      header: "Target", accessor: "targetType",
      render: (v, row) => (
        <div>
          <span className="badge badge-primary capitalize text-xs">{v}</span>
          {row.targetDepartment && <p className="text-xs text-gray-400 mt-0.5">{row.targetDepartment}</p>}
        </div>
      ),
    },
    {
      header: "Priority", accessor: "priority",
      render: (v) => <span className={`badge ${priorityConf[v]?.badge} capitalize text-xs`}>{v}</span>,
    },
    {
      header: "Read Rate",
      render: (_, row) => (
        <div>
          <p className="text-sm font-semibold text-gray-700">{row.readBy}/{row.totalTargets}</p>
          <div className="w-20 bg-gray-100 rounded-full h-1.5 mt-1">
            <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(row.readBy / row.totalTargets) * 100}%` }} />
          </div>
        </div>
      ),
    },
    {
      header: "Sent", accessor: "createdAt", sortable: true,
      render: (v) => <span className="text-xs text-gray-400">{formatDateTime(v)}</span>,
    },
    {
      header: "Actions",
      render: (_, row) => (
        <button
          onClick={() => { setSelectedNotice(row); setDeleteModal(true); }}
          className="w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 text-sm"
        >🗑️</button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Notice Management</h1>
          <p className="page-subtitle">Broadcast announcements across the institution</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary">📢 Create Notice</button>
      </div>

      <div className="card">
        <Table columns={columns} data={mockNotices} searchable searchPlaceholder="Search notices..." />
      </div>

      {/* ── Create Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Notice"
        icon="📢"
        size="lg"
        footer={
          <>
            <button onClick={() => setCreateModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
            <button onClick={handleCreate} className="btn-primary" disabled={saving}>
              {saving ? "Sending..." : "📢 Send Notice"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field" placeholder="Notice title..." maxLength={150} />
          </div>

          <div>
            <label className="label">Content *</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="input-field resize-none" rows={5} placeholder="Notice content..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target Audience</label>
              <select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })} className="input-field">
                <option value="global">All (Global)</option>
                <option value="department">Department</option>
                <option value="students_only">Students Only</option>
                <option value="professors_only">Faculty Only</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-field">
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Schedule (optional)</label>
              <input type="datetime-local" value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Expires At (optional)</label>
              <input type="datetime-local" value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="input-field" />
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 border-2 border-amber-200 bg-amber-50 rounded-xl cursor-pointer">
            <input type="checkbox" checked={form.isForced}
              onChange={(e) => setForm({ ...form, isForced: e.target.checked })} className="w-4 h-4" />
            <div>
              <p className="text-sm font-semibold text-amber-800">🔒 Force Acknowledgment</p>
              <p className="text-xs text-amber-600">Users must read and acknowledge before continuing</p>
            </div>
          </label>

          <FileUploader
            onFilesSelected={setFile}
            accept=".pdf,.jpg,.jpeg,.png"
            allowedFormats={["pdf", "jpg", "png"]}
            maxSize={10}
            label="Attach file (optional)"
          />
        </div>
      </Modal>

      {/* ── Confirm Delete ───────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Notice"
        message={`Delete "${selectedNotice?.title}"? Students will no longer see this notice.`}
        confirmText="Delete Notice"
        loading={saving}
      />
    </div>
  );
};

export default Notices;
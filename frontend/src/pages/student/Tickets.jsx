import { useState } from "react";
import Modal from "../../components/common/Modal";
import { formatDateTime } from "../../utils/helpers";
import { studentService } from "../../services/studentService";
import toast from "react-hot-toast";

const mockTickets = [
  { _id: "t1", title: "Attendance marked wrong for 15 Jan", category: "attendance", priority: "high", status: "in-progress", createdAt: new Date(Date.now() - 2 * 86400000), replies: [{ from: "Admin", message: "We are looking into this.", time: new Date(Date.now() - 86400000) }] },
  { _id: "t2", title: "Result not updated after re-evaluation", category: "result", priority: "medium", status: "open", createdAt: new Date(Date.now() - 5 * 86400000), replies: [] },
  { _id: "t3", title: "Library card not working", category: "other", priority: "low", status: "resolved", createdAt: new Date(Date.now() - 10 * 86400000), replies: [{ from: "Library", message: "Card has been reactivated.", time: new Date(Date.now() - 9 * 86400000) }] },
];

const statusConfig = {
  open:        { label: "Open",        badge: "badge-info",    icon: "🔵" },
  "in-progress":{ label: "In Progress", badge: "badge-warning", icon: "🟡" },
  resolved:    { label: "Resolved",    badge: "badge-success", icon: "🟢" },
  closed:      { label: "Closed",      badge: "badge-gray",    icon: "⚫" },
};
const priorityColors = { high: "text-red-600", medium: "text-amber-600", low: "text-gray-500" };
const categories = ["academic","attendance","result","fee","technical","other"];

const Tickets = () => {
  const [tickets, setTickets]       = useState(mockTickets);
  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal]   = useState(false);
  const [selected, setSelected]     = useState(null);
  const [reply, setReply]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({ title: "", description: "", category: "academic", priority: "medium" });

  const handleCreate = async () => {
    if (!form.title || !form.description) { toast.error("Fill all fields"); return; }
    setSaving(true);
    try {
      await studentService.createTicket(form);
      toast.success("Support ticket raised! 🎫");
      setCreateModal(false);
      setForm({ title: "", description: "", category: "academic", priority: "medium" });
    } catch { toast.error("Failed to create ticket"); }
    finally { setSaving(false); }
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      await studentService.replyToTicket(selected._id, reply);
      toast.success("Reply sent!");
      setReply("");
    } catch { toast.error("Reply failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="page-title">Support Tickets</h1><p className="page-subtitle">Raise and track your support requests</p></div>
        <button onClick={() => setCreateModal(true)} className="btn-primary">🎫 Raise Ticket</button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",       value: tickets.length,                                   color: "text-gray-700"    },
          { label: "Open",        value: tickets.filter((t) => t.status === "open").length, color: "text-blue-600"   },
          { label: "In Progress", value: tickets.filter((t) => t.status === "in-progress").length, color: "text-amber-600" },
          { label: "Resolved",    value: tickets.filter((t) => t.status === "resolved").length,    color: "text-emerald-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card py-3 text-center">
            <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {tickets.map((ticket) => {
          const sConf = statusConfig[ticket.status];
          return (
            <div key={ticket._id} className="card hover:shadow-card-hover cursor-pointer transition-shadow"
              onClick={() => { setSelected(ticket); setViewModal(true); }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🎫</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{ticket.title}</p>
                    <span className={`badge ${sConf.badge} text-[10px]`}>{sConf.icon} {sConf.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    <span className="badge badge-primary capitalize text-[10px]">{ticket.category}</span>
                    <span className={`font-semibold capitalize ${priorityColors[ticket.priority]}`}>{ticket.priority} priority</span>
                    <span>{formatDateTime(ticket.createdAt)}</span>
                  </div>
                  {ticket.replies.length > 0 && <p className="text-xs text-emerald-600 mt-1.5">💬 {ticket.replies.length} reply</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Raise Support Ticket" icon="🎫" size="lg"
        footer={<><button onClick={() => setCreateModal(false)} className="btn-secondary" disabled={saving}>Cancel</button><button onClick={handleCreate} className="btn-primary" disabled={saving}>{saving ? "Submitting..." : "🎫 Submit"}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Title *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Brief description of your issue" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                {categories.map((c) => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div><label className="label">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-field">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
          </div>
          <div><label className="label">Description *</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field resize-none" rows={5} placeholder="Describe your issue in detail..." /></div>
        </div>
      </Modal>

      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title={selected?.title} icon="🎫" size="lg"
        footer={selected?.status !== "resolved" && selected?.status !== "closed" ? (
          <div className="flex gap-3 w-full">
            <input type="text" value={reply} onChange={(e) => setReply(e.target.value)} className="input-field flex-1 py-2" placeholder="Type your reply..." onKeyDown={(e) => e.key === "Enter" && handleReply()} />
            <button onClick={handleReply} disabled={saving || !reply.trim()} className="btn-primary py-2 px-4">Send</button>
          </div>
        ) : null}>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${statusConfig[selected.status]?.badge}`}>{statusConfig[selected.status]?.label}</span>
              <span className="badge badge-primary capitalize">{selected.category}</span>
            </div>
            {selected.replies.length > 0 ? (
              <div className="space-y-3">
                {selected.replies.map((r, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-sm flex-shrink-0">👤</div>
                    <div><p className="text-xs font-semibold text-gray-800">{r.from}</p><p className="text-sm text-gray-600 mt-0.5">{r.message}</p></div>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-6 text-gray-400 text-sm">No replies yet. Our team will respond shortly.</div>}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tickets;
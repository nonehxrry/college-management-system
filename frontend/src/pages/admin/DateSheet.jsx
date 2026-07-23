import { useState } from "react";
import Modal from "../../components/common/Modal";
import { ConfirmModal } from "../../components/common/Modal";
import { formatDate } from "../../utils/helpers";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";

const MOCK_DATESHEETS = [
  { _id: "ds1", title: "End Semester Exam — CS Sem 4", department: "Computer Science", semester: 4, section: "A", academicYear: "2023-24", isPublished: true,  examsCount: 6, startDate: new Date(Date.now() + 5  * 86400000) },
  { _id: "ds2", title: "Mid Semester Exam — IT Sem 2", department: "Information Technology", semester: 2, section: "A,B", academicYear: "2023-24", isPublished: false, examsCount: 4, startDate: new Date(Date.now() + 15 * 86400000) },
  { _id: "ds3", title: "End Semester Exam — ME Sem 6", department: "Mechanical", semester: 6, section: "A", academicYear: "2023-24", isPublished: false, examsCount: 5, startDate: new Date(Date.now() + 20 * 86400000) },
];

const EMPTY_EXAM = { subject: "", code: "", date: "", startTime: "10:00", endTime: "13:00", venue: "", examType: "external" };

const EXAM_TYPE_COLORS = {
  external:  "bg-blue-100 text-blue-700",
  internal:  "bg-amber-100 text-amber-700",
  practical: "bg-green-100 text-green-700",
  viva:      "bg-purple-100 text-purple-700",
};

const DEPARTMENTS = ["Computer Science", "Information Technology", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering", "Electrical Engineering"];

const DateSheetPage = () => {
  const [datesheets, setDatesheets] = useState(MOCK_DATESHEETS);
  const [createModal, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "", department: "", semester: 4, section: "A",
    academicYear: "2023-24",
    exams: [{ ...EMPTY_EXAM }],
  });

  /* ─── helpers ─────────────────────────────────────────────────────────────── */
  const addExam = () =>
    setForm((p) => ({ ...p, exams: [...p.exams, { ...EMPTY_EXAM }] }));

  const removeExam = (i) =>
    setForm((p) => ({ ...p, exams: p.exams.filter((_, idx) => idx !== i) }));

  const updateExam = (i, field, value) =>
    setForm((p) => ({
      ...p,
      exams: p.exams.map((e, idx) => idx === i ? { ...e, [field]: value } : e),
    }));

  /* ─── API calls ────────────────────────────────────────────────────────────── */
  const handleCreate = async () => {
    if (!form.title || !form.department) { toast.error("Title and department are required"); return; }
    if (form.exams.some((e) => !e.subject || !e.date)) {
      toast.error("Fill subject and date for every exam row"); return;
    }
    setSaving(true);
    try {
      await adminService.createDateSheet(form);
      toast.success("Date sheet created! 📅");
      setCreateModal(false);
      setForm({ title: "", department: "", semester: 4, section: "A", academicYear: "2023-24", exams: [{ ...EMPTY_EXAM }] });
    } catch { toast.error("Failed to create date sheet"); }
    finally { setSaving(false); }
  };

  const handlePublish = async (dsId) => {
    try {
      await adminService.publishDateSheet(dsId);
      setDatesheets((p) => p.map((d) => d._id === dsId ? { ...d, isPublished: true } : d));
      toast.success("Date sheet published! Students have been notified. 🎉");
    } catch { toast.error("Publish failed"); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await adminService.deleteDateSheet(selected._id);
      setDatesheets((p) => p.filter((d) => d._id !== selected._id));
      toast.success("Date sheet deleted");
      setDeleteModal(false);
    } catch { toast.error("Delete failed"); }
    finally { setSaving(false); }
  };

  /* ─── Render ───────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Date Sheet Management</h1>
          <p className="page-subtitle">Create and publish examination timetables</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2">
          ➕ Create Date Sheet
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",     value: datesheets.length,                          color: "text-gray-700"    },
          { label: "Published", value: datesheets.filter((d) => d.isPublished).length,  color: "text-emerald-600" },
          { label: "Draft",     value: datesheets.filter((d) => !d.isPublished).length, color: "text-amber-600"   },
        ].map(({ label, value, color }) => (
          <div key={label} className="card py-3 text-center">
            <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {datesheets.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-4xl mb-3">📆</p>
            <p className="font-semibold text-gray-700">No date sheets yet</p>
            <button onClick={() => setCreateModal(true)} className="btn-primary mt-4 text-sm">Create First Date Sheet</button>
          </div>
        ) : (
          datesheets.map((ds) => (
            <div key={ds._id} className="card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0
                    ${ds.isPublished ? "bg-emerald-100" : "bg-amber-100"}`}>
                    📆
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{ds.title}</p>
                      <span className={`badge text-xs ${ds.isPublished ? "badge-success" : "badge-warning"}`}>
                        {ds.isPublished ? "✅ Published" : "⏳ Draft"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                      <span>🏛️ {ds.department}</span>
                      <span>📚 Semester {ds.semester}</span>
                      <span>👥 Section {ds.section}</span>
                      <span>📋 {ds.examsCount} exams</span>
                      <span>🗓️ Starts {formatDate(ds.startDate)}</span>
                      <span>📅 {ds.academicYear}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <button
                    onClick={() => { setSelected(ds); setPreviewModal(true); }}
                    className="btn-secondary text-sm py-2 px-3"
                  >
                    👁️ Preview
                  </button>
                  {!ds.isPublished && (
                    <button
                      onClick={() => handlePublish(ds._id)}
                      className="btn-primary text-sm py-2 px-3"
                    >
                      📢 Publish
                    </button>
                  )}
                  <button
                    onClick={() => { setSelected(ds); setDeleteModal(true); }}
                    className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors text-base"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Create Modal ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Date Sheet"
        icon="📆"
        size="xl"
        footer={
          <>
            <button onClick={() => setCreateModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
            <button onClick={handleCreate} className="btn-primary" disabled={saving}>
              {saving ? "Creating…" : "✅ Create Date Sheet"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Meta fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Title *</label>
              <input type="text" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-field"
                placeholder="e.g. End Semester Examination — Computer Science Semester 4" />
            </div>
            <div>
              <label className="label">Department *</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input-field">
                <option value="">Select department…</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Academic Year</label>
              <select value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} className="input-field">
                {["2022-23","2023-24","2024-25","2025-26"].map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Semester</label>
              <input type="number" value={form.semester} min={1} max={10}
                onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="label">Section(s)</label>
              <input type="text" value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="input-field" placeholder="A  or  A, B, C" />
            </div>
          </div>

          {/* Exam rows */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display font-bold text-gray-900 text-sm">
                Exam Schedule
                <span className="ml-2 text-gray-400 font-normal">({form.exams.length} exam{form.exams.length !== 1 ? "s" : ""})</span>
              </h4>
              <button onClick={addExam} className="btn-secondary text-xs py-1.5 px-3">+ Add Exam Row</button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 no-scrollbar">
              {form.exams.map((exam, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Exam {i + 1}</span>
                    {form.exams.length > 1 && (
                      <button onClick={() => removeExam(i)}
                        className="w-6 h-6 bg-red-100 text-red-500 rounded-lg flex items-center justify-center text-xs hover:bg-red-200 transition-colors">
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Subject *</label>
                      <input type="text" value={exam.subject}
                        onChange={(e) => updateExam(i, "subject", e.target.value)}
                        className="input-field py-2 text-sm" placeholder="Subject name" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Code</label>
                      <input type="text" value={exam.code}
                        onChange={(e) => updateExam(i, "code", e.target.value.toUpperCase())}
                        className="input-field py-2 text-sm" placeholder="CS401" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Type</label>
                      <select value={exam.examType} onChange={(e) => updateExam(i, "examType", e.target.value)} className="input-field py-2 text-sm">
                        <option value="external">Theory / External</option>
                        <option value="internal">Internal</option>
                        <option value="practical">Practical</option>
                        <option value="viva">Viva</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Date *</label>
                      <input type="date" value={exam.date}
                        onChange={(e) => updateExam(i, "date", e.target.value)}
                        className="input-field py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Start Time</label>
                      <input type="time" value={exam.startTime}
                        onChange={(e) => updateExam(i, "startTime", e.target.value)}
                        className="input-field py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">End Time</label>
                      <input type="time" value={exam.endTime}
                        onChange={(e) => updateExam(i, "endTime", e.target.value)}
                        className="input-field py-2 text-sm" />
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Venue</label>
                      <input type="text" value={exam.venue}
                        onChange={(e) => updateExam(i, "venue", e.target.value)}
                        className="input-field py-2 text-sm" placeholder="e.g. Block A, Room 101" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Preview Modal ────────────────────────────────────────────────────── */}
      <Modal
        isOpen={previewModal}
        onClose={() => setPreviewModal(false)}
        title={selected?.title || "Date Sheet Preview"}
        icon="📆"
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Department", selected.department],
                ["Semester",   `Semester ${selected.semester}`],
                ["Section",    selected.section],
                ["Year",       selected.academicYear],
              ].map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {selected.examsCount} Exam{selected.examsCount !== 1 ? "s" : ""} Scheduled
            </p>
            <div className="text-center py-8 text-gray-400 text-sm">
              Full exam schedule will be shown here once synced from the server.
            </div>

            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1 text-sm py-2">📥 Download PDF</button>
              {!selected.isPublished && (
                <button
                  onClick={() => { handlePublish(selected._id); setPreviewModal(false); }}
                  className="btn-primary flex-1 text-sm py-2"
                >
                  📢 Publish Now
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Confirm Delete ───────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Date Sheet"
        message={`Delete "${selected?.title}"? This cannot be undone. Students will lose access to this schedule.`}
        confirmText="Delete"
        loading={saving}
      />
    </div>
  );
};

export default DateSheetPage;
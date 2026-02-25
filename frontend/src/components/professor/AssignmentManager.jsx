import { useState } from "react";
import Modal from "../common/Modal";
import FileUploader from "../common/FileUploader";
import Table from "../common/Table";
import { formatDate, formatDateTime, isDeadlinePassed } from "../../utils/helpers";
import toast from "react-hot-toast";
import { professorService } from "../../services/professorService";

const mockAssignments = [
  { _id: "1", title: "Data Structures Lab Report", subject: "CS401", section: "A", deadline: new Date(Date.now() + 3 * 86400000), maxMarks: 10, submissions: 48, totalStudents: 62, allowedFormats: ["pdf", "docx"] },
  { _id: "2", title: "Algorithm Analysis", subject: "CS401", section: "A", deadline: new Date(Date.now() - 2 * 86400000), maxMarks: 15, submissions: 61, totalStudents: 62, allowedFormats: ["pdf"] },
  { _id: "3", title: "OS Process Scheduling", subject: "CS402", section: "A", deadline: new Date(Date.now() + 5 * 86400000), maxMarks: 20, submissions: 30, totalStudents: 60, allowedFormats: ["pdf", "docx", "zip"] },
];

const mockSubmissions = [
  { _id: "s1", student: "Aarav Sharma", rollNumber: "CS40101", submittedAt: new Date(Date.now() - 86400000), isLate: false, status: "submitted", marksObtained: null },
  { _id: "s2", student: "Priya Singh", rollNumber: "CS40102", submittedAt: new Date(Date.now() - 2 * 86400000), isLate: false, status: "evaluated", marksObtained: 9 },
  { _id: "s3", student: "Rahul Gupta", rollNumber: "CS40103", submittedAt: new Date(Date.now() - 3600000), isLate: true, status: "submitted", marksObtained: null },
  { _id: "s4", student: "Sneha Patel", rollNumber: "CS40104", submittedAt: null, isLate: false, status: "not_submitted", marksObtained: null },
];

const AssignmentManager = () => {
  const [view, setView] = useState("list");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [gradeModal, setGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [saving, setSaving] = useState(false);
  const [gradeForm, setGradeForm] = useState({ marks: "", feedback: "" });

  const [form, setForm] = useState({
    title: "", description: "", subject: "", section: "", semester: 4,
    deadline: "", maxMarks: 10, allowedFormats: ["pdf"],
  });
  const [attachmentFile, setAttachmentFile] = useState(null);

  const mockSubjects = [
    { _id: "1", name: "Algorithms", code: "CS401", section: "A", semester: 4 },
    { _id: "2", name: "Operating Systems", code: "CS402", section: "A", semester: 4 },
  ];

  const toggleFormat = (fmt) => {
    setForm((prev) => ({
      ...prev,
      allowedFormats: prev.allowedFormats.includes(fmt)
        ? prev.allowedFormats.filter((f) => f !== fmt)
        : [...prev.allowedFormats, fmt],
    }));
  };

  const handleCreate = async () => {
    if (!form.title || !form.subject || !form.deadline) { toast.error("Fill all required fields"); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, Array.isArray(v) ? JSON.stringify(v) : v));
      if (attachmentFile) formData.append("attachment", attachmentFile);
      await professorService.createAssignment(formData);
      toast.success("Assignment created successfully! 🎉");
      setCreateModal(false);
    } catch { toast.error("Failed to create assignment"); }
    finally { setSaving(false); }
  };

  const handleGrade = (submission) => {
    setSelectedSubmission(submission);
    setGradeForm({ marks: submission.marksObtained || "", feedback: "" });
    setGradeModal(true);
  };

  const submitGrade = async () => {
    if (gradeForm.marks === "") { toast.error("Enter marks"); return; }
    const max = selectedAssignment?.maxMarks || 10;
    if (Number(gradeForm.marks) > max) { toast.error(`Marks cannot exceed ${max}`); return; }
    setSaving(true);
    try {
      await professorService.gradeSubmission(selectedSubmission._id, { marksObtained: Number(gradeForm.marks), feedback: gradeForm.feedback });
      toast.success("Marks saved! ✅");
      setGradeModal(false);
    } catch { toast.error("Failed to save marks"); }
    finally { setSaving(false); }
  };

  const submissionColumns = [
    { header: "Student", accessor: "student", sortable: true, render: (val, row) => (
      <div>
        <p className="font-medium text-gray-800 text-sm">{val}</p>
        <p className="text-xs text-gray-400">{row.rollNumber}</p>
      </div>
    )},
    { header: "Submitted", accessor: "submittedAt", sortable: true, render: (val, row) => (
      val ? (
        <div>
          <p className="text-sm text-gray-700">{formatDate(val)}</p>
          {row.isLate && <span className="badge badge-warning text-[10px]">Late</span>}
        </div>
      ) : <span className="text-xs text-red-500 font-medium">Not submitted</span>
    )},
    { header: "Status", accessor: "status", render: (val) => {
      const config = { submitted: "badge-info", evaluated: "badge-success", not_submitted: "badge-danger" };
      return <span className={`badge ${config[val]}`}>{val?.replace("_", " ")}</span>;
    }},
    { header: "Marks", accessor: "marksObtained", render: (val, row) => (
      val !== null ? `${val}/${selectedAssignment?.maxMarks}` :
        row.status !== "not_submitted" ? <span className="text-xs text-gray-400">Not graded</span> : "—"
    )},
    { header: "Action", render: (_, row) => (
      row.status !== "not_submitted" ? (
        <button onClick={() => handleGrade(row)} className="btn-primary text-xs py-1 px-3">
          {row.marksObtained !== null ? "✏️ Edit" : "📝 Grade"}
        </button>
      ) : null
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Assignments</h1>
          <p className="page-subtitle">Create and manage assignments, grade submissions</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2">
          ➕ Create Assignment
        </button>
      </div>

      {view === "list" && (
        <div className="space-y-4">
          {mockAssignments.map((a) => {
            const isPassed = isDeadlinePassed(a.deadline);
            const submissionRate = Math.round((a.submissions / a.totalStudents) * 100);
            return (
              <div key={a._id} className={`card hover:shadow-card-hover cursor-pointer transition-shadow ${isPassed ? "border-l-4 border-red-400" : "border-l-4 border-primary-400"}`}
                onClick={() => { setSelectedAssignment(a); setView("submissions"); }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{a.title}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="badge badge-primary text-[10px]">{a.subject}</span>
                      <span className="badge bg-gray-100 text-gray-600 text-[10px]">Sec {a.section}</span>
                      <span className={`badge ${isPassed ? "badge-danger" : "badge-info"} text-[10px]`}>
                        {isPassed ? "Expired" : `Due ${formatDate(a.deadline)}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-700">{a.submissions}/{a.totalStudents}</p>
                    <p className="text-xs text-gray-400">submitted</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Submission progress</span><span>{submissionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-primary-500" style={{ width: `${submissionRate}%` }} />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); toast.success("Downloading all submissions..."); }}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    📥 Download All
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "submissions" && selectedAssignment && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setView("list")} className="btn-secondary text-sm py-2 px-3">← Back</button>
            <div>
              <h2 className="font-display font-bold text-gray-900">{selectedAssignment.title}</h2>
              <p className="text-xs text-gray-500">Viewing all submissions · Max marks: {selectedAssignment.maxMarks}</p>
            </div>
          </div>
          <div className="card">
            <Table columns={submissionColumns} data={mockSubmissions} searchable searchPlaceholder="Search student..." />
          </div>
        </div>
      )}

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create New Assignment" icon="📋" size="lg" footer={
        <>
          <button onClick={() => setCreateModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
          <button onClick={handleCreate} className="btn-primary" disabled={saving}>
            {saving ? "Creating..." : "✅ Create Assignment"}
          </button>
        </>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Assignment title" />
            </div>
            <div>
              <label className="label">Subject *</label>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field">
                <option value="">Select subject</option>
                {mockSubjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Section</label>
              <input type="text" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="input-field" placeholder="A, B, C..." />
            </div>
            <div>
              <label className="label">Deadline *</label>
              <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Max Marks</label>
              <input type="number" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })} className="input-field" min={1} max={100} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field resize-none" rows={3} placeholder="Assignment instructions..." />
          </div>
          <div>
            <label className="label">Allowed Formats</label>
            <div className="flex flex-wrap gap-2">
              {["pdf", "docx", "zip", "jpg", "png"].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => toggleFormat(fmt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${form.allowedFormats.includes(fmt) ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-500 border-gray-200 hover:border-primary-300"}`}
                >
                  .{fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Attach Question Paper (Optional)</label>
            <FileUploader onFilesSelected={setAttachmentFile} accept=".pdf,.docx" allowedFormats={["pdf", "docx"]} maxSize={20} label="Upload question paper" />
          </div>
        </div>
      </Modal>

      <Modal isOpen={gradeModal} onClose={() => setGradeModal(false)} title="Grade Submission" icon="📝" size="sm" footer={
        <>
          <button onClick={() => setGradeModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
          <button onClick={submitGrade} className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "💾 Save Marks"}
          </button>
        </>
      }>
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="font-semibold text-gray-800 text-sm">{selectedSubmission?.student}</p>
            <p className="text-xs text-gray-500">{selectedSubmission?.rollNumber}</p>
          </div>
          <div>
            <label className="label">Marks (out of {selectedAssignment?.maxMarks})</label>
            <input
              type="number"
              value={gradeForm.marks}
              onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
              className="input-field text-2xl font-bold"
              min={0}
              max={selectedAssignment?.maxMarks}
              placeholder="0"
            />
          </div>
          <div>
            <label className="label">Feedback (optional)</label>
            <textarea value={gradeForm.feedback} onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })} className="input-field resize-none" rows={3} placeholder="Write feedback for the student..." />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignmentManager;
import { useState } from "react";
import Table from "../common/Table";
import Modal from "../common/Modal";
import { formatDate, formatDateTime, getGradeColor } from "../../utils/helpers";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";

const mockResults = [
  { _id: "r1", student: "Aarav Sharma", rollNumber: "CS40101", semester: 4, sgpa: 8.6, cgpa: 8.2, isPublished: false, isLocked: false, subjectCount: 5, passCount: 5, updatedAt: new Date(Date.now() - 3600000) },
  { _id: "r2", student: "Priya Singh", rollNumber: "CS40102", semester: 4, sgpa: 7.4, cgpa: 7.8, isPublished: false, isLocked: false, subjectCount: 5, passCount: 4, updatedAt: new Date(Date.now() - 7200000) },
  { _id: "r3", student: "Rahul Gupta", rollNumber: "CS40103", semester: 4, sgpa: 9.1, cgpa: 8.9, isPublished: true, isLocked: true, subjectCount: 5, passCount: 5, updatedAt: new Date(Date.now() - 86400000) },
  { _id: "r4", student: "Sneha Patel", rollNumber: "CS40104", semester: 4, sgpa: 6.8, cgpa: 7.1, isPublished: false, isLocked: false, subjectCount: 5, passCount: 5, updatedAt: new Date(Date.now() - 3600000) },
  { _id: "r5", student: "Arjun Mehta", rollNumber: "CS40105", semester: 4, sgpa: 5.2, cgpa: 6.0, isPublished: false, isLocked: false, subjectCount: 5, passCount: 3, updatedAt: new Date(Date.now() - 7200000) },
];

const ResultManagement = () => {
  const [selected, setSelected] = useState([]);
  const [publishModal, setPublishModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterSem, setFilterSem] = useState(4);
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredResults = mockResults.filter((r) => {
    if (filterStatus === "published") return r.isPublished;
    if (filterStatus === "unpublished") return !r.isPublished;
    return true;
  });

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const unpublished = filteredResults.filter((r) => !r.isPublished).map((r) => r._id);
    if (selected.length === unpublished.length) setSelected([]);
    else setSelected(unpublished);
  };

  const handlePublish = async () => {
    if (selected.length === 0) { toast.error("Select at least one result"); return; }
    setSaving(true);
    try {
      await adminService.publishResult(selected, isScheduled ? scheduleDate : null);
      toast.success(isScheduled ? `Results scheduled for ${formatDate(scheduleDate)}! 📅` : "Results published! 🎉");
      setPublishModal(false);
      setSelected([]);
    } catch { toast.error("Publish failed"); }
    finally { setSaving(false); }
  };

  const handleLock = async (resultId) => {
    try {
      await adminService.lockResult(resultId);
      toast.success("Result locked 🔒");
    } catch { toast.error("Lock failed"); }
  };

  const handleGenerateCGPA = async (studentId) => {
    try {
      await adminService.generateCGPA(studentId);
      toast.success("CGPA recalculated ✅");
    } catch { toast.error("CGPA generation failed"); }
  };

  const unpublishedCount = filteredResults.filter((r) => !r.isPublished).length;

  const columns = [
    {
      header: () => (
        <input type="checkbox"
          checked={selected.length === filteredResults.filter((r) => !r.isPublished).length && unpublishedCount > 0}
          onChange={toggleSelectAll}
          className="w-4 h-4 rounded text-primary-600"
        />
      ),
      render: (_, row) => !row.isPublished ? (
        <input type="checkbox" checked={selected.includes(row._id)} onChange={() => toggleSelect(row._id)} className="w-4 h-4 rounded text-primary-600" onClick={(e) => e.stopPropagation()} />
      ) : <span className="text-gray-300 text-xs">—</span>,
      width: "48px",
    },
    {
      header: "Student", accessor: "student", sortable: true, render: (val, row) => (
        <div>
          <p className="font-semibold text-gray-800 text-sm">{val}</p>
          <p className="text-xs text-gray-400">{row.rollNumber}</p>
        </div>
      )
    },
    {
      header: "SGPA / CGPA", render: (_, row) => (
        <div>
          <p className={`font-bold font-display text-sm ${row.sgpa >= 8 ? "text-emerald-600" : row.sgpa >= 6 ? "text-blue-600" : "text-red-600"}`}>{row.sgpa?.toFixed(2)}</p>
          <p className="text-xs text-gray-400">CGPA: {row.cgpa?.toFixed(2)}</p>
        </div>
      )
    },
    {
      header: "Result", render: (_, row) => (
        <div>
          <span className={`badge ${row.passCount === row.subjectCount ? "badge-success" : "badge-danger"}`}>
            {row.passCount === row.subjectCount ? "PASS" : `${row.subjectCount - row.passCount} BACK`}
          </span>
          <p className="text-xs text-gray-400 mt-0.5">{row.passCount}/{row.subjectCount} subjects</p>
        </div>
      )
    },
    {
      header: "Status", render: (_, row) => (
        <div className="flex flex-col gap-1">
          <span className={`badge text-[10px] ${row.isPublished ? "badge-success" : "badge-warning"}`}>
            {row.isPublished ? "Published" : "Draft"}
          </span>
          {row.isLocked && <span className="badge bg-gray-100 text-gray-600 text-[10px]">🔒 Locked</span>}
        </div>
      )
    },
    { header: "Updated", accessor: "updatedAt", render: (val) => <span className="text-xs text-gray-400">{formatDateTime(val)}</span> },
    {
      header: "Actions", render: (_, row) => (
        <div className="flex gap-1">
          {!row.isLocked && (
            <button onClick={() => handleLock(row._id)} className="w-7 h-7 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center text-sm hover:bg-gray-200" title="Lock Result">🔒</button>
          )}
          <button onClick={() => handleGenerateCGPA(row._id)} className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm hover:bg-blue-100" title="Recalculate CGPA">🔄</button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Result Management</h1>
          <p className="page-subtitle">Publish and manage semester results</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPublishModal(true)}
            disabled={selected.length === 0}
            className={`btn-primary text-sm py-2 flex items-center gap-2 ${selected.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            📢 Publish ({selected.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Results", value: mockResults.length, color: "text-gray-700" },
          { label: "Published", value: mockResults.filter((r) => r.isPublished).length, color: "text-emerald-600" },
          { label: "Pending", value: mockResults.filter((r) => !r.isPublished).length, color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card py-3 text-center">
            <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {["all", "published", "unpublished"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filterStatus === s ? "bg-white text-primary-600 shadow-sm" : "text-gray-500"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Semester:</label>
          <select value={filterSem} onChange={(e) => setFilterSem(Number(e.target.value))} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary-400">
            {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
          </select>
        </div>
        {selected.length > 0 && (
          <span className="text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-xl font-semibold">
            {selected.length} selected
          </span>
        )}
      </div>

      <div className="card">
        <Table columns={columns} data={filteredResults} emptyMessage="No results found" />
      </div>

      <Modal isOpen={publishModal} onClose={() => setPublishModal(false)} title="Publish Results" icon="📢" size="sm" footer={
        <>
          <button onClick={() => setPublishModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
          <button onClick={handlePublish} className="btn-primary" disabled={saving}>
            {saving ? "Publishing..." : isScheduled ? "📅 Schedule" : "🎉 Publish Now"}
          </button>
        </>
      }>
        <div className="space-y-4">
          <div className="p-3 bg-primary-50 border border-primary-100 rounded-xl">
            <p className="text-sm font-semibold text-primary-800">Publishing {selected.length} result(s)</p>
            <p className="text-xs text-primary-600 mt-0.5">Students will receive instant notifications</p>
          </div>
          <label className="flex items-center gap-3 p-3 border-2 border-gray-100 rounded-xl cursor-pointer hover:border-primary-200 transition-colors">
            <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="w-4 h-4 rounded" />
            <div>
              <p className="text-sm font-medium text-gray-800">Schedule for later</p>
              <p className="text-xs text-gray-400">Results will publish at specified date/time</p>
            </div>
          </label>
          {isScheduled && (
            <div>
              <label className="label">Publish Date & Time</label>
              <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="input-field" min={new Date().toISOString().slice(0, 16)} />
            </div>
          )}
          {!isScheduled && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 p-3 rounded-xl">
              ⚠️ Once published, results will be immediately visible to students and cannot be unpublished.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ResultManagement;
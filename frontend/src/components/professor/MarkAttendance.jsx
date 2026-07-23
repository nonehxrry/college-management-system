import { useState } from "react";
import FileUploader from "../common/FileUploader";
import Modal from "../common/Modal";
import toast from "react-hot-toast";
import { professorService } from "../../services/professorService";
import { formatDate } from "../../utils/helpers";
import { getInitials, generateAvatarColor } from "../../utils/helpers";

const mockSubjects = [
  { _id: "1", name: "Algorithms", code: "CS401", section: "A", semester: 4 },
  { _id: "2", name: "Data Structures", code: "CS301", section: "B", semester: 3 },
  { _id: "3", name: "Operating Systems", code: "CS402", section: "A", semester: 4 },
];

const mockStudents = Array.from({ length: 12 }, (_, i) => ({
  _id: String(i + 1),
  name: ["Aarav Sharma", "Priya Singh", "Rahul Gupta", "Sneha Patel", "Arjun Mehta", "Divya Kumar", "Vikram Joshi", "Ananya Verma", "Rohit Das", "Meera Pillai", "Kabir Nair", "Sita Reddy"][i],
  rollNumber: `CS401${String(i + 1).padStart(3, "0")}`,
  status: "present",
}));

const MarkAttendance = () => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [students, setStudents] = useState(mockStudents);
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const statusOptions = [
    { value: "present", label: "P", color: "bg-emerald-100 text-emerald-700 border-emerald-300", fullLabel: "Present" },
    { value: "absent", label: "A", color: "bg-red-100 text-red-700 border-red-300", fullLabel: "Absent" },
    { value: "late", label: "L", color: "bg-amber-100 text-amber-700 border-amber-300", fullLabel: "Late" },
    { value: "excused", label: "E", color: "bg-blue-100 text-blue-700 border-blue-300", fullLabel: "Excused" },
  ];

  const setAllStatus = (status) => {
    setStudents(students.map((s) => ({ ...s, status })));
  };

  const toggleStatus = (id) => {
    const order = ["present", "absent", "late", "excused"];
    setStudents(students.map((s) => {
      if (s._id !== id) return s;
      const idx = order.indexOf(s.status);
      return { ...s, status: order[(idx + 1) % order.length] };
    }));
  };

  const handleSubmit = async () => {
    if (!selectedSubject) { toast.error("Select a subject first"); return; }
    setSubmitting(true);
    try {
      await professorService.markAttendance({
        subjectId: selectedSubject._id,
        date, topic,
        records: students.map((s) => ({ studentId: s._id, status: s.status })),
      });
      toast.success("Attendance marked successfully.");
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!csvFile) { toast.error("Select a CSV file"); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("subjectId", selectedSubject?._id || "");
      await professorService.bulkUploadAttendance(formData);
      toast.success("Bulk attendance uploaded! ✅");
      setBulkModal(false);
    } catch {
      toast.error("Failed to upload attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const counts = {
    present: students.filter((s) => s.status === "present").length,
    absent: students.filter((s) => s.status === "absent").length,
    late: students.filter((s) => s.status === "late").length,
    excused: students.filter((s) => s.status === "excused").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Mark Attendance</h1>
          <p className="page-subtitle">Record attendance for your classes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setBulkModal(true)} className="btn-secondary text-sm py-2 flex items-center gap-2">
            📊 Bulk Upload CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <label className="label">Select Subject *</label>
          <select
            value={selectedSubject?._id || ""}
            onChange={(e) => setSelectedSubject(mockSubjects.find((s) => s._id === e.target.value) || null)}
            className="input-field"
          >
            <option value="">Choose subject...</option>
            {mockSubjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.code}) - Sec {s.section}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" max={new Date().toISOString().split("T")[0]} />
        </div>
        <div>
          <label className="label">Topic Covered</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="input-field" placeholder="e.g. Sorting Algorithms" />
        </div>
      </div>

      {selectedSubject && (
        <>
          <div className="grid grid-cols-4 gap-3">
            {[
              { status: "present", count: counts.present, color: "border-emerald-200 bg-emerald-50", textColor: "text-emerald-700", label: "Present" },
              { status: "absent", count: counts.absent, color: "border-red-200 bg-red-50", textColor: "text-red-700", label: "Absent" },
              { status: "late", count: counts.late, color: "border-amber-200 bg-amber-50", textColor: "text-amber-700", label: "Late" },
              { status: "excused", count: counts.excused, color: "border-blue-200 bg-blue-50", textColor: "text-blue-700", label: "Excused" },
            ].map(({ status, count, color, textColor, label }) => (
              <div key={status} className={`border ${color} rounded-xl p-3 text-center`}>
                <p className={`text-2xl font-bold font-display ${textColor}`}>{count}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="font-display font-bold text-gray-900">
                {selectedSubject.name} · {students.length} Students
              </h3>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-gray-500 self-center">Mark all:</span>
                {statusOptions.map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => setAllStatus(value)}
                    className={`w-8 h-8 rounded-lg font-bold text-sm border-2 ${color} transition-colors`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {students.map((student) => {
                const statusConf = statusOptions.find((s) => s.value === student.status);
                const avatarColor = generateAvatarColor(student.name);
                return (
                  <div
                    key={student._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-150 hover:shadow-sm
                      ${student.status === "present" ? "border-emerald-200 bg-emerald-50/30" : student.status === "absent" ? "border-red-200 bg-red-50/30" : student.status === "late" ? "border-amber-200 bg-amber-50/30" : "border-blue-200 bg-blue-50/30"}`}
                    onClick={() => toggleStatus(student._id)}
                  >
                    <div className={`w-9 h-9 ${avatarColor} rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                      {getInitials(student.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{student.name}</p>
                      <p className="text-xs text-gray-400">{student.rollNumber}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border-2 ${statusConf?.color} flex-shrink-0`}>
                      {statusConf?.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2 px-8">
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : "✅ Save Attendance"}
              </button>
            </div>
          </div>
        </>
      )}

      {!selectedSubject && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-gray-500 font-medium">Select a subject to start marking attendance</p>
        </div>
      )}

      <Modal isOpen={bulkModal} onClose={() => setBulkModal(false)} title="Bulk Upload Attendance" icon="📊" footer={
        <>
          <button onClick={() => setBulkModal(false)} className="btn-secondary" disabled={submitting}>Cancel</button>
          <button onClick={handleBulkUpload} className="btn-primary" disabled={submitting || !csvFile}>
            {submitting ? "Uploading..." : "Upload"}
          </button>
        </>
      }>
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            <p className="font-semibold mb-1">CSV Format:</p>
            <p>Column headers: <code>rollNumber, status</code></p>
            <p>Status values: present, absent, late, excused</p>
          </div>
          <FileUploader
            onFilesSelected={setCsvFile}
            accept=".csv,.xlsx,.xls"
            allowedFormats={["csv", "xlsx", "xls"]}
            maxSize={5}
            label="Upload CSV / Excel file"
          />
        </div>
      </Modal>
    </div>
  );
};

export default MarkAttendance;
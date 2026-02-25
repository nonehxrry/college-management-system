import { useState } from "react";
import Table from "../common/Table";
import toast from "react-hot-toast";
import { professorService } from "../../services/professorService";

const mockSubjects = [
  { _id: "1", name: "Algorithms", code: "CS401", section: "A", semester: 4, maxInternal: 30, maxPractical: 0 },
  { _id: "2", name: "Operating Systems", code: "CS402", section: "A", semester: 4, maxInternal: 30, maxPractical: 25 },
  { _id: "3", name: "Database Lab", code: "CS403L", section: "A", semester: 4, maxInternal: 0, maxPractical: 50 },
];

const generateStudents = () =>
  Array.from({ length: 10 }, (_, i) => ({
    _id: String(i + 1),
    name: ["Aarav Sharma", "Priya Singh", "Rahul Gupta", "Sneha Patel", "Arjun Mehta", "Divya Kumar", "Vikram Joshi", "Ananya Verma", "Rohit Das", "Meera Pillai"][i],
    rollNumber: `CS401${String(i + 1).padStart(3, "0")}`,
    internalMarks: null,
    practicalMarks: null,
  }));

const GradeSubmissions = () => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [marksType, setMarksType] = useState("internal");
  const [saving, setSaving] = useState(false);
  const [allMarks, setAllMarks] = useState("");

  const handleSubjectChange = (e) => {
    const sub = mockSubjects.find((s) => s._id === e.target.value) || null;
    setSelectedSubject(sub);
    setStudents(generateStudents());
  };

  const updateMark = (studentId, field, value) => {
    setStudents((prev) =>
      prev.map((s) => s._id === studentId ? { ...s, [field]: value === "" ? null : Number(value) } : s)
    );
  };

  const applyAll = () => {
    if (allMarks === "") return;
    const max = marksType === "internal" ? selectedSubject?.maxInternal : selectedSubject?.maxPractical;
    if (Number(allMarks) > max) { toast.error(`Max marks is ${max}`); return; }
    setStudents((prev) => prev.map((s) => ({ ...s, [`${marksType}Marks`]: Number(allMarks) })));
  };

  const handleSave = async () => {
    if (!selectedSubject) return;
    setSaving(true);
    try {
      const payload = {
        subjectId: selectedSubject._id,
        marks: students.map((s) => ({
          studentId: s._id,
          internalMarks: s.internalMarks,
          practicalMarks: s.practicalMarks,
        })),
      };
      await professorService.uploadInternalMarks(payload);
      toast.success("Marks uploaded successfully! ✅");
    } catch {
      toast.error("Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  const getMarksValue = (student) =>
    marksType === "internal" ? student.internalMarks : student.practicalMarks;
  const maxMarks = marksType === "internal" ? selectedSubject?.maxInternal : selectedSubject?.maxPractical;
  const fieldName = marksType === "internal" ? "internalMarks" : "practicalMarks";

  const columns = [
    {
      header: "#", render: (_, __, rowIdx) => (
        <span className="text-gray-400 font-mono text-xs">{rowIdx + 1}</span>
      ), width: "40px"
    },
    {
      header: "Student", accessor: "name", sortable: true, render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800 text-sm">{val}</p>
          <p className="text-xs text-gray-400">{row.rollNumber}</p>
        </div>
      )
    },
    {
      header: `${marksType === "internal" ? "Internal" : "Practical"} Marks (/${maxMarks})`,
      render: (_, row) => (
        <input
          type="number"
          min={0}
          max={maxMarks}
          value={getMarksValue(row) ?? ""}
          onChange={(e) => updateMark(row._id, fieldName, e.target.value)}
          className={`w-20 px-3 py-1.5 rounded-lg border-2 text-sm font-medium text-center focus:outline-none transition-colors
            ${getMarksValue(row) !== null && getMarksValue(row) < maxMarks * 0.4 ? "border-red-300 bg-red-50 text-red-700 focus:border-red-400" : "border-gray-200 bg-white focus:border-primary-400"}`}
          placeholder="—"
        />
      )
    },
    {
      header: "Status",
      render: (_, row) => {
        const val = getMarksValue(row);
        if (val === null) return <span className="badge bg-gray-100 text-gray-500">Not entered</span>;
        if (val < maxMarks * 0.4) return <span className="badge badge-danger">Below 40%</span>;
        if (val < maxMarks * 0.6) return <span className="badge badge-warning">Average</span>;
        return <span className="badge badge-success">Good</span>;
      }
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Upload Marks</h1>
        <p className="page-subtitle">Enter internal and practical marks for students</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Select Subject *</label>
          <select onChange={handleSubjectChange} className="input-field">
            <option value="">Choose subject...</option>
            {mockSubjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
        {selectedSubject && (
          <div>
            <label className="label">Marks Type</label>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              {[
                { value: "internal", label: `Internal /${selectedSubject.maxInternal}`, disabled: !selectedSubject.maxInternal },
                { value: "practical", label: `Practical /${selectedSubject.maxPractical}`, disabled: !selectedSubject.maxPractical },
              ].map(({ value, label, disabled }) => (
                <button
                  key={value}
                  onClick={() => !disabled && setMarksType(value)}
                  disabled={disabled}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${marksType === value ? "bg-white text-primary-600 shadow-sm" : disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedSubject && students.length > 0 && (
        <>
          <div className="card">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="font-display font-bold text-gray-900">
                {selectedSubject.name} — {marksType === "internal" ? "Internal" : "Practical"} Marks
                <span className="text-gray-400 font-normal text-sm ml-2">(Max: {maxMarks})</span>
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={allMarks}
                  onChange={(e) => setAllMarks(e.target.value)}
                  className="w-20 input-field py-1.5 text-sm"
                  placeholder="All"
                  min={0}
                  max={maxMarks}
                />
                <button onClick={applyAll} className="btn-secondary text-sm py-1.5 px-3">Apply to All</button>
              </div>
            </div>
            <Table columns={columns} data={students} />

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="flex gap-4 text-sm text-gray-500">
                <span>Entered: {students.filter((s) => getMarksValue(s) !== null).length}/{students.length}</span>
                <span>Avg: {(students.filter((s) => getMarksValue(s) !== null).reduce((a, s) => a + getMarksValue(s), 0) / (students.filter((s) => getMarksValue(s) !== null).length || 1)).toFixed(1)}/{maxMarks}</span>
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "💾 Save Marks"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Entered", value: students.filter((s) => getMarksValue(s) !== null).length, color: "text-primary-600" },
              { label: "Below 40%", value: students.filter((s) => getMarksValue(s) !== null && getMarksValue(s) < maxMarks * 0.4).length, color: "text-red-600" },
              { label: "40-60%", value: students.filter((s) => getMarksValue(s) !== null && getMarksValue(s) >= maxMarks * 0.4 && getMarksValue(s) < maxMarks * 0.6).length, color: "text-amber-600" },
              { label: "Above 60%", value: students.filter((s) => getMarksValue(s) !== null && getMarksValue(s) >= maxMarks * 0.6).length, color: "text-emerald-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="card py-3 text-center">
                <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {!selectedSubject && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-gray-500 font-medium">Select a subject to enter marks</p>
        </div>
      )}
    </div>
  );
};

export default GradeSubmissions;
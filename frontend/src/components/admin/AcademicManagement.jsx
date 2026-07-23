import { useState } from "react";
import Table from "../common/Table";
import Modal from "../common/Modal";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";

const mockDepts = [
  { _id: "1", name: "Computer Science", code: "CS", courses: 4, professors: 24, students: 520, isActive: true },
  { _id: "2", name: "Information Technology", code: "IT", courses: 3, professors: 18, students: 480, isActive: true },
  { _id: "3", name: "Electronics", code: "ECE", courses: 3, professors: 22, students: 410, isActive: true },
  { _id: "4", name: "Mechanical", code: "ME", courses: 2, professors: 20, students: 380, isActive: true },
];

const mockSubjects = [
  { _id: "1", name: "Algorithms", code: "CS401", department: "Computer Science", semester: 4, credits: 4, type: "theory", professor: "Dr. Kumar" },
  { _id: "2", name: "Operating Systems", code: "CS402", department: "Computer Science", semester: 4, credits: 4, type: "theory", professor: "Dr. Gupta" },
  { _id: "3", name: "Database Lab", code: "CS403L", department: "Computer Science", semester: 4, credits: 2, type: "practical", professor: null },
  { _id: "4", name: "Computer Networks", code: "CS404", department: "Computer Science", semester: 4, credits: 4, type: "theory", professor: "Prof. Sharma" },
];

const mockProfessors = [
  { _id: "p1", name: "Dr. Kumar", employeeId: "EMP001" },
  { _id: "p2", name: "Dr. Gupta", employeeId: "EMP002" },
  { _id: "p3", name: "Prof. Sharma", employeeId: "EMP003" },
];

const AcademicManagement = () => {
  const [activeTab, setActiveTab] = useState("departments");
  const [deptModal, setDeptModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedProf, setSelectedProf] = useState("");
  const [saving, setSaving] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "" });
  const [subjectForm, setSubjectForm] = useState({
    name: "", code: "", department: "", semester: 1, credits: 3, type: "theory", section: "A",
    maxInternalMarks: 30, maxExternalMarks: 70, maxPracticalMarks: 0,
  });

  const handleCreateDept = async () => {
    if (!deptForm.name || !deptForm.code) { toast.error("Name and code required"); return; }
    setSaving(true);
    try {
      await adminService.createDepartment(deptForm);
      toast.success("Department created!");
      setDeptModal(false);
      setDeptForm({ name: "", code: "", description: "" });
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleCreateSubject = async () => {
    if (!subjectForm.name || !subjectForm.code || !subjectForm.department) { toast.error("Fill required fields"); return; }
    setSaving(true);
    try {
      await adminService.createSubject(subjectForm);
      toast.success("Subject created!");
      setSubjectModal(false);
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  const handleAssign = async () => {
    if (!selectedProf) { toast.error("Select a professor"); return; }
    setSaving(true);
    try {
      await adminService.assignFacultyToSubject(selectedSubject._id, selectedProf);
      toast.success("Faculty assigned!");
      setAssignModal(false);
    } catch { toast.error("Assignment failed"); }
    finally { setSaving(false); }
  };

  const deptColumns = [
    { header: "Department", accessor: "name", sortable: true, render: (val, row) => (
      <div><p className="font-semibold text-gray-800 text-sm">{val}</p><p className="text-xs text-primary-600 font-mono">{row.code}</p></div>
    )},
    { header: "Courses", accessor: "courses", render: (v) => <span className="badge badge-info">{v} courses</span> },
    { header: "Professors", accessor: "professors", render: (v) => <span className="badge badge-success">{v} faculty</span> },
    { header: "Students", accessor: "students", sortable: true, render: (v) => <span className="font-semibold text-gray-700">{v.toLocaleString()}</span> },
    { header: "Status", accessor: "isActive", render: (v) => <span className={`badge ${v ? "badge-success" : "badge-danger"}`}>{v ? "Active" : "Inactive"}</span> },
    { header: "Delete", render: () => <button className="text-xs text-red-500 hover:text-red-700 font-medium">🗑️</button> },
  ];

  const subjectColumns = [
    { header: "Subject", accessor: "name", sortable: true, render: (val, row) => (
      <div><p className="font-semibold text-gray-800 text-sm">{val}</p><p className="text-xs font-mono text-primary-600">{row.code}</p></div>
    )},
    { header: "Dept / Sem", render: (_, row) => <div><p className="text-sm text-gray-700">{row.department}</p><p className="text-xs text-gray-400">Semester {row.semester}</p></div> },
    { header: "Credits", accessor: "credits", render: (v, row) => (
      <div>
        <span className="badge badge-primary text-xs">{v} cr</span>
        <span className={`ml-1 badge text-[10px] ${row.type === "theory" ? "badge-info" : row.type === "practical" ? "badge-success" : "badge-warning"}`}>{row.type}</span>
      </div>
    )},
    { header: "Faculty", accessor: "professor", render: (v, row) => v ? (
      <p className="text-sm text-gray-700">{v}</p>
    ) : (
      <button onClick={() => { setSelectedSubject(row); setSelectedProf(""); setAssignModal(true); }} className="text-xs text-amber-600 font-semibold hover:text-amber-700">
        ⚠️ Assign Faculty
      </button>
    )},
    { header: "Actions", render: (_, row) => (
      <button onClick={() => { setSelectedSubject(row); setSelectedProf(""); setAssignModal(true); }}
        className="w-7 h-7 bg-primary-50 text-primary-600 rounded-lg text-sm flex items-center justify-center hover:bg-primary-100"
        title="Assign Faculty">👨‍🏫</button>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Academic Management</h1>
          <p className="page-subtitle">Manage departments, courses, and subjects</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "departments" && <button onClick={() => setDeptModal(true)} className="btn-primary text-sm py-2">➕ Add Department</button>}
          {activeTab === "subjects" && <button onClick={() => setSubjectModal(true)} className="btn-primary text-sm py-2">➕ Add Subject</button>}
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[{ key: "departments", icon: "🏛️", label: "Departments" }, { key: "subjects", icon: "📚", label: "Subjects" }].map(({ key, icon, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === key ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {activeTab === "departments" && (
        <div className="card"><Table columns={deptColumns} data={mockDepts} searchable searchPlaceholder="Search departments..." /></div>
      )}

      {activeTab === "subjects" && (
        <div className="card"><Table columns={subjectColumns} data={mockSubjects} searchable searchPlaceholder="Search subjects..." /></div>
      )}

      <Modal isOpen={deptModal} onClose={() => setDeptModal(false)} title="Add Department" icon="🏛️" footer={
        <>
          <button onClick={() => setDeptModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
          <button onClick={handleCreateDept} className="btn-primary" disabled={saving}>{saving ? "Creating..." : "Create"}</button>
        </>
      }>
        <div className="space-y-4">
          <div><label className="label">Department Name *</label><input type="text" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} className="input-field" placeholder="e.g. Computer Science" /></div>
          <div><label className="label">Code *</label><input type="text" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })} className="input-field" placeholder="e.g. CS" maxLength={10} /></div>
          <div><label className="label">Description</label><textarea value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} className="input-field resize-none" rows={3} placeholder="Department description..." /></div>
        </div>
      </Modal>

      <Modal isOpen={subjectModal} onClose={() => setSubjectModal(false)} title="Add Subject" icon="📚" size="lg" footer={
        <>
          <button onClick={() => setSubjectModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
          <button onClick={handleCreateSubject} className="btn-primary" disabled={saving}>{saving ? "Creating..." : "Create Subject"}</button>
        </>
      }>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Subject Name *</label><input type="text" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} className="input-field" placeholder="e.g. Data Structures" /></div>
          <div><label className="label">Code *</label><input type="text" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} className="input-field" placeholder="e.g. CS301" /></div>
          <div>
            <label className="label">Department *</label>
            <select value={subjectForm.department} onChange={(e) => setSubjectForm({ ...subjectForm, department: e.target.value })} className="input-field">
              <option value="">Select department...</option>
              {mockDepts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div><label className="label">Semester *</label><input type="number" value={subjectForm.semester} onChange={(e) => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })} className="input-field" min={1} max={10} /></div>
          <div><label className="label">Credits</label><input type="number" value={subjectForm.credits} onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })} className="input-field" min={1} max={6} /></div>
          <div>
            <label className="label">Type</label>
            <select value={subjectForm.type} onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })} className="input-field">
              <option value="theory">Theory</option><option value="practical">Practical</option><option value="elective">Elective</option>
            </select>
          </div>
          <div><label className="label">Section</label><input type="text" value={subjectForm.section} onChange={(e) => setSubjectForm({ ...subjectForm, section: e.target.value })} className="input-field" placeholder="A" /></div>
          <div><label className="label">Max Internal Marks</label><input type="number" value={subjectForm.maxInternalMarks} onChange={(e) => setSubjectForm({ ...subjectForm, maxInternalMarks: Number(e.target.value) })} className="input-field" /></div>
          <div><label className="label">Max External Marks</label><input type="number" value={subjectForm.maxExternalMarks} onChange={(e) => setSubjectForm({ ...subjectForm, maxExternalMarks: Number(e.target.value) })} className="input-field" /></div>
          <div><label className="label">Max Practical Marks</label><input type="number" value={subjectForm.maxPracticalMarks} onChange={(e) => setSubjectForm({ ...subjectForm, maxPracticalMarks: Number(e.target.value) })} className="input-field" /></div>
        </div>
      </Modal>

      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Faculty" icon="👨‍🏫" size="sm" footer={
        <>
          <button onClick={() => setAssignModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
          <button onClick={handleAssign} className="btn-primary" disabled={saving || !selectedProf}>{saving ? "Assigning..." : "✅ Assign"}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="font-semibold text-gray-800 text-sm">{selectedSubject?.name}</p>
            <p className="text-xs text-gray-500">{selectedSubject?.code} · Semester {selectedSubject?.semester}</p>
          </div>
          <div>
            <label className="label">Select Professor</label>
            <select value={selectedProf} onChange={(e) => setSelectedProf(e.target.value)} className="input-field">
              <option value="">Choose professor...</option>
              {mockProfessors.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.employeeId})</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AcademicManagement;
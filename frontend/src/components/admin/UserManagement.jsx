import { useState } from "react";
import Table from "../common/Table";
import Modal from "../common/Modal";
import { ConfirmModal } from "../common/Modal";
import FileUploader from "../common/FileUploader";
import { formatDate, getInitials, generateAvatarColor } from "../../utils/helpers";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";

const mockUsers = [
  { _id: "1", name: "Aarav Sharma", email: "aarav@college.edu", role: "student", isActive: true, createdAt: new Date("2022-08-10"), rollNumber: "CS40101", department: "Computer Science", semester: 4 },
  { _id: "2", name: "Dr. Kumar", email: "kumar@college.edu", role: "professor", isActive: true, createdAt: new Date("2020-01-15"), employeeId: "EMP001", department: "Computer Science", designation: "Assistant Professor" },
  { _id: "3", name: "Priya Singh", email: "priya@college.edu", role: "student", isActive: false, createdAt: new Date("2022-08-10"), rollNumber: "CS40102", department: "Computer Science", semester: 4 },
  { _id: "4", name: "Prof. Mehra", email: "mehra@college.edu", role: "professor", isActive: true, createdAt: new Date("2019-07-01"), employeeId: "EMP002", department: "Chemistry", designation: "Associate Professor" },
];

const defaultStudentForm = { name: "", email: "", password: "", rollNumber: "", enrollmentNumber: "", department: "", course: "", semester: 1, section: "A", batch: "2022-26", fatherName: "", phone: "" };
const defaultProfForm = { name: "", email: "", password: "", employeeId: "", department: "", designation: "Assistant Professor", qualification: "", specialization: "", phone: "" };

const UserManagement = () => {
  const [roleFilter, setRoleFilter] = useState("all");
  const [createModal, setCreateModal] = useState(false);
  const [createRole, setCreateRole] = useState("student");
  const [bulkModal, setBulkModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(defaultStudentForm);
  const [csvFile, setCsvFile] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredUsers = roleFilter === "all" ? mockUsers : mockUsers.filter((u) => u.role === roleFilter);

  const handleCreateRoleChange = (role) => {
    setCreateRole(role);
    setForm(role === "student" ? defaultStudentForm : defaultProfForm);
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { toast.error("Name, email and password are required"); return; }
    setSaving(true);
    try {
      await adminService.createUser({ ...form, role: createRole });
      toast.success(`${createRole === "student" ? "Student" : "Professor"} added successfully! 🎉`);
      setCreateModal(false);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create user"); }
    finally { setSaving(false); }
  };

  const handleToggleStatus = async (user) => {
    try {
      await adminService.toggleUserStatus(user._id);
      toast.success(`${user.name} ${user.isActive ? "deactivated" : "activated"}`);
    } catch { toast.error("Failed to toggle status"); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await adminService.deleteUser(selectedUser._id);
      toast.success("User deleted");
      setDeleteModal(false);
    } catch { toast.error("Failed to delete user"); }
    finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error("Password must be 6+ characters"); return; }
    setSaving(true);
    try {
      await adminService.resetUserPassword(selectedUser._id, newPassword);
      toast.success("Password reset successfully");
      setResetModal(false);
      setNewPassword("");
    } catch { toast.error("Failed to reset password"); }
    finally { setSaving(false); }
  };

  const handleBulkImport = async () => {
    if (!csvFile) { toast.error("Select a file"); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("role", createRole);
      await adminService.bulkImportUsers(formData);
      toast.success("Users imported successfully!");
      setBulkModal(false);
    } catch { toast.error("Import failed"); }
    finally { setSaving(false); }
  };

  const columns = [
    {
      header: "User", accessor: "name", sortable: true, render: (val, row) => {
        const color = generateAvatarColor(val);
        return (
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
              {getInitials(val)}
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">{val}</p>
              <p className="text-xs text-gray-400">{row.email}</p>
            </div>
          </div>
        );
      }
    },
    {
      header: "Role / ID", render: (_, row) => (
        <div>
          <span className={`badge text-xs ${row.role === "student" ? "badge-info" : "badge-success"}`}>{row.role}</span>
          <p className="text-xs text-gray-400 mt-0.5">{row.rollNumber || row.employeeId}</p>
        </div>
      )
    },
    { header: "Department", accessor: "department", sortable: true, render: (val) => <span className="text-sm text-gray-600">{val}</span> },
    {
      header: "Status", accessor: "isActive", render: (val, row) => (
        <button onClick={() => handleToggleStatus(row)} className={`badge cursor-pointer hover:opacity-80 ${val ? "badge-success" : "badge-danger"}`}>
          {val ? "✓ Active" : "✗ Inactive"}
        </button>
      )
    },
    { header: "Joined", accessor: "createdAt", sortable: true, render: (val) => <span className="text-xs text-gray-500">{formatDate(val)}</span> },
    {
      header: "Actions", render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={() => { setSelectedUser(row); setResetModal(true); }} className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm hover:bg-blue-100 transition-colors" title="Reset Password">🔑</button>
          <button onClick={() => { setSelectedUser(row); setDeleteModal(true); }} className="w-7 h-7 bg-red-50 text-red-600 rounded-lg flex items-center justify-center text-sm hover:bg-red-100 transition-colors" title="Delete">🗑️</button>
        </div>
      )
    },
  ];

  const studentFields = [
    [{ label: "Full Name *", key: "name", type: "text", placeholder: "Student's full name" }, { label: "Email *", key: "email", type: "email", placeholder: "student@college.edu" }],
    [{ label: "Password *", key: "password", type: "password", placeholder: "Min 6 characters" }, { label: "Roll Number *", key: "rollNumber", type: "text", placeholder: "CS40101" }],
    [{ label: "Enrollment No.", key: "enrollmentNumber", type: "text", placeholder: "ENR12345" }, { label: "Semester", key: "semester", type: "number", placeholder: "1" }],
    [{ label: "Section", key: "section", type: "text", placeholder: "A" }, { label: "Batch", key: "batch", type: "text", placeholder: "2022-26" }],
    [{ label: "Father's Name", key: "fatherName", type: "text", placeholder: "Parent's name" }, { label: "Phone", key: "phone", type: "tel", placeholder: "+91 9876543210" }],
  ];

  const professorFields = [
    [{ label: "Full Name *", key: "name", type: "text", placeholder: "Dr. Full Name" }, { label: "Email *", key: "email", type: "email", placeholder: "professor@college.edu" }],
    [{ label: "Password *", key: "password", type: "password", placeholder: "Min 6 characters" }, { label: "Employee ID *", key: "employeeId", type: "text", placeholder: "EMP001" }],
    [{ label: "Qualification", key: "qualification", type: "text", placeholder: "Ph.D, M.Tech..." }, { label: "Specialization", key: "specialization", type: "text", placeholder: "Machine Learning..." }],
    [{ label: "Phone", key: "phone", type: "tel", placeholder: "+91 9876543210" }],
  ];

  const fields = createRole === "student" ? studentFields : professorFields;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Add, manage and control access for all users</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setBulkModal(true)} className="btn-secondary text-sm py-2">📊 Bulk Import</button>
          <button onClick={() => setCreateModal(true)} className="btn-primary text-sm py-2">➕ Add User</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "All Users", value: "all", count: mockUsers.length, color: "text-gray-700" },
          { label: "Students", value: "student", count: mockUsers.filter((u) => u.role === "student").length, color: "text-blue-600" },
          { label: "Professors", value: "professor", count: mockUsers.filter((u) => u.role === "professor").length, color: "text-emerald-600" },
          { label: "Inactive", value: "inactive", count: mockUsers.filter((u) => !u.isActive).length, color: "text-red-600" },
        ].map(({ label, value, count, color }) => (
          <button key={value} onClick={() => setRoleFilter(value === "inactive" ? "all" : value)}
            className={`card py-3 text-center transition-all ${roleFilter === value ? "ring-2 ring-primary-500" : ""}`}>
            <p className={`text-2xl font-bold font-display ${color}`}>{count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      <div className="card">
        <Table columns={columns} data={filteredUsers} searchable searchPlaceholder="Search users..." emptyMessage="No users found" />
      </div>

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Add New User" icon="👤" size="lg" footer={
        <>
          <button onClick={() => setCreateModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
          <button onClick={handleCreate} className="btn-primary" disabled={saving}>{saving ? "Adding..." : "✅ Add User"}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-2">
            {["student", "professor"].map((r) => (
              <button key={r} onClick={() => handleCreateRoleChange(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${createRole === r ? "bg-white text-primary-600 shadow-sm" : "text-gray-500"}`}>
                {r === "student" ? "🎓 Student" : "👨‍🏫 Professor"}
              </button>
            ))}
          </div>

          <div>
            <label className="label">Department</label>
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input-field">
              <option value="">Select department...</option>
              {["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "Electrical"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {createRole === "professor" && (
            <div>
              <label className="label">Designation</label>
              <select value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="input-field">
                {["Assistant Professor", "Associate Professor", "Professor", "HOD", "Dean"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {fields.map((row, ri) => (
            <div key={ri} className={`grid grid-cols-${row.length === 1 ? "1" : "2"} gap-4`}>
              {row.map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input
                    type={type}
                    value={form[key] || ""}
                    onChange={(e) => setForm({ ...form, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
                    className="input-field"
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={bulkModal} onClose={() => setBulkModal(false)} title="Bulk Import Users" icon="📊" footer={
        <>
          <button onClick={() => setBulkModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
          <button onClick={handleBulkImport} className="btn-primary" disabled={saving || !csvFile}>{saving ? "Importing..." : "📤 Import"}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            {["student", "professor"].map((r) => (
              <button key={r} onClick={() => setCreateRole(r)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${createRole === r ? "bg-white text-primary-600 shadow-sm" : "text-gray-500"}`}>{r}</button>
            ))}
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 space-y-1">
            <p className="font-semibold">CSV Format ({createRole}):</p>
            {createRole === "student" ? <p>name, email, password, rollNumber, department, semester, section, batch</p> : <p>name, email, password, employeeId, department, designation</p>}
          </div>
          <FileUploader onFilesSelected={setCsvFile} accept=".csv,.xlsx" allowedFormats={["csv", "xlsx"]} maxSize={10} label="Upload CSV or Excel file" />
          <a href="#" className="text-xs text-primary-600 hover:underline">📥 Download template</a>
        </div>
      </Modal>

      <ConfirmModal isOpen={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={handleDelete} title="Delete User" message={`Are you sure you want to permanently delete "${selectedUser?.name}"? This action cannot be undone and all their data will be removed.`} confirmText="Delete Permanently" loading={saving} />

      <Modal isOpen={resetModal} onClose={() => setResetModal(false)} title="Reset Password" icon="🔑" size="sm" footer={
        <>
          <button onClick={() => setResetModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
          <button onClick={handleReset} className="btn-primary" disabled={saving}>{saving ? "Resetting..." : "Reset"}</button>
        </>
      }>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Reset password for <strong>{selectedUser?.name}</strong></p>
          <div>
            <label className="label">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" placeholder="Min 6 characters" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { InfoRow } from "../common/Card";
import Modal from "../common/Modal";
import FileUploader from "../common/FileUploader";
import { formatDate } from "../../utils/helpers";
import { getInitials, generateAvatarColor } from "../../utils/helpers";
import { studentService } from "../../services/studentService";
import toast from "react-hot-toast";

const ProfileCard = () => {
  const { user, profile, updateUser, updateProfile } = useAuth();
  const [editModal, setEditModal] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const avatarColor = generateAvatarColor(user?.name || "");

  const mockFees = {
    semester: 4, totalAmount: 45000, amountPaid: 30000,
    dueAmount: 15000, dueDate: new Date(Date.now() + 30 * 86400000), status: "partial",
  };

  const feeStatusConfig = {
    paid: { label: "Fully Paid", color: "text-emerald-600 bg-emerald-50", icon: "✅" },
    partial: { label: "Partially Paid", color: "text-amber-600 bg-amber-50", icon: "⚠️" },
    pending: { label: "Pending", color: "text-red-600 bg-red-50", icon: "❌" },
    overdue: { label: "Overdue", color: "text-red-700 bg-red-50", icon: "🚨" },
  };

  const feeConf = feeStatusConfig[mockFees.status];

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("phone", form.phone);
      if (photoFile) formData.append("profilePicture", photoFile);
      const { data } = await studentService.updateProfile(formData);
      updateUser({ name: form.name, phone: form.phone, profilePicture: data?.profilePicture || user.profilePicture });
      toast.success("Profile updated!");
      setEditModal(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (pwForm.new !== pwForm.confirm) { toast.error("Passwords don't match"); return; }
    if (pwForm.new.length < 6) { toast.error("Password must be 6+ characters"); return; }
    setSaving(true);
    try {
      await import("../../services/authService").then(({ authService }) =>
        authService.changePassword(pwForm.current, pwForm.new)
      );
      toast.success("Password changed!");
      setPwModal(false);
      setPwForm({ current: "", new: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Your academic and personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card flex flex-col items-center text-center">
          <div className="relative mb-4">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="" className="w-28 h-28 rounded-3xl object-cover shadow-lg ring-4 ring-primary-100" />
            ) : (
              <div className={`w-28 h-28 ${avatarColor} rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-primary-100`}>
                {getInitials(user?.name)}
              </div>
            )}
            <button
              onClick={() => setEditModal(true)}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 text-white rounded-xl flex items-center justify-center text-sm shadow-lg hover:bg-primary-700 transition-colors"
            >
              ✏️
            </button>
          </div>

          <h2 className="font-display font-bold text-gray-900 text-xl">{user?.name}</h2>
          <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>

          <div className="flex flex-wrap justify-center gap-2 mt-3">
            <span className="badge badge-primary capitalize">{user?.role}</span>
            {profile?.section && <span className="badge badge-info">Section {profile.section}</span>}
            {profile?.batch && <span className="badge bg-gray-100 text-gray-700">{profile.batch}</span>}
          </div>

          <div className="w-full mt-4 space-y-1">
            <button onClick={() => setEditModal(true)} className="btn-secondary w-full text-sm py-2">✏️ Edit Profile</button>
            <button onClick={() => setPwModal(true)} className="w-full text-sm py-2 rounded-xl text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">🔒 Change Password</button>
            <button onClick={() => { toast.success("Downloading ID card..."); }} className="w-full text-sm py-2 rounded-xl text-primary-600 border border-primary-200 hover:bg-primary-50 transition-colors">🪪 Download ID Card</button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-display font-bold text-gray-900 mb-1">Academic Information</h3>
            <p className="text-xs text-gray-400 mb-4">Your current enrollment details</p>
            <InfoRow label="Roll Number" value={profile?.rollNumber} icon="🎫" />
            <InfoRow label="Enrollment Number" value={profile?.enrollmentNumber} icon="📋" />
            <InfoRow label="Department" value={profile?.department?.name} icon="🏛️" />
            <InfoRow label="Course" value={profile?.course?.name} icon="📚" />
            <InfoRow label="Current Semester" value={`Semester ${profile?.semester}`} icon="📆" />
            <InfoRow label="Section" value={profile?.section} icon="👥" />
            <InfoRow label="Batch" value={profile?.batch} icon="🎓" />
            <InfoRow label="CGPA" value={profile?.cgpa?.toFixed(2)} icon="📊" />
            <InfoRow label="Admission Date" value={formatDate(profile?.admissionDate)} icon="📅" />
          </div>

          <div className="card">
            <h3 className="font-display font-bold text-gray-900 mb-1">Personal Information</h3>
            <p className="text-xs text-gray-400 mb-4">Your personal and contact details</p>
            <InfoRow label="Phone" value={user?.phone || "Not set"} icon="📱" />
            <InfoRow label="Father's Name" value={profile?.fatherName} icon="👨" />
            <InfoRow label="Mother's Name" value={profile?.motherName} icon="👩" />
            <InfoRow label="Date of Birth" value={formatDate(profile?.dateOfBirth)} icon="🎂" />
            <InfoRow label="Gender" value={profile?.gender} icon="👤" />
            <InfoRow label="Blood Group" value={profile?.bloodGroup} icon="🩸" />
            <InfoRow label="Address" value={profile?.address ? `${profile.address.city}, ${profile.address.state}` : "Not set"} icon="🏠" />
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-gray-900">Fee Status</h3>
                <p className="text-xs text-gray-400">Semester {mockFees.semester} fees</p>
              </div>
              <span className={`badge ${feeConf.color} font-semibold`}>{feeConf.icon} {feeConf.label}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Total", value: `₹${mockFees.totalAmount.toLocaleString()}`, color: "text-gray-700" },
                { label: "Paid", value: `₹${mockFees.amountPaid.toLocaleString()}`, color: "text-emerald-600" },
                { label: "Due", value: `₹${mockFees.dueAmount.toLocaleString()}`, color: "text-red-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className={`text-lg font-bold font-display ${color}`}>{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="h-2.5 rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${(mockFees.amountPaid / mockFees.totalAmount) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">Due date: {formatDate(mockFees.dueDate)}</p>
          </div>
        </div>
      </div>

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Profile" icon="✏️" footer={
        <>
          <button onClick={() => setEditModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </>
      }>
        <div className="space-y-4">
          <div>
            <label className="label">Profile Picture</label>
            <FileUploader onFilesSelected={setPhotoFile} accept=".jpg,.jpeg,.png,.webp" allowedFormats={["jpg", "jpeg", "png", "webp"]} maxSize={5} label="Upload profile photo" />
          </div>
          <div>
            <label className="label">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Your full name" />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+91 9876543210" />
          </div>
        </div>
      </Modal>

      <Modal isOpen={pwModal} onClose={() => setPwModal(false)} title="Change Password" icon="🔒" size="sm" footer={
        <>
          <button onClick={() => setPwModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
          <button onClick={handlePasswordChange} className="btn-primary" disabled={saving}>
            {saving ? "Changing..." : "Change Password"}
          </button>
        </>
      }>
        <div className="space-y-4">
          {[
            { label: "Current Password", key: "current" },
            { label: "New Password", key: "new" },
            { label: "Confirm New Password", key: "confirm" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input type="password" value={pwForm[key]} onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })} className="input-field" placeholder="••••••••" />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default ProfileCard;
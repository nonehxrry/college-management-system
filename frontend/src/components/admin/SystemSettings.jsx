import { useState } from "react";
import Table from "../common/Table";
import { formatDateTime } from "../../utils/helpers";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";

const mockAuditLogs = [
  { _id: "1", user: "Admin", action: "USER_CREATED", entity: "Student", details: "Added Aarav Sharma", createdAt: new Date(Date.now() - 3600000), ipAddress: "192.168.1.1" },
  { _id: "2", user: "Dr. Kumar", action: "ATTENDANCE_MARKED", entity: "Attendance", details: "CS401 Sec A - 62 students", createdAt: new Date(Date.now() - 7200000), ipAddress: "192.168.1.25" },
  { _id: "3", user: "Admin", action: "RESULT_PUBLISHED", entity: "Result", details: "Sem 3 results - IT Dept", createdAt: new Date(Date.now() - 86400000), ipAddress: "192.168.1.1" },
  { _id: "4", user: "Prof. Mehra", action: "NOTICE_SENT", entity: "Notice", details: "Urgent fee deadline notice", createdAt: new Date(Date.now() - 2 * 86400000), ipAddress: "192.168.1.30" },
];

const defaultSettings = {
  collegeName: "National Institute of Technology",
  collegeEmail: "info@nit.edu.in",
  collegePhone: "+91 11 2345 6789",
  collegeWebsite: "www.nit.edu.in",
  currentAcademicYear: "2023-24",
  attendanceThreshold: 75,
  allowLateSubmissions: true,
  maxLateSubmissionDays: 3,
  emailNotifications: true,
  smsNotifications: false,
  maintenanceMode: false,
  maxFileUploadSize: 25,
  sessionTimeout: 60,
};

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(defaultSettings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updateSystemSettings(settings);
      toast.success("Settings saved successfully! ✅");
    } catch { toast.error("Failed to save settings"); }
    finally { setSaving(false); }
  };

  const handleBackup = async () => {
    try {
      toast.success("Database backup initiated! Check your email. 📦");
      await adminService.backupDatabase();
    } catch { toast.error("Backup failed"); }
  };

  const auditColumns = [
    { header: "User", accessor: "user", render: (v) => <span className="font-medium text-gray-800 text-sm">{v}</span> },
    { header: "Action", accessor: "action", render: (v) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{v}</span> },
    { header: "Entity", accessor: "entity", render: (v) => <span className="badge badge-info text-xs">{v}</span> },
    { header: "Details", accessor: "details", render: (v) => <span className="text-xs text-gray-600 truncate block max-w-[200px]">{v}</span> },
    { header: "IP", accessor: "ipAddress", render: (v) => <span className="text-xs font-mono text-gray-500">{v}</span> },
    { header: "Time", accessor: "createdAt", render: (v) => <span className="text-xs text-gray-400">{formatDateTime(v)}</span> },
  ];

  const ToggleSwitch = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${value ? "bg-primary-600" : "bg-gray-200"}`}
    >
      <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Configure system preferences and view audit logs</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "💾 Save Settings"}
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar">
        {[
          { key: "general", icon: "⚙️", label: "General" },
          { key: "academic", icon: "🎓", label: "Academic" },
          { key: "notifications", icon: "🔔", label: "Notifications" },
          { key: "security", icon: "🔒", label: "Security" },
          { key: "audit", icon: "📋", label: "Audit Logs" },
          { key: "maintenance", icon: "🔧", label: "Maintenance" },
        ].map(({ key, icon, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${activeTab === key ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="card space-y-5">
          <h3 className="font-display font-bold text-gray-900">College Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">College Name</label><input type="text" value={settings.collegeName} onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })} className="input-field" /></div>
            <div><label className="label">Official Email</label><input type="email" value={settings.collegeEmail} onChange={(e) => setSettings({ ...settings, collegeEmail: e.target.value })} className="input-field" /></div>
            <div><label className="label">Phone</label><input type="tel" value={settings.collegePhone} onChange={(e) => setSettings({ ...settings, collegePhone: e.target.value })} className="input-field" /></div>
            <div><label className="label">Website</label><input type="text" value={settings.collegeWebsite} onChange={(e) => setSettings({ ...settings, collegeWebsite: e.target.value })} className="input-field" /></div>
            <div><label className="label">Current Academic Year</label>
              <select value={settings.currentAcademicYear} onChange={(e) => setSettings({ ...settings, currentAcademicYear: e.target.value })} className="input-field">
                {["2022-23", "2023-24", "2024-25", "2025-26"].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === "academic" && (
        <div className="card space-y-5">
          <h3 className="font-display font-bold text-gray-900">Academic Rules</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Minimum Attendance Threshold (%)</label>
              <div className="flex items-center gap-4">
                <input type="range" min={50} max={90} step={5} value={settings.attendanceThreshold} onChange={(e) => setSettings({ ...settings, attendanceThreshold: Number(e.target.value) })} className="flex-1" />
                <span className={`w-16 text-center text-xl font-bold font-display ${settings.attendanceThreshold >= 75 ? "text-emerald-600" : "text-red-600"}`}>{settings.attendanceThreshold}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Students below this threshold will receive shortage warnings</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800 text-sm">Allow Late Submissions</p>
                <p className="text-xs text-gray-400">Permit assignment submissions after deadline</p>
              </div>
              <ToggleSwitch value={settings.allowLateSubmissions} onChange={(v) => setSettings({ ...settings, allowLateSubmissions: v })} />
            </div>
            {settings.allowLateSubmissions && (
              <div>
                <label className="label">Max Late Submission Days</label>
                <input type="number" value={settings.maxLateSubmissionDays} min={1} max={14} onChange={(e) => setSettings({ ...settings, maxLateSubmissionDays: Number(e.target.value) })} className="input-field w-32" />
              </div>
            )}
            <div>
              <label className="label">Max File Upload Size (MB)</label>
              <input type="number" value={settings.maxFileUploadSize} min={5} max={100} onChange={(e) => setSettings({ ...settings, maxFileUploadSize: Number(e.target.value) })} className="input-field w-32" />
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="card space-y-4">
          <h3 className="font-display font-bold text-gray-900">Notification Channels</h3>
          {[
            { key: "emailNotifications", label: "Email Notifications", desc: "Send automated emails for results, attendance alerts, fee reminders" },
            { key: "smsNotifications", label: "SMS Notifications", desc: "Send SMS alerts for urgent notices and shortage warnings" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800 text-sm">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <ToggleSwitch value={settings[key]} onChange={(v) => setSettings({ ...settings, [key]: v })} />
            </div>
          ))}
        </div>
      )}

      {activeTab === "security" && (
        <div className="card space-y-5">
          <h3 className="font-display font-bold text-gray-900">Security Settings</h3>
          <div>
            <label className="label">Session Timeout (minutes)</label>
            <input type="number" value={settings.sessionTimeout} min={15} max={480} onChange={(e) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })} className="input-field w-40" />
            <p className="text-xs text-gray-400 mt-1">Users will be logged out after this period of inactivity</p>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="font-semibold text-amber-800 text-sm">🔐 Two-Factor Authentication</p>
            <p className="text-xs text-amber-600 mt-1">Enforce 2FA for admin accounts</p>
            <button className="mt-3 btn-secondary text-sm py-1.5">Configure 2FA</button>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="card">
          <h3 className="font-display font-bold text-gray-900 mb-4">Audit Logs</h3>
          <Table columns={auditColumns} data={mockAuditLogs} searchable searchPlaceholder="Search logs..." />
        </div>
      )}

      {activeTab === "maintenance" && (
        <div className="card space-y-5">
          <h3 className="font-display font-bold text-gray-900">Maintenance</h3>
          <div className="flex items-center justify-between p-4 border-2 border-red-100 bg-red-50/50 rounded-xl">
            <div>
              <p className="font-semibold text-red-900 text-sm">🔧 Maintenance Mode</p>
              <p className="text-xs text-red-700 mt-0.5">Disable access for all non-admin users</p>
            </div>
            <ToggleSwitch value={settings.maintenanceMode} onChange={(v) => setSettings({ ...settings, maintenanceMode: v })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={handleBackup} className="btn-secondary flex items-center justify-center gap-2 py-3">
              📦 Backup Database
            </button>
            <button onClick={() => toast.success("Cache cleared! ✅")} className="btn-secondary flex items-center justify-center gap-2 py-3">
              🗑️ Clear Cache
            </button>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-semibold text-gray-700">System Information</p>
            <div className="mt-3 space-y-2 text-xs text-gray-500 font-mono">
              <p>Node.js: v20.11.0 LTS</p>
              <p>MongoDB: 7.0.4</p>
              <p>App Version: 1.0.0</p>
              <p>Last Backup: {formatDateTime(new Date(Date.now() - 86400000))}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
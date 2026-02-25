import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { StatCard } from "../common/Card";
import { formatDateTime } from "../../utils/helpers";
import { adminService } from "../../services/adminService";

const mockStats = { totalStudents: 2430, totalProfessors: 124, totalDepartments: 8, totalCourses: 24 };
const mockDeptData = [
  { name: "CS", students: 520 }, { name: "IT", students: 480 }, { name: "ECE", students: 410 },
  { name: "ME", students: 380 }, { name: "CE", students: 340 }, { name: "EEE", students: 300 },
];
const mockFeeCollection = [
  { month: "Aug", collected: 1200000 }, { month: "Sep", collected: 980000 },
  { month: "Oct", collected: 1500000 }, { month: "Nov", collected: 760000 },
  { month: "Dec", collected: 1100000 }, { month: "Jan", collected: 1350000 },
];
const mockAttendancePie = [
  { name: "≥75%", value: 1842, fill: "#10b981" },
  { name: "60-75%", value: 380, fill: "#f59e0b" },
  { name: "<60%", value: 208, fill: "#ef4444" },
];
const mockRecentActivity = [
  { action: "Student added", detail: "Aarav Sharma enrolled in CS Sem 4", time: new Date(Date.now() - 3600000), icon: "👤" },
  { action: "Result published", detail: "Sem 3 results for IT department", time: new Date(Date.now() - 7200000), icon: "📊" },
  { action: "Notice sent", detail: "Urgent: Fee deadline extended", time: new Date(Date.now() - 10800000), icon: "📢" },
  { action: "Date sheet created", detail: "End sem exams Sem 4 CS/IT", time: new Date(Date.now() - 86400000), icon: "📆" },
  { action: "Faculty assigned", detail: "Dr. Kumar assigned to CS401", time: new Date(Date.now() - 2 * 86400000), icon: "👨‍🏫" },
];

const RADIAN = Math.PI / 180;
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return percent > 0.05 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const quickActions = [
    { label: "Add Student", icon: "👤", path: "/admin/users", color: "bg-blue-500" },
    { label: "Add Professor", icon: "👨‍🏫", path: "/admin/users", color: "bg-emerald-500" },
    { label: "Publish Results", icon: "📊", path: "/admin/results", color: "bg-purple-500" },
    { label: "Send Notice", icon: "📢", path: "/admin/notices", color: "bg-amber-500" },
    { label: "Create Date Sheet", icon: "📆", path: "/admin/datesheet", color: "bg-red-500" },
    { label: "System Settings", icon: "⚙️", path: "/admin/settings", color: "bg-gray-600" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Complete system overview and management</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          All systems operational
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={mockStats.totalStudents.toLocaleString()} icon="👥" color="blue" change="+48 this month" changeType="up" onClick={() => navigate("/admin/users")} />
        <StatCard label="Professors" value={mockStats.totalProfessors} icon="👨‍🏫" color="green" change="+3 this month" changeType="up" onClick={() => navigate("/admin/users")} />
        <StatCard label="Departments" value={mockStats.totalDepartments} icon="🏛️" color="purple" onClick={() => navigate("/admin/academics")} />
        <StatCard label="Active Courses" value={mockStats.totalCourses} icon="📚" color="amber" onClick={() => navigate("/admin/academics")} />
      </div>

      <div>
        <h3 className="font-display font-semibold text-gray-800 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map(({ label, icon, path, color }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`${color} text-white rounded-2xl p-4 text-left hover:opacity-90 active:scale-[0.97] transition-all shadow-md hover:shadow-lg`}
            >
              <span className="text-2xl block mb-2">{icon}</span>
              <span className="text-xs font-semibold leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-display font-bold text-gray-900 mb-4">Students by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockDeptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
              <Bar dataKey="students" fill="#3f51b5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-display font-bold text-gray-900 mb-4">Attendance Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={mockAttendancePie} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false} label={CustomLabel}>
                {mockAttendancePie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Legend formatter={(val) => <span style={{ fontSize: "12px", color: "#6b7280" }}>{val}</span>} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-display font-bold text-gray-900 mb-4">Fee Collection (₹)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={mockFeeCollection}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} />
            <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} formatter={(v) => [`₹${(v / 100000).toFixed(2)}L`, "Collected"]} />
            <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="font-display font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {mockRecentActivity.map((activity, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm">{activity.action}</p>
                <p className="text-xs text-gray-500 truncate">{activity.detail}</p>
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(activity.time)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
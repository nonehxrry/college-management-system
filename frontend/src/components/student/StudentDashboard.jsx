import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { StatCard } from "../common/Card";
import { studentService } from "../../services/studentService";
import { formatDate, getAttendanceColor, getGradeColor } from "../../utils/helpers";
import { ATTENDANCE_THRESHOLD } from "../../utils/constants";

const AttendanceRadial = ({ percentage }) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const filled = ((percentage || 0) / 100) * circumference;
  const color = percentage >= 75 ? "#10b981" : percentage >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="130" height="130" className="-rotate-90">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - filled}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold font-display" style={{ color }}>{percentage?.toFixed(0)}%</p>
        <p className="text-xs text-gray-400">Overall</p>
      </div>
    </div>
  );
};

const QuickCard = ({ icon, label, path, color, count }) => {
  const navigate = useNavigate();
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-orange-500",
    red: "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600",
    indigo: "from-indigo-500 to-indigo-600",
  };

  return (
    <button
      onClick={() => navigate(path)}
      className={`relative overflow-hidden bg-gradient-to-br ${colors[color]} text-white rounded-2xl p-5 text-left 
        hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl group`}
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full group-hover:scale-110 transition-transform" />
      <p className="text-3xl mb-3">{icon}</p>
      <p className="font-bold text-sm">{label}</p>
      {count !== undefined && <p className="text-white/70 text-xs mt-0.5">{count} items</p>}
    </button>
  );
};

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await studentService.getDashboard();
        setData(res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const mockAttendanceData = [
    { month: "Aug", percentage: 88 }, { month: "Sep", percentage: 82 }, { month: "Oct", percentage: 76 },
    { month: "Nov", percentage: 79 }, { month: "Dec", percentage: 71 }, { month: "Jan", percentage: 85 },
  ];

  const mockSubjectAttendance = [
    { subject: "Mathematics", attended: 28, total: 32, percentage: 87.5 },
    { subject: "Physics", attended: 22, total: 30, percentage: 73.3 },
    { subject: "Chemistry", attended: 18, total: 28, percentage: 64.3 },
    { subject: "English", attended: 25, total: 26, percentage: 96.2 },
    { subject: "Computer Science", attended: 30, total: 34, percentage: 88.2 },
  ];

  const mockUpcoming = [
    { subject: "Mathematics", type: "Assignment", due: new Date(Date.now() + 2 * 86400000), status: "pending" },
    { subject: "Physics", type: "Lab Report", due: new Date(Date.now() + 5 * 86400000), status: "pending" },
    { subject: "Chemistry", type: "Mid-sem Exam", due: new Date(Date.now() + 8 * 86400000), status: "exam" },
  ];

  const overallAttendance = data?.attendanceSummary?.overall || 79.4;
  const cgpa = data?.cgpa || 7.8;

  const pieData = [
    { name: "Present", value: Math.round(overallAttendance), fill: "#10b981" },
    { name: "Absent", value: Math.round(100 - overallAttendance), fill: "#fee2e2" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-32 shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card h-64 shimmer" />
          <div className="card h-64 shimmer col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back — here's your academic summary</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overall Attendance" value={`${overallAttendance.toFixed(1)}%`} icon="📅" color={overallAttendance >= 75 ? "green" : "red"} change={overallAttendance < 75 ? "Below 75% threshold" : "Good standing"} changeType={overallAttendance >= 75 ? "up" : "down"} />
        <StatCard label="Current CGPA" value={cgpa.toFixed(2)} icon="📊" color="blue" change="Semester 4" changeType="neutral" />
        <StatCard label="Pending Assignments" value={data?.pendingAssignments || 3} icon="📋" color="amber" change="Due this week" changeType={data?.pendingAssignments > 2 ? "down" : "neutral"} />
        <StatCard label="Subjects Enrolled" value={data?.subjects?.length || 6} icon="📚" color="purple" subtitle="This semester" />
      </div>

      {overallAttendance < ATTENDANCE_THRESHOLD && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🚨</div>
          <div className="flex-1">
            <p className="font-semibold text-red-800">Attendance Shortage Warning</p>
            <p className="text-red-600 text-sm mt-0.5">
              Your attendance is {overallAttendance.toFixed(1)}%, below the required 75%.
              Contact your mentor immediately to avoid detention.
            </p>
          </div>
          <button onClick={() => navigate("/student/attendance")} className="btn-danger text-sm py-2 px-4 flex-shrink-0">
            View Details
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-display font-bold text-gray-900 mb-4">Attendance Overview</h3>
          <div className="flex flex-col items-center">
            <AttendanceRadial percentage={overallAttendance} />
            <div className="w-full mt-4 space-y-2">
              {mockSubjectAttendance.slice(0, 4).map((sub) => (
                <div key={sub.subject} className="flex items-center gap-3">
                  <p className="text-xs text-gray-500 w-24 truncate">{sub.subject}</p>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${sub.percentage}%`,
                        background: sub.percentage >= 75 ? "#10b981" : sub.percentage >= 60 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <p className="text-xs font-bold w-10 text-right text-gray-700">{sub.percentage.toFixed(0)}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-900">Attendance Trend</h3>
            <span className="badge badge-info">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mockAttendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                formatter={(val) => [`${val}%`, "Attendance"]}
              />
              <Line type="monotone" dataKey="percentage" stroke="#3f51b5" strokeWidth={3} dot={{ fill: "#3f51b5", r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey={() => 75} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <QuickCard icon="📊" label="Results" path="/student/results" color="blue" />
        <QuickCard icon="📆" label="Date Sheet" path="/student/datesheet" color="purple" />
        <QuickCard icon="📢" label="Notices" path="/student/notices" color="amber" count={data?.unreadNotices || 2} />
        <QuickCard icon="💰" label="Fee Status" path="/student/profile" color="green" />
        <QuickCard icon="📋" label="Assignments" path="/student/assignments" color="indigo" count={data?.pendingAssignments || 3} />
        <QuickCard icon="🎫" label="Support" path="/student/tickets" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-display font-bold text-gray-900 mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {mockUpcoming.map((item, i) => {
              const daysLeft = Math.ceil((item.due - Date.now()) / 86400000);
              return (
                <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl
                    ${item.status === "exam" ? "bg-red-100" : "bg-blue-100"}`}>
                    {item.status === "exam" ? "📝" : "📋"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{item.type}</p>
                    <p className="text-xs text-gray-500">{item.subject}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-gray-700">{formatDate(item.due)}</p>
                    <p className={`text-xs font-bold ${daysLeft <= 2 ? "text-red-600" : daysLeft <= 5 ? "text-amber-600" : "text-gray-400"}`}>
                      {daysLeft === 0 ? "Today!" : `${daysLeft}d left`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => navigate("/student/assignments")} className="w-full mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium text-center py-2">
            View all assignments →
          </button>
        </div>

        <div className="card">
          <h3 className="font-display font-bold text-gray-900 mb-4">Subject-wise Attendance</h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={mockSubjectAttendance} layout="vertical" margin={{ left: 0, right: 30 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis type="category" dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} width={90} />
              <Tooltip formatter={(val) => [`${val.toFixed(1)}%`, "Attendance"]} contentStyle={{ borderRadius: "12px", border: "none" }} />
              <Bar dataKey="percentage" radius={[0, 6, 6, 0]}>
                {mockSubjectAttendance.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.percentage >= 75 ? "#10b981" : entry.percentage >= 60 ? "#f59e0b" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
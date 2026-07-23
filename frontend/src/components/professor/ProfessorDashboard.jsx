import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { StatCard } from "../common/Card";
import { formatDate } from "../../utils/helpers";
import { professorService } from "../../services/professorService";

const mockSubjects = [
  { _id: "1", name: "Algorithms", code: "CS401", section: "A", semester: 4, totalStudents: 62, avgAttendance: 78, pendingEvaluations: 12 },
  { _id: "2", name: "Data Structures", code: "CS301", section: "B", semester: 3, totalStudents: 58, avgAttendance: 82, pendingEvaluations: 0 },
  { _id: "3", name: "Operating Systems", code: "CS402", section: "A", semester: 4, totalStudents: 60, avgAttendance: 71, pendingEvaluations: 5 },
];

const mockAttendanceData = mockSubjects.map((s) => ({ name: s.code, attendance: s.avgAttendance }));

const mockPendingWork = [
  { type: "Assignment Evaluation", subject: "Algorithms", count: 12, path: "/professor/assignments" },
  { type: "Internal Marks Upload", subject: "Operating Systems", count: 1, path: "/professor/results" },
  { type: "Attendance Missing", subject: "Data Structures", count: 2, path: "/professor/attendance" },
];

const ProfessorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await professorService.getDashboard();
        setData(res.data);
      } catch { setData(null); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const totalStudents = mockSubjects.reduce((a, s) => a + s.totalStudents, 0);
  const totalPending = mockSubjects.reduce((a, s) => a + s.pendingEvaluations, 0);
  const avgAtt = (mockSubjects.reduce((a, s) => a + s.avgAttendance, 0) / mockSubjects.length).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Professor Dashboard</h1>
        <p className="page-subtitle">Overview of your assigned subjects and pending tasks</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Subjects Assigned" value={mockSubjects.length} icon="📚" color="blue" />
        <StatCard label="Total Students" value={totalStudents} icon="👥" color="green" />
        <StatCard label="Avg Attendance" value={`${avgAtt}%`} icon="📅" color={parseFloat(avgAtt) >= 75 ? "green" : "amber"} />
        <StatCard label="Pending Evaluations" value={totalPending} icon="⏳" color={totalPending > 0 ? "amber" : "green"} />
      </div>

      {totalPending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="font-bold text-amber-900 mb-3">⚡ Action Required</p>
          <div className="space-y-2">
            {mockPendingWork.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-white rounded-xl p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.type}</p>
                  <p className="text-xs text-gray-500">{item.subject} · {item.count} pending</p>
                </div>
                <button onClick={() => navigate(item.path)} className="btn-primary text-xs py-1.5 px-3">Go →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-display font-bold text-gray-900 mb-4">Attendance by Subject</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockAttendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} formatter={(v) => [`${v}%`, "Avg Attendance"]} />
              <Bar dataKey="attendance" radius={[6, 6, 0, 0]}>
                {mockAttendanceData.map((entry, i) => (
                  <Cell key={i} fill={entry.attendance >= 75 ? "#10b981" : entry.attendance >= 60 ? "#f59e0b" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2">
            {[{ c: "#10b981", l: "≥75%" }, { c: "#f59e0b", l: "60-75%" }, { c: "#ef4444", l: "<60%" }].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: c }} /><span className="text-xs text-gray-500">{l}</span></div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-display font-bold text-gray-900 mb-4">Assigned Subjects</h3>
          <div className="space-y-3">
            {mockSubjects.map((sub) => (
              <div key={sub._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 font-bold text-xs">
                  {sub.code.slice(-3)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{sub.name}</p>
                  <p className="text-xs text-gray-500">Sem {sub.semester} · Sec {sub.section} · {sub.totalStudents} students</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${sub.avgAttendance >= 75 ? "text-emerald-600" : "text-amber-600"}`}>{sub.avgAttendance}%</p>
                  {sub.pendingEvaluations > 0 && (
                    <span className="badge badge-warning text-[10px]">{sub.pendingEvaluations} pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboard;
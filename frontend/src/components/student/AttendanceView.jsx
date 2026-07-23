import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getAttendanceBadgeClass, predictAttendanceShortage } from "../../utils/helpers";

const mockAttendance = [
  { subject: "Mathematics", code: "MA201", professor: "Dr. Sharma", attended: 28, total: 32, percentage: 87.5 },
  { subject: "Physics", code: "PH201", professor: "Dr. Gupta", attended: 22, total: 30, percentage: 73.3 },
  { subject: "Chemistry", code: "CH201", professor: "Prof. Mehra", attended: 18, total: 28, percentage: 64.3 },
  { subject: "English Communication", code: "EN201", professor: "Ms. Singh", attended: 25, total: 26, percentage: 96.2 },
  { subject: "Computer Science", code: "CS201", professor: "Dr. Kumar", attended: 30, total: 34, percentage: 88.2 },
  { subject: "Engineering Drawing", code: "ED201", professor: "Prof. Joshi", attended: 16, total: 24, percentage: 66.7 },
];

const mockMonthly = [
  { month: "Aug", present: 22, absent: 4 },
  { month: "Sep", present: 18, absent: 6 },
  { month: "Oct", present: 20, absent: 4 },
  { month: "Nov", present: 16, absent: 8 },
  { month: "Dec", present: 14, absent: 5 },
  { month: "Jan", present: 19, absent: 3 },
];

const SubjectCard = ({ sub }) => {
  const [expanded, setExpanded] = useState(false);
  const isShort = sub.percentage < 75;
  const isCritical = sub.percentage < 60;

  const prediction = {
    classesNeededToAttend: isShort ? Math.ceil(((75 * sub.total) / 100) - sub.attended) : 0,
    canRecover: true,
  };

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-200
        ${isCritical ? "border-red-200 bg-red-50/30" : isShort ? "border-amber-200 bg-amber-50/20" : "border-gray-100 bg-white"}`}
    >
      <div
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-black/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0
          ${isCritical ? "bg-red-100" : isShort ? "bg-amber-100" : "bg-emerald-100"}`}>
          {isCritical ? "🚨" : isShort ? "⚠️" : "✅"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{sub.subject}</p>
            <span className="badge badge-primary text-[10px]">{sub.code}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{sub.professor}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${sub.percentage}%`,
                  background: sub.percentage >= 75 ? "#10b981" : sub.percentage >= 60 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className={`text-2xl font-bold font-display ${sub.percentage >= 75 ? "text-emerald-600" : sub.percentage >= 60 ? "text-amber-600" : "text-red-600"}`}>
            {sub.percentage.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">{sub.attended}/{sub.total} classes</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{expanded ? "▲ less" : "▼ more"}</p>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-white/50 animate-fade-in">
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              { label: "Classes Attended", value: sub.attended, color: "text-emerald-600" },
              { label: "Classes Missed", value: sub.total - sub.attended, color: "text-red-600" },
              { label: "Total Classes", value: sub.total, color: "text-gray-700" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold font-display ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {isShort && (
            <div className={`mt-3 p-3 rounded-xl border text-sm
              ${isCritical ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
              {prediction.canRecover ? (
                <p>⚡ You need to attend <strong>{prediction.classesNeededToAttend} more consecutive classes</strong> to reach 75%.</p>
              ) : (
                <p>❌ Recovery not possible with remaining classes. Visit your mentor.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AttendanceView = () => {
  const [view, setView] = useState("subjects");
  const shortageSubjects = mockAttendance.filter((s) => s.percentage < 75);
  const overall = mockAttendance.reduce((acc, s) => acc + s.percentage, 0) / mockAttendance.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track your attendance across all subjects</p>
        </div>
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          {["subjects", "monthly"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize
                ${view === v ? "bg-white text-primary-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {v === "subjects" ? "📚 By Subject" : "📅 Monthly"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex flex-col items-center py-4">
          <p className={`text-3xl font-bold font-display ${overall >= 75 ? "text-emerald-600" : "text-red-600"}`}>
            {overall.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Overall Attendance</p>
          <span className={`mt-2 badge ${overall >= 75 ? "badge-success" : "badge-danger"}`}>
            {overall >= 75 ? "Good Standing" : "Below Threshold"}
          </span>
        </div>
        {[
          { label: "Subjects OK", value: mockAttendance.filter((s) => s.percentage >= 75).length, icon: "✅", color: "text-emerald-600" },
          { label: "At Risk", value: shortageSubjects.length, icon: "⚠️", color: "text-amber-600" },
          { label: "Total Classes", value: mockAttendance.reduce((a, s) => a + s.total, 0), icon: "📅", color: "text-primary-600" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card flex flex-col items-center py-4">
            <span className="text-2xl mb-1">{icon}</span>
            <p className={`text-3xl font-bold font-display ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {shortageSubjects.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🚨</div>
            <div>
              <p className="font-bold text-red-900">Attendance Shortage Alert</p>
              <p className="text-red-700 text-sm mt-0.5">
                You have attendance shortage in <strong>{shortageSubjects.length} subject(s)</strong>:{" "}
                {shortageSubjects.map((s) => s.subject).join(", ")}
              </p>
              <p className="text-red-600 text-xs mt-1">
                Students with less than 75% attendance may be detained. Contact your class mentor immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {view === "subjects" && (
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-gray-800">Subject-wise Attendance</h2>
          {mockAttendance.map((sub) => <SubjectCard key={sub.code} sub={sub} />)}
        </div>
      )}

      {view === "monthly" && (
        <div className="card">
          <h2 className="font-display font-bold text-gray-900 mb-6">Monthly Attendance</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockMonthly} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="#fca5a5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-4 justify-center">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-xs text-gray-500">Present</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-300" /><span className="text-xs text-gray-500">Absent</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;
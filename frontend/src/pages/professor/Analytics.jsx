import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockWeakStudents = [
  { name: "Rahul Gupta",  rollNumber: "CS40103", attendance: 61, cgpa: 5.8, missedAssignments: 3, riskScore: 82, riskLevel: "high"   },
  { name: "Sneha Patel",  rollNumber: "CS40104", attendance: 68, cgpa: 6.2, missedAssignments: 2, riskScore: 65, riskLevel: "medium" },
  { name: "Vikram Joshi", rollNumber: "CS40107", attendance: 71, cgpa: 5.5, missedAssignments: 4, riskScore: 79, riskLevel: "high"   },
];

const mockSubjectPerf = [
  { subject: "Algorithms", avgInternal: 21, avgExternal: 52, avgAttendance: 78 },
  { subject: "OS",         avgInternal: 19, avgExternal: 48, avgAttendance: 71 },
  { subject: "DS",         avgInternal: 23, avgExternal: 58, avgAttendance: 82 },
];

const riskColors = { high: "text-red-600 bg-red-50 border-red-200", medium: "text-amber-600 bg-amber-50 border-amber-200", low: "text-emerald-600 bg-emerald-50 border-emerald-200" };
const riskBarColors = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };

const Analytics = () => (
  <div className="space-y-6 animate-fade-in">
    <div><h1 className="page-title">Analytics & Insights</h1><p className="page-subtitle">AI-powered student performance analysis</p></div>

    <div className="grid grid-cols-3 gap-4">
      {[
        { label: "At-Risk Students",      value: mockWeakStudents.filter((s) => s.riskLevel === "high").length, color: "text-red-600",     icon: "🚨" },
        { label: "Attendance Below 75%",  value: mockWeakStudents.filter((s) => s.attendance < 75).length,      color: "text-amber-600",   icon: "📅" },
        { label: "Avg Class Attendance",  value: "74%",                                                          color: "text-primary-600", icon: "👥" },
      ].map(({ label, value, color, icon }) => (
        <div key={label} className="card text-center py-4">
          <div className="text-2xl mb-1">{icon}</div>
          <p className={`text-3xl font-bold font-display ${color}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>

    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-gray-900">🤖 AI Risk Detection</h3>
        <span className="badge badge-warning text-xs">AI Powered</span>
      </div>
      <div className="space-y-3">
        {mockWeakStudents.map((student) => (
          <div key={student.rollNumber} className={`flex items-center gap-4 p-4 rounded-xl border ${riskColors[student.riskLevel]}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-800 text-sm">{student.name}</p>
                <span className="text-xs text-gray-500">{student.rollNumber}</span>
                <span className={`badge text-[10px] ${riskColors[student.riskLevel]}`}>{student.riskLevel === "high" ? "🚨 High Risk" : "⚠️ Medium"}</span>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600">
                <span>📅 Attendance: <strong className={student.attendance < 75 ? "text-red-600" : ""}>{student.attendance}%</strong></span>
                <span>📊 CGPA: <strong>{student.cgpa}</strong></span>
                <span>📋 Missed: <strong>{student.missedAssignments} assignments</strong></span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">Risk Score:</span>
                <div className="flex-1 max-w-32 bg-gray-200 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${student.riskScore}%`, background: riskBarColors[student.riskLevel] }} />
                </div>
                <span className="text-xs font-bold" style={{ color: riskBarColors[student.riskLevel] }}>{student.riskScore}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="card">
      <h3 className="font-display font-bold text-gray-900 mb-4">Subject Performance Comparison</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={mockSubjectPerf} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="subject" tick={{ fontSize: 12, fill: "#9ca3af" }} />
          <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
          <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
          <Bar dataKey="avgInternal"   name="Avg Internal"    fill="#3f51b5" radius={[4,4,0,0]} />
          <Bar dataKey="avgExternal"   name="Avg External"    fill="#10b981" radius={[4,4,0,0]} />
          <Bar dataKey="avgAttendance" name="Attendance %"    fill="#f59e0b" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default Analytics;
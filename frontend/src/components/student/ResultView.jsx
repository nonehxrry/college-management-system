import { useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { getGradeColor } from "../../utils/helpers";
import Modal from "../common/Modal";
import toast from "react-hot-toast";

const mockResults = [
  {
    semester: 1, academicYear: "2022-23", sgpa: 8.4, isPublished: true,
    subjects: [
      { name: "Mathematics I", code: "MA101", credits: 4, internalMarks: 26, externalMarks: 58, totalMarks: 84, maxMarks: 100, grade: "A+", gradePoints: 9, status: "pass" },
      { name: "Physics", code: "PH101", credits: 4, internalMarks: 24, externalMarks: 62, totalMarks: 86, maxMarks: 100, grade: "A+", gradePoints: 9, status: "pass" },
      { name: "Chemistry", code: "CH101", credits: 4, internalMarks: 22, externalMarks: 55, totalMarks: 77, maxMarks: 100, grade: "B+", gradePoints: 7, status: "pass" },
      { name: "English", code: "EN101", credits: 2, internalMarks: 28, externalMarks: 68, totalMarks: 96, maxMarks: 100, grade: "O", gradePoints: 10, status: "pass" },
      { name: "Engineering Drawing", code: "ED101", credits: 2, internalMarks: 20, externalMarks: 50, totalMarks: 70, maxMarks: 100, grade: "A", gradePoints: 8, status: "pass" },
    ],
  },
  {
    semester: 2, academicYear: "2022-23", sgpa: 7.9, isPublished: true,
    subjects: [
      { name: "Mathematics II", code: "MA201", credits: 4, internalMarks: 25, externalMarks: 54, totalMarks: 79, maxMarks: 100, grade: "B+", gradePoints: 7, status: "pass" },
      { name: "Data Structures", code: "CS201", credits: 4, internalMarks: 27, externalMarks: 65, totalMarks: 92, maxMarks: 100, grade: "O", gradePoints: 10, status: "pass" },
      { name: "Digital Electronics", code: "DE201", credits: 4, internalMarks: 23, externalMarks: 58, totalMarks: 81, maxMarks: 100, grade: "A+", gradePoints: 9, status: "pass" },
      { name: "Environmental Science", code: "ES201", credits: 2, internalMarks: 19, externalMarks: 48, totalMarks: 67, maxMarks: 100, grade: "A", gradePoints: 8, status: "pass" },
    ],
  },
  {
    semester: 3, academicYear: "2023-24", sgpa: 8.1, isPublished: true,
    subjects: [
      { name: "Algorithms", code: "CS301", credits: 4, internalMarks: 26, externalMarks: 60, totalMarks: 86, maxMarks: 100, grade: "A+", gradePoints: 9, status: "pass" },
      { name: "Operating Systems", code: "CS302", credits: 4, internalMarks: 24, externalMarks: 58, totalMarks: 82, maxMarks: 100, grade: "A+", gradePoints: 9, status: "pass" },
      { name: "Database Systems", code: "CS303", credits: 4, internalMarks: 22, externalMarks: 52, totalMarks: 74, maxMarks: 100, grade: "B+", gradePoints: 7, status: "pass" },
      { name: "Computer Networks", code: "CS304", credits: 4, internalMarks: 25, externalMarks: 56, totalMarks: 81, maxMarks: 100, grade: "A+", gradePoints: 9, status: "pass" },
    ],
  },
  { semester: 4, academicYear: "2023-24", sgpa: null, isPublished: false, subjects: [] },
];

const cgpaTrend = [
  { sem: "Sem 1", sgpa: 8.4 }, { sem: "Sem 2", sgpa: 7.9 }, { sem: "Sem 3", sgpa: 8.1 },
];

const gradeColors = { O: "#10b981", "A+": "#3b82f6", A: "#6366f1", "B+": "#8b5cf6", B: "#f59e0b", C: "#f97316", D: "#ef4444", F: "#dc2626" };

const ResultView = () => {
  const [selectedSem, setSelectedSem] = useState(3);
  const [reevalModal, setReevalModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [reason, setReason] = useState("");

  const result = mockResults.find((r) => r.semester === selectedSem);
  const cgpa = (mockResults.filter((r) => r.sgpa).reduce((a, r) => a + r.sgpa, 0) / mockResults.filter((r) => r.sgpa).length).toFixed(2);

  const radarData = result?.subjects?.map((s) => ({
    subject: s.code, marks: Math.round((s.totalMarks / s.maxMarks) * 100),
  }));

  const handleReeval = (subject) => {
    setSelectedSubject(subject);
    setReason("");
    setReevalModal(true);
  };

  const submitReeval = () => {
    if (!reason.trim()) { toast.error("Please provide a reason"); return; }
    toast.success("Re-evaluation request submitted!");
    setReevalModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Results</h1>
          <p className="page-subtitle">Semester-wise academic results and grades</p>
        </div>
        <div className="flex items-center gap-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-3 rounded-2xl shadow-lg">
          <div className="text-center">
            <p className="text-2xl font-bold font-display">{cgpa}</p>
            <p className="text-xs text-blue-200">Current CGPA</p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <p className="text-2xl font-bold font-display">
              {mockResults.filter((r) => r.sgpa).length}
            </p>
            <p className="text-xs text-blue-200">Sems Done</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-gray-900">CGPA Trend</h3>
          <span className="badge badge-info">Semester-wise SGPA</span>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={cgpaTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="sem" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis domain={[6, 10]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} formatter={(v) => [v.toFixed(2), "SGPA"]} />
            <Line type="monotone" dataKey="sgpa" stroke="#3f51b5" strokeWidth={3} dot={{ fill: "#3f51b5", r: 5 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-2">
        {mockResults.map((r) => (
          <button
            key={r.semester}
            onClick={() => r.isPublished && setSelectedSem(r.semester)}
            disabled={!r.isPublished}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2
              ${selectedSem === r.semester ? "bg-primary-600 text-white shadow-md" : r.isPublished ? "bg-white border border-gray-200 text-gray-700 hover:border-primary-300" : "bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed"}`}
          >
            Sem {r.semester}
            {r.isPublished ? (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedSem === r.semester ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {r.sgpa?.toFixed(1)}
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Pending</span>
            )}
          </button>
        ))}
      </div>

      {result && result.isPublished ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-bold text-gray-900">Semester {selectedSem} Results</h3>
                    <p className="text-xs text-gray-400">{result.academicYear}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600 font-display">{result.sgpa?.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">SGPA</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {result.subjects.map((sub) => (
                    <div key={sub.code} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 text-sm truncate">{sub.name}</p>
                          <span className="badge badge-primary text-[10px]">{sub.credits}cr</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="text-xs text-gray-400">Internal: {sub.internalMarks}/30</span>
                          <span className="text-xs text-gray-400">External: {sub.externalMarks}/70</span>
                        </div>
                      </div>
                      <div className="text-center flex-shrink-0">
                        <p className={`text-lg font-bold font-display ${getGradeColor(sub.grade)}`}>{sub.grade}</p>
                        <p className="text-xs text-gray-400">{sub.totalMarks}/{sub.maxMarks}</p>
                      </div>
                      <button
                        onClick={() => handleReeval(sub)}
                        className="text-xs text-gray-400 hover:text-primary-600 transition-colors px-2 py-1 rounded-lg hover:bg-primary-50"
                        title="Request Re-evaluation"
                      >
                        🔄
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {radarData && radarData.length > 2 && (
              <div className="card">
                <h3 className="font-display font-bold text-gray-900 mb-4 text-sm">Performance Radar</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6b7280" }} />
                    <Radar name="Marks" dataKey="marks" stroke="#3f51b5" fill="#3f51b5" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">🔒</div>
          <p className="font-semibold text-gray-700">Results Not Published</p>
          <p className="text-gray-400 text-sm mt-1">Semester {selectedSem} results will be published after evaluation.</p>
        </div>
      )}

      <Modal
        isOpen={reevalModal}
        onClose={() => setReevalModal(false)}
        title="Request Re-evaluation"
        icon="🔄"
        size="sm"
        footer={
          <>
            <button onClick={() => setReevalModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={submitReeval} className="btn-primary">Submit Request</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm font-semibold text-blue-800">{selectedSubject?.name}</p>
            <p className="text-xs text-blue-600 mt-0.5">Grade: {selectedSubject?.grade} · Marks: {selectedSubject?.totalMarks}/{selectedSubject?.maxMarks}</p>
          </div>
          <div>
            <label className="label">Reason for Re-evaluation *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field resize-none"
              rows={4}
              placeholder="Please provide a detailed reason for requesting re-evaluation..."
            />
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3">
            ⚠️ Re-evaluation requests must be submitted within 7 days of result publication. A fee may apply.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ResultView;
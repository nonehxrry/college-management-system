import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import { studentService } from "../../services/studentService";
import LoadingSpinner from "../common/LoadingSpinner";
import Card from "../common/Card";

const AIStudentDashboard = () => {
  const [insights, setInsights] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [progress, setProgress] = useState(null);
  const [wellness, setWellness] = useState(null);
  const [peerComparison, setPeerComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAIInsights();
  }, []);

  const fetchAIInsights = async () => {
    try {
      setLoading(true);
      const [insightsRes, pathRes, progressRes, wellnessRes, peerRes] = await Promise.all([
        studentService.getAIInsights?.() || { success: false },
        studentService.getLearningPath?.() || { success: false },
        studentService.getProgress?.() || { success: false },
        studentService.getWellness?.() || { success: false },
        studentService.getPeerComparison?.() || { success: false }
      ]);

      if (insightsRes.success) setInsights(insightsRes.data);
      if (pathRes.success) setLearningPath(pathRes.data);
      if (progressRes.success) setProgress(progressRes.data);
      if (wellnessRes.success) setWellness(wellnessRes.data);
      if (peerRes.success) setPeerComparison(peerRes.data);
    } catch (err) {
      toast.error("Failed to load AI insights");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">AI-Powered Learning Dashboard</h1>
          <p className="text-slate-600">Personalized insights to help you succeed</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["overview", "performance", "learning", "wellness", "peer"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance Card */}
            <Card className="lg:col-span-2">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">📊 Performance Prediction</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Current CGPA</p>
                    <p className="text-3xl font-bold text-blue-600">{insights.performance?.currentCGPA.toFixed(2)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Predicted CGPA</p>
                    <p className="text-3xl font-bold text-green-600">{insights.performance?.predictedCGPA.toFixed(2)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Trend</p>
                    <p className="text-lg font-bold text-purple-600 capitalize">{insights.performance?.trendType}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    insights.performance?.riskLevel === "low" ? "bg-green-50 to-green-100" :
                    insights.performance?.riskLevel === "medium" ? "bg-yellow-50 to-yellow-100" :
                    "bg-red-50 to-red-100"
                  }`}>
                    <p className="text-sm text-slate-600">Risk Level</p>
                    <p className={`text-lg font-bold capitalize ${
                      insights.performance?.riskLevel === "low" ? "text-green-600" :
                      insights.performance?.riskLevel === "medium" ? "text-yellow-600" :
                      "text-red-600"
                    }`}>{insights.performance?.riskLevel}</p>
                  </div>
                </div>
                {insights.performance?.recommendations && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                    <p className="font-semibold text-slate-900 mb-2">💡 Recommendations:</p>
                    <ul className="text-sm text-slate-700 space-y-1">
                      {insights.performance.recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            {/* Attendance Card */}
            {insights.attendance && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">📍 Attendance</h2>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-slate-900">{insights.attendance.percentage}%</div>
                    <p className="text-sm text-slate-600 mt-2">Current Attendance</p>
                    {insights.attendance.riskOfWarning && (
                      <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        ⚠️ Risk of warning!
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Stress Level Card */}
            {insights.stress && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">😌 Stress Level</h2>
                  <div className="text-center">
                    <div className={`text-3xl font-bold capitalize ${
                      insights.stress.stressLevel === "low" ? "text-green-600" :
                      insights.stress.stressLevel === "moderate" ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      {insights.stress.stressLevel}
                    </div>
                    <div className="mt-4 text-sm text-slate-600">Score: {insights.stress.stressScore}/100</div>
                    {insights.stress.counselingRecommended && (
                      <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-orange-700 text-xs">
                        💬 Counseling recommended
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Course Recommendations */}
            {insights.recommendations && (
              <Card className="lg:col-span-3">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">📚 Recommended Courses</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {insights.recommendations.recommendedElectives?.slice(0, 3).map((course, idx) => (
                      <div key={idx} className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
                        <p className="font-semibold text-slate-900">{course.name}</p>
                        <p className="text-sm text-slate-600 mt-1">Match: {course.matchScore}%</p>
                        <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${course.matchScore}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && progress && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">📈 CGPA Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progress.cgpaTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="semester" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cgpa" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">📊 Overall Progress</h2>
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600">{progress.overallProgress}%</div>
                  <p className="text-slate-600 mt-2">Academic Progress Score</p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Submission Rate: {progress.submissionRate}%</p>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${progress.submissionRate}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Learning Path Tab */}
        {activeTab === "learning" && learningPath && (
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">📖 Personalized Learning Path</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">Focus Areas</h3>
                  <ul className="space-y-2">
                    {learningPath.focusAreas?.map((subject, idx) => (
                      <li key={idx} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                        <span className="text-blue-600">✓</span>
                        <span className="text-slate-700">{subject}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">Resources</h3>
                  <ul className="space-y-2">
                    {learningPath.resources?.map((resource, idx) => (
                      <li key={idx} className="p-3 bg-slate-50 rounded border-l-4 border-blue-600">
                        <p className="font-semibold text-slate-900">{resource.type}</p>
                        <p className="text-sm text-slate-600">{resource.platform} • {resource.estimated_time}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Wellness Tab */}
        {activeTab === "wellness" && wellness && (
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">🧘 Mental Health & Wellness</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 capitalize">Stress Level: {wellness.stressLevel}</h3>
                  <ul className="space-y-2">
                    {wellness.tips?.map((tip, idx) => (
                      <li key={idx} className="flex gap-2 p-2 bg-purple-50 rounded">
                        <span className="text-purple-600 font-bold">•</span>
                        <span className="text-slate-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">Support Resources</h3>
                  {wellness.supportResources?.map((resource, idx) => (
                    <div key={idx} className="mb-3 p-3 bg-slate-50 rounded">
                      <p className="font-semibold text-slate-900">{resource.name}</p>
                      <p className="text-sm text-slate-600">{resource.contact}</p>
                      <p className="text-xs text-slate-500">{resource.availability}</p>
                    </div>
                  ))}
                </div>
              </div>
              {wellness.counselingRecommended && (
                <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-600 rounded-lg">
                  <p className="font-bold text-orange-900">⚠️ Counseling Recommended</p>
                  <p className="text-sm text-orange-800 mt-1">Please reach out to your academic counselor or mental health professional.</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Peer Comparison Tab */}
        {activeTab === "peer" && peerComparison && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">📊 Your Standing</h2>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-sm text-slate-600">Your CGPA</p>
                    <p className="text-4xl font-bold text-blue-600">{peerComparison.yourPerformance?.cgpa.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">Percentile Rank</p>
                    <p className="text-3xl font-bold text-slate-900">{peerComparison.yourPerformance?.percentile}th</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">Class Ranking</p>
                    <p className="text-3xl font-bold text-slate-900">#{peerComparison.yourPerformance?.ranking}</p>
                  </div>
                  <div className={`p-4 rounded-lg text-center font-bold text-lg ${
                    peerComparison.yourPerformance?.percentile > 90 ? "bg-green-100 text-green-700" :
                    peerComparison.yourPerformance?.percentile > 75 ? "bg-blue-100 text-blue-700" :
                    peerComparison.yourPerformance?.percentile > 50 ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {peerComparison.performanceLevel}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">📈 Class Statistics</h2>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-sm text-slate-600">Total Students</p>
                    <p className="text-2xl font-bold text-slate-900">{peerComparison.classStatistics?.totalStudents}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-sm text-slate-600">Class Average CGPA</p>
                    <p className="text-2xl font-bold text-slate-900">{peerComparison.classStatistics?.averageCGPA}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-sm text-slate-600">Highest CGPA</p>
                    <p className="text-2xl font-bold text-green-600">{peerComparison.classStatistics?.topCGPA.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <p className="text-sm text-slate-600">Lowest CGPA</p>
                    <p className="text-2xl font-bold text-red-600">{peerComparison.classStatistics?.minCGPA.toFixed(2)}</p>
                  </div>
                </div>
                <p className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-600 text-slate-700 text-sm">
                  {peerComparison.message}
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIStudentDashboard;

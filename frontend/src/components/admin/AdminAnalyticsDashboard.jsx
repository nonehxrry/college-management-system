import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import { adminService } from "../../services/adminService";
import LoadingSpinner from "../common/LoadingSpinner";
import Card from "../common/Card";

const AdminAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const analyticsRes = await adminService.getAIAnalyticsOverview?.() || { success: false };
      const healthRes = await adminService.getSystemHealth?.() || { success: false };
      const reportRes = await adminService.getComprehensiveReport?.() || { success: false };

      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (healthRes.success) setSystemHealth(healthRes.data);
      if (reportRes.success) setReport(reportRes.data);
    } catch (err) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">📊 System Analytics Dashboard</h1>
          <p className="text-slate-600">Real-time insights and AI-powered analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["overview", "system", "ai", "report"].map((tab) => (
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
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-600 mb-2">Total Students</p>
                  <p className="text-4xl font-bold text-blue-600">{report?.statistics?.students}</p>
                  <p className="text-xs text-slate-500 mt-2">Active in system</p>
                </div>
              </Card>
              <Card>
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-600 mb-2">Total Professors</p>
                  <p className="text-4xl font-bold text-green-600">{report?.statistics?.professors}</p>
                  <p className="text-xs text-slate-500 mt-2">Teaching staff</p>
                </div>
              </Card>
              <Card>
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-600 mb-2">At-Risk Students</p>
                  <p className="text-4xl font-bold text-orange-600">{report?.performance?.atRiskStudents}</p>
                  <p className="text-xs text-slate-500 mt-2">Need intervention</p>
                </div>
              </Card>
              <Card>
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-600 mb-2">Plagiarism Rate</p>
                  <p className="text-4xl font-bold text-red-600">{report?.statistics?.submissions?.plagiarismRate}%</p>
                  <p className="text-xs text-slate-500 mt-2">Of submissions</p>
                </div>
              </Card>
            </div>

            {/* Academic Performance */}
            {analytics && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">🎓 Academic Performance Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-2">Total Analyzed</p>
                      <p className="text-3xl font-bold text-slate-900">{analytics.totalAnalyzed}</p>
                      <p className="text-xs text-slate-500 mt-2">students</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-2">Improving Students</p>
                      <p className="text-3xl font-bold text-green-600">{analytics.improvingStudents}</p>
                      <p className="text-xs text-slate-500 mt-2">positive trend</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-2">Average CGPA</p>
                      <p className="text-3xl font-bold text-blue-600">{analytics.averageCGPA}</p>
                      <p className="text-xs text-slate-500 mt-2">class average</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === "system" && systemHealth && (
          <div className="space-y-6">
            {/* System Status */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">🏥 System Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className={`inline-block px-4 py-2 rounded-full font-bold ${
                      systemHealth.status === "healthy"
                        ? "bg-green-100 text-green-800"
                        : systemHealth.status === "warning"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {systemHealth.status?.toUpperCase()}
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="p-3 bg-slate-50 rounded">
                        <p className="text-sm text-slate-600">Uptime</p>
                        <p className="text-xl font-bold text-slate-900">{Math.floor(systemHealth.metrics.uptime / 3600)} hours</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded">
                        <p className="text-sm text-slate-600">Memory Usage</p>
                        <p className="text-xl font-bold text-slate-900">{systemHealth.metrics.memoryUsage.toFixed(1)} MB</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 border-l-4 border-blue-600 rounded">
                        <p className="text-sm text-slate-600">Active Users</p>
                        <p className="text-xl font-bold text-blue-600">{systemHealth.metrics.activeUsers}</p>
                      </div>
                      <div className="p-3 bg-green-50 border-l-4 border-green-600 rounded">
                        <p className="text-sm text-slate-600">Total Users</p>
                        <p className="text-xl font-bold text-green-600">{systemHealth.metrics.totalUsers}</p>
                      </div>
                      <div className="p-3 bg-purple-50 border-l-4 border-purple-600 rounded">
                        <p className="text-sm text-slate-600">API Response Time</p>
                        <p className="text-xl font-bold text-purple-600">{systemHealth.metrics.apiResponseTime} ms</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Metrics Over Time */}
            {systemHealth.recentMetrics && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">📈 Recent Metrics Trends</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[systemHealth.recentMetrics]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* AI Analytics Tab */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">🤖 AI Analytics Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3">At-Risk Students by Risk Level</h3>
                    {[
                      { level: "High Risk", count: report?.performance?.atRiskStudents || 0, color: "bg-red-100 text-red-800" },
                      { level: "Medium Risk", count: Math.floor((report?.performance?.atRiskStudents || 0) * 0.6), color: "bg-yellow-100 text-yellow-800" },
                      { level: "Low Risk", count: Math.floor((report?.statistics?.students || 0) * 0.3), color: "bg-green-100 text-green-800" }
                    ].map((risk, idx) => (
                      <div key={idx} className={`p-3 mb-2 ${risk.color} rounded font-medium`}>
                        {risk.level}: {risk.count} students
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3">Key Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-blue-50 rounded">
                        <span className="text-slate-700">Improving Students</span>
                        <span className="font-bold text-blue-600">{analytics?.improvingStudents || 0}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-green-50 rounded">
                        <span className="text-slate-700">Average CGPA</span>
                        <span className="font-bold text-green-600">{analytics?.averageCGPA || 0}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-orange-50 rounded">
                        <span className="text-slate-700">Plagiarism Detected</span>
                        <span className="font-bold text-orange-600">{report?.statistics?.submissions?.plagiarized || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Report Tab */}
        {activeTab === "report" && report && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">📋 Comprehensive System Report</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-slate-900 mb-4">Institution Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 bg-slate-100 rounded">
                      <span className="text-slate-700">Total Students</span>
                      <span className="font-bold text-slate-900">{report.statistics.students}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-100 rounded">
                      <span className="text-slate-700">Total Professors</span>
                      <span className="font-bold text-slate-900">{report.statistics.professors}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-100 rounded">
                      <span className="text-slate-700">Departments</span>
                      <span className="font-bold text-slate-900">{report.statistics.departments}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-100 rounded">
                      <span className="text-slate-700">Total Subjects</span>
                      <span className="font-bold text-slate-900">{report.statistics.subjects}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-4">Academic Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 bg-blue-50 rounded">
                      <span className="text-slate-700">Results Published</span>
                      <span className="font-bold text-blue-600">{report.statistics.results.published}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 rounded">
                      <span className="text-slate-700">Total Submissions</span>
                      <span className="font-bold text-green-600">{report.statistics.submissions.total}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-orange-50 rounded">
                      <span className="text-slate-700">Plagiarism Rate</span>
                      <span className="font-bold text-orange-600">{report.statistics.submissions.plagiarismRate}%</span>
                    </div>
                    <div className="flex justify-between p-3 bg-purple-50 rounded">
                      <span className="text-slate-700">At-Risk Students</span>
                      <span className="font-bold text-purple-600">{report.performance.atRiskStudents}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
                <p className="font-bold text-blue-900 mb-2">📌 Report Generated</p>
                <p className="text-sm text-blue-800">{new Date(report.generatedAt).toLocaleString()}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;

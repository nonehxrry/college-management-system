import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as Icons from "lucide-react";
import { studentService } from "../../services/studentService";

/**
 * Enhanced Student Analytics Dashboard
 * Provides detailed performance insights, peer comparisons, and predictive analytics
 */
const StudentAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState("semester");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await studentService.getDetailedAnalytics(timeRange);
        setAnalyticsData(data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const performanceMetrics = [
    {
      label: "Overall GPA",
      value: "3.85",
      change: "+0.15",
      icon: "TrendingUp",
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Attendance Rate",
      value: "92%",
      change: "+2%",
      icon: "Calendar",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      label: "Assignment Completion",
      value: "98%",
      change: "+5%",
      icon: "CheckCircle",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      label: "Class Rank",
      value: "8/120",
      change: "↑ 2 positions",
      icon: "Award",
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-500 mt-1">Detailed insights into your academic performance</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="semester">This Semester</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric) => {
          const IconComponent = Icons[metric.icon];
          return (
            <div key={metric.label} className={`${metric.bgColor} rounded-xl p-5 border border-gray-100`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{metric.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                  <p className={`text-xs mt-2 ${metric.color} font-semibold`}>{metric.change}</p>
                </div>
                {IconComponent && <IconComponent size={24} className={`${metric.color} flex-shrink-0`} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Trend */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Icons.LineChart className="text-blue-500" size={20} />
            <h3 className="font-semibold text-gray-900">Grade Progression</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analyticsData?.gradeProgression || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="average" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject-wise Performance */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Icons.BarChart3 className="text-purple-500" size={20} />
            <h3 className="font-semibold text-gray-900">Subject Performance</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsData?.subjectPerformance || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="marks" fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peer Comparison */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Icons.Users className="text-emerald-500" size={20} />
          <h3 className="font-semibold text-gray-900">Peer Comparison</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: "Your GPA", value: 3.85, color: "bg-blue-500" },
            { label: "Class Average", value: 3.42, color: "bg-gray-300" },
            { label: "Top Performer", value: 4.0, color: "bg-emerald-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="w-32 text-sm font-medium text-gray-600">{item.label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                <div
                  className={`${item.color} h-full flex items-center justify-end pr-2`}
                  style={{ width: `${(item.value / 4) * 100}%` }}
                >
                  <span className="text-white text-xs font-bold">{item.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Study Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icons.Lightbulb className="text-blue-600" size={20} />
          <h3 className="font-semibold text-gray-900">Personalized Recommendations</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <Icons.CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
            <span>Focus on Mathematics - you scored 15% below average in the last assessment</span>
          </li>
          <li className="flex items-start gap-2">
            <Icons.CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
            <span>Join study group for Physics - collaborative learning can boost your performance</span>
          </li>
          <li className="flex items-start gap-2">
            <Icons.CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
            <span>Great improvement in Chemistry - maintain this momentum with consistent practice</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StudentAnalyticsDashboard;

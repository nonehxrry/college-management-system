import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services/adminService";
import Table from "../common/Table";

const AdminAI = () => {
  const [report, setReport] = useState(null);
  const [studentPredictions, setStudentPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState("");

  useEffect(() => {
    loadIntegrityReport();
  }, []);

  const loadIntegrityReport = async () => {
    try {
      const response = await adminService.getIntegrityReport();
      setReport(response.data);
    } catch (error) {
      toast.error("Failed to load integrity report");
    } finally {
      setLoading(false);
    }
  };

  const getStudentPrediction = async () => {
    if (!selectedStudent) return;

    try {
      const response = await adminService.getStudentPerformance(selectedStudent);
      setStudentPredictions(prev => ({
        ...prev,
        [selectedStudent]: response.data
      }));
      toast.success("Performance prediction generated");
    } catch (error) {
      toast.error("Failed to get prediction");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">AI Integrity & Analytics</h1>
        <p className="page-subtitle">Data integrity checks and performance predictions</p>
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Health */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">System Health</h3>
            <div className={`text-4xl mb-2 ${report.overallHealth === 'good' ? 'text-green-500' : report.overallHealth === 'warning' ? 'text-yellow-500' : 'text-red-500'}`}>
              {report.overallHealth === 'good' ? '✅' : report.overallHealth === 'warning' ? '⚠️' : '❌'}
            </div>
            <p className="text-sm text-gray-600 capitalize">{report.overallHealth}</p>
            <p className="text-xs text-gray-500 mt-2">
              Last checked: {new Date(report.timestamp).toLocaleString()}
            </p>
          </div>

          {/* Duplicates */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Duplicate Detection</h3>
            <div className="text-3xl mb-2 text-blue-500">{report.duplicates}</div>
            <p className="text-sm text-gray-600">Potential duplicates found</p>
            {report.duplicates > 0 && (
              <button
                onClick={() => document.getElementById('duplicates-section').scrollIntoView()}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                View details
              </button>
            )}
          </div>

          {/* Anomalies */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Data Anomalies</h3>
            <div className="text-3xl mb-2 text-orange-500">{report.anomalies}</div>
            <p className="text-sm text-gray-600">Data quality issues</p>
            {report.anomalies > 0 && (
              <button
                onClick={() => document.getElementById('anomalies-section').scrollIntoView()}
                className="mt-2 text-sm text-orange-600 hover:underline"
              >
                View details
              </button>
            )}
          </div>
        </div>
      )}

      {/* Student Performance Prediction */}
      <div className="card">
        <h3 className="font-semibold text-lg mb-4">Student Performance Prediction</h3>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Enter Student ID"
            className="input flex-1"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          />
          <button
            onClick={getStudentPrediction}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Predict
          </button>
        </div>

        {Object.entries(studentPredictions).map(([studentId, prediction]) => (
          <div key={studentId} className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Student {studentId}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Current CGPA</p>
                <p className="font-semibold">{prediction.currentCGPA}</p>
              </div>
              <div>
                <p className="text-gray-600">Predicted CGPA</p>
                <p className="font-semibold">{prediction.predictedCGPA}</p>
              </div>
              <div>
                <p className="text-gray-600">Attendance %</p>
                <p className="font-semibold">{prediction.attendancePercentage}%</p>
              </div>
              <div>
                <p className="text-gray-600">Risk Level</p>
                <p className={`font-semibold ${prediction.riskLevel === 'high' ? 'text-red-500' : prediction.riskLevel === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                  {prediction.riskLevel}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Trend: {prediction.trend}</p>
          </div>
        ))}
      </div>

      {/* Detailed Reports */}
      {report && report.duplicates > 0 && (
        <div id="duplicates-section" className="card">
          <h3 className="font-semibold text-lg mb-4">Duplicate Students</h3>
          <Table
            columns={[
              { key: "student1.user.name", label: "Student 1" },
              { key: "student1.rollNumber", label: "Roll 1" },
              { key: "student2.user.name", label: "Student 2" },
              { key: "student2.rollNumber", label: "Roll 2" },
              { key: "reason", label: "Reason" }
            ]}
            data={report.duplicateDetails}
          />
        </div>
      )}

      {report && report.anomalies > 0 && (
        <div id="anomalies-section" className="card">
          <h3 className="font-semibold text-lg mb-4">Data Anomalies</h3>
          <Table
            columns={[
              { key: "student", label: "Student" },
              { key: "rollNumber", label: "Roll Number" },
              { key: "issues", label: "Issues", render: (issues) => issues.join(", ") }
            ]}
            data={report.anomalyDetails}
          />
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-lg mb-4">AI Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">🔍 Duplicate Detection</h4>
            <p className="text-sm text-gray-600">Automatically identifies students with duplicate roll numbers or emails</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">📊 Data Anomaly Detection</h4>
            <p className="text-sm text-gray-600">Flags invalid CGPA, missing required fields, and other data quality issues</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">🎯 Performance Prediction</h4>
            <p className="text-sm text-gray-600">Predicts student CGPA based on attendance and current performance</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">⚠️ Risk Assessment</h4>
            <p className="text-sm text-gray-600">Identifies students at risk of poor performance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAI;
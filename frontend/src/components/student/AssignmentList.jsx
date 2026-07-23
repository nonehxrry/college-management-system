import { useState } from "react";
import Modal from "../common/Modal";
import FileUploader from "../common/FileUploader";
import { formatDate, formatDateTime, isDeadlinePassed, isDeadlineNear, getFileIcon } from "../../utils/helpers";
import toast from "react-hot-toast";
import { studentService } from "../../services/studentService";

const mockAssignments = [
  {
    _id: "1", title: "Data Structures Lab Report", subject: "Computer Science", code: "CS201",
    professor: "Dr. Kumar", deadline: new Date(Date.now() + 2 * 86400000),
    maxMarks: 10, allowedFormats: ["pdf", "docx"], description: "Submit a detailed lab report covering arrays, linked lists, and stack implementations with code and output screenshots.",
    status: "pending", attachmentUrl: null,
  },
  {
    _id: "2", title: "Wave Optics Numerical Problems", subject: "Physics", code: "PH201",
    professor: "Dr. Gupta", deadline: new Date(Date.now() - 1 * 86400000),
    maxMarks: 15, allowedFormats: ["pdf"], description: "Solve all 12 numerical problems from Chapter 10 - Wave Optics. Show complete working.",
    status: "submitted", submittedAt: new Date(Date.now() - 2 * 86400000), marksObtained: null, feedback: "",
  },
  {
    _id: "3", title: "Organic Chemistry Reaction Mechanisms", subject: "Chemistry", code: "CH201",
    professor: "Prof. Mehra", deadline: new Date(Date.now() + 7 * 86400000),
    maxMarks: 20, allowedFormats: ["pdf", "docx", "zip"], description: "Prepare a comprehensive note on SN1 and SN2 reactions with examples.",
    status: "evaluated", marksObtained: 18, feedback: "Excellent work! Very detailed explanation. Minor issue in the elimination section.",
  },
  {
    _id: "4", title: "Trigonometry Practice Set", subject: "Mathematics", code: "MA201",
    professor: "Dr. Sharma", deadline: new Date(Date.now() + 10 * 86400000),
    maxMarks: 10, allowedFormats: ["pdf"], description: "Complete practice problems 1-50 from the exercise book.",
    status: "pending",
  },
];

const statusConfig = {
  pending: { label: "Pending", icon: "⏳", class: "badge-warning" },
  submitted: { label: "Submitted", icon: "📤", class: "badge-info" },
  evaluated: { label: "Evaluated", icon: "✅", class: "badge-success" },
  resubmit: { label: "Resubmit", icon: "🔄", class: "badge-danger" },
};

const AssignmentCard = ({ assignment, onSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const isPassed = isDeadlinePassed(assignment.deadline);
  const isNear = isDeadlineNear(assignment.deadline);
  const status = statusConfig[assignment.status];

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-200 bg-white
      ${isPassed && assignment.status === "pending" ? "border-red-200" : isNear ? "border-amber-200" : "border-gray-100"}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
              ${assignment.status === "evaluated" ? "bg-emerald-100" : assignment.status === "submitted" ? "bg-blue-100" : isPassed ? "bg-red-100" : "bg-amber-100"}`}>
              {assignment.status === "evaluated" ? "✅" : assignment.status === "submitted" ? "📤" : isPassed ? "⛔" : "📋"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm leading-tight">{assignment.title}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{assignment.subject}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500">{assignment.professor}</span>
              </div>
            </div>
          </div>
          <span className={`badge ${status.class} flex-shrink-0`}>{status.icon} {status.label}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-400">Deadline</p>
            <p className={`text-xs font-bold mt-0.5 ${isPassed ? "text-red-600" : isNear ? "text-amber-600" : "text-gray-700"}`}>
              {formatDate(assignment.deadline)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-400">Max Marks</p>
            <p className="text-xs font-bold text-gray-700 mt-0.5">{assignment.maxMarks}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-400">
              {assignment.status === "evaluated" ? "Obtained" : "Formats"}
            </p>
            <p className="text-xs font-bold text-gray-700 mt-0.5">
              {assignment.status === "evaluated"
                ? `${assignment.marksObtained}/${assignment.maxMarks}`
                : assignment.allowedFormats.map((f) => f.toUpperCase()).join(", ")}
            </p>
          </div>
        </div>

        {assignment.status === "evaluated" && assignment.feedback && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <p className="text-xs font-semibold text-emerald-800 mb-1">💬 Professor's Feedback</p>
            <p className="text-xs text-emerald-700">{assignment.feedback}</p>
          </div>
        )}

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
          >
            {expanded ? "▲ Less info" : "▼ More info"}
          </button>
          <div className="flex-1" />
          {assignment.attachmentUrl && (
            <a href={assignment.attachmentUrl} target="_blank" rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3">
              📎 View Question
            </a>
          )}
          {assignment.status === "pending" && !isPassed && (
            <button onClick={() => onSubmit(assignment)} className="btn-primary text-xs py-1.5 px-4">
              📤 Submit
            </button>
          )}
          {assignment.status === "pending" && isPassed && (
            <span className="text-xs text-red-600 font-semibold">Deadline passed</span>
          )}
          {assignment.status === "resubmit" && (
            <button onClick={() => onSubmit(assignment)} className="btn-danger text-xs py-1.5 px-4">
              🔄 Resubmit
            </button>
          )}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 animate-fade-in">
            <p className="text-xs font-semibold text-gray-700 mb-1">📄 Description</p>
            <p className="text-xs text-gray-600 leading-relaxed">{assignment.description}</p>
            {assignment.submittedAt && (
              <p className="text-xs text-gray-400 mt-2">Submitted: {formatDateTime(assignment.submittedAt)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AssignmentList = () => {
  const [filter, setFilter] = useState("all");
  const [submitModal, setSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setFile(null);
    setSubmitModal(true);
  };

  const doSubmit = async () => {
    if (!file) { toast.error("Please select a file to upload"); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await studentService.submitAssignment(selectedAssignment._id, formData);
      toast.success("Assignment submitted successfully! 🎉");
      setSubmitModal(false);
    } catch {
      toast.error("Failed to submit assignment. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filter === "all" ? mockAssignments : mockAssignments.filter((a) => a.status === filter);

  const counts = {
    all: mockAssignments.length,
    pending: mockAssignments.filter((a) => a.status === "pending").length,
    submitted: mockAssignments.filter((a) => a.status === "submitted").length,
    evaluated: mockAssignments.filter((a) => a.status === "evaluated").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Assignments</h1>
        <p className="page-subtitle">Manage and submit your assignments</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2
              ${filter === key ? "bg-primary-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:border-primary-300"}`}
          >
            <span className="capitalize">{key}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-3">🎉</div>
            <p className="font-semibold text-gray-700">All caught up!</p>
            <p className="text-gray-400 text-sm mt-1">No {filter !== "all" ? filter : ""} assignments</p>
          </div>
        ) : (
          filtered.map((a) => <AssignmentCard key={a._id} assignment={a} onSubmit={handleSubmit} />)
        )}
      </div>

      <Modal
        isOpen={submitModal}
        onClose={() => setSubmitModal(false)}
        title={`Submit: ${selectedAssignment?.title}`}
        icon="📤"
        footer={
          <>
            <button onClick={() => setSubmitModal(false)} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button onClick={doSubmit} className="btn-primary" disabled={submitting || !file}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : "📤 Submit Assignment"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-700">
              <strong>Deadline:</strong> {formatDate(selectedAssignment?.deadline)} ·{" "}
              <strong>Max Marks:</strong> {selectedAssignment?.maxMarks} ·{" "}
              <strong>Formats:</strong> {selectedAssignment?.allowedFormats?.join(", ").toUpperCase()}
            </p>
          </div>
          <FileUploader
            onFilesSelected={setFile}
            label="Drop your assignment file here"
            hint={`Allowed: ${selectedAssignment?.allowedFormats?.join(", ").toUpperCase()} · Max 25MB`}
            allowedFormats={selectedAssignment?.allowedFormats || []}
            maxSize={25}
            accept={selectedAssignment?.allowedFormats?.map((f) => `.${f}`).join(",")}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AssignmentList;
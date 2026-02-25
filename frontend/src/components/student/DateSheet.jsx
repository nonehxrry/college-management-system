import { useState } from "react";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

const mockDateSheet = {
  title: "End Semester Examination — Semester 4",
  semester: 4, section: "A", academicYear: "2023-24",
  isPublished: true,
  exams: [
    { subject: "Algorithms", code: "CS401", date: new Date(Date.now() + 5 * 86400000), startTime: "10:00 AM", endTime: "01:00 PM", venue: "Block A, Room 101", examType: "external" },
    { subject: "Operating Systems", code: "CS402", date: new Date(Date.now() + 7 * 86400000), startTime: "10:00 AM", endTime: "01:00 PM", venue: "Block B, Room 204", examType: "external" },
    { subject: "Database Lab", code: "CS403L", date: new Date(Date.now() + 9 * 86400000), startTime: "02:00 PM", endTime: "05:00 PM", venue: "Computer Lab 3", examType: "practical" },
    { subject: "Computer Networks", code: "CS404", date: new Date(Date.now() + 12 * 86400000), startTime: "10:00 AM", endTime: "01:00 PM", venue: "Block A, Room 105", examType: "external" },
    { subject: "Software Engineering", code: "CS405", date: new Date(Date.now() + 14 * 86400000), startTime: "10:00 AM", endTime: "01:00 PM", venue: "Block C, Room 301", examType: "external" },
    { subject: "Project Viva", code: "CS406V", date: new Date(Date.now() + 18 * 86400000), startTime: "10:00 AM", endTime: "04:00 PM", venue: "Seminar Hall", examType: "viva" },
  ],
};

const examTypeConfig = {
  external: { label: "Theory", color: "bg-blue-100 text-blue-800", icon: "📝" },
  internal: { label: "Internal", color: "bg-amber-100 text-amber-800", icon: "📋" },
  practical: { label: "Practical", color: "bg-green-100 text-green-800", icon: "🔬" },
  viva: { label: "Viva", color: "bg-purple-100 text-purple-800", icon: "🗣️" },
};

const DateSheet = () => {
  const today = new Date();

  const getDaysUntil = (date) => {
    const diff = Math.ceil((new Date(date) - today) / 86400000);
    return diff;
  };

  const sortedExams = [...mockDateSheet.exams].sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextExam = sortedExams.find((e) => getDaysUntil(e.date) > 0);

  const handleDownload = () => {
    toast.success("Hall ticket download started!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Date Sheet</h1>
          <p className="page-subtitle">Examination timetable and schedule</p>
        </div>
        <button onClick={handleDownload} className="btn-primary flex items-center gap-2">
          🎫 Download Hall Ticket
        </button>
      </div>

      <div className="bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-display font-bold text-xl">{mockDateSheet.title}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">Sem {mockDateSheet.semester}</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">Section {mockDateSheet.section}</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">{mockDateSheet.academicYear}</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold font-display">{sortedExams.length}</p>
            <p className="text-blue-200 text-xs">Total Exams</p>
          </div>
        </div>
      </div>

      {nextExam && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
            <p className="text-2xl font-bold text-amber-700 font-display leading-none">
              {getDaysUntil(nextExam.date)}
            </p>
            <p className="text-[10px] text-amber-600">days</p>
          </div>
          <div>
            <p className="font-bold text-amber-900">Next Exam: {nextExam.subject}</p>
            <p className="text-amber-700 text-sm">{formatDate(nextExam.date)} · {nextExam.startTime} – {nextExam.endTime}</p>
            <p className="text-amber-600 text-xs mt-0.5">📍 {nextExam.venue}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sortedExams.map((exam, i) => {
          const daysUntil = getDaysUntil(exam.date);
          const isPast = daysUntil < 0;
          const isToday = daysUntil === 0;
          const isNext = exam === nextExam;
          const typeConf = examTypeConfig[exam.examType] || examTypeConfig.external;

          return (
            <div
              key={i}
              className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200
                ${isPast ? "border-gray-100 bg-gray-50 opacity-60" : isToday ? "border-red-300 bg-red-50 shadow-md" : isNext ? "border-primary-200 bg-primary-50/50 shadow-sm" : "border-gray-100 bg-white hover:shadow-sm"}`}
            >
              <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center
                ${isPast ? "bg-gray-100" : isToday ? "bg-red-100" : isNext ? "bg-primary-100" : "bg-gray-50"}`}>
                <p className={`text-xs font-bold uppercase ${isPast ? "text-gray-400" : isToday ? "text-red-600" : "text-gray-500"}`}>
                  {new Date(exam.date).toLocaleString("default", { month: "short" })}
                </p>
                <p className={`text-xl font-bold font-display leading-none ${isPast ? "text-gray-400" : isToday ? "text-red-700" : "text-gray-800"}`}>
                  {new Date(exam.date).getDate()}
                </p>
                <p className={`text-[10px] ${isPast ? "text-gray-400" : "text-gray-500"}`}>
                  {new Date(exam.date).toLocaleString("default", { weekday: "short" })}
                </p>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-semibold text-sm ${isPast ? "text-gray-500" : "text-gray-900"}`}>{exam.subject}</p>
                  <span className="badge badge-primary text-[10px]">{exam.code}</span>
                  <span className={`badge ${typeConf.color} text-[10px]`}>{typeConf.icon} {typeConf.label}</span>
                  {isToday && <span className="badge bg-red-100 text-red-800 text-[10px] animate-pulse">TODAY!</span>}
                  {isNext && !isToday && <span className="badge bg-primary-100 text-primary-800 text-[10px]">Next</span>}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    🕙 {exam.startTime} – {exam.endTime}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    📍 {exam.venue}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                {isPast ? (
                  <span className="text-xs text-gray-400 font-medium">Done ✓</span>
                ) : isToday ? (
                  <span className="text-sm font-bold text-red-600">Today!</span>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-primary-600 font-display leading-none">{daysUntil}</p>
                    <p className="text-xs text-gray-400">days left</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DateSheet;
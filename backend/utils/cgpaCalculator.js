const getGrade = (percentage) => {
  if (percentage >= 90) return { grade: "O", gradePoints: 10 };
  if (percentage >= 80) return { grade: "A+", gradePoints: 9 };
  if (percentage >= 70) return { grade: "A", gradePoints: 8 };
  if (percentage >= 60) return { grade: "B+", gradePoints: 7 };
  if (percentage >= 55) return { grade: "B", gradePoints: 6 };
  if (percentage >= 50) return { grade: "C", gradePoints: 5 };
  if (percentage >= 45) return { grade: "D", gradePoints: 4 };
  return { grade: "F", gradePoints: 0 };
};

const calculateSGPA = (subjectResults) => {
  let totalWeightedPoints = 0;
  let totalCredits = 0;

  subjectResults.forEach((result) => {
    if (result.status !== "fail" && result.status !== "absent") {
      totalWeightedPoints += result.gradePoints * result.credits;
      totalCredits += result.credits;
    }
  });

  if (totalCredits === 0) return 0;
  return Math.round((totalWeightedPoints / totalCredits) * 100) / 100;
};

const calculateCGPA = (semesterResults) => {
  let totalWeightedPoints = 0;
  let totalCredits = 0;

  semesterResults.forEach((semResult) => {
    semResult.subjects.forEach((subject) => {
      if (subject.status !== "fail" && subject.status !== "absent") {
        totalWeightedPoints += subject.gradePoints * subject.credits;
        totalCredits += subject.credits;
      }
    });
  });

  if (totalCredits === 0) return 0;
  return Math.round((totalWeightedPoints / totalCredits) * 100) / 100;
};

const processSubjectMarks = (internalMarks, practicalMarks, externalMarks, maxInternalMarks, maxPracticalMarks, maxExternalMarks, credits) => {
  const totalMaxMarks = maxInternalMarks + maxPracticalMarks + maxExternalMarks;
  const totalObtained = (internalMarks || 0) + (practicalMarks || 0) + (externalMarks || 0);
  const percentage = (totalObtained / totalMaxMarks) * 100;
  const { grade, gradePoints } = getGrade(percentage);
  const status = externalMarks < maxExternalMarks * 0.4 || percentage < 40 ? "fail" : "pass";

  return {
    totalMarks: totalObtained,
    maxMarks: totalMaxMarks,
    grade,
    gradePoints,
    credits,
    status,
  };
};

module.exports = { getGrade, calculateSGPA, calculateCGPA, processSubjectMarks };
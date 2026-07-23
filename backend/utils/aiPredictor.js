const predictWeakStudents = (students) => {
  return students.map((student) => {
    const { attendance, cgpa, assignmentCompletionRate, latestSGPA } = student;

    let riskScore = 0;
    let riskFactors = [];

    if (attendance < 60) {
      riskScore += 40;
      riskFactors.push("Critical attendance shortage (<60%)");
    } else if (attendance < 75) {
      riskScore += 25;
      riskFactors.push("Low attendance (<75%)");
    }

    if (cgpa < 5.0) {
      riskScore += 35;
      riskFactors.push("Very low CGPA (<5.0)");
    } else if (cgpa < 6.0) {
      riskScore += 20;
      riskFactors.push("Below average CGPA (<6.0)");
    }

    if (assignmentCompletionRate < 50) {
      riskScore += 20;
      riskFactors.push("Low assignment submission rate");
    }

    if (latestSGPA && latestSGPA < cgpa - 1) {
      riskScore += 15;
      riskFactors.push("Declining academic performance");
    }

    let riskLevel = "low";
    if (riskScore >= 60) riskLevel = "critical";
    else if (riskScore >= 40) riskLevel = "high";
    else if (riskScore >= 20) riskLevel = "medium";

    return {
      ...student,
      riskScore,
      riskLevel,
      riskFactors,
      needsIntervention: riskScore >= 40,
    };
  });
};

const predictAttendanceShortage = (currentAttended, totalClasses, remainingClasses, requiredPercentage = 75) => {
  const currentPercentage = totalClasses > 0 ? (currentAttended / totalClasses) * 100 : 0;
  const totalFutureClasses = totalClasses + remainingClasses;
  const requiredTotal = Math.ceil((requiredPercentage / 100) * totalFutureClasses);
  const currentDeficit = requiredTotal - currentAttended;
  const classesNeededToAttend = Math.max(0, currentDeficit);
  const canRecover = currentAttended + remainingClasses >= requiredTotal;

  return {
    currentPercentage: Math.round(currentPercentage * 100) / 100,
    isShort: currentPercentage < requiredPercentage,
    classesNeededToAttend,
    canRecover,
    minimumAttendanceRequired: requiredTotal,
  };
};

const generateRecommendations = (studentData) => {
  const recommendations = [];

  if (studentData.attendance < 75) {
    recommendations.push({
      type: "attendance",
      priority: "high",
      message: "Attend all remaining classes to recover attendance shortage.",
    });
  }

  if (studentData.cgpa < 6.0) {
    recommendations.push({
      type: "academics",
      priority: "high",
      message: "Focus on core subjects. Consider seeking extra help from professors.",
    });
  }

  if (studentData.pendingAssignments > 2) {
    recommendations.push({
      type: "assignments",
      priority: "medium",
      message: `You have ${studentData.pendingAssignments} pending assignments. Submit them before the deadline.`,
    });
  }

  return recommendations;
};

module.exports = { predictWeakStudents, predictAttendanceShortage, generateRecommendations };
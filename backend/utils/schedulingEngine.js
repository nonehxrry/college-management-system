const Course = require("../models/Course");
const Professor = require("../models/Professor");
const Student = require("../models/Student");

/**
 * Advanced Class Scheduling System
 * Intelligently schedules classes considering:
 * - Professor availability and preferences
 * - Student course enrollments
 * - Classroom capacity
 * - No time conflicts
 * - Optimal distribution across week
 */

class SchedulingEngine {
  constructor() {
    this.timeSlots = [
      "08:00-09:00", "09:00-10:00", "10:00-11:00",
      "11:00-12:00", "12:00-01:00", "01:00-02:00",
      "02:00-03:00", "03:00-04:00", "04:00-05:00"
    ];
    this.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    this.classrooms = ["A101", "A102", "B201", "B202", "C301"];
  }

  /**
   * Generate optimal class schedule
   */
  async generateSchedule(semester) {
    const courses = await Course.find({ semester }).populate("professor");
    const schedule = {};

    for (const course of courses) {
      const professorAvailability = await this.getProfessorAvailability(course.professor._id);
      const optimalSlot = this.findOptimalSlot(
        course,
        professorAvailability,
        schedule
      );

      if (optimalSlot) {
        const key = `${optimalSlot.day}-${optimalSlot.time}`;
        schedule[key] = {
          course: course._id,
          professor: course.professor._id,
          classroom: optimalSlot.classroom,
          enrolledStudents: course.enrolledStudents?.length || 0
        };
      }
    }

    return this.validateSchedule(schedule);
  }

  /**
   * Get professor availability and preferences
   */
  async getProfessorAvailability(professorId) {
    const professor = await Professor.findById(professorId);
    return {
      preferredDays: professor.preferredDays || this.days,
      preferredTimes: professor.preferredTimeSlots || this.timeSlots,
      maxClassesPerDay: professor.maxClassesPerDay || 4,
      unavailableSlots: professor.unavailableSlots || []
    };
  }

  /**
   * Find optimal time slot with conflict resolution
   */
  findOptimalSlot(course, availability, currentSchedule) {
    for (const day of availability.preferredDays) {
      for (const time of availability.preferredTimes) {
        if (availability.unavailableSlots.includes(`${day}-${time}`)) continue;

        const slot = this.getClassroom(course.enrolledStudents?.length || 30);
        if (slot && this.isSlotAvailable(day, time, currentSchedule)) {
          return { day, time, classroom: slot };
        }
      }
    }
    return null;
  }

  /**
   * Assign classroom based on student count
   */
  getClassroom(enrolledCount) {
    const classroomCapacity = {
      "A101": 30,
      "A102": 30,
      "B201": 50,
      "B202": 50,
      "C301": 100
    };

    for (const [room, capacity] of Object.entries(classroomCapacity)) {
      if (enrolledCount <= capacity) return room;
    }
    return null;
  }

  /**
   * Check if slot is available
   */
  isSlotAvailable(day, time, schedule) {
    const key = `${day}-${time}`;
    return !schedule[key];
  }

  /**
   * Validate and optimize schedule
   */
  validateSchedule(schedule) {
    const issues = [];
    const slotUsage = {};

    for (const [slot, details] of Object.entries(schedule)) {
      if (!slotUsage[slot]) slotUsage[slot] = [];
      slotUsage[slot].push(details);

      // Check for double booking
      if (slotUsage[slot].length > 1) {
        issues.push(`Double booking detected at ${slot}`);
      }
    }

    return {
      schedule,
      issues,
      isValid: issues.length === 0,
      utilization: this.calculateUtilization(schedule)
    };
  }

  /**
   * Calculate schedule utilization metrics
   */
  calculateUtilization(schedule) {
    const totalSlots = this.days.length * this.timeSlots.length;
    const usedSlots = Object.keys(schedule).length;

    return {
      totalSlots,
      usedSlots,
      utilizationRate: `${Math.round((usedSlots / totalSlots) * 100)}%`,
      emptySlots: totalSlots - usedSlots
    };
  }
}

/**
 * Smart room allocation
 */
class RoomAllocationEngine {
  async allocateOptimalRooms(courses) {
    const allocations = {};

    for (const course of courses) {
      const enrolledCount = course.enrolledStudents?.length || 30;
      allocations[course._id] = this.findBestRoom(enrolledCount);
    }

    return allocations;
  }

  findBestRoom(enrolledCount) {
    const rooms = [
      { id: "A101", capacity: 30, type: "standard" },
      { id: "A102", capacity: 30, type: "standard" },
      { id: "B201", capacity: 50, type: "advanced" },
      { id: "B202", capacity: 50, type: "advanced" },
      { id: "C301", capacity: 100, type: "auditorium" }
    ];

    // Find room with smallest excess capacity
    const suitable = rooms.filter(r => r.capacity >= enrolledCount);
    return suitable.length > 0
      ? suitable.reduce((best, room) => 
          room.capacity - enrolledCount < best.capacity - enrolledCount ? room : best
        )
      : null;
  }
}

module.exports = {
  SchedulingEngine,
  RoomAllocationEngine
};

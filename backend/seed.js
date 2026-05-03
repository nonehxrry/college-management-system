const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Student = require("./models/Student");
const Professor = require("./models/Professor");
const Department = require("./models/Department");
const Course = require("./models/Course");

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/college");
    console.log("✅ Connected to MongoDB");

    // Clean out the old data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Professor.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});

    // 1. Create a Department
    const csDept = await Department.create({
      name: "Computer Science",
      code: "CSE",
      description: "Department of Computer Science and Engineering",
    });

    // 2. Create a Course
    const btechCourse = await Course.create({
      name: "B.Tech Computer Science",
      code: "BTCS",
      department: csDept._id,
      duration: 4,
      totalSemesters: 8,
      description: "Bachelor of Technology in Computer Science",
    });

    // 3. Create Admin User
    const adminUser = await User.create({
      name: "Demo Admin",
      email: "admin@college.edu",
      password: "Admin@123456",
      role: "admin",
    });

    // 4. Create Professor User and Profile
    const profUser = await User.create({
      name: "Demo Professor",
      email: "professor@college.edu",
      password: "Prof@123",
      role: "professor",
    });
    const professor = await Professor.create({
      user: profUser._id,
      employeeId: "EMP1001",
      department: csDept._id,
      designation: "Professor",
    });

    // 5. Create Student User and Profile
    const studentUser = await User.create({
      name: "Demo Student",
      email: "student@college.edu",
      password: "Student@123",
      role: "student",
    });
    await Student.create({
      user: studentUser._id,
      rollNumber: "CSE2023001",
      enrollmentNumber: "ENR2023001",
      department: csDept._id,
      course: btechCourse._id,
      semester: 2,
      section: "A",
      batch: "2023-2027",
      fatherName: "John Doe",
      motherName: "Jane Doe",
      dateOfBirth: new Date("2005-01-01"),
      gender: "male",
      address: {
        street: "123 Main St",
        city: "Metropolis",
        state: "State",
        pincode: "123456",
      },
      bloodGroup: "O+",
    });

    console.log("✅ Admin, Professor, and Student demo users seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Seed Error:", error.message);
    process.exit(1);
  }
};

seedDatabase();
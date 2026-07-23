/**
 * Bulk CSV Upload Handler for Student Data
 * Supports importing multiple students at once with validation
 */

const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const User = require("../models/User");
const Student = require("../models/Student");
const Department = require("../models/Department");

/**
 * Parse CSV file and extract student data
 */
const parseCSVFile = async (filePath) => {
  return new Promise((resolve, reject) => {
    const records = [];
    const ext = filePath.split('.').pop().toLowerCase();

    try {
      if (ext === 'csv') {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => records.push(data))
          .on('end', () => resolve(records))
          .on('error', reject);
      } else if (['xlsx', 'xls'].includes(ext)) {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        resolve(data);
      }
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Validate student data from CSV
 */
const validateStudentData = (studentData) => {
  const errors = [];
  const warnings = [];

  // Required fields
  const requiredFields = [
    'name', 'email', 'rollNumber', 'department',
    'semester', 'section', 'batch'
  ];

  for (const field of requiredFields) {
    if (!studentData[field] || studentData[field].toString().trim() === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate email format
  if (studentData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentData.email)) {
    errors.push(`Invalid email format: ${studentData.email}`);
  }

  // Validate semester
  if (studentData.semester && (isNaN(studentData.semester) || studentData.semester < 1 || studentData.semester > 10)) {
    errors.push(`Invalid semester: ${studentData.semester}`);
  }

  // Validate gender
  if (studentData.gender && !['male', 'female', 'other'].includes(studentData.gender.toLowerCase())) {
    warnings.push(`Invalid gender value: ${studentData.gender}`);
  }

  // Optional but validate if present
  if (studentData.dateOfBirth && isNaN(new Date(studentData.dateOfBirth).getTime())) {
    warnings.push(`Invalid date of birth format: ${studentData.dateOfBirth}`);
  }

  // Phone number validation (if present)
  if (studentData.phone && !/^\d{10}$/.test(studentData.phone.toString().replace(/[^\d]/g, ''))) {
    warnings.push(`Invalid phone number format: ${studentData.phone}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Bulk import students from CSV file
 */
const bulkImportStudents = async (filePath, options = {}) => {
  const results = {
    imported: 0,
    failed: 0,
    updated: 0,
    duplicates: 0,
    errors: [],
    warnings: [],
    details: []
  };

  try {
    // Parse file
    const studentData = await parseCSVFile(filePath);

    // Find department once for better performance
    const departments = await Department.find().select('_id name code');
    const deptMap = {};
    departments.forEach(d => {
      deptMap[d.name] = d._id;
      deptMap[d.code] = d._id;
    });

    // Process each student record
    for (let i = 0; i < studentData.length; i++) {
      const data = studentData[i];

      try {
        // Validate data
        const validation = validateStudentData(data);

        if (!validation.isValid) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            email: data.email,
            errors: validation.errors
          });
          results.details.push({
            row: i + 2,
            status: 'failed',
            reason: validation.errors.join('; ')
          });
          continue;
        }

        if (validation.warnings.length > 0) {
          results.warnings.push({
            row: i + 2,
            email: data.email,
            warnings: validation.warnings
          });
        }

        // Check for existing user
        const existingUser = await User.findOne({ email: data.email });

        if (existingUser && !options.updateExisting) {
          results.duplicates++;
          results.details.push({
            row: i + 2,
            status: 'duplicate',
            email: data.email
          });
          continue;
        }

        // Find department ID
        const deptId = deptMap[data.department];
        if (!deptId) {
          results.failed++;
          results.details.push({
            row: i + 2,
            status: 'failed',
            reason: `Department not found: ${data.department}`
          });
          continue;
        }

        // Create or update user
        let user;
        if (existingUser && options.updateExisting) {
          // Update existing user
          Object.assign(existingUser, {
            name: data.name,
            role: 'student'
          });
          user = await existingUser.save();
          results.updated++;
        } else {
          // Generate temporary password
          const tempPassword = generateTemporaryPassword();

          user = await User.create({
            name: data.name,
            email: data.email,
            password: tempPassword,
            role: 'student',
            isActive: true
          });
          results.imported++;
        }

        // Create or update student profile
        let student = await Student.findOne({ user: user._id });

        if (student) {
          // Update existing student record
          Object.assign(student, {
            rollNumber: data.rollNumber,
            enrollmentNumber: data.enrollmentNumber || `ENR-${Date.now()}`,
            department: deptId,
            semester: parseInt(data.semester),
            section: data.section,
            batch: data.batch,
            fatherName: data.fatherName || '',
            motherName: data.motherName || '',
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            gender: data.gender ? data.gender.toLowerCase() : undefined,
            phone: data.phone,
            address: {
              street: data.street,
              city: data.city,
              state: data.state,
              pincode: data.pincode
            },
            bloodGroup: data.bloodGroup
          });
          await student.save();
        } else {
          // Create new student record
          student = await Student.create({
            user: user._id,
            rollNumber: data.rollNumber,
            enrollmentNumber: data.enrollmentNumber || `ENR-${Date.now()}`,
            department: deptId,
            semester: parseInt(data.semester),
            section: data.section,
            batch: data.batch,
            fatherName: data.fatherName || '',
            motherName: data.motherName || '',
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            gender: data.gender ? data.gender.toLowerCase() : undefined,
            phone: data.phone,
            address: {
              street: data.street || '',
              city: data.city || '',
              state: data.state || '',
              pincode: data.pincode || ''
            },
            bloodGroup: data.bloodGroup || ''
          });
        }

        results.details.push({
          row: i + 2,
          status: 'success',
          email: data.email,
          rollNumber: data.rollNumber
        });

      } catch (err) {
        results.failed++;
        results.details.push({
          row: i + 2,
          status: 'error',
          email: data.email,
          error: err.message
        });
      }
    }

    // Clean up uploaded file
    if (options.deleteFile && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      success: true,
      summary: results,
      timestamp: new Date()
    };

  } catch (err) {
    return {
      success: false,
      error: err.message,
      timestamp: new Date()
    };
  }
};

/**
 * Generate sample CSV template
 */
const generateCSVTemplate = () => {
  const headers = [
    'name',
    'email',
    'rollNumber',
    'enrollmentNumber',
    'department',
    'semester',
    'section',
    'batch',
    'fatherName',
    'motherName',
    'dateOfBirth',
    'gender',
    'phone',
    'street',
    'city',
    'state',
    'pincode',
    'bloodGroup'
  ];

  const sampleData = [
    {
      name: 'Raj Kumar Singh',
      email: 'raj.singh@college.edu',
      rollNumber: 'CS001',
      enrollmentNumber: 'ENR-2023-001',
      department: 'Computer Science',
      semester: '3',
      section: 'A',
      batch: '2023',
      fatherName: 'Mr. Kumar Singh',
      motherName: 'Mrs. Priya Singh',
      dateOfBirth: '2005-05-15',
      gender: 'male',
      phone: '9876543210',
      street: '123 Main Street',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      bloodGroup: 'O+'
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@college.edu',
      rollNumber: 'CS002',
      enrollmentNumber: 'ENR-2023-002',
      department: 'Computer Science',
      semester: '3',
      section: 'A',
      batch: '2023',
      fatherName: 'Mr. Sharma',
      motherName: 'Mrs. Neha Sharma',
      dateOfBirth: '2005-06-20',
      gender: 'female',
      phone: '9876543211',
      street: '456 Oak Avenue',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      bloodGroup: 'B+'
    }
  ];

  return {
    headers,
    template: [headers, ...sampleData.map(student => headers.map(h => student[h] || ''))],
    sampleData
  };
};

/**
 * Export students to CSV
 */
const exportStudentsToCSV = async (students) => {
  const headers = [
    'Roll Number', 'Name', 'Email', 'Department', 'Semester',
    'Section', 'CGPA', 'Admission Date', 'Phone', 'Status'
  ];

  const csvData = students.map(student => [
    student.rollNumber,
    student.user?.name || 'N/A',
    student.user?.email || 'N/A',
    student.department?.name || 'N/A',
    student.semester,
    student.section,
    student.cgpa || 0,
    new Date(student.admissionDate).toLocaleDateString(),
    student.user?.phone || 'N/A',
    student.user?.isActive ? 'Active' : 'Inactive'
  ]);

  return {
    headers,
    data: [headers, ...csvData]
  };
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

module.exports = {
  parseCSVFile,
  validateStudentData,
  bulkImportStudents,
  generateCSVTemplate,
  exportStudentsToCSV,
  generateTemporaryPassword
};

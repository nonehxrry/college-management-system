const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: `"College Management System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

const sendResultPublishedEmail = async (studentEmail, studentName, semester) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f7f8; border-radius: 10px;">
      <div style="background: #1a237e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Result Published!</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px;">Dear <strong>${studentName}</strong>,</p>
        <p>Your <strong>Semester ${semester}</strong> results have been published.</p>
        <p>Please login to your student portal to view your results.</p>
        <a href="${process.env.FRONTEND_URL}/student/results" style="background: #1a237e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">View Results</a>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">This is an automated email. Please do not reply.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: studentEmail, subject: `Semester ${semester} Results Published`, html });
};

const sendAttendanceShortageEmail = async (studentEmail, studentName, subjectName, percentage) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f7f8; border-radius: 10px;">
      <div style="background: #c62828; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">⚠️ Attendance Shortage Alert</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px;">Dear <strong>${studentName}</strong>,</p>
        <p>Your attendance in <strong>${subjectName}</strong> has dropped to <strong style="color: red;">${percentage}%</strong>, which is below the required 75%.</p>
        <p>Please contact your professor or department immediately.</p>
        <a href="${process.env.FRONTEND_URL}/student/attendance" style="background: #c62828; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">View Attendance</a>
      </div>
    </div>
  `;
  return sendEmail({ to: studentEmail, subject: `⚠️ Attendance Shortage - ${subjectName}`, html });
};

const sendAssignmentDeadlineEmail = async (studentEmail, studentName, assignmentTitle, deadline) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f7f8; border-radius: 10px;">
      <div style="background: #e65100; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">📋 Assignment Deadline Reminder</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px;">Dear <strong>${studentName}</strong>,</p>
        <p>The assignment <strong>"${assignmentTitle}"</strong> is due on <strong style="color: #e65100;">${new Date(deadline).toLocaleDateString()}</strong>.</p>
        <p>Please submit before the deadline to avoid late submission penalty.</p>
        <a href="${process.env.FRONTEND_URL}/student/assignments" style="background: #e65100; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">Submit Now</a>
      </div>
    </div>
  `;
  return sendEmail({ to: studentEmail, subject: `📋 Reminder: ${assignmentTitle} deadline approaching`, html });
};

module.exports = { sendEmail, sendResultPublishedEmail, sendAttendanceShortageEmail, sendAssignmentDeadlineEmail };
const Joi = require("joi");

// User registration validation
const validateUserRegistration = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/).required().messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
      'any.required': 'Password is required'
    }),
    role: Joi.string().valid('student', 'professor', 'admin').required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional()
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  next();
};

// Student creation validation
const validateStudentCreation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    rollNumber: Joi.string().required(),
    department: Joi.string().required(),
    course: Joi.string().required(),
    semester: Joi.number().min(1).max(10).required(),
    section: Joi.string().required(),
    phone: Joi.string().optional(),
    fatherName: Joi.string().optional(),
    motherName: Joi.string().optional(),
    dateOfBirth: Joi.date().optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    bloodGroup: Joi.string().optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      pincode: Joi.string().optional()
    }).optional()
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  next();
};

// Login validation
const validateLogin = (req, res, next) => {

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    role: Joi.string().valid('student', 'professor', 'admin').required().messages({
      'any.only': 'Role must be student, professor, or admin',
      'any.required': 'Role is required'
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

module.exports = {
  validateUserRegistration,
  validateStudentCreation,
  validateLogin
};
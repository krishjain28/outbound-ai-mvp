const validator = require('validator');

// Sanitize user input
const sanitizeInput = input => {
  if (typeof input !== 'string') return input;

  // Remove potential XSS attacks
  return validator.escape(input);
};

// Validate email format
const isValidEmail = email => {
  return validator.isEmail(email);
};

// Validate password strength
const isStrongPassword = password => {
  return validator.isStrongPassword(password, {
    minLength: 6,
    minLowercase: 1,
    minUppercase: 0, // Make uppercase optional
    minNumbers: 0,   // Make numbers optional
    minSymbols: 0,
  });
};

// Validate user name
const isValidName = name => {
  return (
    validator.isLength(name, { min: 2, max: 50 }) &&
    validator.isAlpha(name.replace(/\s/g, ''))
  );
};

// Rate limiting helper
const createRateLimitMessage = (windowMs, max) => {
  const minutes = Math.floor(windowMs / 60000);
  return `Too many requests. Please try again in ${minutes} minutes. Limit: ${max} requests per ${minutes} minutes.`;
};

// Check if request is from allowed origins
const isAllowedOrigin = (origin, allowedOrigins) => {
  return allowedOrigins.includes(origin);
};

// Generate secure random token
const generateSecureToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

// Hash sensitive data
const hashData = data => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data).digest('hex');
};

module.exports = {
  sanitizeInput,
  isValidEmail,
  isStrongPassword,
  isValidName,
  createRateLimitMessage,
  isAllowedOrigin,
  generateSecureToken,
  hashData,
};

// Security utilities for input validation and sanitization

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with score and feedback
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, score: 0, feedback: 'Password is required' };
  }

  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  let score = 0;
  const feedback = [];

  if (password.length >= minLength) score += 1;
  else feedback.push(`At least ${minLength} characters`);

  if (hasUpperCase) score += 1;
  else feedback.push('At least one uppercase letter');

  if (hasLowerCase) score += 1;
  else feedback.push('At least one lowercase letter');

  if (hasNumbers) score += 1;
  else feedback.push('At least one number');

  if (hasSpecialChar) score += 1;
  else feedback.push('At least one special character');

  const isValid = score >= 4 && password.length >= minLength;

  return {
    isValid,
    score,
    feedback: feedback.length > 0 ? feedback.join(', ') : 'Strong password'
  };
};

/**
 * Rate limiting utility
 */
class RateLimiter {
  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  reset(identifier) {
    this.requests.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Generate CSRF token
 * @returns {string} - CSRF token
 */
export const generateCSRFToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Validate task input data
 * @param {object} taskData - Task data to validate
 * @returns {object} - Validation result
 */
export const validateTaskData = (taskData) => {
  const errors = [];
  
  if (!taskData.title || taskData.title.trim().length === 0) {
    errors.push('Task title is required');
  }
  
  if (taskData.title && taskData.title.length > 200) {
    errors.push('Task title must be less than 200 characters');
  }
  
  if (taskData.description && taskData.description.length > 1000) {
    errors.push('Task description must be less than 1000 characters');
  }
  
  if (taskData.dueDate) {
    const dueDate = new Date(taskData.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.push('Invalid due date');
    }
  }
  
  if (taskData.tags && Array.isArray(taskData.tags)) {
    if (taskData.tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }
    
    taskData.tags.forEach(tag => {
      if (tag.length > 20) {
        errors.push('Each tag must be less than 20 characters');
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize task data before saving
 * @param {object} taskData - Task data to sanitize
 * @returns {object} - Sanitized task data
 */
export const sanitizeTaskData = (taskData) => {
  return {
    ...taskData,
    title: sanitizeHtml(taskData.title || ''),
    description: sanitizeHtml(taskData.description || ''),
    tags: Array.isArray(taskData.tags) 
      ? taskData.tags.map(tag => sanitizeHtml(tag.trim())).filter(Boolean)
      : []
  };
}; 
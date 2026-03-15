// Error handling utilities

/**
 * Error types for better error categorization
 */
export const ErrorTypes = {
  AUTHENTICATION: 'AUTHENTICATION',
  VALIDATION: 'VALIDATION',
  NETWORK: 'NETWORK',
  DATABASE: 'DATABASE',
  PERMISSION: 'PERMISSION',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Centralized error logger
 */
class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors
  }

  log(error, context = {}, severity = ErrorSeverity.MEDIUM) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      context,
      severity,
      type: this.categorizeError(error)
    };

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      this.sendToErrorService(errorEntry);
    } else {
      // In development, log to console with better formatting
      console.group(`🚨 ${severity} Error: ${errorEntry.type}`);
      console.error('Message:', errorEntry.message);
      console.error('Context:', errorEntry.context);
      console.error('Stack:', errorEntry.stack);
      console.groupEnd();
    }

    // Store error locally
    this.errors.push(errorEntry);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  categorizeError(error) {
    if (error.code) {
      if (error.code.startsWith('auth/')) return ErrorTypes.AUTHENTICATION;
      if (error.code.startsWith('permission-denied')) return ErrorTypes.PERMISSION;
    }
    
    if (error.message) {
      const message = error.message.toLowerCase();
      if (message.includes('network') || message.includes('fetch')) return ErrorTypes.NETWORK;
      if (message.includes('validation') || message.includes('invalid')) return ErrorTypes.VALIDATION;
      if (message.includes('firestore') || message.includes('database')) return ErrorTypes.DATABASE;
    }
    
    return ErrorTypes.UNKNOWN;
  }

  sendToErrorService(errorEntry) {
    // In production, integrate with services like Sentry, LogRocket, etc.
    // For now, we'll just store locally
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: errorEntry.message,
        fatal: errorEntry.severity === ErrorSeverity.CRITICAL
      });
    }
  }

  getErrors() {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }
}

export const errorLogger = new ErrorLogger();

/**
 * Firebase authentication error handler
 */
export const handleAuthError = (error, operation) => {
  let userMessage = 'An authentication error occurred.';
  let severity = ErrorSeverity.MEDIUM;

  if (error.code) {
    switch (error.code) {
      case 'auth/user-not-found':
        userMessage = 'No account found with this email.';
        break;
      case 'auth/wrong-password':
        userMessage = 'Incorrect password. Please try again.';
        break;
      case 'auth/invalid-email':
        userMessage = 'Please enter a valid email address.';
        break;
      case 'auth/missing-password':
        userMessage = 'Password is required.';
        break;
      case 'auth/weak-password':
        userMessage = 'Password should be at least 6 characters.';
        break;
      case 'auth/email-already-in-use':
        userMessage = 'An account with this email already exists.';
        break;
      case 'auth/network-request-failed':
        userMessage = 'Network error. Please check your internet connection.';
        severity = ErrorSeverity.HIGH;
        break;
      case 'auth/too-many-requests':
        userMessage = 'Too many failed attempts. Please wait and try again later.';
        severity = ErrorSeverity.HIGH;
        break;
      case 'auth/popup-closed-by-user':
        userMessage = 'Login popup was closed. Please try again.';
        break;
      case 'auth/invalid-credential':
        userMessage = 'Invalid login credentials. Please check and try again.';
        break;
      case 'auth/user-disabled':
        userMessage = 'This account has been disabled.';
        severity = ErrorSeverity.HIGH;
        break;
      case 'auth/operation-not-allowed':
        userMessage = 'This operation is not allowed.';
        severity = ErrorSeverity.HIGH;
        break;
      default:
        userMessage = 'Something went wrong. Please try again.';
    }
  }

  if (operation === "logout" && error.code === "permission-denied") {
    // Don't show toast
    return;
  }

  errorLogger.log(error, { type: 'AUTHENTICATION' }, severity);
  return userMessage;
};

/**
 * Database operation error handler
 */
export const handleDatabaseError = (error, operation) => {
  let userMessage = 'A database error occurred.';
  let severity = ErrorSeverity.MEDIUM;

  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        userMessage = 'You do not have permission to perform this action.';
        severity = ErrorSeverity.HIGH;
        break;
      case 'unavailable':
        userMessage = 'Service temporarily unavailable. Please try again.';
        severity = ErrorSeverity.HIGH;
        break;
      case 'deadline-exceeded':
        userMessage = 'Request timed out. Please try again.';
        break;
      case 'resource-exhausted':
        userMessage = 'Service quota exceeded. Please try again later.';
        severity = ErrorSeverity.HIGH;
        break;
      case 'failed-precondition':
        userMessage = 'Operation failed due to invalid state.';
        break;
      case 'aborted':
        userMessage = 'Operation was aborted. Please try again.';
        break;
      case 'out-of-range':
        userMessage = 'Invalid data range.';
        break;
      case 'unimplemented':
        userMessage = 'Operation not implemented.';
        severity = ErrorSeverity.HIGH;
        break;
      case 'internal':
        userMessage = 'Internal server error. Please try again.';
        severity = ErrorSeverity.HIGH;
        break;
      case 'unavailable':
        userMessage = 'Service unavailable. Please try again.';
        severity = ErrorSeverity.HIGH;
        break;
      case 'data-loss':
        userMessage = 'Data loss occurred.';
        severity = ErrorSeverity.CRITICAL;
        break;
      default:
        userMessage = 'Database operation failed. Please try again.';
    }
  }

  errorLogger.log(error, { type: 'DATABASE', operation }, severity);
  return userMessage;
};

/**
 * Network error handler
 */
export const handleNetworkError = (error) => {
  const userMessage = 'Network error. Please check your internet connection and try again.';
  errorLogger.log(error, { type: 'NETWORK' }, ErrorSeverity.HIGH);
  return userMessage;
};

/**
 * Validation error handler
 */
export const handleValidationError = (errors) => {
  const userMessage = Array.isArray(errors) ? errors.join(', ') : errors;
  errorLogger.log(new Error(userMessage), { type: 'VALIDATION' }, ErrorSeverity.LOW);
  return userMessage;
};

/**
 * Generic error handler
 */
export const handleError = (error, context = {}) => {
  let userMessage = 'Something went wrong. Please try again.';
  let severity = ErrorSeverity.MEDIUM;

  if (error.message) {
    userMessage = error.message;
  }

  errorLogger.log(error, context, severity);
  return userMessage;
}; 
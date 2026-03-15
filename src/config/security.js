// Security configuration for the application

/**
 * Content Security Policy configuration
 */
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite dev mode
    "'unsafe-eval'",   // Required for Vite dev mode
    "https://www.gstatic.com",
    "https://www.googleapis.com",
    "https://apis.google.com"
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS
    "https://fonts.googleapis.com"
  ],
  'font-src': [
    "'self'",
    "https://fonts.gstatic.com"
  ],
  'img-src': [
    "'self'",
    "data:",
    "https:",
    "blob:"
  ],
  'connect-src': [
    "'self'",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://firestore.googleapis.com",
    "https://www.googleapis.com",
    "wss://s-usc1c-nss-2077.firebaseio.com"
  ],
  'frame-src': [
    "'self'",
    "https://accounts.google.com"
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
};

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDuration: 30 * 60 * 1000 // 30 minutes
  },
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  taskCreation: {
    maxRequests: 10,
    windowMs: 60 * 1000 // 1 minute
  }
};

/**
 * Password policy configuration
 */
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  preventCommonPasswords: true,
  preventUserInfo: true
};

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  secure: true,
  httpOnly: true,
  sameSite: 'strict'
};

/**
 * Input validation rules
 */
export const VALIDATION_RULES = {
  email: {
    maxLength: 254,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    minLength: 8,
    maxLength: 128
  },
  taskTitle: {
    maxLength: 200,
    minLength: 1
  },
  taskDescription: {
    maxLength: 1000
  },
  tags: {
    maxCount: 10,
    maxLength: 20
  },
  username: {
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/
  }
};

/**
 * File upload restrictions
 */
export const FILE_UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  maxFiles: 1
};

/**
 * API security configuration
 */
export const API_SECURITY = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  maxPayloadSize: 1024 * 1024 // 1MB
};

/**
 * Audit logging configuration
 */
export const AUDIT_CONFIG = {
  enabled: true,
  logLevel: import.meta.env.PROD ? 'warn' : 'debug',
  events: [
    'login',
    'logout',
    'task_create',
    'task_update',
    'task_delete',
    'password_change',
    'profile_update'
  ]
};

/**
 * Get CSP header string
 */
export const getCSPHeader = () => {
  return Object.entries(CSP_CONFIG)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
};

/**
 * Validate security configuration
 */
export const validateSecurityConfig = () => {
  const errors = [];
  
  if (!CSP_CONFIG['default-src'].includes("'self'")) {
    errors.push('CSP default-src must include self');
  }
  
  if (CSP_CONFIG['object-src'].includes("'self'")) {
    errors.push('CSP object-src should be none for security');
  }
  
  if (RATE_LIMIT_CONFIG.login.maxAttempts < 3) {
    errors.push('Login rate limit should allow at least 3 attempts');
  }
  
  if (PASSWORD_POLICY.minLength < 8) {
    errors.push('Password minimum length should be at least 8 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 
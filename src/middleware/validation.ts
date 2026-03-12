import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { reportError } from '@/services/sentry';

// Validation middleware factory
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      let data;
      
      switch (source) {
        case 'body':
          data = req.body;
          break;
        case 'query':
          data = req.query;
          break;
        case 'params':
          data = req.params;
          break;
        default:
          data = req.body;
      }

      const validatedData = schema.parse(data);
      
      // Attach validated data to request
      switch (source) {
        case 'body':
          req.body = validatedData;
          break;
        case 'query':
          req.query = validatedData;
          break;
        case 'params':
          req.params = validatedData;
          break;
        default:
          req.body = validatedData;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = formatValidationError(error);
        
        reportError(error, {
          context: 'validation_middleware',
          source,
          endpoint: req.path,
          method: req.method,
          validation_errors: validationError.errors,
        });

        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationError,
        });
      }
      
      // For non-Zod errors, pass to next error handler
      next(error);
    }
  };
};

// Format Zod validation errors for better API responses
const formatValidationError = (error: ZodError) => {
  const errors: Array<{
    field: string;
    message: string;
    code: string;
    received: any;
  }> = [];

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors.push({
      field: path || 'root',
      message: err.message,
      code: err.code,
      received: err.received,
    });
  });

  return {
    errors,
    summary: `${errors.length} validation error(s)`,
  };
};

// Async validation wrapper for route handlers
export const validateAsync = async (
  schema: ZodSchema,
  data: any,
  context?: string
) => {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = formatValidationError(error);
      
      reportError(error, {
        context: context || 'async_validation',
        validation_errors: validationError.errors,
      });

      throw new ValidationError(validationError);
    }
    
    throw error;
  }
};

// Custom validation error class
export class ValidationError extends Error {
  public details: any;

  constructor(details: any) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.details = details;
  }
}

// Common validation patterns
export const commonValidations = {
  // UUID validation
  uuid: (value: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  // Email validation (more strict than basic)
  email: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  // Password strength validation
  passwordStrength: (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: [
        ...(password.length < minLength ? ['Password must be at least 8 characters'] : []),
        ...(!hasUpperCase ? ['Password must contain uppercase letter'] : []),
        ...(!hasLowerCase ? ['Password must contain lowercase letter'] : []),
        ...(!hasNumbers ? ['Password must contain number'] : []),
        ...(!hasSpecialChar ? ['Password must contain special character'] : []),
      ],
    };
  },

  // Phone number validation
  phone: (phone: string) => {
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  },

  // Date validation (ISO format and not in future)
  date: (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    return {
      isValid: !isNaN(date.getTime()) && date <= now,
      date,
      errors: [
        ...(isNaN(date.getTime()) ? ['Invalid date format'] : []),
        ...(date > now ? ['Date cannot be in the future'] : []),
      ],
    };
  },

  // File upload validation
  file: (file: Express.Multer.File, options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}) => {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;
    
    return {
      isValid: file.size <= maxSize && allowedTypes.includes(file.mimetype),
      errors: [
        ...(file.size > maxSize ? [`File size exceeds ${maxSize / 1024 / 1024}MB limit`] : []),
        ...(!allowedTypes.includes(file.mimetype) ? [`File type ${file.mimetype} not allowed`] : []),
      ],
    };
  },
};

// Sanitization utilities
export const sanitize = {
  // Remove HTML tags
  html: (input: string): string => {
    return input.replace(/<[^>]*>/g, '');
  },

  // Trim and collapse whitespace
  text: (input: string): string => {
    return input.trim().replace(/\s+/g, ' ');
  },

  // Sanitize email (lowercase and trim)
  email: (email: string): string => {
    return email.toLowerCase().trim();
  },

  // Sanitize phone number (keep only digits and +)
  phone: (phone: string): string => {
    return phone.replace(/[^\d+]/g, '');
  },
};

// Rate limiting validation
export const rateLimitValidation = {
  // Check if user is exceeding rate limits
  checkUserLimit: async (userId: string, action: string, limit: number, windowMs: number) => {
    // This would typically use Redis or similar
    // Implementation depends on your rate limiting strategy
    const key = `rate_limit:${userId}:${action}`;
    
    // Placeholder implementation
    return {
      allowed: true,
      remaining: limit,
      resetTime: Date.now() + windowMs,
    };
  },

  // Check IP-based rate limiting
  checkIPLimit: async (ip: string, action: string, limit: number, windowMs: number) => {
    const key = `rate_limit:${ip}:${action}`;
    
    // Placeholder implementation
    return {
      allowed: true,
      remaining: limit,
      resetTime: Date.now() + windowMs,
    };
  },
};

export default validate;

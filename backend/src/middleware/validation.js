/**
 * Request validation middleware
 * Validates request parameters, query, and body against a schema
 */

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    // Validate each part of the request
    ['params', 'query', 'body'].forEach((key) => {
      if (schema[key]) {
        const { error } = validateSchema(schema[key], req[key]);
        if (error) {
          errors.push({
            location: key,
            message: error.message,
            details: error.details
          });
        }
      }
    });
    
    if (errors.length > 0) {
      const error = new Error('Validation Error');
      error.name = 'ValidationError';
      error.details = errors;
      return next(error);
    }
    
    next();
  };
};

/**
 * Validate data against a schema
 */
const validateSchema = (schema, data) => {
  const errors = [];
  
  for (const [key, rule] of Object.entries(schema)) {
    const value = data ? data[key] : undefined;
    
    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: key,
        message: `'${key}' is required`,
        value
      });
      continue;
    }
    
    // Skip further validation if value is optional and not provided
    if (value === undefined || value === null || value === '') {
      continue;
    }
    
    // Type validation
    if (rule.type && typeof value !== rule.type) {
      errors.push({
        field: key,
        message: `'${key}' must be of type ${rule.type}`,
        value,
        expected: rule.type,
        actual: typeof value
      });
    }
    
    // String validations
    if (typeof value === 'string') {
      // Minimum length
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          field: key,
          message: `'${key}' must be at least ${rule.minLength} characters long`,
          value,
          minLength: rule.minLength,
          actualLength: value.length
        });
      }
      
      // Maximum length
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          field: key,
          message: `'${key}' must be at most ${rule.maxLength} characters long`,
          value,
          maxLength: rule.maxLength,
          actualLength: value.length
        });
      }
      
      // Format validation (e.g., email, URL)
      if (rule.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push({
          field: key,
          message: `'${key}' must be a valid email address`,
          value
        });
      }
      
      if (rule.format === 'uri' && !/^https?:\/\//.test(value)) {
        errors.push({
          field: key,
          message: `'${key}' must be a valid URL`,
          value
        });
      }
    }
    
    // Number validations
    if (typeof value === 'number') {
      if (rule.minimum !== undefined && value < rule.minimum) {
        errors.push({
          field: key,
          message: `'${key}' must be at least ${rule.minimum}`,
          value,
          minimum: rule.minimum
        });
      }
      
      if (rule.maximum !== undefined && value > rule.maximum) {
        errors.push({
          field: key,
          message: `'${key}' must be at most ${rule.maximum}`,
          value,
          maximum: rule.maximum
        });
      }
    }
    
    // Enum validation
    if (Array.isArray(rule.enum) && !rule.enum.includes(value)) {
      errors.push({
        field: key,
        message: `'${key}' must be one of: ${rule.enum.join(', ')}`,
        value,
        allowedValues: rule.enum
      });
    }
    
    // Custom validation function
    if (typeof rule.validate === 'function') {
      const customError = rule.validate(value, data);
      if (customError) {
        errors.push({
          field: key,
          message: customError,
          value
        });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    error: errors.length > 0 ? new Error('Validation failed') : null,
    errors
  };
};

// Helper to create validation rules
export const Joi = {
  string: (options = {}) => ({
    type: 'string',
    ...options
  }),
  number: (options = {}) => ({
    type: 'number',
    ...options
  }),
  boolean: (options = {}) => ({
    type: 'boolean',
    ...options
  }),
  array: (itemSchema, options = {}) => ({
    type: 'array',
    items: itemSchema,
    ...options
  }),
  object: (schema, options = {}) => ({
    type: 'object',
    schema,
    ...options
  })
};

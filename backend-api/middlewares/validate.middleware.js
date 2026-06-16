const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    // Attempt to parse the incoming request body against the provided Zod schema
    schema.parse(req.body);
    next(); // If successful, pass control to the actual controller
  } catch (error) {
    // If it fails, catch the ZodError and format it cleanly for the frontend
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error_type: "VALIDATION_FAILURE",
        details: error.errors.map(err => ({ 
          field: err.path.join('.'), 
          message: err.message 
        }))
      });
    }
    // If it's a different kind of system error, pass it to our global error handler
    next(error);
  }
};

module.exports = validate;
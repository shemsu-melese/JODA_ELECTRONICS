
//Centralized Error Handling Middleware
// Custom error class for API errors
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; 
        
        // Capture the stack trace (where the error occurred)
        Error.captureStackTrace(this, this.constructor);
    }
}

// 404 Handler
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`File not found: ${req.originalUrl}`, 404);
    next(error); 
}

// Main error handler
const errorHandler = (err, req, res, next) => {
    // Default values
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    // Development: Send detailed error information
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            stack: err.stack,        // Shows where the error occurred
            error: err               // Full error object
        });
    }
    
    // Production: Send clean, safe error message
    if (err.isOperational) {
        // Operational errors (expected) - send the message
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message
        });
    }
    
    // Programming or unknown errors - don't leak error details
    console.error('ERROR 💥:', err);
    return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong! Please try again later.'
    });
};

module.exports = {
    AppError,
    notFoundHandler,
    errorHandler
};
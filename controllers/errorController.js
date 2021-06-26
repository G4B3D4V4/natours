const AppError = require("../utils/appError");

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`

    return new AppError(message, 400)
}

const handleDuplicatedFieldsDB = err => {
    const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0]
    const message = `Duplicate field value ${value} please use another value`

    return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message)

    const message = `Invalid input data. ${errors.join('. ')}`
    return new AppError(message, 400);
}

const handleJsonWebTokenError = err => new AppError('Invalid token. please log in again', 401);

const handleTokenExpiredError = err => new AppError('Token is expired. please log in again', 401)

const sendErrorDev = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });    
    }
    // B) RENDERED website
    console.error('Error:', err)
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: err.message
    })
    
     
};

const sendErrorProd = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        // A) API
        // Operational, trusted error
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        
        }
        // Programing or other error
        // 1) log error
        console.error('Error:', err)

        // 2) Send generic message
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        })
        
    }
    // Operational, trusted error
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        });
    }
    // Programing or other error
    // 1) log error
    console.error('Error:', err)

    // 2) Send generic message
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later'
    })
    
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error'

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if(process.env.NODE_ENV === 'production') {
        let error = {...err};
        error.message = err.message

        if (err.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicatedFieldsDB(err);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(err);    
        if(err.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
        if(err.name === 'TokenExpiredError') error = handleTokenExpiredError();
        sendErrorProd(error, req, res);
    }
}
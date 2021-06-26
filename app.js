const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routers/tourRouters');
const userRouter = require('./routers/userRouters');
const reviewRouter = require('./routers/reviewRouter');
const viewsRouter = require('./routers/viewsRouters');
const bookingRouter = require('./routers/bookingRouter')
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');


// Starting express app
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());

app.use(express.json({limit: '10kb'}));
app.use(cookieParser());

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against xss
app.use(xss());

app.use(morgan('tiny'));



const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,  // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again i a hour!'
});

// Apply to all requests
app.use('/api', limiter);

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}



app.use((req, res, next) =>{
    req.requestTime = new Date().toISOString();
    next();
});

// Routers
app.use('/', viewsRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!!!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
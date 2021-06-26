const { promisify } = require('util')
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError')
const Email = require('../utils/email')
const crypto = require('crypto');


const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN})
}

const sendNewToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOption = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    if(process.env.NODE_ENV == 'production') cookieOption.secure = true;

    res.cookie('jwt', token, cookieOption)

    // Remove password
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })    
        
}

exports.signup = catchAsync( async (req, res, next) => {
    const newUser = await User.create(req.body);
    const url = `${req.protocol}://${req.get('host')}/me`
    await new Email(newUser, url).sendWelcome();
    sendNewToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;
    
    // 1) check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and Password', 400))
    }
    // 2) check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    
    if(!user || !await user.correctPassword(password, user.password)){
        return next(new AppError('Incorrect email or password', 401))
    }
    // 3) if everything is ok. send token to client 
    sendNewToken(user, 200, res)
    
})

exports.logout = (req, res) => {
    const cookieOption = {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    };
    res.cookie('jwt', 'loggedout', cookieOption)
    res.status(200).json({
        status: 'success'
    })
}

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    // 1) Getting Token and check 
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }else if(req.cookies.jwt){
        token = req.cookies.jwt
    }
    
    if (!token) {
        return next(new AppError('You are not logged in! please login to get access', 401))
    }

    // 2) Verification token
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    // 3) Check if user still exists
    const user = await User.findById(decode.id);

    if (!user){
        return next(new AppError('The user belonged to this token does no longer exist', 401))
    }

    // 4) Check if user changed password
    if ( user.changePasswordAfter(decode.iat)) {
        return next(new AppError('User recently changed password! please log in again', 401))
    }

    req.user = user;
    res.locals.user = user;

    next();
});

exports.isLoggedIn = async (req, res, next) => {
    if(req.cookies.jwt){
        try {
            // 1) verify token
            const decode = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            // 2) Check if user still exists
            const user = await User.findById(decode.id);

            if (!user){
                return next();
            }

            // 3) Check if user changed password
            if ( user.changePasswordAfter(decode.iat)) {
                return next();
            }

            // There is logged in user
            res.locals.user = user
            return next();    
        } catch (error) {
            return next();
        }
        
    }
    next();
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        //roles ['admin', 'lead-guy']
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403))
        }

        next()
    }
}

exports.forgotPassword = async (req, res, next) => {
    // 1) Get user email
    const user = await User.findOne({email: req.body.email});

    if (!user) {
        return next(new AppError('There is no user with email address', 404))
    }

    // 2) Generate random reset token
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email

    try {
        const reseTURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`

        await new Email(user, reseTURL).sendPasswordResetToken();
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false })
        
        return next(new AppError('Error sending email. Try again later', 400))
    }
    

    res.status(200).json({
        status: 'success',
        message: 'Token send to email'
    })

}

exports.resetPassword = catchAsync( async (req, res, next) => {
    // 1) Get user token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()} });
    
    // 2) if token has not expired
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400))
    }

    // 3) Update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save()
    // 4) send new JWT
    sendNewToken(user, 200, res)
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const {passwordCurrent, password, passwordConfirm} = req.body
    // 1) Find user collection in DB
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
        return next(new AppError('No user found with this token', 404))
    }

    // 2) Check current password and passwordConfirm matches
    if (!await user.correctPassword(passwordCurrent, user.password)) {
        return next(new AppError('The currenct password is incorrect', 401))
    }

    if (password !== passwordConfirm) {
        return next(new AppError('The passwords does not match', 401))
    }

    // 3) Update password
    user.password = password;
    user.passwordConfirm = passwordConfirm
    await user.save();
    // 4) Send new JWT
    sendNewToken(user, 200, res)
});

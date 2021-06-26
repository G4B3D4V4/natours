const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs')
const crypto = require('crypto');
// name, email, photo, password, passwordConfirm

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name']
    },

    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate:[validator.isEmail, 'Please provide a valid email']
    },

    photo: {
        type: String,
        default: 'default.jpg'
    },

    role:{
        type: String,
        enum: ['user', 'guid', 'lead-guid', 'admin'],
        default: 'user'
    },
    
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },

    passwordConfirm: {
        type: String,
        required:[true, 'Confirm your password'],
        validate: {
            //This only works on CREATE and SAVE!!!
            validator: function(el){
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },

    passwordChangeAt: Date,

    passwordResetToken: String,

    passwordResetExpires: Date,

    active:{
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangeAt) {
        const changeTimestamp = parseInt(this.passwordChangeAt.getTime() / 1000);
        return JWTTimestamp < changeTimestamp;
    }
    // false means NOT changed
    return false;
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew) return next()
    
    this.passwordChangeAt = Date.now() - 1000;
    next();
});

userSchema.pre('save', async function(next){
    if (!this.isModified('password')) return next();
           
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre(/^find/, function(next){
    this.find({active: {$ne: false}});
    next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;
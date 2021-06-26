const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator')
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [30, 'A tour name must have less or equal then 30 characters '],
        minlength: [10, 'A tour name must have more or equal then 10 characters '],
      //  validate: [validator.isAlpha, 'Tour name must be only character']
    },
    slug: String,
    duration:{
        type: Number,
        required:[true, 'A Tour must have a duration']
    },
    maxGroupSize:{
        type: Number,
        required:[true, 'A Tour must have a group size']
    },
    difficulty:{
        type: String,
        required:[true, 'A Tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        } 
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1 , 'Rating must be above 1.0'],
        max: [5 , 'Rating must be below 5.0'],
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity:{
        type:Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val){
                return val < this.price // 600 < 500 false validate fails
            },
            message: 'Discount price ({VALUE}) should below regular price'
        }
    },
    summary:{
        type: String,
        trim: true,
    },
    description:{
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    imageCover:{
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images:[String],
    createdAt:{
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates:[(Date)],
    secretTour: {
        type:Boolean,
        default: false
    },
    startLocation: {
        //GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations:[
        {
            type: {
            type: String,
            default: 'Point',
            enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });


tourSchema.virtual('durationsWeeks').get(function() {
    return this.duration / 7
});

// Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
})

tourSchema.pre('save', function(next){
    this.slug = slugify(this.name, {lower: true});
    next();
})

/* tourSchema.pre('save', function(){
     this.durationsWeeks = Math.floor(this.durationsWeeks)
}) */
tourSchema.pre('find', function(next){
    this.find({secretTour: {$ne: true}})
    next();
});

tourSchema.pre(/^find/, function(next){
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangeAt'
    })
    next();
})

// Agregation Middleware
/* tourSchema.pre('aggregate', function(next) {
    this.pipeline().unshift({ $match: {secretTour: {$ne: true} } } );
    next();
}) */
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
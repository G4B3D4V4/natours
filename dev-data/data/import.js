const fs = require('fs')
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({path: './config.env'})

let DB = process.env.DB_LINK.replace('<password>', process.env.DB_PASSWORD);
DB = DB.replace('<username>', process.env.DB_USERNAME);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}).then(con => console.log('DB connections successful'))

//Read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8'));

//Import Data to DB
const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, {validateBeforeSave: false});
        await Review.create(reviews);
        console.log('Data succesfuly loaded!');
        process.exit();
    } catch (error) {
        console.log(error);
    }
}

//Delete all Data from collection
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data succesfuly Deleted!');
        process.exit()
    } catch (error) {
        console.log(error);
    }
}

if (process.argv[2] === '--import') {
    importData();
} else if(process.argv[2] === '--delete'){
    deleteData();
}

console.log(process.argv)
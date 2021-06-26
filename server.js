const mongoose = require('mongoose')
const dotenv = require('dotenv');
const app = require('./app');
const path = require('path')

process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    process.exit(1);
})

dotenv.config({path: path.resolve('config.env')})

let DB = process.env.DB_LINK.replace('<password>', process.env.DB_PASSWORD);
DB = DB.replace('<username>', process.env.DB_USERNAME);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}).then(con => console.log('DB connections successful'))


const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`App runing on port ${port}...`);
});

process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    })
});

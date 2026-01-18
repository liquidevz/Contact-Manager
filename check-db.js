const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/database');
const User = require('./models/User');
const Contact = require('./models/Contact');

async function checkDB() {
    try {
        await connectDB();
        const userCount = await User.countDocuments();
        const contactCount = await Contact.countDocuments();
        console.log(`Users: ${userCount}`);
        console.log(`Contacts: ${contactCount}`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkDB();

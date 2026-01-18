require('dotenv').config();
const mongoose = require('mongoose');
const Tag = require('../models/Tag');
const Category = require('../models/Category');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tags-api';

// Logger
const log = {
    info: (msg, ...args) => console.log(`[INFO]: ${msg}`, ...args),
    error: (msg, ...args) => console.error(`[ERROR]: ${msg}`, ...args)
};

async function cleanTags() {
    try {
        // Connect to MongoDB
        log.info(`Connecting to MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
        await mongoose.connect(MONGODB_URI);
        log.info('Connected to MongoDB successfully');

        // Get counts before deletion
        const tagCount = await Tag.countDocuments({});
        const categoryCount = await Category.countDocuments({});

        log.info(`Found ${tagCount.toLocaleString()} tags and ${categoryCount} categories`);

        // Delete all tags
        log.info('Deleting all tags...');
        const tagResult = await Tag.deleteMany({});
        log.info(`✅ Deleted ${tagResult.deletedCount.toLocaleString()} tags`);

        // Delete all categories
        log.info('Deleting all categories...');
        const categoryResult = await Category.deleteMany({});
        log.info(`✅ Deleted ${categoryResult.deletedCount} categories`);

        log.info('✅ Database cleaned successfully!');
        log.info('💾 Space has been freed up');

        await mongoose.connection.close();
        log.info('Database connection closed');
        process.exit(0);
    } catch (error) {
        log.error('Cleaning failed:', error);
        process.exit(1);
    }
}

// Run cleaning
cleanTags();

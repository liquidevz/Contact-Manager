// Script to completely drop and recreate the User collection indexes
require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndexes() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Drop the problematic geospatial index specifically
        try {
            await usersCollection.dropIndex('location.coordinates_2dsphere');
            console.log('✅ Dropped geospatial index');
        } catch (err) {
            console.log('ℹ️  Geospatial index may not exist:', err.message);
        }

        // Drop all indexes except _id
        try {
            await usersCollection.dropIndexes();
            console.log('✅ Dropped all indexes');
        } catch (err) {
            console.log('ℹ️  Error dropping indexes:', err.message);
        }

        // Now require the User model to recreate indexes
        const User = require('./models/User');
        await User.init();
        console.log('✅ Recreated indexes with updated configuration');

        // List current indexes
        const indexes = await usersCollection.indexes();
        console.log('\n📋 Current indexes:');
        indexes.forEach(idx => {
            console.log(`   - ${idx.name}:`, JSON.stringify(idx.key), idx.sparse ? '(sparse)' : '');
        });

        console.log('\n🎉 Index fix complete! Restart your server and try signup again.');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

fixIndexes();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Contact = require('./models/Contact');
const List = require('./models/List');
const connectDB = require('./config/database');

// Sample Users Data (1 of each type)
const usersData = [
    {
        fullName: 'John Salaried',
        email: 'john.salaried@example.com',
        password: 'password123',
        mobileNo: '+1234567890',
        professionType: 'salaried',
        salariedInfo: {
            companyName: 'Tech Corp',
            designation: 'Developer',
            role: 'Backend',
            bio: 'Coding all day.'
        },
        location: { coordinates: { type: 'Point', coordinates: [-122.4194, 37.7749] }, regionalArray: ['San Francisco', 'CA', 'USA'] }
    },
    {
        fullName: 'Jane Business',
        email: 'jane.business@example.com',
        password: 'password123',
        mobileNo: '+1234567891',
        professionType: 'business',
        businessInfo: {
            businessName: 'Jane\'s Shop',
            businessBio: 'Selling cool stuff.',
            businessInterest: ['Retail', 'E-commerce']
        },
        location: { coordinates: { type: 'Point', coordinates: [-74.0060, 40.7128] }, regionalArray: ['New York', 'NY', 'USA'] }
    },
    {
        fullName: 'Bob Freelancer',
        email: 'bob.freelancer@example.com',
        password: 'password123',
        mobileNo: '+1234567892',
        professionType: 'freelancer',
        businessInfo: {
            businessName: 'Bob Designs',
            businessBio: 'Freelance designer.',
            businessInterest: ['Design', 'Art']
        },
        location: { coordinates: { type: 'Point', coordinates: [-118.2437, 34.0522] }, regionalArray: ['Los Angeles', 'CA', 'USA'] }
    },
    {
        fullName: 'Alice Student',
        email: 'alice.student@example.com',
        password: 'password123',
        mobileNo: '+1234567893',
        professionType: 'student',
        studentInfo: {
            collegeName: 'State University',
            degreeName: 'Computer Science',
            year: 2,
            bio: 'Learning to code.'
        },
        location: { coordinates: { type: 'Point', coordinates: [-87.6298, 41.8781] }, regionalArray: ['Chicago', 'IL', 'USA'] }
    }
];

// Helper to generate random contacts
const generateContacts = (ownerId, count) => {
    const contacts = [];
    const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

    for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

        contacts.push({
            owner: ownerId,
            name: `${firstName} ${lastName}`,
            mobileNumber: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
            company: 'Some Company',
            designation: 'Employee',
            location: {
                type: 'Point',
                coordinates: [
                    -180 + Math.random() * 360,
                    -90 + Math.random() * 180
                ]
            }
        });
    }
    return contacts;
};

async function seedFull() {
    try {
        console.log('🌱 Starting full database seeding (preserving existing data)...\n');
        await connectDB();

        // Hash passwords
        const salt = await bcrypt.genSalt(10);
        for (let user of usersData) {
            user.password = await bcrypt.hash(user.password, salt);
        }

        // Create or Get Users
        console.log('👤 Processing users...');
        const processedUsers = [];

        for (const userData of usersData) {
            let user = await User.findOne({ email: userData.email });
            if (user) {
                console.log(`   - User ${userData.email} already exists. Skipping creation.`);
            } else {
                user = await User.create(userData);
                console.log(`   - Created user ${userData.email}`);
            }
            processedUsers.push(user);
        }
        console.log(`✅ Processed ${processedUsers.length} users\n`);

        // Create Contacts for each user
        console.log('📇 Creating contacts...');
        let totalContacts = 0;

        for (const user of processedUsers) {
            const contactsData = generateContacts(user._id, 10);

            // We use create() to ensure pre/post save hooks run
            const contacts = await Contact.create(contactsData);
            totalContacts += contacts.length;
            console.log(`   - Added ${contacts.length} contacts for ${user.fullName}`);
        }
        console.log(`✅ Total new contacts created: ${totalContacts}\n`);

        console.log('✨ Seeding completed successfully!');

        // Summary
        console.log('\n📊 Summary:');
        console.log('-------------------');
        console.log(`Users Processed: ${processedUsers.length}`);
        console.log(`New Contacts:    ${totalContacts}`);
        console.log('-------------------');
        console.log('Login Credentials (password: password123):');
        processedUsers.forEach(u => console.log(`- ${u.email} (${u.professionType})`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedFull();

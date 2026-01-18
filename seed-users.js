const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const connectDB = require('./config/database');

/**
 * User Seeding Script
 * Populates the database with sample users across different profession types
 */

const sampleUsers = [
    // Salaried Professionals
    {
        fullName: 'John Smith',
        email: 'john.smith@example.com',
        password: 'password123',
        mobileNo: '+1234567890',
        professionType: 'salaried',
        salariedInfo: {
            companyName: 'Tech Corp Inc.',
            companyLogo: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=TechCorp',
            designation: 'Senior Software Engineer',
            role: 'Full Stack Developer',
            bio: 'Passionate about building scalable web applications with modern technologies.'
        },
        customTags: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        searchingFor: ['Networking', 'Collaboration'],
        whatYouCanOffer: ['Mentorship', 'Technical Consulting'],
        whatYouWant: ['Business Partnerships', 'Investment Opportunities'],
        karmaScore: 150,
        location: {
            coordinates: {
                type: 'Point',
                coordinates: [-122.4194, 37.7749] // San Francisco
            },
            regionalArray: ['San Francisco', 'California', 'USA']
        }
    },
    {
        fullName: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        password: 'password123',
        mobileNo: '+1234567891',
        professionType: 'salaried',
        salariedInfo: {
            companyName: 'Design Studio Pro',
            companyLogo: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=DesignPro',
            designation: 'Lead UX Designer',
            role: 'Product Design',
            bio: 'Creating beautiful and intuitive user experiences for digital products.'
        },
        customTags: ['UX Design', 'UI Design', 'Figma', 'User Research'],
        searchingFor: ['Design Collaboration', 'Freelance Projects'],
        whatYouCanOffer: ['Design Consultation', 'Portfolio Reviews'],
        whatYouWant: ['Creative Projects', 'Design Partnerships'],
        karmaScore: 200,
        location: {
            coordinates: {
                type: 'Point',
                coordinates: [-73.935242, 40.730610] // New York
            },
            regionalArray: ['New York', 'New York', 'USA']
        }
    },

    // Business Owners
    {
        fullName: 'Michael Chen',
        email: 'michael.chen@example.com',
        password: 'password123',
        mobileNo: '+1234567892',
        professionType: 'business',
        businessInfo: {
            businessName: 'Chen Digital Marketing',
            businessLogo: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=CDM',
            businessBio: 'Full-service digital marketing agency specializing in SEO, content marketing, and social media management.',
            businessInterest: ['Digital Marketing', 'SEO', 'Content Strategy', 'Social Media']
        },
        customTags: ['Marketing', 'SEO', 'Content Creation', 'Analytics'],
        searchingFor: ['Business Partnerships', 'Client Acquisition'],
        whatYouCanOffer: ['Marketing Services', 'SEO Consulting'],
        whatYouWant: ['Strategic Partnerships', 'Referrals'],
        karmaScore: 300,
        portfolio: 'https://chendigitalmarketing.example.com',
        location: {
            coordinates: {
                type: 'Point',
                coordinates: [-118.2437, 34.0522] // Los Angeles
            },
            regionalArray: ['Los Angeles', 'California', 'USA']
        }
    },
    {
        fullName: 'Emily Rodriguez',
        email: 'emily.rodriguez@example.com',
        password: 'password123',
        mobileNo: '+1234567893',
        professionType: 'business',
        businessInfo: {
            businessName: 'Rodriguez Consulting Group',
            businessLogo: 'https://via.placeholder.com/150/95E1D3/FFFFFF?text=RCG',
            businessBio: 'Strategic business consulting for startups and SMEs. Helping businesses scale and optimize operations.',
            businessInterest: ['Business Strategy', 'Operations', 'Scaling', 'Leadership']
        },
        customTags: ['Business Consulting', 'Strategy', 'Operations', 'Leadership'],
        searchingFor: ['Client Acquisition', 'Speaking Opportunities'],
        whatYouCanOffer: ['Business Consulting', 'Strategy Sessions'],
        whatYouWant: ['Networking', 'Collaboration'],
        karmaScore: 250,
        portfolio: 'https://rodriguezconsuling.example.com',
        location: {
            coordinates: {
                type: 'Point',
                coordinates: [-87.6298, 41.8781] // Chicago
            },
            regionalArray: ['Chicago', 'Illinois', 'USA']
        }
    },

    // Freelancers
    {
        fullName: 'David Kumar',
        email: 'david.kumar@example.com',
        password: 'password123',
        mobileNo: '+1234567894',
        professionType: 'freelancer',
        businessInfo: {
            businessName: 'Kumar Creative Studios',
            businessLogo: 'https://via.placeholder.com/150/F38181/FFFFFF?text=KCS',
            businessBio: 'Freelance graphic designer and illustrator. Creating stunning visuals for brands worldwide.',
            businessInterest: ['Graphic Design', 'Illustration', 'Branding', 'Animation']
        },
        customTags: ['Graphic Design', 'Illustration', 'Adobe Creative Suite', 'Branding'],
        searchingFor: ['Freelance Projects', 'Long-term Clients'],
        whatYouCanOffer: ['Design Services', 'Illustration Work'],
        whatYouWant: ['Project Opportunities', 'Collaborations'],
        karmaScore: 180,
        portfolio: 'https://kumarcreative.example.com',
        location: {
            coordinates: {
                type: 'Point',
                coordinates: [-95.3698, 29.7604] // Houston
            },
            regionalArray: ['Houston', 'Texas', 'USA']
        }
    },
    {
        fullName: 'Lisa Anderson',
        email: 'lisa.anderson@example.com',
        password: 'password123',
        mobileNo: '+1234567895',
        professionType: 'freelancer',
        businessInfo: {
            businessName: 'Anderson Content Writing',
            businessLogo: 'https://via.placeholder.com/150/AA96DA/FFFFFF?text=ACW',
            businessBio: 'Professional content writer specializing in tech, SaaS, and B2B content marketing.',
            businessInterest: ['Content Writing', 'Copywriting', 'SEO Writing', 'Technical Writing']
        },
        customTags: ['Content Writing', 'Copywriting', 'SEO', 'Technical Writing'],
        searchingFor: ['Writing Projects', 'Content Partnerships'],
        whatYouCanOffer: ['Content Writing', 'Copywriting Services'],
        whatYouWant: ['Steady Clients', 'Long-term Contracts'],
        karmaScore: 220,
        portfolio: 'https://andersoncontent.example.com',
        location: {
            coordinates: {
                type: 'Point',
                coordinates: [-122.3321, 47.6062] // Seattle
            },
            regionalArray: ['Seattle', 'Washington', 'USA']
        }
    },

    // Students
    {
        fullName: 'Alex Thompson',
        email: 'alex.thompson@example.com',
        password: 'password123',
        mobileNo: '+1234567896',
        professionType: 'student',
        studentInfo: {
            collegeName: 'Massachusetts Institute of Technology',
            collegeLogo: 'https://via.placeholder.com/150/FF6B9D/FFFFFF?text=MIT',
            degreeName: 'Computer Science',
            year: 3,
            bio: 'CS student passionate about AI/ML and building innovative solutions. Looking for internship opportunities.'
        },
        customTags: ['Machine Learning', 'Python', 'AI', 'Data Science'],
        searchingFor: ['Internships', 'Mentorship', 'Projects'],
        whatYouCanOffer: ['Programming Skills', 'Fresh Perspectives'],
        whatYouWant: ['Internship Opportunities', 'Industry Connections'],
        karmaScore: 100,
        location: {
            coordinates: {
                type: 'Point',
                coordinates: [-71.0589, 42.3601] // Boston
            },
            regionalArray: ['Boston', 'Massachusetts', 'USA']
        }
    },
    {
        fullName: 'Priya Patel',
        email: 'priya.patel@example.com',
        password: 'password123',
        mobileNo: '+1234567897',
        professionType: 'student',
        studentInfo: {
            collegeName: 'Stanford University',
            collegeLogo: 'https://via.placeholder.com/150/C7CEEA/FFFFFF?text=Stanford',
            degreeName: 'Business Administration',
            year: 2,
            bio: 'MBA student interested in entrepreneurship and startup ecosystem. Aspiring founder.'
        },
        customTags: ['Entrepreneurship', 'Business Strategy', 'Startups', 'Innovation'],
        searchingFor: ['Co-founders', 'Startup Ideas', 'Mentorship'],
        whatYouCanOffer: ['Business Analysis', 'Market Research'],
        whatYouWant: ['Startup Opportunities', 'Networking'],
        karmaScore: 120,
        location: {
            coordinates: {
                type: 'Point',
                coordinates: [-122.1697, 37.4275] // Palo Alto
            },
            regionalArray: ['Palo Alto', 'California', 'USA']
        }
    },

    // Additional diverse users
    {
        fullName: 'James Wilson',
        email: 'james.wilson@example.com',
        password: 'password123',
        mobileNo: '+1234567898',
        professionType: 'salaried',
        salariedInfo: {
            companyName: 'FinTech Solutions',
            companyLogo: 'https://via.placeholder.com/150/FFB6B9/FFFFFF?text=FinTech',
            designation: 'Data Scientist',
            role: 'Analytics & ML',
            bio: 'Building predictive models and data-driven solutions for financial services.'
        },
        customTags: ['Data Science', 'Machine Learning', 'Python', 'SQL'],
        searchingFor: ['Data Projects', 'Research Collaboration'],
        whatYouCanOffer: ['Data Analysis', 'ML Consulting'],
        whatYouWant: ['Research Opportunities', 'Side Projects'],
        karmaScore: 175,
        location: {
            coordinates: {
                type: 'Point',
                coordinates: [-0.1276, 51.5074] // London
            },
            regionalArray: ['London', 'England', 'UK']
        }
    },
    {
        fullName: 'Maria Garcia',
        email: 'maria.garcia@example.com',
        password: 'password123',
        mobileNo: '+1234567899',
        professionType: 'business',
        businessInfo: {
            businessName: 'Garcia Wellness Studio',
            businessLogo: 'https://via.placeholder.com/150/FFEAA7/000000?text=GWS',
            businessBio: 'Holistic wellness center offering yoga, meditation, and nutrition coaching.',
            businessInterest: ['Wellness', 'Yoga', 'Nutrition', 'Mindfulness']
        },
        customTags: ['Wellness', 'Yoga', 'Nutrition', 'Health Coaching'],
        searchingFor: ['Client Acquisition', 'Wellness Partnerships'],
        whatYouCanOffer: ['Wellness Coaching', 'Yoga Classes'],
        whatYouWant: ['Business Growth', 'Collaborations'],
        karmaScore: 190,
        portfolio: 'https://garciawellness.example.com',
        location: {
            coordinates: {
                type: 'Point',
                coordinates: [-80.1918, 25.7617] // Miami
            },
            regionalArray: ['Miami', 'Florida', 'USA']
        }
    }
];

/**
 * Hash passwords for all users
 */
async function hashPasswords(users) {
    const salt = await bcrypt.genSalt(10);

    for (let user of users) {
        user.password = await bcrypt.hash(user.password, salt);
    }

    return users;
}

/**
 * Seed the database
 */
async function seedUsers() {
    try {
        console.log('🌱 Starting user seeding process...\n');

        // Connect to database
        await connectDB();

        // Clear existing users (optional - comment out if you want to keep existing data)
        console.log('🗑️  Clearing existing users...');
        await User.deleteMany({});
        console.log('✅ Existing users cleared\n');

        // Hash passwords
        console.log('🔐 Hashing passwords...');
        const usersWithHashedPasswords = await hashPasswords(sampleUsers);
        console.log('✅ Passwords hashed\n');

        // Insert users
        console.log('📝 Inserting users...');
        const insertedUsers = await User.insertMany(usersWithHashedPasswords);
        console.log(`✅ Successfully inserted ${insertedUsers.length} users\n`);

        // Display summary
        console.log('📊 Seeding Summary:');
        console.log('─'.repeat(50));

        const professionCounts = insertedUsers.reduce((acc, user) => {
            acc[user.professionType] = (acc[user.professionType] || 0) + 1;
            return acc;
        }, {});

        Object.entries(professionCounts).forEach(([profession, count]) => {
            console.log(`   ${profession.padEnd(15)} : ${count} users`);
        });

        console.log('─'.repeat(50));
        console.log(`   Total           : ${insertedUsers.length} users\n`);

        // Display sample login credentials
        console.log('🔑 Sample Login Credentials:');
        console.log('─'.repeat(50));
        insertedUsers.slice(0, 3).forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.fullName}`);
            console.log(`      Email: ${user.email}`);
            console.log(`      Password: password123`);
            console.log(`      Type: ${user.professionType}\n`);
        });
        console.log('   (All users have password: password123)\n');

        console.log('✨ Seeding completed successfully!\n');

        // Close connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
}

// Run the seeding script
seedUsers();

/**
 * Complete Example - Contact Manager System
 * Demonstrates full workflow with Users, Contacts, and Lists
 */

const User = require('../models/User');
const Contact = require('../models/Contact');
const List = require('../models/List');

/**
 * Example 1: Create users with different profession types
 */
async function createUsers() {
  console.log(`\n📝 Creating Users with Different Professions\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  try {
    // Salaried User
    const salariedUser = new User({
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      password: 'hashedPassword123',
      mobileNo: '+1234567890',
      professionType: 'salaried',
      salariedInfo: {
        companyName: 'Tech Corp',
        companyLogo: 'https://example.com/techcorp-logo.png',
        designation: 'Senior Software Engineer',
        role: 'Full Stack Developer'
      },
      searchingFor: ['networking', 'career opportunities'],
      whatYouWant: ['mentorship', 'collaboration'],
      location: {
        coordinates: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749] // San Francisco
        },
        regionalArray: ['San Francisco', 'California', 'USA']
      }
    });
    
    await salariedUser.save();
    console.log(`✅ Salaried User Created: ${salariedUser.fullName}`);
    console.log(`   Company: ${salariedUser.salariedInfo.companyName}`);
    console.log(`   Role: ${salariedUser.salariedInfo.designation}\n`);
    
    // Business User
    const businessUser = new User({
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: 'hashedPassword456',
      mobileNo: '+1987654321',
      professionType: 'business',
      businessInfo: {
        businessName: 'Smith Consulting',
        businessLogo: 'https://example.com/smith-logo.png',
        businessBio: 'Strategic business consulting for startups',
        businessInterest: ['startups', 'strategy', 'growth']
      },
      searchingFor: ['clients', 'partnerships'],
      whatYouCanOffer: ['consulting', 'mentorship', 'funding advice']
    });
    
    await businessUser.save();
    console.log(`✅ Business User Created: ${businessUser.fullName}`);
    console.log(`   Business: ${businessUser.businessInfo.businessName}`);
    console.log(`   Bio: ${businessUser.businessInfo.businessBio}\n`);
    
    // Student User
    const studentUser = new User({
      fullName: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      password: 'hashedPassword789',
      mobileNo: '+1122334455',
      professionType: 'student',
      studentInfo: {
        collegeName: 'MIT',
        collegeLogo: 'https://example.com/mit-logo.png',
        degreeName: 'Computer Science',
        year: 3
      },
      searchingFor: ['internships', 'projects'],
      lookingFor: ['mentors', 'study groups']
    });
    
    await studentUser.save();
    console.log(`✅ Student User Created: ${studentUser.fullName}`);
    console.log(`   College: ${studentUser.studentInfo.collegeName}`);
    console.log(`   Degree: ${studentUser.studentInfo.degreeName}, Year ${studentUser.studentInfo.year}\n`);
    
    // Freelancer User
    const freelancerUser = new User({
      fullName: 'Mike Wilson',
      email: 'mike.wilson@example.com',
      password: 'hashedPassword321',
      mobileNo: '+1555666777',
      professionType: 'freelancer',
      businessInfo: {
        businessName: 'Wilson Design Studio',
        businessBio: 'Freelance UI/UX designer specializing in mobile apps',
        businessInterest: ['design', 'mobile', 'startups']
      },
      portfolio: 'https://mikewilson.design',
      searchingFor: ['projects', 'collaborations'],
      whatYouCanOffer: ['UI design', 'UX research', 'prototyping']
    });
    
    await freelancerUser.save();
    console.log(`✅ Freelancer User Created: ${freelancerUser.fullName}`);
    console.log(`   Business: ${freelancerUser.businessInfo.businessName}`);
    console.log(`   Portfolio: ${freelancerUser.portfolio}\n`);
    
    return {
      salariedUser,
      businessUser,
      studentUser,
      freelancerUser
    };
    
  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    throw error;
  }
}

/**
 * Example 2: Create contacts with referral system
 */
async function createContactsWithReferrals(userId) {
  console.log(`\n📇 Creating Contacts with Referral System\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  try {
    // Contact 1 - Primary contact
    const contact1 = new Contact({
      owner: userId,
      name: 'Sarah Williams',
      mobileNumber: '+1234567891',
      email: 'sarah.williams@example.com',
      company: 'Design Co',
      designation: 'Creative Director',
      tags: ['design', 'creative', 'networking'],
      priority: 'high',
      isFavorite: true
    });
    
    await contact1.save();
    console.log(`✅ Contact Created: ${contact1.name}`);
    console.log(`   Company: ${contact1.company}`);
    console.log(`   Priority: ${contact1.priority}\n`);
    
    // Contact 2 - Referred by Contact 1
    const contact2 = new Contact({
      owner: userId,
      name: 'Robert Brown',
      mobileNumber: '+1234567892',
      email: 'robert.brown@example.com',
      company: 'Tech Startup',
      designation: 'CTO',
      tags: ['technology', 'startup'],
      priority: 'high'
    });
    
    await contact2.save();
    
    // Set up referral
    await contact1.addReferral(contact2._id);
    console.log(`✅ Contact Created: ${contact2.name}`);
    console.log(`   Referred by: ${contact1.name}\n`);
    
    // Contact 3 - Referred by Contact 2
    const contact3 = new Contact({
      owner: userId,
      name: 'Emily Davis',
      mobileNumber: '+1234567893',
      email: 'emily.davis@example.com',
      company: 'Marketing Agency',
      designation: 'Marketing Manager',
      tags: ['marketing', 'social-media'],
      priority: 'medium'
    });
    
    await contact3.save();
    await contact2.addReferral(contact3._id);
    console.log(`✅ Contact Created: ${contact3.name}`);
    console.log(`   Referred by: ${contact2.name}\n`);
    
    return {
      contact1,
      contact2,
      contact3
    };
    
  } catch (error) {
    console.error('❌ Error creating contacts:', error.message);
    throw error;
  }
}

/**
 * Example 3: Create lists with different types
 */
async function createLists(userId, contacts) {
  console.log(`\n📋 Creating Lists with Different Types\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  try {
    // Task List
    const taskList = new List({
      owner: userId,
      listType: 'task',
      name: 'Project Tasks',
      description: 'Tasks for the new mobile app project',
      color: '#10B981',
      icon: '✓',
      contacts: [contacts.contact1._id, contacts.contact2._id]
    });
    
    await taskList.save();
    console.log(`✅ Task List Created: ${taskList.name}`);
    console.log(`   Contacts: ${taskList.contacts.length}\n`);
    
    // Add task items
    await taskList.addItem({
      title: 'Design mockups for home screen',
      description: 'Create high-fidelity mockups',
      status: 'in-progress',
      priority: 'high',
      relatedContact: contacts.contact1._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      taskInfo: {
        subtasks: [
          { title: 'Research competitors', isCompleted: true },
          { title: 'Create wireframes', isCompleted: true },
          { title: 'Design UI', isCompleted: false }
        ],
        assignedTo: contacts.contact1._id
      }
    });
    
    console.log(`   ✓ Added task item with alarm\n`);
    
    // Meeting List
    const meetingList = new List({
      owner: userId,
      listType: 'meeting',
      name: 'Client Meetings',
      description: 'Schedule of upcoming client meetings',
      color: '#3B82F6',
      icon: '📅',
      contacts: [contacts.contact2._id]
    });
    
    await meetingList.save();
    console.log(`✅ Meeting List Created: ${meetingList.name}\n`);
    
    // Add meeting item
    const meetingDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
    await meetingList.addItem({
      title: 'Quarterly Review Meeting',
      description: 'Discuss Q4 performance and Q1 goals',
      status: 'pending',
      priority: 'urgent',
      relatedContact: contacts.contact2._id,
      startTime: meetingDate,
      endTime: new Date(meetingDate.getTime() + 60 * 60 * 1000), // 1 hour later
      meetingInfo: {
        location: 'Conference Room A',
        meetingLink: 'https://zoom.us/j/123456789',
        attendees: [contacts.contact2._id],
        agenda: '1. Review Q4 metrics\n2. Set Q1 goals\n3. Budget discussion'
      },
      alarms: [
        {
          triggerTime: new Date(meetingDate.getTime() - 30 * 60 * 1000), // 30 min before
          type: 'notification',
          message: 'Meeting starts in 30 minutes'
        }
      ]
    });
    
    console.log(`   ✓ Added meeting item with alarm\n`);
    
    // Transaction List
    const transactionList = new List({
      owner: userId,
      listType: 'transaction',
      name: 'Business Transactions',
      description: 'Track payments and invoices',
      color: '#F59E0B',
      icon: '💰',
      contacts: [contacts.contact3._id]
    });
    
    await transactionList.save();
    console.log(`✅ Transaction List Created: ${transactionList.name}\n`);
    
    // Add transaction item
    await transactionList.addItem({
      title: 'Payment for Marketing Services',
      description: 'Monthly retainer payment',
      status: 'pending',
      priority: 'high',
      relatedContact: contacts.contact3._id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      transactionInfo: {
        amount: 5007,
        currency: 'USD',
        transactionType: 'payment',
        paymentMethod: 'Bank Transfer',
        invoiceNumber: 'INV-2024-001'
      }
    });
    
    console.log(`   ✓ Added transaction item\n`);
    
    // Booking List
    const bookingList = new List({
      owner: userId,
      listType: 'booking',
      name: 'Appointments',
      description: 'Scheduled appointments and bookings',
      color: '#8B5CF6',
      icon: '📌',
      contacts: []
    });
    
    await bookingList.save();
    console.log(`✅ Booking List Created: ${bookingList.name}\n`);
    
    // Add booking item
    await bookingList.addItem({
      title: 'Dentist Appointment',
      description: 'Regular checkup',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      bookingInfo: {
        venue: 'City Dental Clinic',
        bookingReference: 'DENT-2024-456',
        confirmationStatus: 'confirmed',
        participants: []
      }
    });
    
    console.log(`   ✓ Added booking item\n`);
    
    return {
      taskList,
      meetingList,
      transactionList,
      bookingList
    };
    
  } catch (error) {
    console.error('❌ Error creating lists:', error.message);
    throw error;
  }
}

/**
 * Example 4: Demonstrate share code system
 */
async function demonstrateShareCodeSystem(user1, user2) {
  console.log(`\n🔐 Demonstrating Share Code System\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  try {
    // Generate share code for user1
    await user1.generateShareCode();
    await user1.save();
    
    console.log(`✅ Share code generated for ${user1.fullName}`);
    console.log(`   Code: ${user1.shareCode}\n`);
    
    // User2 accesses user1's data
    await user2.accessViaCode(user1.shareCode);
    
    console.log(`✅ ${user2.fullName} accessed ${user1.fullName}'s data`);
    console.log(`   Using code: ${user1.shareCode}\n`);
    
    // Reload users to see updated data
    await user1.populate('sharedWith.userId', 'fullName email');
    await user2.populate('accessingViaCode.ownerId', 'fullName email');
    
    console.log(`📊 ${user1.fullName}'s data is shared with:`);
    user1.sharedWith.forEach(share => {
      console.log(`   - ${share.userId.fullName} (${share.accessLevel} access)`);
    });
    
    console.log(`\n📊 ${user2.fullName} is accessing data from:`);
    user2.accessingViaCode.forEach(access => {
      console.log(`   - ${access.ownerId.fullName} (code: ${access.code})`);
    });
    
    console.log();
    
  } catch (error) {
    console.error('❌ Error in share code system:', error.message);
    throw error;
  }
}

/**
 * Example 5: Complete workflow demonstration
 */
async function runCompleteDemo() {
  console.log(`\n╔════════════════════════════════════════════════════════╗`);
  console.log(`║  Contact Manager - Complete System Demonstration      ║`);
  console.log(`╚════════════════════════════════════════════════════════╝`);
  
  try {
    // Step 1: Create users
    const users = await createUsers();
    
    // Step 2: Create contacts for salaried user
    const contacts = await createContactsWithReferrals(users.salariedUser._id);
    
    // Step 3: Create lists
    const lists = await createLists(users.salariedUser._id, contacts);
    
    // Step 4: Demonstrate share code system
    await demonstrateShareCodeSystem(users.salariedUser, users.businessUser);
    
    // Step 5: Display summary
    console.log(`\n📊 System Summary\n`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`✅ Users Created: 4`);
    console.log(`   - Salaried: 1`);
    console.log(`   - Business: 1`);
    console.log(`   - Student: 1`);
    console.log(`   - Freelancer: 1\n`);
    console.log(`✅ Contacts Created: 3`);
    console.log(`   - With referral chain\n`);
    console.log(`✅ Lists Created: 4`);
    console.log(`   - Task List: 1`);
    console.log(`   - Meeting List: 1`);
    console.log(`   - Transaction List: 1`);
    console.log(`   - Booking List: 1\n`);
    console.log(`✅ Share Codes: Active`);
    console.log(`   - Data sharing enabled between users\n`);
    
    console.log(`\n✅ Complete demonstration finished successfully!\n`);
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error.message, '\n');
    throw error;
  }
}

// Export functions
module.exports = {
  createUsers,
  createContactsWithReferrals,
  createLists,
  demonstrateShareCodeSystem,
  runCompleteDemo
};

// If running directly
if (require.main === module) {
  const connectDB = require('../config/database');
  
  // Connect to database and run demo
  connectDB()
    .then(() => runCompleteDemo())
    .then(() => {
      console.log('Exiting...');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

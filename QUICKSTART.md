# Quick Start Guide

Get up and running with the Contact Manager in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- MongoDB 5+ running locally or remotely
- Basic knowledge of JavaScript and MongoDB

## Installation

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `express` - Web framework (optional)
- Other utilities

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your MongoDB connection:

```env
MONGODB_URI=mongodb://localhost:27017/contact-manager
PORT=3000
JWT_SECRET=your-secret-key-here
```

### Step 3: Start MongoDB

Make sure MongoDB is running:

```bash
# If using local MongoDB
mongod

# Or if using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Basic Usage

### Connect to Database

```javascript
const { connectDB } = require('./index');

await connectDB();
```

### Create Your First User

```javascript
const { User } = require('./index');
const bcrypt = require('bcryptjs');

// Create a salaried user
const user = new User({
  fullName: 'John Doe',
  email: 'john@example.com',
  password: await bcrypt.hash('password123', 10),
  professionType: 'salaried',
  mobileNo: '+1234567890',
  salariedInfo: {
    companyName: 'Tech Corp',
    designation: 'Software Engineer'
  }
});

await user.save();
console.log('User created:', user.fullName);
```

### Generate a Share Code

```javascript
// Generate share code for the user
await user.generateShareCode();
await user.save();

console.log('Share code:', user.shareCode); // e.g., "BAFEK"
```

### Create a Contact

```javascript
const { Contact } = require('./index');

const contact = new Contact({
  owner: user._id,
  name: 'Jane Smith',
  mobileNumber: '+1987654321',
  email: 'jane@example.com',
  company: 'Design Studio',
  tags: ['client', 'design']
});

await contact.save();
console.log('Contact created:', contact.name);
```

### Create a Task List

```javascript
const { List } = require('./index');

const taskList = new List({
  owner: user._id,
  listType: 'task',
  name: 'My Tasks',
  color: '#10B981'
});

await taskList.save();

// Add a task
await taskList.addItem({
  title: 'Complete project proposal',
  priority: 'high',
  status: 'pending',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
});

console.log('Task list created with', taskList.items.length, 'items');
```

## Running Examples

### Complete System Demo

```bash
npm run demo
```

This demonstrates:
- Creating users with different profession types
- Creating contacts with referral chains
- Creating lists of all types
- Using the share code system

### Share Code Demo

```bash
npm run share-demo
```

This shows:
- Generating memorable codes
- Validating codes
- Batch generation
- System statistics

## Common Patterns

### Pattern 1: User Registration Flow

```javascript
const { User, userValidator } = require('./index');
const bcrypt = require('bcryptjs');

async function registerUser(userData) {
  // Validate input
  const validation = userValidator.validateUser(userData);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  
  // Hash password
  userData.password = await bcrypt.hash(userData.password, 10);
  
  // Create user
  const user = new User(userData);
  await user.save();
  
  // Generate share code
  await user.generateShareCode();
  await user.save();
  
  return user;
}
```

### Pattern 2: Share Data Between Users

```javascript
async function shareData(ownerUserId, recipientUserId) {
  const owner = await User.findById(ownerUserId);
  
  // Generate and share code
  const shareCode = await owner.shareWith(recipientUserId, 'view');
  
  return shareCode;
}

async function accessSharedData(currentUserId, shareCode) {
  const currentUser = await User.findById(currentUserId);
  
  // Access owner's data
  const owner = await currentUser.accessViaCode(shareCode);
  
  return owner;
}
```

### Pattern 3: Create Contact with Referral

```javascript
async function addReferredContact(userId, referrerContactId, newContactData) {
  // Create new contact
  const newContact = new Contact({
    owner: userId,
    ...newContactData
  });
  await newContact.save();
  
  // Set up referral
  const referrer = await Contact.findById(referrerContactId);
  await referrer.addReferral(newContact._id);
  
  return newContact;
}
```

### Pattern 4: Create List with Alarms

```javascript
async function createMeetingWithReminders(userId, meetingData) {
  // Create meeting list if not exists
  let list = await List.findOne({ owner: userId, listType: 'meeting' });
  
  if (!list) {
    list = new List({
      owner: userId,
      listType: 'meeting',
      name: 'Meetings'
    });
    await list.save();
  }
  
  // Add meeting with alarms
  const meetingTime = new Date(meetingData.startTime);
  
  await list.addItem({
    title: meetingData.title,
    startTime: meetingTime,
    endTime: meetingData.endTime,
    meetingInfo: meetingData.meetingInfo,
    alarms: [
      {
        triggerTime: new Date(meetingTime.getTime() - 30 * 60 * 1000), // 30 min
        type: 'notification',
        message: `Meeting "${meetingData.title}" starts in 30 minutes`
      },
      {
        triggerTime: new Date(meetingTime.getTime() - 24 * 60 * 60 * 1000), // 1 day
        type: 'email',
        message: `Reminder: Meeting "${meetingData.title}" tomorrow`
      }
    ]
  });
  
  return list;
}
```

## Testing Your Setup

Create a test file `test.js`:

```javascript
const { connectDB, User, Contact, List } = require('./index');
const bcrypt = require('bcryptjs');

async function test() {
  try {
    // Connect
    await connectDB();
    console.log('✅ Connected to database');
    
    // Create user
    const user = new User({
      fullName: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: await bcrypt.hash('test123', 10),
      professionType: 'salaried'
    });
    await user.save();
    console.log('✅ User created:', user.fullName);
    
    // Generate share code
    await user.generateShareCode();
    await user.save();
    console.log('✅ Share code:', user.shareCode);
    
    // Create contact
    const contact = new Contact({
      owner: user._id,
      name: 'Test Contact',
      mobileNumber: '+1234567890'
    });
    await contact.save();
    console.log('✅ Contact created:', contact.name);
    
    // Create list
    const list = new List({
      owner: user._id,
      listType: 'task',
      name: 'Test List'
    });
    await list.save();
    console.log('✅ List created:', list.name);
    
    console.log('\n✅ All tests passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
```

Run it:

```bash
node test.js
```

## Next Steps

1. **Read the full documentation**: See `README.md` for complete features
2. **Explore the schema**: Check `SCHEMA.md` for detailed schema information
3. **Run examples**: Try `npm run demo` and `npm run share-demo`
4. **Build your API**: Integrate with Express.js or your preferred framework
5. **Add authentication**: Implement JWT-based authentication
6. **Deploy**: Deploy to your preferred hosting platform

## Common Issues

### Issue: Cannot connect to MongoDB

**Solution**: Make sure MongoDB is running and the connection string in `.env` is correct.

```bash
# Check if MongoDB is running
ps aux | grep mongod

# Or try connecting with mongo shell
mongosh
```

### Issue: Validation errors when creating users

**Solution**: Make sure all required fields are provided:
- `fullName`
- `email`
- `password`
- `professionType`

### Issue: Share code already exists

**Solution**: The `generateShareCode()` method automatically generates unique codes. If you get this error, try again or check for duplicate code issues.

### Issue: Cannot find module

**Solution**: Make sure you've run `npm install`:

```bash
npm install
```

## Getting Help

- Check the `examples/` folder for working code
- Read `README.md` for detailed documentation
- Review `SCHEMA.md` for schema details
- Open an issue on GitHub

## Quick Reference

### User Profession Types
- `salaried` - Employee at a company
- `freelancer` - Self-employed professional
- `business` - Business owner
- `student` - Student at educational institution

### List Types
- `task` - To-do lists and tasks
- `meeting` - Meetings and appointments
- `transaction` - Financial transactions
- `booking` - Bookings and reservations
- `custom` - Custom list type

### Item Status
- `pending` - Not started
- `in-progress` - Currently working on
- `completed` - Finished
- `cancelled` - Cancelled

### Priority Levels
- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority
- `urgent` - Urgent priority

### Access Levels
- `view` - Read-only access
- `edit` - Read and write access

## Sample Data

Want to populate your database with sample data? Run:

```bash
npm run demo
```

This creates:
- 4 users (one of each profession type)
- 3 contacts with referral chains
- 4 lists (one of each type)
- Multiple list items with alarms
- Share code relationships

Happy coding! 🚀

# Contact Manager - Node.js + MongoDB

A comprehensive contact management system with dynamic user types, intelligent list management, and a unique 5-digit share code system for data sharing.

## Features

### User Management
- **Dynamic Profession Types**: Support for Salaried, Freelancer, Business, and Student users
- **Optional Fields**: All profession-specific fields are optional and configurable
- **Profile Flexibility**: Different profile structures based on profession type
- **Geolocation Support**: Store and query user locations with coordinates

### Contact Management
- **Comprehensive Contact Data**: Store detailed contact information
- **Referral System**: Track who referred whom with referral chains
- **Contact Lists**: Organize contacts into multiple lists
- **Interaction Tracking**: Monitor last contact date and interaction count
- **Priority & Favorites**: Mark important contacts

### List Management
- **Multiple List Types**:
  - **Task Lists**: Track tasks with subtasks and assignments
  - **Meeting Lists**: Schedule meetings with attendees and agenda
  - **Transaction Lists**: Monitor payments, invoices, and expenses
  - **Booking Lists**: Manage appointments and reservations
  - **Custom Lists**: Create your own list types

- **Alarm System**: Set reminders for list items with multiple notification types
- **Flexible Items**: Each list item can have type-specific fields
- **Status Tracking**: Monitor item status (pending, in-progress, completed, cancelled)
- **Priority Management**: Set priority levels (low, medium, high, urgent)

### Share Code System
- **5-Digit Memorable Codes**: Generate easy-to-remember codes using CVCVC pattern
  - Examples: `BAFEK`, `TIGOL`, `MUPAN`, `ROXIB`, `SAFED`
- **Data Sharing**: Share your data with other users via codes
- **Access Control**: Set view or edit permissions
- **Bidirectional Tracking**: Track who you're sharing with and who's accessing your data

## Database Schema

### User Schema

The User schema adapts based on the `professionType` field:

#### Common Fields (All Users)
- Full Name, Email, Password, Mobile Number
- Profile Picture
- Location (coordinates + regional array)
- Custom Tags
- Searching For / Looking For / What You Want / What You Can Offer
- Karma Score
- Portfolio
- Share Code

#### Profession-Specific Fields

**Salaried**
```javascript
salariedInfo: {
  companyName: String,
  companyLogo: String,
  designation: String,
  role: String
}
```

**Business / Freelancer**
```javascript
businessInfo: {
  businessName: String,
  businessLogo: String,
  businessBio: String,
  businessInterest: [String]
}
```

**Student**
```javascript
studentInfo: {
  collegeName: String,
  collegeLogo: String,
  degreeName: String,
  year: Number
}
```

### Contact Schema

Represents contacts in a user's contact list:

```javascript
{
  owner: ObjectId,           // User who owns this contact
  name: String,
  mobileNumber: String,
  email: String,
  profilePhoto: String,
  linkedUser: ObjectId,      // If contact is also a user
  lists: [ObjectId],         // Lists this contact belongs to
  referredToBy: ObjectId,    // Who referred this contact
  referrals: [ObjectId],     // Contacts this person referred
  company: String,
  designation: String,
  tags: [String],
  priority: String,
  isFavorite: Boolean,
  lastContacted: Date,
  interactionCount: Number
}
```

### List Schema

Flexible list structure supporting multiple types:

```javascript
{
  owner: ObjectId,
  listType: String,          // task, meeting, transaction, booking, custom
  name: String,
  description: String,
  color: String,
  icon: String,
  contacts: [ObjectId],
  items: [{
    title: String,
    description: String,
    status: String,          // pending, in-progress, completed, cancelled
    priority: String,        // low, medium, high, urgent
    relatedContact: ObjectId,
    dueDate: Date,
    alarms: [{
      triggerTime: Date,
      type: String,          // notification, email, sms
      message: String,
      isTriggered: Boolean
    }],
    // Type-specific fields
    taskInfo: { ... },
    meetingInfo: { ... },
    transactionInfo: { ... },
    bookingInfo: { ... }
  }],
  settings: {
    isShared: Boolean,
    sharedWith: [{ userId, permission }],
    defaultAlarmTime: Number
  }
}
```

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- MongoDB 5.0 or higher
- npm or yarn

### Setup

1. **Clone or download the project**
   ```bash
   cd contact-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

5. **Run the application**
   ```bash
   npm start
   ```

## Usage Examples

### Creating Users

```javascript
const User = require('./models/User');

// Create a salaried user
const user = new User({
  fullName: 'John Doe',
  email: 'john@example.com',
  password: 'hashedPassword',
  professionType: 'salaried',
  salariedInfo: {
    companyName: 'Tech Corp',
    designation: 'Senior Engineer'
  }
});

await user.save();
```

### Share Code System

```javascript
// Generate share code
await user.generateShareCode();
console.log(user.shareCode); // e.g., "BAFEK"

// Share with another user
await user.shareWith(otherUserId, 'view');

// Access another user's data
const owner = await currentUser.accessViaCode('BAFEK');
```

### Creating Contacts

```javascript
const Contact = require('./models/Contact');

const contact = new Contact({
  owner: userId,
  name: 'Jane Smith',
  mobileNumber: '+1234567890',
  email: 'jane@example.com',
  company: 'Design Co',
  tags: ['design', 'client']
});

await contact.save();

// Set up referral
await referrerContact.addReferral(contact._id);
```

### Creating Lists

```javascript
const List = require('./models/List');

// Create a task list
const taskList = new List({
  owner: userId,
  listType: 'task',
  name: 'Project Tasks',
  color: '#10B981'
});

await taskList.save();

// Add a task with alarm
await taskList.addItem({
  title: 'Complete design mockups',
  priority: 'high',
  dueDate: new Date('2024-12-31'),
  taskInfo: {
    subtasks: [
      { title: 'Research', isCompleted: true },
      { title: 'Design', isCompleted: false }
    ]
  }
});
```

## Share Code System Details

### Code Generation

The share code system uses a **CVCVC pattern** (Consonant-Vowel-Consonant-Vowel-Consonant) to generate memorable 5-character codes:

- **21 consonants**: B, C, D, F, G, H, J, K, L, M, N, P, Q, R, S, T, V, W, X, Y, Z
- **5 vowels**: A, E, I, O, U
- **Total possible codes**: 21³ × 5² = 231,525 unique codes

### Example Codes
- `BAFEK` - Easy to pronounce and remember
- `TIGOL` - Sounds like a word
- `MUPAN` - Simple and memorable
- `ROXIB` - Clear pronunciation
- `SAFED` - Phonetically friendly

### Code Validation

```javascript
const { isValidCode } = require('./utils/shareCodeGenerator');

isValidCode('BAFEK'); // true
isValidCode('12345'); // false
isValidCode('AEIOU'); // false (all vowels)
```

### Statistics

```javascript
const { getStatistics } = require('./utils/shareCodeGenerator');

const stats = getStatistics();
// {
//   totalPossibleCodes: 231525,
//   consonantCount: 21,
//   vowelCount: 5,
//   pattern: 'CVCVC',
//   codeLength: 5
// }
```

## API Integration

While this package provides the data models and utilities, you can easily integrate it with Express.js for a REST API:

```javascript
const express = require('express');
const connectDB = require('./config/database');
const User = require('./models/User');

const app = express();
app.use(express.json());

// Connect to database
connectDB();

// Example route
app.post('/api/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Running Examples

### Complete System Demo

```bash
npm run demo
```

This will:
1. Create users with different profession types
2. Create contacts with referral chains
3. Create lists of different types
4. Demonstrate the share code system
5. Display a complete system summary

### Share Code Demo

```bash
npm run share-demo
```

This demonstrates:
- Code generation
- Code validation
- Batch code generation
- Custom prefix codes
- System statistics

## Project Structure

```
contact-manager/
├── models/
│   ├── User.js           # User model with dynamic profession types
│   ├── Contact.js        # Contact model with referral system
│   └── List.js           # List model with multiple types
├── utils/
│   ├── shareCodeGenerator.js  # Share code generation utilities
│   └── userValidator.js       # Validation utilities
├── config/
│   └── database.js       # MongoDB connection configuration
├── examples/
│   ├── completeExample.js     # Complete system demonstration
│   └── shareCodeExample.js    # Share code system examples
├── package.json
├── .env.example
└── README.md
```

## Data Flow

### User Registration Flow

1. User selects profession type (Salaried/Freelancer/Business/Student)
2. Common fields are collected (name, email, password)
3. Profession-specific fields are shown based on selection
4. User completes optional fields as needed
5. Account is created with appropriate schema structure

### Contact Addition Flow

1. User adds contact with basic information
2. Contact can be linked to an existing user
3. Contact can be added to multiple lists
4. Referral information can be set
5. Interaction tracking begins

### List Management Flow

1. User creates a list with specific type
2. Contacts are added to the list
3. Items are added with type-specific fields
4. Alarms are set for important items
5. Status and priority are tracked

### Share Code Flow

1. User generates a unique 5-digit code
2. Code is shared with another user
3. Recipient enters the code
4. Access is granted with specified permissions
5. Both users can track the sharing relationship

## Best Practices

### Security
- Always hash passwords before storing (use bcrypt)
- Validate and sanitize all user inputs
- Implement rate limiting for API endpoints
- Use JWT for authentication
- Validate share codes before granting access

### Performance
- Index frequently queried fields
- Use pagination for large lists
- Implement caching for share code lookups
- Optimize geospatial queries with proper indexes

### Data Integrity
- Validate profession-specific fields
- Ensure referral chains are consistent
- Clean up orphaned references
- Implement soft deletes for important data

## Extending the System

### Adding New Profession Types

1. Add the new type to the `professionType` enum in User.js
2. Create a new info object (e.g., `contractorInfo`)
3. Update validation logic in userValidator.js
4. Update examples and documentation

### Adding New List Types

1. Add the new type to the `listType` enum in List.js
2. Create type-specific fields in the items subdocument
3. Update validation logic
4. Create example usage

### Customizing Share Codes

Modify `shareCodeGenerator.js` to:
- Change the pattern (e.g., VCVCV instead of CVCVC)
- Add custom prefixes for categories
- Increase code length for more combinations
- Implement expiration dates

## Testing

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

MIT License - feel free to use this in your projects!

## Support

For questions or issues:
- Open an issue on GitHub
- Check the examples folder for usage patterns
- Review the inline code documentation

## Roadmap

- [ ] Add REST API endpoints
- [ ] Implement real-time notifications
- [ ] Add email/SMS integration for alarms
- [ ] Create admin dashboard
- [ ] Add data export functionality
- [ ] Implement advanced search and filtering
- [ ] Add analytics and reporting
- [ ] Create mobile app integration

## Changelog

### Version 1.0.0
- Initial release
- User management with dynamic profession types
- Contact management with referral system
- List management with multiple types
- Share code system with memorable codes
- Comprehensive examples and documentation
#   C o n t a c t - M a n a g e r  
 
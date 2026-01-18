# Database Schema Documentation

## Overview

The Contact Manager uses three main collections in MongoDB:
1. **Users** - User accounts with dynamic profession types
2. **Contacts** - Contact information with referral tracking
3. **Lists** - Flexible lists with type-specific items

## Schema Relationships

```
User (1) ──────┬─────> (N) Contacts
               │           │
               │           │ referredToBy
               │           └─────> (1) Contact
               │
               └─────> (N) Lists
                           │
                           └─────> (N) Contacts (many-to-many)
```

## User Schema Details

### Base Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| fullName | String | Yes | User's full name |
| email | String | Yes | Unique email address |
| password | String | Yes | Hashed password |
| mobileNo | String | No | Mobile phone number |
| profilePicture | String | No | URL to profile image |
| professionType | String | Yes | One of: salaried, freelancer, business, student |

### Location Structure

```javascript
location: {
  coordinates: {
    type: 'Point',
    coordinates: [longitude, latitude]  // GeoJSON format
  },
  regionalArray: ['City', 'State', 'Country']
}
```

### Profession-Specific Fields

#### Salaried User
```javascript
salariedInfo: {
  companyName: String,      // e.g., "Tech Corp"
  companyLogo: String,      // URL to logo
  designation: String,      // e.g., "Senior Engineer"
  role: String             // e.g., "Full Stack Developer"
}
```

#### Business / Freelancer User
```javascript
businessInfo: {
  businessName: String,     // e.g., "Smith Consulting"
  businessLogo: String,     // URL to logo
  businessBio: String,      // Business description
  businessInterest: [String] // e.g., ["startups", "strategy"]
}
```

#### Student User
```javascript
studentInfo: {
  collegeName: String,      // e.g., "MIT"
  collegeLogo: String,      // URL to logo
  degreeName: String,       // e.g., "Computer Science"
  year: Number             // e.g., 3
}
```

### Share Code System

```javascript
shareCode: String,          // 5-character code (e.g., "BAFEK")
sharedWith: [{
  userId: ObjectId,         // User who has access
  sharedAt: Date,
  accessLevel: String       // "view" or "edit"
}],
accessingViaCode: [{
  code: String,             // Code used to access
  ownerId: ObjectId,        // Owner of the data
  accessedAt: Date
}]
```

### Karma & Success Tracking

```javascript
karmaScore: Number,         // Reputation score
successfullyConnected: [{
  userId: ObjectId,
  connectedAt: Date
}]
```

## Contact Schema Details

### Basic Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| owner | ObjectId | Yes | Reference to User |
| name | String | Yes | Contact's name |
| mobileNumber | String | No | Phone number |
| email | String | No | Email address |
| profilePhoto | String | No | URL to photo |
| linkedUser | ObjectId | No | Reference to User if contact is also a user |

### Referral System

```javascript
referredToBy: ObjectId,     // Contact who referred this person
referrals: [ObjectId]       // Contacts this person referred
```

**Example Referral Chain:**
```
Contact A
  └─> referred Contact B
        └─> referred Contact C
              └─> referred Contact D
```

### Lists & Organization

```javascript
lists: [ObjectId],          // Lists this contact belongs to
tags: [String],            // Custom tags
priority: String,          // "low", "medium", "high"
isFavorite: Boolean        // Star/favorite flag

// Default lists - automatically created for each contact
defaultLists: {
  tasks: ObjectId,         // Reference to default tasks list
  meetings: ObjectId,      // Reference to default meetings list
  transactions: ObjectId   // Reference to default transactions list
}
```

**Default Lists:**
Each contact automatically gets 3 default lists upon creation:
- **Tasks List**: For tracking tasks related to this contact
- **Meetings List**: For scheduling meetings with this contact
- **Transactions List**: For tracking financial transactions with this contact

These lists are:
- Automatically created when a contact is created
- Owned by the same user who owns the contact
- Marked with `isDefault: true` flag
- Associated with the contact via `contactOwner` field

### Interaction Tracking

```javascript
lastContacted: Date,        // Last interaction date
interactionCount: Number    // Total interactions
```

## List Schema Details

### Basic Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| owner | ObjectId | Yes | Reference to User |
| listType | String | Yes | task, meeting, transaction, booking, custom |
| name | String | Yes | List name |
| description | String | No | List description |
| color | String | No | Hex color code |
| icon | String | No | Icon or emoji |
| contacts | [ObjectId] | No | Contacts in this list |
| isDefault | Boolean | No | Whether this is a default contact list |
| contactOwner | ObjectId | No | Contact this list belongs to (for default lists) |

### List Types

#### 1. Task List
```javascript
items: [{
  title: "Complete design mockups",
  status: "in-progress",
  priority: "high",
  dueDate: Date,
  taskInfo: {
    subtasks: [{
      title: "Research competitors",
      isCompleted: true
    }],
    assignedTo: ObjectId
  }
}]
```

#### 2. Meeting List
```javascript
items: [{
  title: "Quarterly Review",
  startTime: Date,
  endTime: Date,
  meetingInfo: {
    location: "Conference Room A",
    meetingLink: "https://zoom.us/...",
    attendees: [ObjectId],
    agenda: "1. Review Q4...",
    meetingNotes: "..."
  }
}]
```

#### 3. Transaction List
```javascript
items: [{
  title: "Payment for Services",
  dueDate: Date,
  transactionInfo: {
    amount: 5007,
    currency: "USD",
    transactionType: "payment",  // payment, receipt, invoice, expense
    paymentMethod: "Bank Transfer",
    invoiceNumber: "INV-2024-001",
    receiptUrl: "https://..."
  }
}]
```

#### 4. Booking List
```javascript
items: [{
  title: "Dentist Appointment",
  dueDate: Date,
  bookingInfo: {
    venue: "City Dental Clinic",
    bookingReference: "DENT-2024-456",
    confirmationStatus: "confirmed",  // pending, confirmed, cancelled
    participants: [ObjectId]
  }
}]
```

### Alarm System

Each list item can have multiple alarms:

```javascript
alarms: [{
  triggerTime: Date,        // When to trigger
  type: String,            // "notification", "email", "sms"
  message: String,         // Alarm message
  isTriggered: Boolean,    // Has it been triggered?
  triggeredAt: Date        // When was it triggered?
}]
```

**Example:**
```javascript
{
  title: "Important Meeting",
  dueDate: "2024-12-31T10:00:00Z",
  alarms: [
    {
      triggerTime: "2024-12-31T09:30:00Z",  // 30 min before
      type: "notification",
      message: "Meeting starts in 30 minutes"
    },
    {
      triggerTime: "2024-12-30T10:00:00Z",  // 1 day before
      type: "email",
      message: "Reminder: Meeting tomorrow"
    }
  ]
}
```

### List Settings

```javascript
settings: {
  isShared: Boolean,
  sharedWith: [{
    userId: ObjectId,
    permission: String      // "view" or "edit"
  }],
  defaultAlarmTime: Number, // Minutes before due date
  sortBy: String,          // "dueDate", "priority", "createdAt", "status"
  sortOrder: String        // "asc" or "desc"
}
```

## Indexes

### User Collection
```javascript
// Geospatial index for location queries
{ 'location.coordinates': '2dsphere' }

// Share code lookup
{ shareCode: 1 }

// Email lookup
{ email: 1 }
```

### Contact Collection
```javascript
// Owner and name lookup
{ owner: 1, name: 1 }

// Owner and mobile lookup
{ owner: 1, mobileNumber: 1 }

// Linked user lookup
{ linkedUser: 1 }

// Geospatial index
{ 'location.coordinates': '2dsphere' }
```

### List Collection
```javascript
// Owner and type lookup
{ owner: 1, listType: 1 }

// Owner and name lookup
{ owner: 1, name: 1 }

// Item due date lookup
{ 'items.dueDate': 1 }

// Alarm trigger lookup
{ 'items.alarms.triggerTime': 1, 'items.alarms.isTriggered': 1 }
```

## Data Flow Examples

### Example 1: User Registration

```javascript
// 1. User selects "Salaried" profession type
const user = new User({
  fullName: "John Doe",
  email: "john@example.com",
  password: hashedPassword,
  professionType: "salaried"
});

// 2. User fills in profession-specific fields
user.salariedInfo = {
  companyName: "Tech Corp",
  designation: "Senior Engineer"
};

// 3. User adds optional fields
user.searchingFor = ["networking", "opportunities"];
user.location = {
  coordinates: { type: 'Point', coordinates: [-122.4194, 37.7749] },
  regionalArray: ["San Francisco", "CA", "USA"]
};

await user.save();
```

### Example 2: Contact Referral Chain

```javascript
// Contact A adds Contact B
const contactB = new Contact({
  owner: userId,
  name: "Bob Smith",
  mobileNumber: "+1234567890"
});
await contactB.save();

// Contact B refers Contact C
const contactC = new Contact({
  owner: userId,
  name: "Carol Jones",
  mobileNumber: "+1987654321"
});
await contactC.save();
await contactB.addReferral(contactC._id);

// Now: contactC.referredToBy === contactB._id
//      contactB.referrals includes contactC._id
```

### Example 3: List with Alarms

```javascript
// Create meeting list
const list = new List({
  owner: userId,
  listType: "meeting",
  name: "Client Meetings"
});
await list.save();

// Add meeting with multiple alarms
const meetingDate = new Date('2024-12-31T14:00:00Z');
await list.addItem({
  title: "Year-end Review",
  startTime: meetingDate,
  endTime: new Date(meetingDate.getTime() + 3600000), // +1 hour
  meetingInfo: {
    location: "Conference Room",
    attendees: [contactId]
  },
  alarms: [
    {
      triggerTime: new Date(meetingDate.getTime() - 1800000), // -30 min
      type: "notification",
      message: "Meeting in 30 minutes"
    },
    {
      triggerTime: new Date(meetingDate.getTime() - 86400000), // -1 day
      type: "email",
      message: "Meeting tomorrow"
    }
  ]
});
```

### Example 4: Share Code Workflow

```javascript
// User A generates share code
await userA.generateShareCode();
console.log(userA.shareCode); // "BAFEK"

// User B accesses User A's data
const ownerData = await userB.accessViaCode("BAFEK");

// Result:
// - userA.sharedWith includes { userId: userB._id, accessLevel: "view" }
// - userB.accessingViaCode includes { code: "BAFEK", ownerId: userA._id }
```

## Field Validation Rules

### User
- `email`: Must be valid email format, unique
- `password`: Minimum 6 characters (should be hashed)
- `professionType`: Must be one of: salaried, freelancer, business, student
- `shareCode`: Must match CVCVC pattern, unique
- `karmaScore`: Number, default 0

### Contact
- `name`: Required, non-empty string
- `owner`: Required, valid User ObjectId
- `email`: Must be valid email format if provided
- `priority`: Must be one of: low, medium, high

### List
- `name`: Required, non-empty string
- `owner`: Required, valid User ObjectId
- `listType`: Must be one of: task, meeting, transaction, booking, custom
- `items.status`: Must be one of: pending, in-progress, completed, cancelled
- `items.priority`: Must be one of: low, medium, high, urgent

## Best Practices

### 1. Always Hash Passwords
```javascript
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 10);
```

### 2. Validate Before Saving
```javascript
const { validateUser } = require('./utils/userValidator');
const validation = validateUser(userData);
if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}
```

### 3. Use Transactions for Related Operations
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  await user.save({ session });
  await contact.save({ session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 4. Populate References Carefully
```javascript
// Good: Only populate needed fields
const user = await User.findById(id)
  .populate('sharedWith.userId', 'fullName email');

// Avoid: Populating everything
const user = await User.findById(id).populate('sharedWith.userId');
```

### 5. Index Frequently Queried Fields
```javascript
// Already indexed in schemas, but verify in production:
db.users.getIndexes()
db.contacts.getIndexes()
db.lists.getIndexes()
```

## Migration Notes

If you're migrating from an existing system:

1. **User Migration**: Map existing user types to profession types
2. **Contact Migration**: Preserve referral relationships
3. **List Migration**: Convert existing lists to appropriate types
4. **Share Codes**: Generate codes for existing users who need sharing

## Performance Considerations

- **Geospatial Queries**: Use `$near` or `$geoWithin` with proper indexes
- **Large Lists**: Consider pagination for lists with 100+ items
- **Referral Chains**: Implement recursive queries carefully to avoid deep nesting
- **Alarm Processing**: Use background jobs to check and trigger alarms
- **Share Code Lookups**: Cached in memory for frequently accessed codes

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Contact schema - represents contacts in a user's contact list
const ContactSchema = new Schema({
  // Owner of this contact
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Basic Contact Info
  name: {
    type: String,
    required: true,
    trim: true
  },

  mobileNumber: {
    type: String,
    trim: true
  },

  profilePhoto: {
    type: String, // URL or path
  },

  // Reference to User if this contact is also a user in the system
  linkedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  // Lists this contact belongs to
  lists: [{
    type: Schema.Types.ObjectId,
    ref: 'List'
  }],

  // Default lists for this contact (Tasks, Meetings, Transactions)
  defaultLists: {
    tasks: {
      type: Schema.Types.ObjectId,
      ref: 'List'
    },
    meetings: {
      type: Schema.Types.ObjectId,
      ref: 'List'
    },
    transactions: {
      type: Schema.Types.ObjectId,
      ref: 'List'
    }
  },

  // Referral System
  referredToBy: {
    type: Schema.Types.ObjectId,
    ref: 'Contact', // Who referred this contact to the owner
  },

  referrals: [{
    type: Schema.Types.ObjectId,
    ref: 'Contact' // Contacts this person has referred
  }],

  // Additional contact details (optional)
  email: {
    type: String,
    lowercase: true,
    trim: true
  },

  company: {
    type: String,
    trim: true
  },

  designation: {
    type: String,
    trim: true
  },

  notes: {
    type: String,
    trim: true
  },

  tags: [{
    type: String,
    trim: true
  }],

  // Social profiles
  socialProfiles: {
    linkedin: String,
    twitter: String,
    instagram: String,
    facebook: String,
    website: String
  },

  // Address
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },

  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    }
  },

  // Interaction tracking
  lastContacted: {
    type: Date
  },

  interactionCount: {
    type: Number,
    default: 0
  },

  // Importance/Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  isFavorite: {
    type: Boolean,
    default: false
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
ContactSchema.index({ owner: 1, name: 1 });
ContactSchema.index({ owner: 1, mobileNumber: 1 });
ContactSchema.index({ linkedUser: 1 });
ContactSchema.index({ 'location.coordinates': '2dsphere' });

// Method to add referral
ContactSchema.methods.addReferral = async function (referredContactId) {
  if (!this.referrals.includes(referredContactId)) {
    this.referrals.push(referredContactId);
    await this.save();

    // Update the referred contact's referredToBy field
    const referredContact = await mongoose.model('Contact').findById(referredContactId);
    if (referredContact) {
      referredContact.referredToBy = this._id;
      await referredContact.save();
    }
  }
};

// Method to track interaction
ContactSchema.methods.recordInteraction = async function () {
  this.lastContacted = Date.now();
  this.interactionCount += 1;
  await this.save();
};

// Method to add to list
ContactSchema.methods.addToList = async function (listId) {
  if (!this.lists.includes(listId)) {
    this.lists.push(listId);
    await this.save();

    // Add contact to the list
    const List = mongoose.model('List');
    const list = await List.findById(listId);
    if (list && !list.contacts.includes(this._id)) {
      list.contacts.push(this._id);
      await list.save();
    }
  }
};

// Method to remove from list
ContactSchema.methods.removeFromList = async function (listId) {
  this.lists = this.lists.filter(id => id.toString() !== listId.toString());
  await this.save();

  // Remove contact from the list
  const List = mongoose.model('List');
  const list = await List.findById(listId);
  if (list) {
    list.contacts = list.contacts.filter(id => id.toString() !== this._id.toString());
    await list.save();
  }
};

// Method to get all default lists
ContactSchema.methods.getDefaultLists = async function () {
  const List = mongoose.model('List');
  return await List.find({
    contactOwner: this._id,
    isDefault: true
  }).sort({ listType: 1 });
};

// Method to add task to default tasks list
ContactSchema.methods.addTask = async function (taskData) {
  const List = mongoose.model('List');
  const tasksList = await List.findById(this.defaultLists.tasks);
  if (!tasksList) {
    throw new Error('Default tasks list not found');
  }
  return await tasksList.addItem({
    ...taskData,
    relatedContact: this._id
  });
};

// Method to add meeting to default meetings list
ContactSchema.methods.addMeeting = async function (meetingData) {
  const List = mongoose.model('List');
  const meetingsList = await List.findById(this.defaultLists.meetings);
  if (!meetingsList) {
    throw new Error('Default meetings list not found');
  }
  return await meetingsList.addItem({
    ...meetingData,
    relatedContact: this._id
  });
};

// Method to add transaction to default transactions list
ContactSchema.methods.addTransaction = async function (transactionData) {
  const List = mongoose.model('List');
  const transactionsList = await List.findById(this.defaultLists.transactions);
  if (!transactionsList) {
    throw new Error('Default transactions list not found');
  }
  return await transactionsList.addItem({
    ...transactionData,
    relatedContact: this._id
  });
};

// Virtual for referral chain depth
ContactSchema.virtual('referralChainDepth').get(function () {
  // This would need to be calculated recursively
  return 0; // Placeholder
});

// Pre-save middleware
ContactSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Post-save middleware - Create default lists for new contacts
ContactSchema.post('save', async function (doc, next) {
  // Only create default lists if this is a new contact and lists don't exist
  if (this.isNew || (!doc.defaultLists.tasks && !doc.defaultLists.meetings && !doc.defaultLists.transactions)) {
    try {
      const List = mongoose.model('List');

      // Create default Tasks list
      const tasksList = new List({
        owner: doc.owner,
        listType: 'task',
        name: `${doc.name} - Tasks`,
        description: `Default tasks list for ${doc.name}`,
        color: '#3B82F6',
        icon: '✓',
        isDefault: true,
        contactOwner: doc._id
      });
      await tasksList.save();

      // Create default Meetings list
      const meetingsList = new List({
        owner: doc.owner,
        listType: 'meeting',
        name: `${doc.name} - Meetings`,
        description: `Default meetings list for ${doc.name}`,
        color: '#10B981',
        icon: '📅',
        isDefault: true,
        contactOwner: doc._id
      });
      await meetingsList.save();

      // Create default Transactions list
      const transactionsList = new List({
        owner: doc.owner,
        listType: 'transaction',
        name: `${doc.name} - Transactions`,
        description: `Default transactions list for ${doc.name}`,
        color: '#F59E0B',
        icon: '💰',
        isDefault: true,
        contactOwner: doc._id
      });
      await transactionsList.save();

      // Update contact with default list references (without triggering hooks)
      await mongoose.model('Contact').updateOne(
        { _id: doc._id },
        {
          $set: {
            'defaultLists.tasks': tasksList._id,
            'defaultLists.meetings': meetingsList._id,
            'defaultLists.transactions': transactionsList._id
          }
        }
      );

      // Update the doc object in memory
      doc.defaultLists.tasks = tasksList._id;
      doc.defaultLists.meetings = meetingsList._id;
      doc.defaultLists.transactions = transactionsList._id;

    } catch (error) {
      console.error('Error creating default lists for contact:', error);
    }
  }
  next();
});

// Export model
module.exports = mongoose.model('Contact', ContactSchema);

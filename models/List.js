const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// List schema - represents different types of lists (Task, Meeting, Transaction, Booking)
const ListSchema = new Schema({
  // Owner of this list
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // List Type
  listType: {
    type: String,
    enum: ['task', 'meeting', 'transaction', 'booking', 'custom'],
    required: true,
    default: 'custom'
  },

  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },

  icon: {
    type: String // Icon name or emoji
  },

  // Contacts in this list
  contacts: [{
    type: Schema.Types.ObjectId,
    ref: 'Contact'
  }],

  // Default list flags - for contact-specific default lists
  isDefault: {
    type: Boolean,
    default: false
  },

  // Contact this list belongs to (for default lists)
  contactOwner: {
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    index: true
  },

  // List Items (flexible structure based on list type)
  items: [{
    // Common fields for all item types
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending'
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },

    // Related contact
    relatedContact: {
      type: Schema.Types.ObjectId,
      ref: 'Contact'
    },

    // Date/Time fields
    dueDate: Date,
    startTime: Date,
    endTime: Date,
    completedAt: Date,

    // Alarm/Reminder settings
    alarms: [{
      triggerTime: {
        type: Date,
        required: true
      },
      type: {
        type: String,
        enum: ['notification', 'email', 'sms'],
        default: 'notification'
      },
      message: String,
      isTriggered: {
        type: Boolean,
        default: false
      },
      triggeredAt: Date
    }],

    // Task-specific fields
    taskInfo: {
      subtasks: [{
        title: String,
        isCompleted: {
          type: Boolean,
          default: false
        }
      }],
      assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'Contact'
      }
    },

    // Meeting-specific fields
    meetingInfo: {
      location: String,
      meetingLink: String,
      attendees: [{
        type: Schema.Types.ObjectId,
        ref: 'Contact'
      }],
      agenda: String,
      meetingNotes: String
    },

    // Transaction-specific fields
    transactionInfo: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      },
      transactionType: {
        type: String,
        enum: ['payment', 'receipt', 'invoice', 'expense'],
      },
      paymentMethod: String,
      invoiceNumber: String,
      receiptUrl: String
    },

    // Booking/Appointment-specific fields
    bookingInfo: {
      venue: String,
      bookingReference: String,
      bookingUrl: String,
      confirmationStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
      },
      participants: [{
        type: Schema.Types.ObjectId,
        ref: 'Contact'
      }]
    },

    // Attachments
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileType: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],

    // Tags
    tags: [String],

    // Notes
    notes: String,

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // List Settings
  settings: {
    isShared: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      permission: {
        type: String,
        enum: ['view', 'edit'],
        default: 'view'
      }
    }],
    defaultAlarmTime: {
      type: Number, // Minutes before due date
      default: 30
    },
    sortBy: {
      type: String,
      enum: ['dueDate', 'priority', 'createdAt', 'status'],
      default: 'dueDate'
    },
    sortOrder: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'asc'
    }
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
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
ListSchema.index({ owner: 1, listType: 1 });
ListSchema.index({ owner: 1, name: 1 });
ListSchema.index({ 'items.dueDate': 1 });
ListSchema.index({ 'items.alarms.triggerTime': 1, 'items.alarms.isTriggered': 1 });
ListSchema.index({ contactOwner: 1, listType: 1, isDefault: 1 });

// Virtual for completed items count
ListSchema.virtual('completedItemsCount').get(function () {
  return this.items.filter(item => item.status === 'completed').length;
});

// Virtual for pending items count
ListSchema.virtual('pendingItemsCount').get(function () {
  return this.items.filter(item => item.status === 'pending' || item.status === 'in-progress').length;
});

// Virtual for overdue items
ListSchema.virtual('overdueItems').get(function () {
  const now = new Date();
  return this.items.filter(item =>
    item.dueDate &&
    item.dueDate < now &&
    item.status !== 'completed' &&
    item.status !== 'cancelled'
  );
});

// Method to add item
ListSchema.methods.addItem = async function (itemData) {
  // Set default alarm if configured
  if (this.settings.defaultAlarmTime && itemData.dueDate) {
    const alarmTime = new Date(itemData.dueDate);
    alarmTime.setMinutes(alarmTime.getMinutes() - this.settings.defaultAlarmTime);

    if (!itemData.alarms) {
      itemData.alarms = [];
    }

    itemData.alarms.push({
      triggerTime: alarmTime,
      type: 'notification',
      message: `Reminder: ${itemData.title}`
    });
  }

  this.items.push(itemData);
  await this.save();
  return this.items[this.items.length - 1];
};

// Method to update item
ListSchema.methods.updateItem = async function (itemId, updateData) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Item not found');
  }

  Object.assign(item, updateData);
  item.updatedAt = Date.now();

  if (updateData.status === 'completed' && !item.completedAt) {
    item.completedAt = Date.now();
  }

  await this.save();
  return item;
};

// Method to delete item
ListSchema.methods.deleteItem = async function (itemId) {
  this.items.pull(itemId);
  await this.save();
};

// Method to add alarm to item
ListSchema.methods.addAlarmToItem = async function (itemId, alarmData) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Item not found');
  }

  item.alarms.push(alarmData);
  await this.save();
  return item;
};

// Method to trigger alarm
ListSchema.methods.triggerAlarm = async function (itemId, alarmId) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Item not found');
  }

  const alarm = item.alarms.id(alarmId);
  if (!alarm) {
    throw new Error('Alarm not found');
  }

  alarm.isTriggered = true;
  alarm.triggeredAt = Date.now();
  await this.save();

  return alarm;
};

// Method to get pending alarms
ListSchema.methods.getPendingAlarms = function () {
  const now = new Date();
  const pendingAlarms = [];

  this.items.forEach(item => {
    item.alarms.forEach(alarm => {
      if (!alarm.isTriggered && alarm.triggerTime <= now) {
        pendingAlarms.push({
          itemId: item._id,
          alarmId: alarm._id,
          alarm: alarm,
          item: item
        });
      }
    });
  });

  return pendingAlarms;
};

// Method to share list
ListSchema.methods.shareWith = async function (userId, permission = 'view') {
  const alreadyShared = this.settings.sharedWith.some(
    share => share.userId.toString() === userId.toString()
  );

  if (!alreadyShared) {
    this.settings.sharedWith.push({ userId, permission });
    this.settings.isShared = true;
    await this.save();
  }
};

// Pre-save middleware
ListSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Export model
module.exports = mongoose.model('List', ListSchema);

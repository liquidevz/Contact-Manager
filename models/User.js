const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Base user schema with common fields
const UserSchema = new Schema({
  // Authentication & Basic Info
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  mobileNo: {
    type: String,
    trim: true
  },

  // Profile
  profilePicture: {
    type: String, // URL or path
  },

  // Profession Type - determines which fields are active
  professionType: {
    type: String,
    enum: ['salaried', 'freelancer', 'business', 'student'],
    required: true
  },

  // Location
  location: {
    coordinates: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number] // [longitude, latitude]
      }
    },
    regionalArray: [String]
  },

  // Universal Fields
  customTags: [{
    type: String,
    trim: true
  }],

  searchingFor: [{
    type: String,
    trim: true
  }],

  additionallySearchingFor: [{
    type: String,
    trim: true
  }],

  lookingFor: [{
    type: String,
    trim: true
  }],

  describeNeed: {
    type: String,
    trim: true
  },

  whatYouWant: [{
    type: String,
    trim: true
  }],

  whatYouCanOffer: [{
    type: String,
    trim: true
  }],

  // Karma & Success Metrics
  karmaScore: {
    type: Number,
    default: 0
  },

  successfullyConnected: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    connectedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Portfolio
  portfolio: {
    type: String, // URL or rich text
  },

  // ===== PROFESSION-SPECIFIC FIELDS =====

  // For Salaried
  salariedInfo: {
    companyName: String,
    companyLogo: String,
    designation: String,
    role: String,
    bio: String
  },

  // For Business / Self-Employed
  businessInfo: {
    businessName: String,
    businessLogo: String,
    businessBio: String,
    businessInterest: [String]
  },

  // For Student
  studentInfo: {
    collegeName: String,
    collegeLogo: String,
    degreeName: String,
    year: Number,
    bio: String
  },

  // Sharing System - 5-digit memorable code
  shareCode: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    uppercase: true,
    length: 5
  },

  // Users who have access to this user's data via share code
  sharedWith: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    accessLevel: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],

  // Codes this user has used to access other users' data
  accessingViaCode: [{
    code: String,
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    accessedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Digital Business Card
  businessCard: {
    cardId: {
      type: String,
      unique: true,
      sparse: true
    },
    generatedAt: Date,
    cardData: {
      displayName: String,
      profession: String,
      company: String,
      tagline: String,
      profileImage: String,
      contactInfo: {
        email: String,
        mobile: String,
        website: String
      }
    },
    theme: {
      primaryColor: {
        type: String,
        default: '#4A90E2' // Blue
      },
      secondaryColor: {
        type: String,
        default: '#E94B8A' // Pink
      },
      style: {
        type: String,
        enum: ['gradient', 'solid', 'minimal'],
        default: 'gradient'
      }
    },
    shareUrl: String,
    qrCodeData: String // Base64 QR code
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


// Index for geospatial queries (sparse to allow users without location)
UserSchema.index({ 'location.coordinates': '2dsphere' }, { sparse: true });

// Virtual for getting active profession info
UserSchema.virtual('professionInfo').get(function () {
  switch (this.professionType) {
    case 'salaried':
      return this.salariedInfo;
    case 'business':
    case 'freelancer':
      return this.businessInfo;
    case 'student':
      return this.studentInfo;
    default:
      return null;
  }
});

// Method to generate unique share code
UserSchema.methods.generateShareCode = async function () {
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
  const vowels = 'AEIOU';

  let code;
  let isUnique = false;

  while (!isUnique) {
    // Generate memorable 5-character code: CVCVC pattern
    code = '';
    code += consonants[Math.floor(Math.random() * consonants.length)];
    code += vowels[Math.floor(Math.random() * vowels.length)];
    code += consonants[Math.floor(Math.random() * consonants.length)];
    code += vowels[Math.floor(Math.random() * vowels.length)];
    code += consonants[Math.floor(Math.random() * consonants.length)];

    // Check if code already exists
    const existing = await mongoose.model('User').findOne({ shareCode: code });
    if (!existing) {
      isUnique = true;
    }
  }

  this.shareCode = code;
  return code;
};

// Method to share data with another user
UserSchema.methods.shareWith = async function (targetUserId, accessLevel = 'view') {
  if (!this.shareCode) {
    await this.generateShareCode();
    await this.save();
  }

  // Add to sharedWith array if not already present
  const alreadyShared = this.sharedWith.some(
    share => share.userId.toString() === targetUserId.toString()
  );

  if (!alreadyShared) {
    this.sharedWith.push({
      userId: targetUserId,
      accessLevel
    });
    await this.save();
  }

  return this.shareCode;
};

// Method to access another user's data via code
UserSchema.methods.accessViaCode = async function (code) {
  const owner = await mongoose.model('User').findOne({ shareCode: code.toUpperCase() });

  if (!owner) {
    throw new Error('Invalid share code');
  }

  // Check if already accessing
  const alreadyAccessing = this.accessingViaCode.some(
    access => access.code === code.toUpperCase()
  );

  if (!alreadyAccessing) {
    this.accessingViaCode.push({
      code: code.toUpperCase(),
      ownerId: owner._id
    });
    await this.save();
  }

  // Add this user to owner's sharedWith
  await owner.shareWith(this._id);

  return owner;
};

// Method to validate required fields based on profession type
UserSchema.methods.validateProfessionFields = function () {
  const errors = [];

  switch (this.professionType) {
    case 'salaried':
      // Optional validation - all fields are optional
      break;
    case 'business':
    case 'freelancer':
      // Optional validation
      break;
    case 'student':
      // Optional validation
      break;
  }

  return errors;
};

// Pre-save middleware
UserSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Export model
module.exports = mongoose.model('User', UserSchema);

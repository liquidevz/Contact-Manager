const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      trim: true,
      maxlength: [100, 'Tag name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'geography-timing',
        'people-roles',
        'skills-tools',
        'domain-category',
        'content-format',
        'intent-objectives',
        'constraints-compliance',
        'status-meta'
      ],
      index: true
    },
    subcategory: {
      type: String,
      required: [true, 'Subcategory is required'],
      trim: true,
      index: true
    },
    type: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    aliases: {
      type: [String],
      default: []
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    metadata: {
      type: Map,
      of: String,
      default: {}
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
tagSchema.index({ name: 'text', description: 'text' });
tagSchema.index({ category: 1, subcategory: 1 });
tagSchema.index({ category: 1, usageCount: -1 });
tagSchema.index({ isActive: 1, usageCount: -1 });
tagSchema.index({ createdAt: -1 });

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;

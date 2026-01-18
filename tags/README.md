# Tags Seeding - Standalone Package

This is a **standalone package** to seed your MongoDB database with **10 MILLION tags** for the Tags API.

## 📦 What's Included

- `seed-10m.js` - Main seeding script (10 million tags)
- `Tag.model.js` - Mongoose Tag model
- `Category.model.js` - Mongoose Category model
- `package.json` - Dependencies
- `.env.example` - Environment configuration template
- `README.md` - This file

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and set your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/tags-api
```

Or use MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tags-api
```

### 3. Run Seeding

```bash
npm run seed
```

## ⏱️ Expected Performance

- **Tags Generated**: 10,000,000
- **Time**: 30-60 minutes (depends on hardware)
- **Insertion Rate**: 3,000-5,000 tags/second
- **Memory Usage**: 2-4GB during seeding
- **Disk Space**: 5-10GB for database storage

## 📊 What Gets Seeded

### Categories (8 total)

1. **Geography & Timing** - Location, venue, timeframe, schedule, timezone, season
2. **People & Roles** - Audience, stakeholder, team, expertise, profession, language
3. **Skills & Tools** - Tech stack, languages, frameworks, databases, cloud platforms
4. **Domain & Category** - Industry, topic, solutions, products, services
5. **Content & Format** - Media types, file formats, styles, accessibility
6. **Intent & Objectives** - Actions, budget, timeline, resources
7. **Constraints & Compliance** - Regulatory, security, delivery, risk, ethics
8. **Status & Meta** - Status, visibility, version, review, metrics

### Tag Types

**1. Location Tags** (~3,600)
- Examples: "New York, USA", "London, UK", "Tokyo, Japan"

**2. Technology Stack Tags** (~50,000)
- Examples: "JavaScript + React + MongoDB", "Python + Django + PostgreSQL"

**3. Industry-Topic Tags** (~250,000)
- Examples: "Scalable Machine Learning for Healthcare", "Secure Cloud Computing for Finance"

**4. Action-Based Tags** (~100,000)
- Examples: "Build Python Application", "Deploy React Platform"

**5. Comprehensive Solution Tags** (~5,000,000)
- Examples: "Enterprise Machine Learning Solution for Healthcare"

**6. Numbered Identifiers** (~4,600,000)
- Examples: "Tag-1", "Resource-1000", "Component-50070"

## 🔧 Integration with Your Backend

### Option 1: Copy Files

Copy the model files to your backend:

```bash
# Copy to your backend models directory
cp Tag.model.js /path/to/your/backend/models/Tag.js
cp Category.model.js /path/to/your/backend/models/Category.js
```

### Option 2: Import Models

If your backend is in the same project, import the models:

```javascript
const Tag = require('./path/to/Tag.model');
const Category = require('./path/to/Category.model');
```

### Option 3: Standalone Seeding

Run this package separately to seed your database, then use the data from your backend:

```bash
# In this directory
npm run seed

# Then in your backend, just query the tags
const tags = await Tag.find({});
```

## 📝 Tag Model Schema

```javascript
{
  name: String,           // "JavaScript + React + MongoDB"
  slug: String,           // "javascript-react-mongodb" (unique, indexed)
  category: String,       // "skills-tools" (indexed)
  subcategory: String,    // "tech-stack" (indexed)
  type: String,           // "combination" (optional)
  description: String,    // "JavaScript + React + MongoDB technology stack"
  aliases: [String],      // Alternative names
  usageCount: Number,     // 1234 (indexed)
  metadata: Map,          // Additional key-value data
  isActive: Boolean,      // true (indexed)
  createdAt: Date,        // Auto-generated
  updatedAt: Date         // Auto-generated
}
```

## 🎯 Indexes

The Tag model includes optimized indexes for performance:

- `slug` - Unique index
- `category` - Single field index
- `subcategory` - Single field index
- `usageCount` - Single field index
- `isActive` - Single field index
- `{ name: 'text', description: 'text' }` - Full-text search
- `{ category: 1, subcategory: 1 }` - Compound index
- `{ category: 1, usageCount: -1 }` - Compound index
- `{ isActive: 1, usageCount: -1 }` - Compound index

## 🔍 Example Queries

After seeding, you can query tags:

```javascript
// Find all tags
const allTags = await Tag.find({}).limit(10);

// Search tags by name
const searchResults = await Tag.find({
  $text: { $search: 'javascript react' }
});

// Get tags by category
const skillsTags = await Tag.find({ category: 'skills-tools' });

// Get popular tags
const popularTags = await Tag.find({ isActive: true })
  .sort({ usageCount: -1 })
  .limit(20);

// Get tags by category and subcategory
const techStackTags = await Tag.find({
  category: 'skills-tools',
  subcategory: 'tech-stack'
});
```

## 💡 Tips

### Increase Node.js Memory

If you encounter memory issues:

```bash
NODE_OPTIONS="--max-old-space-size=8192" npm run seed
```

### MongoDB Configuration

For better performance, configure MongoDB:

```javascript
// Increase cache size (in docker-compose or config file)
mongod --wiredTigerCacheSizeGB 4
```

### Monitor Progress

The script provides real-time progress updates:

```
[INFO]: Batch 1: Inserted 5,000/10,000,000 tags (0.05%) - 4,500 tags/sec
[INFO]: Batch 2: Inserted 10,000/10,000,000 tags (0.10%) - 4,800 tags/sec
...
[INFO]: ✅ Successfully seeded database in 1,234.56s
[INFO]: 📊 Total tags: 10,000,000
[INFO]: ⚡ Average rate: 8,100 tags/second
```

## 🐛 Troubleshooting

### Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Make sure MongoDB is running:

```bash
# Start MongoDB locally
mongod

# Or start with Docker
docker run -d -p 27017:27017 mongo:7
```

### Out of Memory

```
JavaScript heap out of memory
```

**Solution**: Increase Node.js memory:

```bash
NODE_OPTIONS="--max-old-space-size=8192" npm run seed
```

### Slow Performance

**Solutions**:
1. Use SSD storage
2. Increase MongoDB cache size
3. Ensure sufficient RAM (8GB+ recommended)
4. Close other applications

## 📋 Requirements

- **Node.js**: >= 18.0.0
- **MongoDB**: >= 5.0
- **RAM**: 8GB+ recommended
- **Disk Space**: 10GB+ free
- **Time**: 30-60 minutes

## 🔄 Re-seeding

The script automatically clears existing tags before seeding. To re-seed:

```bash
npm run seed
```

## 📄 License

MIT

## 🤝 Support

For issues or questions, please check:
- MongoDB connection string is correct
- MongoDB is running and accessible
- Sufficient disk space available
- Node.js version >= 18.0.0

---

**Note**: This package is designed to work standalone or be integrated into any Node.js/Express backend that uses MongoDB and Mongoose.

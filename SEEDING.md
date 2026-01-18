# User Seeding Guide

This document explains how to use the user seeding script to populate your database with sample users.

## Quick Start

Run the seeding script using npm:

```bash
npm run seed:users
```

## What Gets Seeded

The script creates **10 diverse sample users** across all profession types:

- **3 Salaried Professionals** - Software engineers, designers, data scientists
- **3 Business Owners** - Marketing agency, consulting firm, wellness studio
- **2 Freelancers** - Graphic designer, content writer
- **2 Students** - CS student, MBA student

## Sample User Data

Each user includes:
- ✅ Full name, email, and hashed password
- ✅ Mobile number
- ✅ Profession type and profession-specific information
- ✅ Custom tags and skills
- ✅ Geographic location (coordinates + regional array)
- ✅ Karma score
- ✅ Search preferences (what they're looking for, what they offer)
- ✅ Portfolio URLs (for freelancers/business owners)

## Login Credentials

All seeded users have the same password for testing:

**Password:** `password123`

### Sample Login Accounts

1. **John Smith** (Salaried)
   - Email: `john.smith@example.com`
   - Role: Senior Software Engineer at Tech Corp Inc.

2. **Sarah Johnson** (Salaried)
   - Email: `sarah.johnson@example.com`
   - Role: Lead UX Designer at Design Studio Pro

3. **Michael Chen** (Business)
   - Email: `michael.chen@example.com`
   - Business: Chen Digital Marketing

4. **Emily Rodriguez** (Business)
   - Email: `emily.rodriguez@example.com`
   - Business: Rodriguez Consulting Group

5. **David Kumar** (Freelancer)
   - Email: `david.kumar@example.com`
   - Business: Kumar Creative Studios

6. **Lisa Anderson** (Freelancer)
   - Email: `lisa.anderson@example.com`
   - Business: Anderson Content Writing

7. **Alex Thompson** (Student)
   - Email: `alex.thompson@example.com`
   - College: MIT, Computer Science

8. **Priya Patel** (Student)
   - Email: `priya.patel@example.com`
   - College: Stanford, Business Administration

9. **James Wilson** (Salaried)
   - Email: `james.wilson@example.com`
   - Role: Data Scientist at FinTech Solutions

10. **Maria Garcia** (Business)
    - Email: `maria.garcia@example.com`
    - Business: Garcia Wellness Studio

## Important Notes

⚠️ **Warning:** The seeding script will **DELETE ALL EXISTING USERS** before inserting new ones.

If you want to keep existing users, comment out this line in `seed-users.js`:

```javascript
// await User.deleteMany({});
```

## Customization

To add your own users or modify existing ones, edit the `sampleUsers` array in `seed-users.js`.

Each user object should follow the User model schema defined in `models/User.js`.

## Geographic Locations

The seeded users are distributed across various cities:
- San Francisco, CA
- New York, NY
- Los Angeles, CA
- Chicago, IL
- Houston, TX
- Seattle, WA
- Boston, MA
- Palo Alto, CA
- London, UK
- Miami, FL

This allows testing of location-based features and geospatial queries.

## Next Steps

After seeding:
1. Test user authentication with any of the sample credentials
2. Test profession-specific features for each user type
3. Test location-based queries
4. Test the share code system
5. Test karma scoring and connections

## Troubleshooting

### Connection Error
If you get a MongoDB connection error, ensure:
- MongoDB is running
- Your `.env` file has the correct `MONGODB_URI`
- Your database credentials are valid

### Duplicate Key Error
If you get a duplicate key error:
- The database already has users with these emails
- Run the script again (it will clear existing users first)
- Or manually delete users from the database

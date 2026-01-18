const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const User = require('../models/User');

/**
 * Calculate profile completion percentage based on profession type
 */
function calculateProfileCompletion(user) {
  const weights = {
    basic: { fullName: 5, email: 5, mobileNo: 5, profilePicture: 5, professionType: 10 },
    common: { customTags: 5, searchingFor: 5, lookingFor: 5, describeNeed: 10, whatYouWant: 5, whatYouCanOffer: 5, location: 5 },
    professionSpecific: 30
  };

  let score = 0;
  const maxScore = 100;

  // Basic fields
  if (user.fullName) score += weights.basic.fullName;
  if (user.email) score += weights.basic.email;
  if (user.mobileNo) score += weights.basic.mobileNo;
  if (user.profilePicture) score += weights.basic.profilePicture;
  if (user.professionType) score += weights.basic.professionType;

  // Common fields
  if (user.customTags && user.customTags.length > 0) score += weights.common.customTags;
  if (user.searchingFor && user.searchingFor.length > 0) score += weights.common.searchingFor;
  if (user.lookingFor && user.lookingFor.length > 0) score += weights.common.lookingFor;
  if (user.describeNeed) score += weights.common.describeNeed;
  if (user.whatYouWant && user.whatYouWant.length > 0) score += weights.common.whatYouWant;
  if (user.whatYouCanOffer && user.whatYouCanOffer.length > 0) score += weights.common.whatYouCanOffer;
  if (user.location && user.location.regionalArray && user.location.regionalArray.length > 0) score += weights.common.location;

  // Profession-specific fields
  let professionScore = 0;
  const professionMaxScore = weights.professionSpecific;

  switch (user.professionType) {
    case 'salaried':
      if (user.salariedInfo?.companyName) professionScore += 8;
      if (user.salariedInfo?.companyLogo) professionScore += 4;
      if (user.salariedInfo?.designation) professionScore += 8;
      if (user.salariedInfo?.role) professionScore += 4;
      if (user.salariedInfo?.bio) professionScore += 6;
      break;
    case 'business':
    case 'freelancer':
      if (user.businessInfo?.businessName) professionScore += 8;
      if (user.businessInfo?.businessLogo) professionScore += 4;
      if (user.businessInfo?.businessBio) professionScore += 10;
      if (user.businessInfo?.businessInterest && user.businessInfo.businessInterest.length > 0) professionScore += 8;
      break;
    case 'student':
      if (user.studentInfo?.collegeName) professionScore += 8;
      if (user.studentInfo?.collegeLogo) professionScore += 4;
      if (user.studentInfo?.degreeName) professionScore += 8;
      if (user.studentInfo?.year) professionScore += 4;
      if (user.studentInfo?.bio) professionScore += 6;
      break;
  }

  score += professionScore;

  return {
    percentage: Math.round(score),
    score,
    maxScore,
    breakdown: {
      basic: Math.round((score / maxScore) * 30),
      common: Math.round((score / maxScore) * 40),
      professionSpecific: Math.round((professionScore / professionMaxScore) * 100)
    }
  };
}

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get current user profile with profession-specific fields
 *     description: Returns user profile with only relevant profession-specific fields based on professionType. Students see studentInfo, salaried employees see salariedInfo, business owners and freelancers see businessInfo.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully with profession-specific fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: User profile (only relevant profession fields included based on professionType)
 *                 completion:
 *                   type: object
 *                   properties:
 *                     percentage:
 *                       type: number
 *                       example: 75
 *                       description: Profile completion percentage (0-100)
 *                     score:
 *                       type: number
 *                       example: 75
 *                     maxScore:
 *                       type: number
 *                       example: 100
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         basic:
 *                           type: number
 *                         common:
 *                           type: number
 *                         professionSpecific:
 *                           type: number
 *             examples:
 *               student:
 *                 summary: Student profile response
 *                 value:
 *                   user:
 *                     _id: "507f1f77bcf86cd799439011"
 *                     fullName: "John Doe"
 *                     email: "john@example.com"
 *                     mobileNo: "+1234567890"
 *                     professionType: "student"
 *                     studentInfo:
 *                       collegeName: "MIT"
 *                       degreeName: "Computer Science"
 *                       year: 3
 *                       bio: "AI enthusiast and researcher"
 *                     customTags: ["AI", "Machine Learning", "Research"]
 *                     whatYouWant: ["Internship", "Research Opportunities"]
 *                     whatYouCanOffer: ["Python", "TensorFlow"]
 *                   completion:
 *                     percentage: 78
 *                     score: 78
 *                     maxScore: 100
 *                     breakdown:
 *                       basic: 23
 *                       common: 31
 *                       professionSpecific: 80
 *               salaried:
 *                 summary: Salaried employee profile response
 *                 value:
 *                   user:
 *                     _id: "507f1f77bcf86cd799439012"
 *                     fullName: "Jane Smith"
 *                     email: "jane@example.com"
 *                     professionType: "salaried"
 *                     salariedInfo:
 *                       companyName: "Google"
 *                       designation: "Senior Software Engineer"
 *                       role: "Backend Developer"
 *                       bio: "Building distributed systems"
 *                     customTags: ["Backend", "Microservices"]
 *                     whatYouWant: ["Mentorship"]
 *                     whatYouCanOffer: ["System Design", "Code Review"]
 *                   completion:
 *                     percentage: 82
 *                     score: 82
 *                     maxScore: 100
 *               business:
 *                 summary: Business owner profile response
 *                 value:
 *                   user:
 *                     _id: "507f1f77bcf86cd799439013"
 *                     fullName: "Alex Johnson"
 *                     email: "alex@startup.com"
 *                     professionType: "business"
 *                     businessInfo:
 *                       businessName: "Tech Startup Inc"
 *                       businessBio: "Building innovative SaaS solutions"
 *                       businessInterest: ["SaaS", "Enterprise Software", "AI"]
 *                     customTags: ["Entrepreneur", "SaaS"]
 *                     whatYouWant: ["Investors", "Co-founders"]
 *                   completion:
 *                     percentage: 75
 *               freelancer:
 *                 summary: Freelancer profile response
 *                 value:
 *                   user:
 *                     _id: "507f1f77bcf86cd799439014"
 *                     fullName: "Sarah Williams"
 *                     email: "sarah@freelance.com"
 *                     professionType: "freelancer"
 *                     businessInfo:
 *                       businessName: "Sarah Williams Consulting"
 *                       businessBio: "Full-stack developer specializing in React and Node.js"
 *                       businessInterest: ["Web Development", "Consulting"]
 *                     customTags: ["Freelancer", "Full-stack", "React"]
 *                     whatYouWant: ["Clients", "Long-term Projects"]
 *                   completion:
 *                     percentage: 70
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch profile
 */
// Get current user profile
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Convert to plain object for manipulation
    const userObj = user.toObject();

    // Filter profession-specific fields based on professionType
    // Only return the relevant profession info for the user's current type
    switch (userObj.professionType) {
      case 'student':
        // Students only see studentInfo
        delete userObj.salariedInfo;
        delete userObj.businessInfo;
        break;
      case 'salaried':
        // Salaried employees only see salariedInfo
        delete userObj.studentInfo;
        delete userObj.businessInfo;
        break;
      case 'business':
      case 'freelancer':
        // Business owners and freelancers only see businessInfo
        delete userObj.studentInfo;
        delete userObj.salariedInfo;
        break;
    }

    const completion = calculateProfileCompletion(user);
    res.json({ user: userObj, completion });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * @swagger
 * /profile/completion:
 *   get:
 *     summary: Get profile completion percentage only
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile completion percentage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 percentage:
 *                   type: number
 *                   example: 75
 *                 score:
 *                   type: number
 *                 maxScore:
 *                   type: number
 *                 breakdown:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
// Get profile completion only
router.get('/completion', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const completion = calculateProfileCompletion(user);
    res.json(completion);
  } catch (err) {
    console.error('Get completion error:', err);
    res.status(500).json({ error: 'Failed to calculate completion' });
  }
});

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Update user profile with all profession types supported
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: User's full name
 *               mobileNo:
 *                 type: string
 *                 description: User's mobile number
 *               profilePicture:
 *                 type: string
 *                 description: URL to profile picture
 *               professionType:
 *                 type: string
 *                 enum: [student, salaried, business, freelancer]
 *                 description: User's profession type
 *               location:
 *                 type: object
 *                 properties:
 *                   regionalArray:
 *                     type: array
 *                     items:
 *                       type: string
 *               customTags:
 *                 type: array
 *                 items:
 *                   type: string
 *               searchingFor:
 *                 type: array
 *                 items:
 *                   type: string
 *               lookingFor:
 *                 type: array
 *                 items:
 *                   type: string
 *               describeNeed:
 *                 type: string
 *               whatYouWant:
 *                 type: array
 *                 items:
 *                   type: string
 *               whatYouCanOffer:
 *                 type: array
 *                 items:
 *                   type: string
 *               portfolio:
 *                 type: string
 *               studentInfo:
 *                 type: object
 *                 description: Student-specific information
 *                 properties:
 *                   collegeName:
 *                     type: string
 *                   collegeLogo:
 *                     type: string
 *                   degreeName:
 *                     type: string
 *                   year:
 *                     type: number
 *                   bio:
 *                     type: string
 *               salariedInfo:
 *                 type: object
 *                 description: Salaried employee information
 *                 properties:
 *                   companyName:
 *                     type: string
 *                   companyLogo:
 *                     type: string
 *                   designation:
 *                     type: string
 *                   role:
 *                     type: string
 *                   bio:
 *                     type: string
 *               businessInfo:
 *                 type: object
 *                 description: Business owner or freelancer information
 *                 properties:
 *                   businessName:
 *                     type: string
 *                   businessLogo:
 *                     type: string
 *                   businessBio:
 *                     type: string
 *                   businessInterest:
 *                     type: array
 *                     items:
 *                       type: string
 *           examples:
 *             student:
 *               summary: Update student profile
 *               value:
 *                 professionType: student
 *                 studentInfo:
 *                   collegeName: "MIT"
 *                   degreeName: "Computer Science"
 *                   year: 3
 *                   bio: "AI enthusiast and researcher"
 *                 customTags: ["AI", "Machine Learning", "Research"]
 *                 whatYouWant: ["Internship", "Research Opportunities"]
 *                 whatYouCanOffer: ["Python", "TensorFlow", "Research Skills"]
 *             salaried:
 *               summary: Update salaried employee profile
 *               value:
 *                 professionType: salaried
 *                 salariedInfo:
 *                   companyName: "Google"
 *                   designation: "Senior Software Engineer"
 *                   role: "Backend Developer"
 *                   bio: "Passionate developer with 5 years experience in distributed systems"
 *                 customTags: ["Backend", "Microservices", "Cloud"]
 *                 whatYouWant: ["Mentorship", "Side Projects"]
 *                 whatYouCanOffer: ["Code Review", "System Design", "Go Programming"]
 *             business:
 *               summary: Update business owner profile
 *               value:
 *                 professionType: business
 *                 businessInfo:
 *                   businessName: "Tech Startup Inc"
 *                   businessBio: "Building innovative SaaS solutions for enterprises"
 *                   businessInterest: ["SaaS", "Enterprise Software", "AI"]
 *                 customTags: ["Entrepreneur", "SaaS", "B2B"]
 *                 whatYouWant: ["Investors", "Co-founders", "Enterprise Clients"]
 *                 whatYouCanOffer: ["Product Development", "Business Strategy"]
 *             freelancer:
 *               summary: Update freelancer profile
 *               value:
 *                 professionType: freelancer
 *                 businessInfo:
 *                   businessName: "John Doe Consulting"
 *                   businessBio: "Full-stack developer specializing in React and Node.js"
 *                   businessInterest: ["Web Development", "Mobile Apps", "Consulting"]
 *                 customTags: ["Freelancer", "Full-stack", "React", "Node.js"]
 *                 whatYouWant: ["Clients", "Long-term Projects"]
 *                 whatYouCanOffer: ["Web Development", "Mobile Development", "Consulting"]
 *     responses:
 *       200:
 *         description: Profile updated successfully with completion percentage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   type: object
 *                   description: Updated user profile (password excluded)
 *                 completion:
 *                   type: object
 *                   description: Profile completion metrics
 *                   properties:
 *                     percentage:
 *                       type: number
 *                       example: 75
 *                       description: Overall profile completion percentage (0-100)
 *                     score:
 *                       type: number
 *                       example: 75
 *                       description: Actual score achieved
 *                     maxScore:
 *                       type: number
 *                       example: 100
 *                       description: Maximum possible score
 *                     breakdown:
 *                       type: object
 *                       description: Breakdown by category
 *                       properties:
 *                         basic:
 *                           type: number
 *                           description: Basic fields completion
 *                         common:
 *                           type: number
 *                           description: Common fields completion
 *                         professionSpecific:
 *                           type: number
 *                           description: Profession-specific fields completion
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update profile
 */
// Update user profile
router.put('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Allow updating all fields including all profession-specific info
    const allowedUpdates = [
      'fullName', 'mobileNo', 'profilePicture', 'location', 'customTags',
      'searchingFor', 'additionallySearchingFor', 'lookingFor', 'describeNeed',
      'whatYouWant', 'whatYouCanOffer', 'portfolio',
      'professionType',  // Allow changing profession type
      'salariedInfo',    // Allow updating salaried info
      'businessInfo',    // Allow updating business/freelancer info
      'studentInfo'      // Allow updating student info
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    await user.save();
    const completion = calculateProfileCompletion(user);
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json({ message: 'Profile updated successfully', user: userResponse, completion });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;

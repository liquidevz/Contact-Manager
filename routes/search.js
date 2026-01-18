const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const User = require('../models/User');

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: User search and discovery endpoints
 */

/**
 * Helper to project public user data only
 */
const getPublicProfile = (user) => {
    const userObj = user.toObject();

    // Base public profile
    const publicProfile = {
        _id: userObj._id,
        fullName: userObj.fullName,
        profilePicture: userObj.profilePicture,
        professionType: userObj.professionType,
        shareCode: userObj.shareCode,
        location: userObj.location,

        // Tags (Public)
        whatYouCanOffer: userObj.whatYouCanOffer || [],
        whatYouWant: userObj.whatYouWant || [],
        customTags: userObj.customTags || [],
        searchingFor: userObj.searchingFor || [],
        lookingFor: userObj.lookingFor || [],

        // Business Card (Public)
        businessCard: userObj.businessCard,

        // Profession Info (Public)
        professionInfo: userObj.professionInfo // Virtual field needs to be populated or handled
    };

    // Add profession specific info manually since virtuals might not stick in toObject()
    if (userObj.professionType === 'salaried') publicProfile.salariedInfo = userObj.salariedInfo;
    if (userObj.professionType === 'business' || userObj.professionType === 'freelancer') publicProfile.businessInfo = userObj.businessInfo;
    if (userObj.professionType === 'student') publicProfile.studentInfo = userObj.studentInfo;

    return publicProfile;
};

/**
 * @swagger
 * /search/code:
 *   get:
 *     summary: Search user by 5-digit share code
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 5-character alphanumeric code
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get('/code', authenticate, async (req, res) => {
    try {
        const { code } = req.query;

        if (!code || code.length !== 5) {
            return res.status(400).json({ error: 'Invalid code format. Must be 5 characters.' });
        }

        const user = await User.findOne({
            shareCode: code.toUpperCase(),
            isActive: true
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: getPublicProfile(user) });
    } catch (err) {
        console.error('Search by code error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

/**
 * @swagger
 * /search/smart:
 *   get:
 *     summary: Smart match users based on reciprocal needs and offers
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Matching users found
 */
router.get('/smart', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get current user to know their tags
        const currentUser = await User.findById(req.userId);
        if (!currentUser) return res.status(404).json({ error: 'Current user not found' });

        // 1. Define "My Needs" (What I want)
        const myNeeds = [
            ...(currentUser.whatYouWant || []),
            ...(currentUser.searchingFor || []),
            ...(currentUser.lookingFor || []),
            ...(currentUser.additionallySearchingFor || []),
            currentUser.describeNeed
        ].filter(Boolean).map(t => t.toLowerCase().trim());

        // 2. Define "My Offers" (What I can give)
        const myOffers = [
            ...(currentUser.whatYouCanOffer || []),
            ...(currentUser.customTags || [])
        ].filter(Boolean).map(t => t.toLowerCase().trim());

        if (myNeeds.length === 0 && myOffers.length === 0) {
            return res.json({ matches: [], message: 'Update your profile tags to see matches' });
        }

        // 3. Find Matches
        // We want users who:
        // A) Have an Offer that matches My Need
        // OR
        // B) Have a Need that matches My Offer

        const users = await User.find({
            _id: { $ne: req.userId }, // Exclude self
            isActive: true,
            $or: [
                // Match Type A: Their Offer IN My Needs
                { whatYouCanOffer: { $in: myNeeds } },
                { customTags: { $in: myNeeds } },

                // Match Type B: Their Need IN My Offers
                { whatYouWant: { $in: myOffers } },
                { searchingFor: { $in: myOffers } },
                { lookingFor: { $in: myOffers } }
            ]
        }).lean(); // Use lean for performance since we'll process manually

        // 4. Score and Rank Results
        const scoredUsers = users.map(user => {
            let score = 0;
            const matchedTags = {
                myNeedMetBy: [], // Tags they offer that I want
                myOfferMeets: [] // Tags I offer that they want
            };

            // Check Type A Matches (They Offer -> I Want)
            const theirOffers = [
                ...(user.whatYouCanOffer || []),
                ...(user.customTags || [])
            ].map(t => t.toLowerCase().trim());

            theirOffers.forEach(tag => {
                if (myNeeds.includes(tag)) {
                    score += 10; // High value for meeting a need
                    matchedTags.myNeedMetBy.push(tag);
                }
            });

            // Check Type B Matches (I Offer -> They Want)
            const theirNeeds = [
                ...(user.whatYouWant || []),
                ...(user.searchingFor || []),
                ...(user.lookingFor || [])
            ].map(t => t.toLowerCase().trim());

            theirNeeds.forEach(tag => {
                if (myOffers.includes(tag)) {
                    score += 5; // Value for being able to help
                    matchedTags.myOfferMeets.push(tag);
                }
            });

            return {
                user: getPublicProfile({ toObject: () => user }), // Helper expects mongoose doc or object with toObject
                score,
                matchedTags
            };
        });

        // Sort by score descending
        scoredUsers.sort((a, b) => b.score - a.score);

        // Pagination
        const paginatedResults = scoredUsers.slice(skip, skip + limit);

        res.json({
            matches: paginatedResults,
            pagination: {
                page,
                limit,
                total: scoredUsers.length,
                pages: Math.ceil(scoredUsers.length / limit)
            }
        });

    } catch (err) {
        console.error('Smart search error:', err);
        res.status(500).json({ error: 'Smart search failed' });
    }
});

module.exports = router;

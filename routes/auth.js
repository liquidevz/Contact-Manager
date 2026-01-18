const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validator = require('validator');

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     description: Create a new user account with email, password, and profile information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - professionType
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full name of the user
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (must be unique)
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password (min 6 characters)
 *                 example: SecurePass123
 *               mobileNo:
 *                 type: string
 *                 description: Mobile number (optional)
 *                 example: "9876543210"
 *               profilePicture:
 *                 type: string
 *                 description: URL or path to profile picture (optional)
 *                 example: https://example.com/profile.jpg
 *               professionType:
 *                 type: string
 *                 enum: [salaried, freelancer, business, student]
 *                 description: Type of profession
 *                 example: salaried
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup', async (req, res) => {
    try {
        const { fullName, email, password, mobileNo, profilePicture, professionType } = req.body;

        // Validation
        if (!fullName || !email || !password || !professionType) {
            return res.status(400).json({
                error: 'Please provide fullName, email, password, and professionType'
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Validate profession type
        const validProfessionTypes = ['salaried', 'freelancer', 'business', 'student'];
        if (!validProfessionTypes.includes(professionType)) {
            return res.status(400).json({
                error: `Invalid professionType. Must be one of: ${validProfessionTypes.join(', ')}`
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Check if mobile number is already registered (if provided)
        if (mobileNo) {
            const existingMobile = await User.findOne({ mobileNo });
            if (existingMobile) {
                return res.status(400).json({ error: 'User with this mobile number already exists' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user object
        const userData = {
            fullName,
            email: email.toLowerCase(),
            password: hashedPassword,
            professionType
        };

        // Add optional fields if provided
        if (mobileNo) userData.mobileNo = mobileNo;
        if (profilePicture) userData.profilePicture = profilePicture;

        // Create user
        const user = new User(userData);
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return response (exclude password)
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email or mobile number
 *     tags: [Authentication]
 *     description: Authenticate user with email/mobile number and password, returns JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrMobile
 *               - password
 *             properties:
 *               emailOrMobile:
 *                 type: string
 *                 description: Email address or mobile number
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *                 example: SecurePass123
 *           examples:
 *             emailLogin:
 *               summary: Login with email
 *               value:
 *                 emailOrMobile: john.doe@example.com
 *                 password: SecurePass123
 *             mobileLogin:
 *               summary: Login with mobile
 *               value:
 *                 emailOrMobile: "9876543210"
 *                 password: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
    try {
        const { emailOrMobile, password } = req.body;

        // Validation
        if (!emailOrMobile || !password) {
            return res.status(400).json({
                error: 'Please provide email/mobile number and password'
            });
        }

        // Find user by email or mobile number
        let user;

        // Check if it's an email format
        if (validator.isEmail(emailOrMobile)) {
            user = await User.findOne({ email: emailOrMobile.toLowerCase() });
        } else {
            // Try to find by mobile number
            user = await User.findOne({ mobileNo: emailOrMobile });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return response (exclude password)
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            message: 'Login successful',
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

module.exports = router;

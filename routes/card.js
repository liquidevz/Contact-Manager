const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const User = require('../models/User');
const { createCanvas, loadImage } = require('canvas');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Helper functions
const getProfessionDisplay = (user) => {
    switch (user.professionType) {
        case 'salaried': return user.salariedInfo?.designation || 'Professional';
        case 'business': return user.businessInfo?.businessType || 'Business Owner';
        case 'freelancer': return user.freelancerInfo?.primarySkill || 'Freelancer';
        case 'student': return `Student at ${user.studentInfo?.institution || 'University'}`;
        default: return 'Professional';
    }
};

const getCompanyDisplay = (user) => {
    switch (user.professionType) {
        case 'salaried': return user.salariedInfo?.company || '';
        case 'business': return user.businessInfo?.businessName || '';
        case 'freelancer': return 'Freelancer';
        case 'student': return user.studentInfo?.institution || '';
        default: return '';
    }
};

const getTagline = (user) => {
    switch (user.professionType) {
        case 'salaried': return user.salariedInfo?.bio || '';
        case 'business': return user.businessInfo?.businessBio || '';
        case 'freelancer': return user.freelancerInfo?.bio || '';
        case 'student': return user.studentInfo?.bio || '';
        default: return '';
    }
};

const getWebsite = (user) => {
    if (user.professionType === 'salaried') return user.salariedInfo?.companyWebsite || '';
    if (user.professionType === 'business') return user.businessInfo?.website || '';
    return '';
};

// Generate PNG using Varun_Arc.png template
const generateCardImage = async (cardData, theme) => {
    const width = 680;
    const height = 1020;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Load template
    const templatePath = path.join(__dirname, '..', 'Varun_Arc.png');
    try {
        const template = await loadImage(templatePath);
        ctx.drawImage(template, 0, 0, width, height);
    } catch (err) {
        console.log('Template not found, using gradient');
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, theme.primaryColor);
        gradient.addColorStop(1, theme.secondaryColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    // Profile image
    if (cardData.profileImage) {
        try {
            const img = await loadImage(cardData.profileImage);
            const imgSize = 200;
            const imgX = (width - imgSize) / 2;
            const imgY = 80;
            ctx.save();
            ctx.beginPath();
            ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
            ctx.restore();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
            ctx.stroke();
        } catch (err) {
            console.log('Profile image load failed:', err.message);
        }
    }

    // Bottom left - Code/Date
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'left';
    const displayCode = cardData.displayName.split(' ')[0].toUpperCase().substring(0, 3);
    ctx.fillText(displayCode, 60, 950);
    ctx.font = '24px Arial';
    const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    ctx.fillText(currentDate, 180, 950);

    // Bottom right - Company/Profession
    ctx.textAlign = 'right';
    ctx.font = 'bold 32px Arial';
    if (cardData.company) ctx.fillText(cardData.company.toUpperCase(), width - 60, 930);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#34495E';
    ctx.fillText(cardData.profession, width - 60, 965);

    // Center - Name and contact
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(cardData.displayName, width / 2, 450);
    ctx.font = '28px Arial';
    ctx.fillStyle = '#34495E';
    ctx.fillText(cardData.profession, width / 2, 490);

    // Contact info
    ctx.font = '22px Arial';
    ctx.fillStyle = '#555';
    let yPos = 540;
    if (cardData.contactInfo.mobile) {
        ctx.fillText(`📱 ${cardData.contactInfo.mobile}`, width / 2, yPos);
        yPos += 35;
    }
    if (cardData.contactInfo.email) {
        ctx.font = '20px Arial';
        ctx.fillText(`📧 ${cardData.contactInfo.email}`, width / 2, yPos);
    }

    return canvas.toBuffer('image/png');
};

/**
 * @swagger
 * tags:
 *   name: Business Card
 *   description: Digital business card generation
 */

/**
 * @swagger
 * /card/generate:
 *   post:
 *     summary: Generate business card
 *     tags: [Business Card]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Card generated
 */
router.post('/generate', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const cardId = user.businessCard?.cardId || uuidv4();
        const cardData = {
            displayName: user.fullName,
            profession: getProfessionDisplay(user),
            company: getCompanyDisplay(user),
            tagline: req.body.customTagline || getTagline(user),
            profileImage: user.profilePicture,
            contactInfo: {
                email: user.email,
                mobile: user.mobileNo,
                website: getWebsite(user)
            }
        };

        const theme = {
            primaryColor: req.body.theme?.primaryColor || '#4A90E2',
            secondaryColor: req.body.theme?.secondaryColor || '#E94B8A',
            style: req.body.theme?.style || 'gradient'
        };

        const shareUrl = `${req.protocol}://${req.get('host')}/api/v1/card/share/${cardId}`;
        const qrCodeData = await QRCode.toDataURL(shareUrl);

        user.businessCard = { cardId, generatedAt: new Date(), cardData, theme, shareUrl, qrCodeData };
        await user.save();

        res.json({ success: true, message: 'Card generated', card: { cardId, ...cardData, theme, shareUrl, qrCode: qrCodeData } });
    } catch (err) {
        console.error('Generate error:', err);
        res.status(500).json({ error: 'Failed to generate card' });
    }
});

/**
 * @swagger
 * /card:
 *   get:
 *     summary: Get user's card
 *     tags: [Business Card]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Card retrieved
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user?.businessCard?.cardId) return res.status(404).json({ error: 'No card found' });
        res.json({ success: true, card: { cardId: user.businessCard.cardId, ...user.businessCard.cardData, theme: user.businessCard.theme, shareUrl: user.businessCard.shareUrl, qrCode: user.businessCard.qrCodeData } });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve card' });
    }
});

/**
 * @swagger
 * /card/download:
 *   get:
 *     summary: Download PNG
 *     tags: [Business Card]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PNG image file
 */
router.get('/download', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user?.businessCard?.cardId) return res.status(404).json({ error: 'No card found' });
        const imageBuffer = await generateCardImage(user.businessCard.cardData, user.businessCard.theme);
        res.set({ 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="card-${user.businessCard.cardId}.png"` });
        res.send(imageBuffer);
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

/**
 * @swagger
 * /card/view:
 *   get:
 *     summary: View card image in browser
 *     tags: [Business Card]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PNG image displayed inline
 */
router.get('/view', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user?.businessCard?.cardId) return res.status(404).json({ error: 'No card found' });
        const imageBuffer = await generateCardImage(user.businessCard.cardData, user.businessCard.theme);
        res.set({ 'Content-Type': 'image/png', 'Content-Disposition': 'inline' });
        res.send(imageBuffer);
    } catch (err) {
        console.error('View error:', err);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

/**
 * @swagger
 * /card/qr:
 *   get:
 *     summary: Get QR code
 *     tags: [Business Card]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR code
 */
router.get('/qr', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user?.businessCard?.cardId) return res.status(404).json({ error: 'No card found' });
        res.json({ success: true, qrCode: user.businessCard.qrCodeData, shareUrl: user.businessCard.shareUrl });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get QR code' });
    }
});

/**
 * @swagger
 * /card/share/{cardId}:
 *   get:
 *     summary: Public card view
 *     tags: [Business Card]
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Card data
 */
router.get('/share/:cardId', async (req, res) => {
    try {
        const user = await User.findOne({ 'businessCard.cardId': req.params.cardId });
        if (!user?.businessCard) return res.status(404).json({ error: 'Card not found' });
        res.json({ success: true, card: { displayName: user.businessCard.cardData.displayName, profession: user.businessCard.cardData.profession, company: user.businessCard.cardData.company, profileImage: user.businessCard.cardData.profileImage, contactInfo: user.businessCard.cardData.contactInfo } });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve card' });
    }
});

module.exports = router;

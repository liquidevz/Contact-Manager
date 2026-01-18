const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const Contact = require('../models/Contact');
const User = require('../models/User');

/**
 * @swagger
 * tags:
 *   name: Contacts
 *   description: Contact management endpoints
 */

/**
 * @swagger
 * /contacts:
 *   post:
 *     summary: Create a new contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - mobile
 *             properties:
 *               name:
 *                 type: string
 *               mobile:
 *                 type: string
 *               profilePhoto:
 *                 type: string
 *               email:
 *                 type: string
 *               company:
 *                 type: string
 *               designation:
 *                 type: string
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Contact created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const contact = new Contact({
            owner: req.userId,
            name: req.body.name,
            mobile: req.body.mobile,
            profilePhoto: req.body.profilePhoto,
            email: req.body.email,
            company: req.body.company,
            designation: req.body.designation,
            notes: req.body.notes,
            tags: req.body.tags || [],
            socialProfiles: req.body.socialProfiles,
            address: req.body.address,
            location: req.body.location,
            priority: req.body.priority || 0
        });

        await contact.save();

        // Populate default lists before returning
        await contact.populate('defaultLists.tasks defaultLists.meetings defaultLists.transactions');

        res.status(201).json({ message: 'Contact created successfully', contact });
    } catch (err) {
        console.error('Create contact error:', err);
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /contacts/import:
 *   post:
 *     summary: Import multiple contacts from phone
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contacts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     mobile:
 *                       type: string
 *     responses:
 *       201:
 *         description: Contacts imported successfully
 *       400:
 *         description: Validation error
 */
router.post('/import', authenticate, async (req, res) => {
    try {
        const { contacts } = req.body;

        if (!Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({ error: 'Contacts array is required' });
        }

        const contactDocs = contacts.map(c => ({
            owner: req.userId,
            name: c.name,
            mobile: c.mobile,
            profilePhoto: c.profilePhoto,
            email: c.email
        }));

        const result = await Contact.insertMany(contactDocs, { ordered: false });
        res.status(201).json({
            message: `${result.length} contacts imported successfully`,
            imported: result.length
        });
    } catch (err) {
        console.error('Import contacts error:', err);
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Get all contacts for the authenticated user
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, mobile, or email
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *       - in: query
 *         name: priority
 *         schema:
 *           type: number
 *         description: Filter by priority
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: Contacts retrieved successfully
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let query = { owner: req.userId };

        // Search filter
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { name: searchRegex },
                { mobile: searchRegex },
                { email: searchRegex }
            ];
        }

        // Tags filter
        if (req.query.tags) {
            const tags = req.query.tags.split(',');
            query.tags = { $in: tags };
        }

        // Priority filter
        if (req.query.priority) {
            query.priority = parseInt(req.query.priority);
        }

        const contacts = await Contact.find(query)
            .populate('linkedUser', 'fullName email profilePicture')
            .populate('lists', 'name listType')
            .populate('defaultLists.tasks defaultLists.meetings defaultLists.transactions')
            .skip(skip)
            .limit(limit)
            .sort({ priority: -1, createdAt: -1 });

        const total = await Contact.countDocuments(query);

        res.json({
            contacts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Get contacts error:', err);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

/**
 * @swagger
 * /contacts/{id}:
 *   get:
 *     summary: Get a single contact by ID
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact retrieved successfully
 *       404:
 *         description: Contact not found
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOne({
            _id: req.params.id,
            owner: req.userId
        })
            .populate('linkedUser', 'fullName email profilePicture')
            .populate('lists', 'name listType')
            .populate('defaultLists.tasks defaultLists.meetings defaultLists.transactions')
            .populate('referrals.referredTo', 'fullName email')
            .populate('referrals.referredBy', 'fullName email');

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json({ contact });
    } catch (err) {
        console.error('Get contact error:', err);
        res.status(500).json({ error: 'Failed to fetch contact' });
    }
});

/**
 * @swagger
 * /contacts/{id}:
 *   put:
 *     summary: Update a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Contact updated successfully
 *       404:
 *         description: Contact not found
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOne({
            _id: req.params.id,
            owner: req.userId
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const allowedUpdates = [
            'name', 'mobile', 'profilePhoto', 'email', 'company',
            'designation', 'notes', 'tags', 'socialProfiles',
            'address', 'location', 'priority'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                contact[field] = req.body[field];
            }
        });

        await contact.save();
        res.json({ message: 'Contact updated successfully', contact });
    } catch (err) {
        console.error('Update contact error:', err);
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /contacts/{id}:
 *   delete:
 *     summary: Delete a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *       404:
 *         description: Contact not found
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOneAndDelete({
            _id: req.params.id,
            owner: req.userId
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json({ message: 'Contact deleted successfully' });
    } catch (err) {
        console.error('Delete contact error:', err);
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});

/**
 * @swagger
 * /contacts/{id}/referrals:
 *   post:
 *     summary: Add a referral to a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referredTo:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Referral added successfully
 */
router.post('/:id/referrals', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOne({
            _id: req.params.id,
            owner: req.userId
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        await contact.addReferral(req.body.referredTo, req.body.notes);
        res.json({ message: 'Referral added successfully', contact });
    } catch (err) {
        console.error('Add referral error:', err);
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /contacts/{id}/lists:
 *   get:
 *     summary: Get all default lists for a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default lists retrieved successfully
 */
router.get('/:id/lists', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOne({
            _id: req.params.id,
            owner: req.userId
        }).populate('defaultLists.tasks defaultLists.meetings defaultLists.transactions');

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json({
            defaultLists: {
                tasks: contact.defaultLists.tasks,
                meetings: contact.defaultLists.meetings,
                transactions: contact.defaultLists.transactions
            }
        });
    } catch (err) {
        console.error('Get default lists error:', err);
        res.status(500).json({ error: 'Failed to fetch default lists' });
    }
});

/**
 * @swagger
 * /contacts/{id}/lists/{type}:
 *   get:
 *     summary: Get specific default list for a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tasks, meetings, transactions]
 *     responses:
 *       200:
 *         description: List retrieved successfully
 */
router.get('/:id/lists/:type', authenticate, async (req, res) => {
    try {
        const { type } = req.params;

        if (!['tasks', 'meetings', 'transactions'].includes(type)) {
            return res.status(400).json({ error: 'Invalid list type. Must be tasks, meetings, or transactions' });
        }

        const contact = await Contact.findOne({
            _id: req.params.id,
            owner: req.userId
        }).populate(`defaultLists.${type}`);

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json({ list: contact.defaultLists[type] });
    } catch (err) {
        console.error('Get default list error:', err);
        res.status(500).json({ error: 'Failed to fetch list' });
    }
});

/**
 * @swagger
 * /contacts/{id}/tasks:
 *   post:
 *     summary: Add task to contact's default tasks list
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed, cancelled]
 *     responses:
 *       201:
 *         description: Task added successfully
 */
router.post('/:id/tasks', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOne({
            _id: req.params.id,
            owner: req.userId
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const task = await contact.addTask(req.body);
        res.status(201).json({ message: 'Task added successfully', task });
    } catch (err) {
        console.error('Add task error:', err);
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /contacts/{id}/meetings:
 *   post:
 *     summary: Add meeting to contact's default meetings list
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               meetingInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: Meeting added successfully
 */
router.post('/:id/meetings', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOne({
            _id: req.params.id,
            owner: req.userId
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const meeting = await contact.addMeeting(req.body);
        res.status(201).json({ message: 'Meeting added successfully', meeting });
    } catch (err) {
        console.error('Add meeting error:', err);
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /contacts/{id}/transactions:
 *   post:
 *     summary: Add transaction to contact's default transactions list
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               transactionInfo:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                   currency:
 *                     type: string
 *                   transactionType:
 *                     type: string
 *                     enum: [payment, receipt, invoice, expense]
 *     responses:
 *       201:
 *         description: Transaction added successfully
 */
router.post('/:id/transactions', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOne({
            _id: req.params.id,
            owner: req.userId
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const transaction = await contact.addTransaction(req.body);
        res.status(201).json({ message: 'Transaction added successfully', transaction });
    } catch (err) {
        console.error('Add transaction error:', err);
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /contacts/{id}/{listType}/{itemId}:
 *   put:
 *     summary: Update an item in a contact's default list
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: listType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tasks, meetings, transactions]
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Item updated successfully
 */
router.put('/:id/:listType/:itemId', authenticate, async (req, res) => {
    try {
        const { listType } = req.params;

        if (!['tasks', 'meetings', 'transactions'].includes(listType)) {
            return res.status(400).json({ error: 'Invalid list type' });
        }

        const contact = await Contact.findOne({
            _id: req.params.id,
            owner: req.userId
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const List = require('../models/List');
        const list = await List.findById(contact.defaultLists[listType]);

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        const updatedItem = await list.updateItem(req.params.itemId, req.body);
        res.json({ message: 'Item updated successfully', item: updatedItem });
    } catch (err) {
        console.error('Update item error:', err);
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /contacts/{id}/{listType}/{itemId}:
 *   delete:
 *     summary: Delete an item from a contact's default list
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: listType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tasks, meetings, transactions]
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deleted successfully
 */
router.delete('/:id/:listType/:itemId', authenticate, async (req, res) => {
    try {
        const { listType } = req.params;

        if (!['tasks', 'meetings', 'transactions'].includes(listType)) {
            return res.status(400).json({ error: 'Invalid list type' });
        }

        const contact = await Contact.findOne({
            _id: req.params.id,
            owner: req.userId
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const List = require('../models/List');
        const list = await List.findById(contact.defaultLists[listType]);

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        await list.deleteItem(req.params.itemId);
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error('Delete item error:', err);
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const List = require('../models/List');
const Contact = require('../models/Contact');

/**
 * @swagger
 * tags:
 *   name: Lists
 *   description: List management (Task, Meeting, Transaction, Booking)
 */

/**
 * @swagger
 * /contacts/{contactId}/lists:
 *   post:
 *     summary: Create a new list for a contact
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
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
 *               - name
 *               - listType
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Project Tasks"
 *               listType:
 *                 type: string
 *                 enum: [task, meeting, transaction, booking, custom]
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: List created successfully
 *       404:
 *         description: Contact not found
 */
router.post('/:contactId/lists', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.contactId, owner: req.userId });
        if (!contact) return res.status(404).json({ error: 'Contact not found' });
        const list = new List({ owner: req.userId, name: req.body.name, listType: req.body.listType, description: req.body.description, color: req.body.color, icon: req.body.icon, contacts: [req.params.contactId] });
        await list.save();
        contact.lists.push(list._id);
        await contact.save();
        res.status(201).json({ message: 'List created successfully', list });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /contacts/{contactId}/lists:
 *   get:
 *     summary: Get all lists for a contact
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [task, meeting, transaction, booking, custom]
 *     responses:
 *       200:
 *         description: Lists retrieved successfully
 */
router.get('/:contactId/lists', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.contactId, owner: req.userId });
        if (!contact) return res.status(404).json({ error: 'Contact not found' });
        let query = { _id: { $in: contact.lists }, owner: req.userId };
        if (req.query.type) query.listType = req.query.type;
        const lists = await List.find(query).sort({ createdAt: -1 });
        res.json({ lists, total: lists.length });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch lists' });
    }
});

/**
 * @swagger
 * /contacts/{contactId}/lists/{listId}:
 *   get:
 *     summary: Get a specific list with items
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List retrieved successfully
 */
router.get('/:contactId/lists/:listId', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.contactId, owner: req.userId });
        if (!contact) return res.status(404).json({ error: 'Contact not found' });
        const list = await List.findOne({ _id: req.params.listId, owner: req.userId }).populate('items.relatedContact', 'name mobile');
        if (!list || !contact.lists.includes(list._id)) return res.status(404).json({ error: 'List not found for this contact' });
        res.json({ list });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch list' });
    }
});

router.put('/:contactId/lists/:listId', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.contactId, owner: req.userId });
        if (!contact) return res.status(404).json({ error: 'Contact not found' });
        const list = await List.findOne({ _id: req.params.listId, owner: req.userId });
        if (!list || !contact.lists.includes(list._id)) return res.status(404).json({ error: 'List not found for this contact' });
        ['name', 'description', 'color', 'icon'].forEach(field => { if (req.body[field] !== undefined) list[field] = req.body[field]; });
        await list.save();
        res.json({ message: 'List updated successfully', list });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:contactId/lists/:listId', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.contactId, owner: req.userId });
        if (!contact) return res.status(404).json({ error: 'Contact not found' });
        const list = await List.findOneAndDelete({ _id: req.params.listId, owner: req.userId });
        if (!list) return res.status(404).json({ error: 'List not found' });
        contact.lists.pull(list._id);
        await contact.save();
        res.json({ message: 'List deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete list' });
    }
});

/**
 * @swagger
 * /contacts/{contactId}/lists/{listId}/items:
 *   post:
 *     summary: Add an item to a list
 *     description: |
 *       Add items to different list types with type-specific fields:
 *       
 *       **Task List** - Use `taskInfo` for task-specific data
 *       **Meeting List** - Use `meetingInfo` with `meetingType` (physical/online), location/link
 *       **Transaction List** - Use `transactionInfo` with amount and type (credit/debit)
 *       **Booking List** - Use `bookingInfo` for appointments
 *       
 *       **Alarms**: All items support alarms that sync with related contacts
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: listId
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
 *                 example: "Complete API Documentation"
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed, cancelled]
 *                 default: pending
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-15T18:00:00Z"
 *               taskInfo:
 *                 type: object
 *                 description: For task lists only
 *                 properties:
 *                   assignee:
 *                     type: string
 *                     example: "John Doe"
 *                   estimatedHours:
 *                     type: number
 *                     example: 4
 *                   checklist:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         item:
 *                           type: string
 *                         completed:
 *                           type: boolean
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *               meetingInfo:
 *                 type: object
 *                 description: For meeting lists - supports physical and online meetings
 *                 properties:
 *                   meetingType:
 *                     type: string
 *                     enum: [physical, online]
 *                     example: "online"
 *                   location:
 *                     type: string
 *                     description: Physical address for in-person meetings
 *                     example: "Conference Room A, 5th Floor"
 *                   meetingLink:
 *                     type: string
 *                     description: Video call link for online meetings
 *                     example: "https://zoom.us/j/123456789"
 *                   participants:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["john@example.com", "jane@example.com"]
 *                   agenda:
 *                     type: string
 *                     example: "Discuss Q1 roadmap and budget"
 *                   duration:
 *                     type: number
 *                     description: Duration in minutes
 *                     example: 60
 *               transactionInfo:
 *                 type: object
 *                 description: For transaction lists - track credit/debit
 *                 properties:
 *                   amount:
 *                     type: number
 *                     example: 5007
 *                   type:
 *                     type: string
 *                     enum: [credit, debit]
 *                     example: "credit"
 *                   category:
 *                     type: string
 *                     example: "consulting"
 *                   paymentMethod:
 *                     type: string
 *                     example: "bank transfer"
 *                   invoiceNumber:
 *                     type: string
 *                     example: "INV-2024-001"
 *                   notes:
 *                     type: string
 *               bookingInfo:
 *                 type: object
 *                 description: For booking/appointment lists
 *                 properties:
 *                   serviceType:
 *                     type: string
 *                     example: "Consultation"
 *                   location:
 *                     type: string
 *                   duration:
 *                     type: number
 *                     description: Duration in minutes
 *                   confirmationCode:
 *                     type: string
 *                   notes:
 *                     type: string
 *               alarms:
 *                 type: array
 *                 description: Alarms sync with related contacts when shared
 *                 items:
 *                   type: object
 *                   required:
 *                     - time
 *                   properties:
 *                     time:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-12-14T09:00:00Z"
 *                     type:
 *                       type: string
 *                       enum: [notification, email, sms]
 *                       default: notification
 *                     message:
 *                       type: string
 *                       example: "Meeting in 1 hour"
 *                     syncWithContact:
 *                       type: boolean
 *                       description: If true, alarm triggers for both users
 *                       default: false
 *           examples:
 *             taskItem:
 *               summary: Task List Item
 *               value:
 *                 title: "Complete API Documentation"
 *                 description: "Add Swagger docs for all endpoints"
 *                 status: "in-progress"
 *                 priority: "high"
 *                 dueDate: "2024-12-15T18:00:00Z"
 *                 taskInfo:
 *                   assignee: "Dev Team"
 *                   estimatedHours: 8
 *                   checklist:
 *                     - item: "Contact endpoints"
 *                       completed: true
 *                     - item: "List endpoints"
 *                       completed: false
 *                   tags: ["documentation", "api"]
 *                 alarms:
 *                   - time: "2024-12-14T09:00:00Z"
 *                     type: "notification"
 *                     message: "Documentation due tomorrow"
 *                     syncWithContact: false
 *             onlineMeeting:
 *               summary: Online Meeting Item
 *               value:
 *                 title: "Client Review Meeting"
 *                 description: "Q1 Progress Review"
 *                 status: "pending"
 *                 priority: "high"
 *                 dueDate: "2024-12-10T14:00:00Z"
 *                 meetingInfo:
 *                   meetingType: "online"
 *                   meetingLink: "https://zoom.us/j/123456789"
 *                   participants: ["client@example.com", "team@example.com"]
 *                   agenda: "Review Q1 deliverables and discuss Q2 planning"
 *                   duration: 60
 *                 alarms:
 *                   - time: "2024-12-10T13:30:00Z"
 *                     type: "notification"
 *                     message: "Meeting starting in 30 minutes"
 *                     syncWithContact: true
 *                   - time: "2024-12-10T13:55:00Z"
 *                     type: "notification"
 *                     message: "Meeting starting in 5 minutes"
 *                     syncWithContact: true
 *             physicalMeeting:
 *               summary: Physical Meeting Item
 *               value:
 *                 title: "Office Meeting"
 *                 description: "Team sync"
 *                 status: "pending"
 *                 priority: "medium"
 *                 dueDate: "2024-12-12T10:00:00Z"
 *                 meetingInfo:
 *                   meetingType: "physical"
 *                   location: "Conference Room A, 5th Floor, Main Building"
 *                   participants: ["john@example.com", "jane@example.com"]
 *                   agenda: "Weekly team sync"
 *                   duration: 30
 *                 alarms:
 *                   - time: "2024-12-12T09:45:00Z"
 *                     type: "notification"
 *                     message: "Meeting in 15 minutes"
 *                     syncWithContact: true
 *             creditTransaction:
 *               summary: Credit Transaction Item
 *               value:
 *                 title: "Payment Received"
 *                 description: "Project milestone payment"
 *                 status: "completed"
 *                 transactionInfo:
 *                   amount: 50070
 *                   type: "credit"
 *                   category: "consulting"
 *                   paymentMethod: "bank transfer"
 *                   invoiceNumber: "INV-2024-001"
 *                   notes: "Milestone 1 completion"
 *             debitTransaction:
 *               summary: Debit Transaction Item
 *               value:
 *                 title: "Software License"
 *                 description: "Annual subscription renewal"
 *                 status: "pending"
 *                 dueDate: "2024-12-20T00:00:00Z"
 *                 transactionInfo:
 *                   amount: 1200
 *                   type: "debit"
 *                   category: "software"
 *                   paymentMethod: "credit card"
 *                   notes: "Auto-renew enabled"
 *                 alarms:
 *                   - time: "2024-12-19T10:00:00Z"
 *                     type: "notification"
 *                     message: "License renewal tomorrow"
 *             booking:
 *               summary: Booking/Appointment Item
 *               value:
 *                 title: "Doctor Appointment"
 *                 description: "Annual checkup"
 *                 status: "pending"
 *                 dueDate: "2024-12-18T15:00:00Z"
 *                 bookingInfo:
 *                   serviceType: "Medical Consultation"
 *                   location: "City Hospital, Room 302"
 *                   duration: 30
 *                   confirmationCode: "APPT-2024-5678"
 *                   notes: "Bring previous reports"
 *                 alarms:
 *                   - time: "2024-12-17T18:00:00Z"
 *                     type: "notification"
 *                     message: "Appointment tomorrow at 3 PM"
 *                   - time: "2024-12-18T14:30:00Z"
 *                     type: "notification"
 *                     message: "Appointment in 30 minutes"
 *     responses:
 *       200:
 *         description: Item added successfully
 *       404:
 *         description: Contact or list not found
 */
router.post('/:contactId/lists/:listId/items', authenticate, async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.contactId, owner: req.userId });
        if (!contact) return res.status(404).json({ error: 'Contact not found' });
        const list = await List.findOne({ _id: req.params.listId, owner: req.userId });
        if (!list || !contact.lists.includes(list._id)) return res.status(404).json({ error: 'List not found for this contact' });
        const item = { title: req.body.title, description: req.body.description, status: req.body.status || 'pending', priority: req.body.priority || 'medium', relatedContact: req.params.contactId, startDate: req.body.startDate, dueDate: req.body.dueDate, alarms: req.body.alarms || [] };
        if (list.listType === 'task' && req.body.taskInfo) item.taskInfo = req.body.taskInfo;
        if (list.listType === 'meeting' && req.body.meetingInfo) item.meetingInfo = req.body.meetingInfo;
        if (list.listType === 'transaction' && req.body.transactionInfo) item.transactionInfo = req.body.transactionInfo;
        if (list.listType === 'booking' && req.body.bookingInfo) item.bookingInfo = req.body.bookingInfo;
        list.items.push(item);
        await list.save();
        res.json({ message: 'Item added successfully', item: list.items[list.items.length - 1] });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:contactId/lists/:listId/items/:itemId', authenticate, async (req, res) => {
    try {
        const list = await List.findOne({ _id: req.params.listId, owner: req.userId });
        if (!list) return res.status(404).json({ error: 'List not found' });
        const item = list.items.id(req.params.itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        ['title', 'description', 'status', 'priority', 'startDate', 'dueDate', 'completedDate'].forEach(field => { if (req.body[field] !== undefined) item[field] = req.body[field]; });
        if (req.body.taskInfo) item.taskInfo = req.body.taskInfo;
        if (req.body.meetingInfo) item.meetingInfo = req.body.meetingInfo;
        if (req.body.transactionInfo) item.transactionInfo = req.body.transactionInfo;
        if (req.body.bookingInfo) item.bookingInfo = req.body.bookingInfo;
        await list.save();
        res.json({ message: 'Item updated successfully', item });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:contactId/lists/:listId/items/:itemId', authenticate, async (req, res) => {
    try {
        const list = await List.findOne({ _id: req.params.listId, owner: req.userId });
        if (!list) return res.status(404).json({ error: 'List not found' });
        list.items.id(req.params.itemId).remove();
        await list.save();
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

router.post('/:contactId/lists/:listId/items/:itemId/alarms', authenticate, async (req, res) => {
    try {
        const list = await List.findOne({ _id: req.params.listId, owner: req.userId });
        if (!list) return res.status(404).json({ error: 'List not found' });
        const item = list.items.id(req.params.itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        item.alarms.push({ time: req.body.time, type: req.body.type || 'notification', message: req.body.message, triggered: false });
        await list.save();
        res.json({ message: 'Alarm added successfully', item });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:contactId/lists/:listId/items/:itemId/alarms/:alarmId', authenticate, async (req, res) => {
    try {
        const list = await List.findOne({ _id: req.params.listId, owner: req.userId });
        if (!list) return res.status(404).json({ error: 'List not found' });
        const item = list.items.id(req.params.itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        item.alarms.id(req.params.alarmId).remove();
        await list.save();
        res.json({ message: 'Alarm removed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove alarm' });
    }
});

module.exports = router;

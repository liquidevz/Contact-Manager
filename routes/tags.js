const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const Category = require('../models/Category');

/**
 * @swagger
 * components:
 *   schemas:
 *     Tag:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Tag ID
 *         name:
 *           type: string
 *           description: Tag name
 *           example: JavaScript + React + MongoDB
 *         slug:
 *           type: string
 *           description: URL-friendly slug
 *           example: javascript-react-mongodb
 *         category:
 *           type: string
 *           enum: [geography-timing, people-roles, skills-tools, domain-category, content-format, intent-objectives, constraints-compliance, status-meta]
 *           description: Tag category
 *         subcategory:
 *           type: string
 *           description: Tag subcategory
 *           example: tech-stack
 *         type:
 *           type: string
 *           description: Tag type
 *         description:
 *           type: string
 *           description: Tag description
 *         aliases:
 *           type: array
 *           items:
 *             type: string
 *           description: Alternative names
 *         usageCount:
 *           type: number
 *           description: Number of times tag has been used
 *         metadata:
 *           type: object
 *           description: Additional metadata
 *         isActive:
 *           type: boolean
 *           description: Whether tag is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: Skills & Tools
 *         slug:
 *           type: string
 *           example: skills-tools
 *         description:
 *           type: string
 *         subcategories:
 *           type: array
 *           items:
 *             type: string
 *         icon:
 *           type: string
 *         color:
 *           type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: List all tags with pagination and filtering
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of tags to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of tags to skip
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: string
 *         description: Filter by subcategory
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [usageCount, -usageCount, createdAt, -createdAt, name, -name]
 *           default: -usageCount
 *         description: Sort field and order
 *     responses:
 *       200:
 *         description: List of tags
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tags:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tag'
 *                 total:
 *                   type: number
 *                 limit:
 *                   type: number
 *                 skip:
 *                   type: number
 */
router.get('/', async (req, res) => {
    try {
        const {
            limit = 20,
            skip = 0,
            category,
            subcategory,
            isActive,
            sort = '-usageCount'
        } = req.query;

        // Build filter
        const filter = {};
        if (category) filter.category = category;
        if (subcategory) filter.subcategory = subcategory;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        // Get tags with pagination
        const tags = await Tag.find(filter)
            .sort(sort)
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();

        const total = await Tag.countDocuments(filter);

        res.json({
            tags,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /tags/search:
 *   get:
 *     summary: Full-text search for tags
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tags:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tag'
 *                 total:
 *                   type: number
 *       400:
 *         description: Missing search query
 */
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Full-text search
        const tags = await Tag.find(
            { $text: { $search: q } },
            { score: { $meta: 'textScore' } }
        )
            .sort({ score: { $meta: 'textScore' } })
            .limit(parseInt(limit))
            .lean();

        res.json({
            tags,
            total: tags.length,
            query: q
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /tags/popular:
 *   get:
 *     summary: Get most popular tags by usage count
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of tags to return
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Popular tags
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tags:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tag'
 */
router.get('/popular', async (req, res) => {
    try {
        const { limit = 20, category } = req.query;

        const filter = { isActive: true };
        if (category) filter.category = category;

        const tags = await Tag.find(filter)
            .sort({ usageCount: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({ tags });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /tags/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ name: 1 })
            .lean();

        res.json({ categories });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /tags/categories/{slug}:
 *   get:
 *     summary: Get tags by category
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Tags in category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *                 tags:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tag'
 *                 total:
 *                   type: number
 *       404:
 *         description: Category not found
 */
router.get('/categories/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { limit = 20, skip = 0 } = req.query;

        const category = await Category.findOne({ slug }).lean();
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const tags = await Tag.find({ category: slug })
            .sort({ usageCount: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();

        const total = await Tag.countDocuments({ category: slug });

        res.json({
            category,
            tags,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /tags/categories/{categorySlug}/subcategories/{subcategory}:
 *   get:
 *     summary: Get tags by category and subcategory
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: categorySlug
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subcategory
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Tags in subcategory
 */
router.get('/categories/:categorySlug/subcategories/:subcategory', async (req, res) => {
    try {
        const { categorySlug, subcategory } = req.params;
        const { limit = 20, skip = 0 } = req.query;

        const tags = await Tag.find({
            category: categorySlug,
            subcategory: subcategory
        })
            .sort({ usageCount: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();

        const total = await Tag.countDocuments({
            category: categorySlug,
            subcategory: subcategory
        });

        res.json({
            tags,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /tags/slug/{slug}:
 *   get:
 *     summary: Get tag by slug
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag slug
 *     responses:
 *       200:
 *         description: Tag details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       404:
 *         description: Tag not found
 */
router.get('/slug/:slug', async (req, res) => {
    try {
        const tag = await Tag.findOne({ slug: req.params.slug }).lean();

        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        res.json(tag);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /tags/{id}:
 *   get:
 *     summary: Get tag by ID
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag ID
 *     responses:
 *       200:
 *         description: Tag details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       404:
 *         description: Tag not found
 */
router.get('/:id', async (req, res) => {
    try {
        const tag = await Tag.findById(req.params.id).lean();

        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        res.json(tag);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

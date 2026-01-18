require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const contactRoutes = require('./routes/contacts');
const listRoutes = require('./routes/lists');
const cardRoutes = require('./routes/card');
const tagRoutes = require('./routes/tags');
const searchRoutes = require('./routes/search');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Contact Manager API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
    }
}));

/**
 * @swagger
 * /:
 *   get:
 *     summary: API health check
 *     tags: [Health]
 *     description: Check if the API is running and get version information
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contact Manager API is running
 *                 version:
 *                   type: string
 *                   example: v1
 *                 apiVersion:
 *                   type: string
 *                   example: 1.0.0
 *                 documentation:
 *                   type: string
 *                   example: /api-docs
 *                 basePath:
 *                   type: string
 *                   example: /api/v1
 */
app.get('/', (req, res) => {
    res.json({
        message: 'Contact Manager API is running',
        version: process.env.API_VERSION || 'v1',
        apiVersion: '1.0.0',
        documentation: '/api-docs',
        basePath: `${process.env.API_BASE_PATH || '/api'}/${process.env.API_VERSION || 'v1'}`
    });
});

// Get API configuration from environment
const apiBasePath = process.env.API_BASE_PATH || '/api';
const apiVersion = process.env.API_VERSION || 'v1';
const versionedPath = `${apiBasePath}/${apiVersion}`;

// Mount versioned routes
app.use(`${versionedPath}/auth`, authRoutes);
app.use(`${versionedPath}/profile`, profileRoutes);
app.use(`${versionedPath}/contacts`, contactRoutes);
app.use(`${versionedPath}/contacts`, listRoutes); // Lists are nested under contacts
app.use(`${versionedPath}/card`, cardRoutes);
app.use(`${versionedPath}/tags`, tagRoutes);
app.use(`${versionedPath}/search`, searchRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Connect to database and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Get API configuration
        const apiBasePath = process.env.API_BASE_PATH || '/api';
        const apiVersion = process.env.API_VERSION || 'v1';
        const versionedPath = `${apiBasePath}/${apiVersion}`;

        // Start Express server
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════╗
║         Contact Manager API Server ${apiVersion.toUpperCase()}                   ║
╚════════════════════════════════════════════════════════╝

🚀 Server is running on port ${PORT}

📍 API Base URL: http://localhost:${PORT}
📖 API Documentation: http://localhost:${PORT}/api-docs
🏷️  API Version: ${apiVersion}

📋 Available Endpoints:
   • POST ${versionedPath}/auth/signup  - Register new user
   • POST ${versionedPath}/auth/login   - Login user
   • GET  ${versionedPath}/profile      - Get user profile
   • PUT  ${versionedPath}/profile      - Update profile
   
   📇 Contacts:
   • POST ${versionedPath}/contacts     - Create contact
   • GET  ${versionedPath}/contacts     - List contacts
   • POST ${versionedPath}/contacts/import - Import contacts
   
   📋 Lists (nested under contacts):
   • POST ${versionedPath}/contacts/:contactId/lists - Create list
   • GET  ${versionedPath}/contacts/:contactId/lists - Get lists
   • POST ${versionedPath}/contacts/:contactId/lists/:listId/items - Add item
   
   🎴 Business Card:
   • POST ${versionedPath}/card/generate - Generate card
   • GET  ${versionedPath}/card/view - View card image
   • GET  ${versionedPath}/card/download - Download PNG
   
   🏷️  Tags:
   • GET  ${versionedPath}/tags - List all tags
   • GET  ${versionedPath}/tags/search - Search tags
   • GET  ${versionedPath}/tags/popular - Popular tags
   • GET  ${versionedPath}/tags/categories - List categories

💡 Visit the Swagger UI for interactive API documentation
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;

const swaggerJsdoc = require('swagger-jsdoc');

// Get API configuration from environment
const apiBasePath = process.env.API_BASE_PATH || '/api';
const apiVersion = process.env.API_VERSION || 'v1';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: `Contact Manager API ${apiVersion.toUpperCase()}`,
            version: '1.0.0',
            description: `Contact Manager API ${apiVersion} with authentication, dynamic user types, share code system, and list management`,
            contact: {
                name: 'API Support',
                email: 'support@contactmanager.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}${apiBasePath}/${apiVersion}`,
                description: `Development server (${apiVersion})`
            },
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Base server URL'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token in the format: Bearer <token>'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'User ID'
                        },
                        fullName: {
                            type: 'string',
                            description: 'Full name of the user'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Email address'
                        },
                        mobileNo: {
                            type: 'string',
                            description: 'Mobile number'
                        },
                        profilePicture: {
                            type: 'string',
                            description: 'URL or path to profile picture'
                        },
                        professionType: {
                            type: 'string',
                            enum: ['salaried', 'freelancer', 'business', 'student'],
                            description: 'Type of profession'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message'
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./routes/*.js', './server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

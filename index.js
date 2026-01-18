/**
 * Contact Manager - Main Entry Point
 * 
 * This file serves as the main entry point for the Contact Manager system.
 * It exports all models, utilities, and configuration for easy integration.
 */

// Database Configuration
const connectDB = require('./config/database');

// Models
const User = require('./models/User');
const Contact = require('./models/Contact');
const List = require('./models/List');

// Utilities
const shareCodeGenerator = require('./utils/shareCodeGenerator');
const userValidator = require('./utils/userValidator');

// Export everything
module.exports = {
  // Database
  connectDB,
  
  // Models
  User,
  Contact,
  List,
  
  // Utilities
  shareCodeGenerator,
  userValidator
};

// If running directly, show usage information
if (require.main === module) {
  console.log(`
╔════════════════════════════════════════════════════════╗
║         Contact Manager - Node.js + MongoDB            ║
╚════════════════════════════════════════════════════════╝

📚 Usage:

  Import in your project:
    const { User, Contact, List, connectDB } = require('./index');

  Run examples:
    npm run demo          # Complete system demonstration
    npm run share-demo    # Share code system examples

  Connect to database:
    const { connectDB } = require('./index');
    await connectDB();

  Create a user:
    const { User } = require('./index');
    const user = new User({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'hashed-password',
      professionType: 'salaried'
    });
    await user.save();

📖 Documentation:
  See README.md for complete documentation

🚀 Quick Start:
  1. npm install
  2. Copy .env.example to .env
  3. Configure MongoDB connection
  4. npm run demo

  `);
}

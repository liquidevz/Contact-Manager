/**
 * Share Code System - Example Usage
 * Demonstrates how to use the 5-digit memorable code sharing system
 */

const User = require('../models/User');
const shareCodeGenerator = require('../utils/shareCodeGenerator');

/**
 * Example 1: Generate a share code for a user
 */
async function generateUserShareCode(userId) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate share code if not exists
    if (!user.shareCode) {
      await user.generateShareCode();
      await user.save();
      console.log(`✅ Share code generated: ${user.shareCode}`);
    } else {
      console.log(`ℹ️  Existing share code: ${user.shareCode}`);
    }
    
    return user.shareCode;
  } catch (error) {
    console.error('Error generating share code:', error.message);
    throw error;
  }
}

/**
 * Example 2: Share data with another user
 */
async function shareDataWithUser(ownerUserId, targetUserId, accessLevel = 'view') {
  try {
    const owner = await User.findById(ownerUserId);
    
    if (!owner) {
      throw new Error('Owner user not found');
    }
    
    // Share with target user
    const shareCode = await owner.shareWith(targetUserId, accessLevel);
    
    console.log(`✅ Data shared successfully!`);
    console.log(`📋 Share Code: ${shareCode}`);
    console.log(`🔐 Access Level: ${accessLevel}`);
    
    return shareCode;
  } catch (error) {
    console.error('Error sharing data:', error.message);
    throw error;
  }
}

/**
 * Example 3: Access another user's data via code
 */
async function accessDataViaCode(currentUserId, shareCode) {
  try {
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      throw new Error('Current user not found');
    }
    
    // Access data using share code
    const owner = await currentUser.accessViaCode(shareCode);
    
    console.log(`✅ Access granted!`);
    console.log(`👤 Owner: ${owner.fullName}`);
    console.log(`📧 Email: ${owner.email}`);
    console.log(`💼 Profession: ${owner.professionType}`);
    
    return owner;
  } catch (error) {
    console.error('Error accessing data:', error.message);
    throw error;
  }
}

/**
 * Example 4: Get all users who have access to my data
 */
async function getSharedWithUsers(userId) {
  try {
    const user = await User.findById(userId).populate('sharedWith.userId', 'fullName email');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    console.log(`📊 Users with access to ${user.fullName}'s data:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    user.sharedWith.forEach((share, index) => {
      console.log(`${index + 1}. ${share.userId.fullName} (${share.userId.email})`);
      console.log(`   Access Level: ${share.accessLevel}`);
      console.log(`   Shared At: ${share.sharedAt.toLocaleDateString()}`);
      console.log(`   ─────────────────────────────────────`);
    });
    
    return user.sharedWith;
  } catch (error) {
    console.error('Error getting shared users:', error.message);
    throw error;
  }
}

/**
 * Example 5: Get all data I'm accessing via codes
 */
async function getAccessingData(userId) {
  try {
    const user = await User.findById(userId).populate('accessingViaCode.ownerId', 'fullName email shareCode');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    console.log(`📊 Data ${user.fullName} is accessing:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    user.accessingViaCode.forEach((access, index) => {
      console.log(`${index + 1}. ${access.ownerId.fullName} (${access.ownerId.email})`);
      console.log(`   Code Used: ${access.code}`);
      console.log(`   Accessed At: ${access.accessedAt.toLocaleDateString()}`);
      console.log(`   ─────────────────────────────────────`);
    });
    
    return user.accessingViaCode;
  } catch (error) {
    console.error('Error getting accessing data:', error.message);
    throw error;
  }
}

/**
 * Example 6: Generate batch of memorable codes
 */
function generateBatchCodes(count = 10) {
  console.log(`🎲 Generating ${count} memorable share codes:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  const codes = shareCodeGenerator.generateBatch(count);
  
  codes.forEach((code, index) => {
    console.log(`${(index + 1).toString().padStart(2, '0')}. ${code}`);
  });
  
  return codes;
}

/**
 * Example 7: Validate share code format
 */
function validateShareCode(code) {
  const isValid = shareCodeGenerator.isValidCode(code);
  
  console.log(`🔍 Validating code: ${code}`);
  console.log(`Result: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  
  if (!isValid) {
    console.log(`ℹ️  Valid format: CVCVC (Consonant-Vowel-Consonant-Vowel-Consonant)`);
    console.log(`   Examples: BAFEK, TIGOL, MUPAN, ROXIB`);
  }
  
  return isValid;
}

/**
 * Example 8: Get share code statistics
 */
function getCodeStatistics() {
  const stats = shareCodeGenerator.getStatistics();
  
  console.log(`📊 Share Code System Statistics:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Pattern: ${stats.pattern}`);
  console.log(`Code Length: ${stats.codeLength} characters`);
  console.log(`Consonants Available: ${stats.consonantCount}`);
  console.log(`Vowels Available: ${stats.vowelCount}`);
  console.log(`Total Possible Codes: ${stats.totalPossibleCodes.toLocaleString()}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  return stats;
}

/**
 * Example 9: Generate code with custom prefix
 */
function generateCodeWithPrefix(prefix) {
  try {
    const code = shareCodeGenerator.generateWithPrefix(prefix);
    
    console.log(`✅ Generated code with prefix "${prefix}": ${code}`);
    
    return code;
  } catch (error) {
    console.error('Error generating code with prefix:', error.message);
    throw error;
  }
}

/**
 * Example 10: Complete sharing workflow
 */
async function completeShareWorkflow(user1Id, user2Id) {
  console.log(`\n🔄 Complete Sharing Workflow Demo`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  try {
    // Step 1: Generate share code for User 1
    console.log(`Step 1: Generating share code for User 1...`);
    const shareCode = await generateUserShareCode(user1Id);
    
    // Step 2: User 2 accesses User 1's data
    console.log(`\nStep 2: User 2 accessing User 1's data...`);
    const owner = await accessDataViaCode(user2Id, shareCode);
    
    // Step 3: Display shared data
    console.log(`\nStep 3: Displaying accessible data...`);
    console.log(`✅ Successfully connected!`);
    console.log(`📋 Share Code: ${shareCode}`);
    console.log(`👤 Owner: ${owner.fullName}`);
    console.log(`💼 Profession: ${owner.professionType}`);
    
    // Step 4: Show who has access
    console.log(`\nStep 4: Checking access list...`);
    await getSharedWithUsers(user1Id);
    
    console.log(`\n✅ Workflow completed successfully!\n`);
    
  } catch (error) {
    console.error('\n❌ Workflow failed:', error.message, '\n');
    throw error;
  }
}

// Export examples
module.exports = {
  generateUserShareCode,
  shareDataWithUser,
  accessDataViaCode,
  getSharedWithUsers,
  getAccessingData,
  generateBatchCodes,
  validateShareCode,
  getCodeStatistics,
  generateCodeWithPrefix,
  completeShareWorkflow
};

// If running directly
if (require.main === module) {
  console.log(`\n🎯 Share Code System Examples\n`);
  
  // Show statistics
  getCodeStatistics();
  
  console.log(`\n`);
  
  // Generate sample codes
  generateBatchCodes(10);
  
  console.log(`\n`);
  
  // Validate some codes
  validateShareCode('BAFEK');
  validateShareCode('12345');
  validateShareCode('AEIOU');
  
  console.log(`\n`);
  
  // Generate with prefix
  generateCodeWithPrefix('B');
  generateCodeWithPrefix('BZ');
}

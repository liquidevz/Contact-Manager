/**
 * User Validator Utility
 * Validates user data based on profession type and ensures required fields
 */

/**
 * Validate user data based on profession type
 * @param {object} userData - User data to validate
 * @returns {object} { isValid: boolean, errors: string[] }
 */
function validateUser(userData) {
  const errors = [];
  
  // Common required fields
  if (!userData.fullName || userData.fullName.trim() === '') {
    errors.push('Full name is required');
  }
  
  if (!userData.email || !isValidEmail(userData.email)) {
    errors.push('Valid email is required');
  }
  
  if (!userData.password || userData.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!userData.professionType) {
    errors.push('Profession type is required');
  } else if (!['salaried', 'freelancer', 'business', 'student'].includes(userData.professionType)) {
    errors.push('Invalid profession type');
  }
  
  // Profession-specific validation
  if (userData.professionType) {
    const professionErrors = validateProfessionFields(userData);
    errors.push(...professionErrors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate profession-specific fields
 * @param {object} userData - User data
 * @returns {string[]} Array of error messages
 */
function validateProfessionFields(userData) {
  const errors = [];
  
  switch (userData.professionType) {
    case 'salaried':
      // Optional fields - no strict validation
      if (userData.salariedInfo) {
        if (userData.salariedInfo.companyName && userData.salariedInfo.companyName.length > 200) {
          errors.push('Company name too long (max 200 characters)');
        }
      }
      break;
      
    case 'business':
    case 'freelancer':
      // Optional fields - no strict validation
      if (userData.businessInfo) {
        if (userData.businessInfo.businessName && userData.businessInfo.businessName.length > 200) {
          errors.push('Business name too long (max 200 characters)');
        }
      }
      break;
      
    case 'student':
      // Optional fields - no strict validation
      if (userData.studentInfo) {
        if (userData.studentInfo.year && (userData.studentInfo.year < 1 || userData.studentInfo.year > 10)) {
          errors.push('Year must be between 1 and 10');
        }
      }
      break;
  }
  
  return errors;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate mobile number format
 * @param {string} mobile - Mobile number to validate
 * @returns {boolean} True if valid
 */
function isValidMobile(mobile) {
  // Basic validation - adjust based on your requirements
  const mobileRegex = /^[\d\s\-\+\(\)]+$/;
  return mobile && mobile.length >= 10 && mobileRegex.test(mobile);
}

/**
 * Validate contact data
 * @param {object} contactData - Contact data to validate
 * @returns {object} { isValid: boolean, errors: string[] }
 */
function validateContact(contactData) {
  const errors = [];
  
  if (!contactData.name || contactData.name.trim() === '') {
    errors.push('Contact name is required');
  }
  
  if (!contactData.owner) {
    errors.push('Contact owner is required');
  }
  
  if (contactData.email && !isValidEmail(contactData.email)) {
    errors.push('Invalid email format');
  }
  
  if (contactData.mobileNumber && !isValidMobile(contactData.mobileNumber)) {
    errors.push('Invalid mobile number format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate list data
 * @param {object} listData - List data to validate
 * @returns {object} { isValid: boolean, errors: string[] }
 */
function validateList(listData) {
  const errors = [];
  
  if (!listData.name || listData.name.trim() === '') {
    errors.push('List name is required');
  }
  
  if (!listData.owner) {
    errors.push('List owner is required');
  }
  
  if (!listData.listType) {
    errors.push('List type is required');
  } else if (!['task', 'meeting', 'transaction', 'booking', 'custom'].includes(listData.listType)) {
    errors.push('Invalid list type');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate list item data
 * @param {object} itemData - List item data to validate
 * @param {string} listType - Type of list
 * @returns {object} { isValid: boolean, errors: string[] }
 */
function validateListItem(itemData, listType) {
  const errors = [];
  
  if (!itemData.title || itemData.title.trim() === '') {
    errors.push('Item title is required');
  }
  
  if (itemData.status && !['pending', 'in-progress', 'completed', 'cancelled'].includes(itemData.status)) {
    errors.push('Invalid status');
  }
  
  if (itemData.priority && !['low', 'medium', 'high', 'urgent'].includes(itemData.priority)) {
    errors.push('Invalid priority');
  }
  
  // Type-specific validation
  if (listType === 'transaction' && itemData.transactionInfo) {
    if (itemData.transactionInfo.amount && typeof itemData.transactionInfo.amount !== 'number') {
      errors.push('Transaction amount must be a number');
    }
  }
  
  if (listType === 'meeting' && itemData.meetingInfo) {
    if (itemData.startTime && itemData.endTime) {
      if (new Date(itemData.endTime) <= new Date(itemData.startTime)) {
        errors.push('Meeting end time must be after start time');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Get required fields for a profession type
 * @param {string} professionType - Type of profession
 * @returns {string[]} Array of required field names
 */
function getRequiredFieldsForProfession(professionType) {
  const baseFields = ['fullName', 'email', 'password', 'professionType'];
  
  // All profession-specific fields are optional in this schema
  return baseFields;
}

/**
 * Get optional fields for a profession type
 * @param {string} professionType - Type of profession
 * @returns {string[]} Array of optional field names
 */
function getOptionalFieldsForProfession(professionType) {
  const commonOptional = [
    'mobileNo',
    'profilePicture',
    'location',
    'customTags',
    'searchingFor',
    'lookingFor',
    'describeNeed',
    'whatYouWant',
    'whatYouCanOffer',
    'portfolio'
  ];
  
  switch (professionType) {
    case 'salaried':
      return [...commonOptional, 'companyName', 'companyLogo', 'designation', 'role'];
      
    case 'business':
    case 'freelancer':
      return [...commonOptional, 'businessName', 'businessLogo', 'businessBio', 'businessInterest'];
      
    case 'student':
      return [...commonOptional, 'collegeName', 'collegeLogo', 'degreeName', 'year'];
      
    default:
      return commonOptional;
  }
}

module.exports = {
  validateUser,
  validateProfessionFields,
  validateContact,
  validateList,
  validateListItem,
  isValidEmail,
  isValidMobile,
  sanitizeInput,
  getRequiredFieldsForProfession,
  getOptionalFieldsForProfession
};

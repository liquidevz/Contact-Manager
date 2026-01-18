/**
 * Share Code Generator Utility
 * Generates memorable 5-character codes using CVCVC pattern
 * (Consonant-Vowel-Consonant-Vowel-Consonant)
 * 
 * Examples: BAFEK, TIGOL, MUPAN, ROXIB, SAFED
 */

const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
const vowels = 'AEIOU';

/**
 * Generate a single random share code
 * @returns {string} 5-character code in CVCVC pattern
 */
function generateCode() {
  let code = '';
  
  // Pattern: C-V-C-V-C
  code += consonants[Math.floor(Math.random() * consonants.length)];
  code += vowels[Math.floor(Math.random() * vowels.length)];
  code += consonants[Math.floor(Math.random() * consonants.length)];
  code += vowels[Math.floor(Math.random() * vowels.length)];
  code += consonants[Math.floor(Math.random() * consonants.length)];
  
  return code;
}

/**
 * Generate a unique share code by checking against existing codes
 * @param {Function} checkExistence - Async function that checks if code exists
 * @returns {Promise<string>} Unique 5-character code
 */
async function generateUniqueCode(checkExistence) {
  let code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops
  
  while (!isUnique && attempts < maxAttempts) {
    code = generateCode();
    const exists = await checkExistence(code);
    
    if (!exists) {
      isUnique = true;
    }
    
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error('Failed to generate unique code after maximum attempts');
  }
  
  return code;
}

/**
 * Generate multiple codes at once
 * @param {number} count - Number of codes to generate
 * @returns {string[]} Array of codes
 */
function generateBatch(count) {
  const codes = new Set();
  
  while (codes.size < count) {
    codes.add(generateCode());
  }
  
  return Array.from(codes);
}

/**
 * Validate if a code matches the expected pattern
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid
 */
function isValidCode(code) {
  if (!code || code.length !== 5) {
    return false;
  }
  
  const upperCode = code.toUpperCase();
  
  // Check pattern: C-V-C-V-C
  return (
    consonants.includes(upperCode[0]) &&
    vowels.includes(upperCode[1]) &&
    consonants.includes(upperCode[2]) &&
    vowels.includes(upperCode[3]) &&
    consonants.includes(upperCode[4])
  );
}

/**
 * Calculate total possible combinations
 * @returns {number} Total possible unique codes
 */
function getTotalPossibleCodes() {
  // 21 consonants * 5 vowels * 21 consonants * 5 vowels * 21 consonants
  return Math.pow(consonants.length, 3) * Math.pow(vowels.length, 2);
}

/**
 * Generate a phonetically memorable code with custom patterns
 * @param {string} pattern - Pattern string (C for consonant, V for vowel)
 * @returns {string} Generated code
 */
function generateCustomPattern(pattern = 'CVCVC') {
  let code = '';
  
  for (let char of pattern.toUpperCase()) {
    if (char === 'C') {
      code += consonants[Math.floor(Math.random() * consonants.length)];
    } else if (char === 'V') {
      code += vowels[Math.floor(Math.random() * vowels.length)];
    } else {
      code += char; // Keep other characters as-is
    }
  }
  
  return code;
}

/**
 * Generate codes with specific prefixes for categorization
 * @param {string} prefix - 1-2 character prefix
 * @returns {string} Code with prefix
 */
function generateWithPrefix(prefix) {
  const remainingLength = 5 - prefix.length;
  
  if (remainingLength < 3) {
    throw new Error('Prefix too long, must leave at least 3 characters');
  }
  
  let code = prefix.toUpperCase();
  
  // Fill remaining with alternating pattern
  for (let i = 0; i < remainingLength; i++) {
    if (i % 2 === 0) {
      code += consonants[Math.floor(Math.random() * consonants.length)];
    } else {
      code += vowels[Math.floor(Math.random() * vowels.length)];
    }
  }
  
  return code;
}

/**
 * Get statistics about code generation
 * @returns {object} Statistics object
 */
function getStatistics() {
  return {
    totalPossibleCodes: getTotalPossibleCodes(),
    consonantCount: consonants.length,
    vowelCount: vowels.length,
    pattern: 'CVCVC',
    codeLength: 5
  };
}

module.exports = {
  generateCode,
  generateUniqueCode,
  generateBatch,
  isValidCode,
  getTotalPossibleCodes,
  generateCustomPattern,
  generateWithPrefix,
  getStatistics
};

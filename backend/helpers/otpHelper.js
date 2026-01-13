// backend/helpers/otpHelper.js

/**
 * Generate a 6-digit OTP
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * OTP storage (in-memory)
 * In production, use Redis or database
 */
const otpStore = new Map();

/**
 * Save OTP with expiry time (10 minutes)
 * @param {string} email 
 * @param {string} otp 
 */
export function saveOTP(email, otp) {
  const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(email.toLowerCase(), {
    otp,
    expiryTime,
    attempts: 0,
  });
  console.log(`📧 OTP saved for ${email}: ${otp} (expires in 10 min)`);
}

/**
 * Verify OTP
 * @param {string} email 
 * @param {string} otp 
 * @param {boolean} keepOtp - If true, do not delete OTP after valid check
 * @returns {boolean}
 */
export function verifyOTP(email, otp, keepOtp = false) {
  const stored = otpStore.get(email.toLowerCase());
  
  if (!stored) {
    return { valid: false, reason: 'OTP not found or expired' };
  }
  
  // Check expiry
  if (Date.now() > stored.expiryTime) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, reason: 'OTP expired' };
  }
  
  // Check attempts
  if (stored.attempts >= 5) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, reason: 'Too many failed attempts' };
  }
  
  // Verify OTP
  if (stored.otp === otp) {
    if (!keepOtp) {
      otpStore.delete(email.toLowerCase()); // Remove after successful verification
    }
    return { valid: true };
  } else {
    stored.attempts++;
    return { valid: false, reason: 'Invalid OTP' };
  }
}

/**
 * Clear OTP for an email
 * @param {string} email 
 */
export function clearOTP(email) {
  otpStore.delete(email.toLowerCase());
}

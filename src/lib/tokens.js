// -------------------------------------------------------------
// Token Utilities - Secure Random Tokens for Invitations
// -------------------------------------------------------------
//
// WHY THIS FILE EXISTS:
// Invitation links need tokens that:
//   1. Are UNPREDICTABLE (can't be guessed)
//   2. Have HIGH ENTROPY (can't be brute-forced)
//   3. Are URL-SAFE (no escaping needed)
//
// We use Node's crypto.randomBytes() — cryptographically
// secure randomness. This is different from Math.random() or
// cuid(), which are NOT suitable for security-sensitive
// tokens.
//
// WHAT WE GENERATE:
//   64-character hex string = 256 bits of entropy
//   Example: "a3f5c7e9b1d2...64 chars total"
//
// WHY NOT HASH THE TOKEN BEFORE STORING:
// Invitation tokens are short-lived (7 days) and single-use.
// Storing them plaintext is fine — GitHub, Slack, and Vercel
// all do this. Hashing would prevent us from looking them up
// by token value directly.
// -------------------------------------------------------------

import crypto from 'crypto';

// -------------------------------------------------------------
// GENERATE TOKEN
// -------------------------------------------------------------
// Returns a 64-character hex string (32 random bytes).
//
// Why 32 bytes?
//   - 32 bytes = 256 bits of entropy
//   - Brute-forcing 2^256 possibilities is impossible
//   - 64 hex chars is short enough for URLs
//
// Why hex instead of base64?
//   - No `+`, `/`, or `=` characters to escape in URLs
//   - Lowercase-only: no case-sensitivity issues in emails
//   - Slightly longer, but clearer and safer
export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// -------------------------------------------------------------
// GET EXPIRY DATE
// -------------------------------------------------------------
// Returns a Date object 7 days from now (by default).
// The DB stores this on invitation.expiresAt.
//
// We default to 7 days because:
//   - Long enough for people to see the email
//   - Short enough that a leaked link can't be used forever
//   - Standard for the industry (Slack, Linear, GitHub all
//     use 3-7 days for workspace invites)
export function getTokenExpiry(days = 7) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

// -------------------------------------------------------------
// CHECK IF A TOKEN IS EXPIRED
// -------------------------------------------------------------
// Given a Date (from invitation.expiresAt), return true if
// it's in the past.
export function isTokenExpired(expiresAt) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}
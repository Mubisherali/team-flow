// -------------------------------------------------------------
// Cloudinary Helper - Server-Side Signing
// -------------------------------------------------------------
//
// WHY THIS FILE:
// Cloudinary signed uploads require a signature generated with
// the API_SECRET. That secret must NEVER reach the browser, so
// signing happens here on the server.
//
// WHAT IT PROVIDES:
//   generateUploadSignature(params)
//     → returns { signature, timestamp, ... } for the client
//
// HOW THE FLOW WORKS:
//   1. Client: POST /api/upload/sign
//   2. This file: builds params, signs them
//   3. Client: receives { signature, apiKey, timestamp, folder, ... }
//   4. Client: POSTs file + params + signature to Cloudinary
//   5. Cloudinary: verifies signature, stores file, returns URL
//   6. Client: PUTs the URL to /api/users/me to update avatar
//
// NOT USING THE CLOUDINARY SDK:
//   The official cloudinary npm package is heavy (~1 MB). For
//   signing only, we just need Node's crypto module. Keeping
//   the dependency footprint small.
// -------------------------------------------------------------

import crypto from 'crypto';

// -------------------------------------------------------------
// CONFIG CHECK
// -------------------------------------------------------------
// Fail loudly at call time (not import time) if env is missing.
function getConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      '[cloudinary] Missing env vars. Set CLOUDINARY_CLOUD_NAME, ' +
        'CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }

  return { cloudName, apiKey, apiSecret };
}

// -------------------------------------------------------------
// GENERATE UPLOAD SIGNATURE
// -------------------------------------------------------------
// Given a set of upload parameters, returns the signed payload
// the client can send to Cloudinary.
//
// PARAMS WE SIGN:
//   - timestamp : seconds since epoch (must be recent — Cloudinary
//                 rejects signatures older than 1 hour)
//   - folder    : where in Cloudinary to store the file
//   - (optional) eager : transformation instructions
//
// HOW SIGNING WORKS:
//   1. Sort params alphabetically by key
//   2. Build "key1=value1&key2=value2" string
//   3. Append the API_SECRET
//   4. SHA-1 hash
//   5. That hash is the signature
//
// Cloudinary does the same thing server-side and compares.
export function generateUploadSignature({ folder } = {}) {
  const { cloudName, apiKey, apiSecret } = getConfig();

  const timestamp = Math.round(Date.now() / 1000);

  // Params to include in the signature. Order doesn't matter here —
  // we sort them before hashing.
  const paramsToSign = {
    timestamp,
    ...(folder && { folder }),
  };

  // Build the string to hash: sorted key=value pairs joined by &.
  const signatureString =
    Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join('&') + apiSecret;

  // HMAC-SHA1 hex digest
  const signature = crypto
    .createHash('sha1')
    .update(signatureString)
    .digest('hex');

  // Return everything the client needs (except the secret).
  return {
    signature,
    timestamp,
    ...(folder && { folder }),
    apiKey,
    cloudName,
    // Client-safe upload URL:
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  };
}

// -------------------------------------------------------------
// HELPER — folder path for user avatars
// -------------------------------------------------------------
// Centralized so we can change it in one place later.
export function avatarFolder() {
  return 'teamflow/avatars';
}
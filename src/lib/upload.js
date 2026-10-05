// -------------------------------------------------------------
// Upload Helper - Client-side Cloudinary Upload
// -------------------------------------------------------------
//
// WHAT THIS FILE DOES:
// Handles the full client-side flow for uploading an image:
//   1. Client-side validation (type + size)
//   2. Fetch a signature from our server (/api/upload/sign)
//   3. Build FormData for Cloudinary
//   4. POST to Cloudinary's upload endpoint
//   5. Return the secure_url
//
// WHY NOT USE THE CLOUDINARY SDK:
// The cloudinary npm package's browser SDK is heavy. For a single
// upload, plain fetch + FormData is simpler, smaller, and gives
// us full control over errors.
//
// USED BY:
//   - AvatarUpload.jsx (in the settings phase)
//   - Any future file-upload UI
// -------------------------------------------------------------

// -------------------------------------------------------------
// CONSTANTS
// -------------------------------------------------------------
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// -------------------------------------------------------------
// MAIN UPLOAD FUNCTION
// -------------------------------------------------------------
// uploadImage(file, options)
//   file:    File object from an <input type="file">
//   options: { folder: 'teamflow/avatars' } (optional)
//
// Returns:
//   { secureUrl, publicId, width, height, format } on success
//
// Throws:
//   Error with a user-friendly message on any failure
export async function uploadImage(file, options = {}) {
  // ─── Step 1: Client-side validation ───
  if (!file) {
    throw new Error('No file provided');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG, WebP, or GIF image');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Image must be smaller than ${MAX_FILE_SIZE_MB}MB`);
  }

  // ─── Step 2: Get a signature from our server ───
  let signData;
  try {
    const signRes = await fetch('/api/upload/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: options.folder }),
    });

    if (!signRes.ok) {
      const err = await signRes.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to get upload permission');
    }

    signData = await signRes.json();
  } catch (err) {
    console.error('[UPLOAD_SIGN]', err);
    throw new Error('Could not prepare upload. Please try again.');
  }

  // ─── Step 3: Build FormData for Cloudinary ───
  // The order matters for some browsers but not for correctness.
  // Cloudinary reads everything by key, not position.
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signData.apiKey);
  formData.append('timestamp', signData.timestamp);
  formData.append('signature', signData.signature);
  if (signData.folder) {
    formData.append('folder', signData.folder);
  }

  // ─── Step 4: Upload to Cloudinary ───
  let uploadData;
  try {
    const uploadRes = await fetch(signData.uploadUrl, {
      method: 'POST',
      body: formData,
      // ⚠️ DO NOT set Content-Type — the browser sets it
      // automatically with the correct multipart boundary.
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      console.error('[CLOUDINARY_UPLOAD]', err);
      throw new Error(
        err?.error?.message || 'Upload failed. Please try again.'
      );
    }

    uploadData = await uploadRes.json();
  } catch (err) {
    console.error('[UPLOAD_FETCH]', err);
    if (err.message?.includes('Upload failed')) throw err;
    throw new Error('Upload failed. Please try again.');
  }

  // ─── Step 5: Return a clean result ───
  return {
    secureUrl: uploadData.secure_url,
    publicId: uploadData.public_id,
    width: uploadData.width,
    height: uploadData.height,
    format: uploadData.format,
  };
}

// -------------------------------------------------------------
// HELPERS — for UI use
// -------------------------------------------------------------
export const UPLOAD_RULES = {
  maxSizeMB: MAX_FILE_SIZE_MB,
  allowedTypes: ALLOWED_TYPES,
  // Display string for "JPG, PNG, WebP, or GIF, max 2MB"
  description: 'JPG, PNG, WebP, or GIF · max 2MB',
};
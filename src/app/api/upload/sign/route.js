// -------------------------------------------------------------
// /api/upload/sign - Cloudinary Upload Signature
// -------------------------------------------------------------
//
// POST: Returns a signed payload the client can use to upload
//       an image directly to Cloudinary.
//
// AUTH: Must be logged in.
//
// FLOW:
//   1. Client: POST /api/upload/sign { folder?: "teamflow/avatars" }
//   2. This route: calls generateUploadSignature()
//   3. Client: receives { signature, timestamp, apiKey, cloudName, uploadUrl, folder? }
//   4. Client: POSTs file + params + signature to Cloudinary
//
// SECURITY:
//   - Signature uses CLOUDINARY_API_SECRET (never sent to client)
//   - We sign { timestamp, folder } — no arbitrary fields
//   - Rate limiting could be added here later; not needed for MVP
//
// WHY NO FILE SIZE LIMIT HERE:
//   Cloudinary enforces upload limits server-side (free tier: 10MB per file).
//   Our client enforces 2MB. No need to re-implement here.
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { generateUploadSignature, avatarFolder } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    // ─── Step 1: Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ─── Step 2: Parse optional folder from body ───
    // We only accept a folder, and only allow a small allowlist
    // of destinations. This prevents a malicious client from
    // using our signature to upload to arbitrary paths.
    let requestedFolder;
    try {
      const body = await request.json();
      requestedFolder = body?.folder;
    } catch {
      // Empty body or malformed JSON is fine — folder stays undefined.
      requestedFolder = undefined;
    }

    // Allowlist — only these folders can be used by the client.
    const ALLOWED_FOLDERS = [avatarFolder()]; // ['teamflow/avatars']

    let folder;
    if (requestedFolder !== undefined) {
      if (!ALLOWED_FOLDERS.includes(requestedFolder)) {
        return NextResponse.json(
          { error: 'Invalid upload destination' },
          { status: 400 }
        );
      }
      folder = requestedFolder;
    }

    // ─── Step 3: Generate signature ───
    const signature = generateUploadSignature({ folder });

    // ─── Step 4: Return to client ───
    // Never includes apiSecret.
    return NextResponse.json(signature);
  } catch (error) {
    console.error('[UPLOAD_SIGN_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
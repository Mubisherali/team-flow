// -------------------------------------------------------------
// Slug Utilities
// -------------------------------------------------------------
//
// WHY SLUGS:
// URLs like /workspaces/nova-tech are way better than
// /workspaces/clx1a2b3c4d5e. Readable, shareable, memorable.
//
// WHAT A SLUG IS:
// A URL-safe version of a name:
//   "NOVA TECH"        → "nova-tech"
//   "My  Awesome Team" → "my-awesome-team"
//   "Café & Co."       → "cafe-co"
//   "  Spaces  "       → "spaces"
//
// RULES:
//   - Lowercase only
//   - Letters, numbers, hyphens
//   - No leading/trailing/consecutive hyphens
//   - Max 50 characters
//
// UNIQUENESS:
// Slugs must be unique in the DB (see @unique on Workspace.slug).
// generateUniqueSlug() appends -1, -2, -3 etc. until it finds
// one that isn't taken.
// -------------------------------------------------------------

import { prisma } from '@/lib/prisma';

// -------------------------------------------------------------
// BASIC SLUGIFY
// -------------------------------------------------------------
// Convert any string into a URL-safe slug.
//
// Why not use a library?
// - The logic is simple enough to write ourselves
// - No extra dependency
// - Full control over behavior
export function slugify(text) {
  if (!text) return '';

  return (
    text
      .toString()
      // Normalize unicode: "é" → "e", "ñ" → "n"
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // strip accent marks

      // Lowercase
      .toLowerCase()

      // Replace anything that isn't a-z, 0-9, or space/hyphen
      // with a hyphen (handles "&", "!", "?", etc.)
      .replace(/[^a-z0-9\s-]/g, '')

      // Replace one or more spaces/hyphens with a single hyphen
      .replace(/[\s-]+/g, '-')

      // Trim leading/trailing hyphens
      .replace(/^-+|-+$/g, '')

      // Truncate to 50 chars (good URL length)
      .slice(0, 50)
  );
}

// -------------------------------------------------------------
// GENERATE UNIQUE SLUG
// -------------------------------------------------------------
// Uses slugify() as a base, then checks the DB for collisions.
// If "nova-tech" exists, tries "nova-tech-1", "nova-tech-2" etc.
//
// Returns the first available slug.
//
// Why async? Because we check the DB for existence.
export async function generateUniqueSlug(name) {
  const base = slugify(name) || 'workspace'; // fallback if name is all symbols

  // Try the base slug first.
  let candidate = base;
  let suffix = 1;

  // Loop until we find a free slug.
  // We cap at 100 attempts to prevent infinite loops in pathological cases.
  while (suffix < 100) {
    const existing = await prisma.workspace.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    // Taken → try next: "nova-tech-1", "nova-tech-2", ...
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  // Extremely unlikely to reach here. Throw rather than silently fail.
  throw new Error('Could not generate a unique slug after 100 attempts');
}
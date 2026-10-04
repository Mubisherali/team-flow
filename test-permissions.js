// Copy these temporarily to test WITHOUT importing Prisma.
// These are the same logic as in src/lib/permissions.js.

function isOwner(role) { return role === 'OWNER'; }
function isManagerOrOwner(role) { return role === 'OWNER' || role === 'MANAGER'; }
function isMember(role) { return role === 'OWNER' || role === 'MANAGER' || role === 'MEMBER'; }
function canDeleteWorkspace(role) { return isOwner(role); }
function canInviteMembers(role) { return isManagerOrOwner(role); }
function canCreateProjects(role) { return isManagerOrOwner(role); }

console.log('--- OWNER ---');
console.log('canDelete:', canDeleteWorkspace('OWNER'));   // true
console.log('canInvite:', canInviteMembers('OWNER'));     // true

console.log('\n--- MANAGER ---');
console.log('canDelete:', canDeleteWorkspace('MANAGER')); // false
console.log('canInvite:', canInviteMembers('MANAGER'));   // true

console.log('\n--- MEMBER ---');
console.log('canInvite:', canInviteMembers('MEMBER'));    // false

console.log('\n--- NULL ---');
console.log('canDelete:', canDeleteWorkspace(null));      // false
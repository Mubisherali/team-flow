const { createWorkspaceSchema } = require('./src/lib/validators/workspace');

console.log('Test 1 (valid):', createWorkspaceSchema.safeParse({
  name: 'NOVA TECH',
  description: 'Our team workspace',
}).success); // true

console.log('Test 2 (short name):', createWorkspaceSchema.safeParse({
  name: 'A',
}).success); // false

console.log('Test 3 (no description):', createWorkspaceSchema.safeParse({
  name: 'NOVA TECH',
}).success); // true

console.log('Test 4 (empty description):', createWorkspaceSchema.safeParse({
  name: 'NOVA TECH',
  description: '',
}).success); // true
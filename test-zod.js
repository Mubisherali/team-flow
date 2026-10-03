const { registerSchema } = require('./src/lib/validators/auth');

// Test 1: Valid data
console.log('Test 1 (valid):', registerSchema.safeParse({
  name: 'Ahmed',
  email: 'ahmed@test.com',
  password: 'password123',
  confirmPassword: 'password123',
}).success); // expected: true

// Test 2: Password without number
console.log('Test 2 (no number):', registerSchema.safeParse({
  name: 'Ahmed',
  email: 'ahmed@test.com',
  password: 'passwordonly',
  confirmPassword: 'passwordonly',
}).success); // expected: false

// Test 3: Passwords don't match
console.log('Test 3 (mismatch):', registerSchema.safeParse({
  name: 'Ahmed',
  email: 'ahmed@test.com',
  password: 'password123',
  confirmPassword: 'password456',
}).success); // expected: false
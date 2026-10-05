const { invitationEmail } = require('./src/lib/email-templates');

const email = invitationEmail({
  inviterName: 'Mubisher Ahmed',
  workspaceName: 'NOVA TECH',
  roleName: 'MEMBER',
  inviteLink: 'https://team-flow-ashen-five.vercel.app/invite/abc123def456',
  expiresInDays: 7,
});

console.log('SUBJECT:', email.subject);
console.log('\n--- PLAIN TEXT ---\n');
console.log(email.text);
console.log('\n--- HTML length:', email.html.length, 'chars ---');

// Write HTML to a file so you can open it in the browser
const fs = require('fs');
fs.writeFileSync('test-email.html', email.html);
console.log('\n✓ Open test-email.html in your browser to preview');
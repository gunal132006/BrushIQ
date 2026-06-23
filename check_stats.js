const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, 'backend/src/db/local_db.json');
if (!fs.existsSync(dbFile)) {
  console.log('Database file not found at:', dbFile);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));

const members = db.family_members || [];
const brushes = db.toothbrushes || [];

const totalMembers = members.length;
const totalBrushes = brushes.length;

// Count how many family members have at least one toothbrush assigned
const assignedMemberIds = new Set(brushes.map(b => b.family_member_id));
const assignedMembersCount = members.filter(m => assignedMemberIds.has(m.id)).length;
const missingAssignments = totalMembers - assignedMembersCount;

console.log('====================================');
console.log('       BRUSHIQ DATABASE STATS       ');
console.log('====================================');
console.log('Total Family Members:      ', totalMembers);
console.log('Total Toothbrushes:        ', totalBrushes);
console.log('Assigned Family Members:   ', assignedMembersCount);
console.log('Members Missing Brushes:   ', missingAssignments);
console.log('====================================');
if (missingAssignments > 0) {
  console.log('List of members missing a toothbrush:');
  members.forEach(m => {
    if (!assignedMemberIds.has(m.id)) {
      console.log(`- ${m.name} (${m.relationship}) | User ID: ${m.user_id}`);
    }
  });
}
console.log('====================================');

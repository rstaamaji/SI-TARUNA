import prisma from '../src/utils/prisma';
import { after } from 'node:test';
import { runAuthTests } from './auth.test';
import { runAuthorizationTests } from './authorization.test';
import { runMemberTests } from './member.test';
import { runFinanceTests } from './finance.test';
import { runAttendanceTests } from './attendance.test';
import { runAnnouncementTests } from './announcement.test';
import { runArisanTests } from './arisan.test';
import { runJimpitanTests } from './jimpitan.test';
import { runNotificationTests } from './notification.test';

console.log('===============================================================');
console.log('🧪 SI-TARUNA Comprehensive Backend Test Suite (Module 29)');
console.log('===============================================================\n');

// 1. Authentication
runAuthTests();

// 2. Authorization
runAuthorizationTests();

// 3. Member CRUD & Profile
runMemberTests();

// 4. Finance & Cash Withdrawal
runFinanceTests();

// 5. Attendance & Statistics
runAttendanceTests();

// 6. Announcements
runAnnouncementTests();

// 7. Arisan Management
runArisanTests();

// 8. Jimpitan Management
runJimpitanTests();

// 9. Notifications
runNotificationTests();

after(async () => {
  await prisma.$disconnect();
});

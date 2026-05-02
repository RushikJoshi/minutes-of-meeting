const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Membership = require('../models/Membership');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Find users to delete
    const usersToDelete = await User.find({ email: { $ne: 'admin@gmail.com' } });
    const userIds = usersToDelete.map(u => u._id);
    
    if (userIds.length === 0) {
      console.log('No other users found to delete.');
      return;
    }
    
    // 2. Delete their memberships
    await Membership.deleteMany({ userId: { $in: userIds } });
    
    // 3. Delete the users
    const result = await User.deleteMany({ _id: { $in: userIds } });
    
    console.log(`Successfully deleted ${result.deletedCount} users.`);
    console.log('Deleted emails:', usersToDelete.map(u => u.email).join(', '));
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

cleanup();

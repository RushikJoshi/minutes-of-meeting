const mongoose = require('mongoose');
require('dotenv').config();
const ActionItem = require('../models/ActionItem');
const Meeting = require('../models/Meeting');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const overdue = await ActionItem.find({ 
      status: 'pending', 
      deadline: { $lt: new Date() } 
    }).populate('meetingId', 'title');
    
    console.log('--- Overdue Action Items ---');
    overdue.forEach((item, index) => {
      console.log(`${index + 1}. Title: ${item.title || item.task}`);
      console.log(`   Meeting: ${item.meetingId?.title || 'Unknown'}`);
      console.log(`   Assigned To: ${item.assignedTo || 'Unassigned'}`);
      console.log(`   Deadline: ${item.deadline.toDateString()}`);
      console.log('---------------------------');
    });
    
    if (overdue.length === 0) {
      console.log('No overdue items found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();

const mongoose = require('mongoose');
const path = require('path');

// Load Meeting model
const Meeting = require('./server/models/Meeting');

async function fixMeetings() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gt_mom');
    console.log("Connected to MongoDB");

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const result = await Meeting.updateMany(
      { 
        date: { $lt: now }, 
        status: { $ne: 'completed' } 
      }, 
      { 
        $set: { status: 'completed' } 
      }
    );

    console.log(`Success: Found and marked ${result.modifiedCount} old meetings as completed.`);
    process.exit(0);
  } catch (err) {
    console.error("Error fixing meetings:", err);
    process.exit(1);
  }
}

fixMeetings();

const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');

async function checkMeetings() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gt_mom');
    console.log("Connected to MongoDB");

    const meetings = await Meeting.find({ status: { $ne: 'completed' } }).limit(5);
    console.log("Current non-completed meetings in DB:");
    meetings.forEach(m => {
      console.log(`- Title: ${m.title}, Date: ${m.date}, Status: ${m.status}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkMeetings();

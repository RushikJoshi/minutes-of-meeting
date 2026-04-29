require('dotenv').config();
const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');

async function fixMeetings() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI not found in .env");

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB Atlas successfully!");

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

    console.log(`[FIX] Marked ${result.modifiedCount} old meetings as completed.`);
    process.exit(0);
  } catch (err) {
    console.error("Error fixing meetings:", err);
    process.exit(1);
  }
}

fixMeetings();

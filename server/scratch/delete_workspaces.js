const mongoose = require('mongoose');
require('dotenv').config();
const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const namesToDelete = ['emloyee', 'My Office'];
    const workspaces = await Workspace.find({ name: { $in: namesToDelete } });
    
    if (workspaces.length === 0) {
      console.log('No workspaces found with those names.');
      return;
    }
    
    const ids = workspaces.map(w => w._id);
    
    // Delete memberships first
    await Membership.deleteMany({ workspaceId: { $in: ids } });
    
    // Delete workspaces
    await Workspace.deleteMany({ _id: { $in: ids } });
    
    console.log(`Successfully deleted ${workspaces.length} workspaces: ${workspaces.map(w => w.name).join(', ')}`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

cleanup();

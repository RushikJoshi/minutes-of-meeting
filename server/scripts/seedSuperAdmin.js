const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB...");

    const email = "superadmin@gitakshmi.com";
    const password = "superadmin123";

    let user = await User.findOne({ email });
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 12);
      user = await User.create({
        email,
        name: "Product Super Admin",
        passwordHash,
        role: "product_super_admin",
        // Notice organizationId is intentionally omitted/null
      });
      console.log("✅ Super Admin created!");
    } else {
      user.role = "product_super_admin";
      user.organizationId = undefined; // Ensure no org bound
      const passwordHash = await bcrypt.hash(password, 12);
      user.passwordHash = passwordHash;
      await user.save();
      console.log("✅ Existing user updated to Super Admin!");
    }

    console.log(`
    🎉 You can now log in with:
    Email: ${email}
    Password: ${password}
    `);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

seed();

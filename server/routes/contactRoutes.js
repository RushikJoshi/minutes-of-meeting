const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireWorkspace } = require("../middlewares/workspaceMiddleware");
const {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getContactGroups,
  createContactGroup,
  updateContactGroup,
  deleteContactGroup,
} = require("../controllers/contactController");

const router = express.Router();

router.use(requireAuth);
router.use(requireWorkspace);

// Group Routes
router.get("/groups", getContactGroups);
router.post("/groups", createContactGroup);
router.put("/groups/:id", updateContactGroup);
router.delete("/groups/:id", deleteContactGroup);

// Contact Routes
router.get("/", getContacts);
router.post("/", createContact);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

module.exports = router;

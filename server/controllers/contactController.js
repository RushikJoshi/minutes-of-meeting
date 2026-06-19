const Contact = require("../models/Contact");
const ContactGroup = require("../models/ContactGroup");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Get all contacts for a organization (with optional search)
// @route   GET /api/contacts
const getContacts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const organizationId = req.organization._id;

  let query = { organization: organizationId };

  if (q) {
    const searchRegex = new RegExp(q, "i");
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { department: searchRegex },
      { company: searchRegex },
    ];
  }

  const contacts = await Contact.find(query).sort({ name: 1 });
  res.json(contacts);
});

// @desc    Create a new contact
// @route   POST /api/contacts
const createContact = asyncHandler(async (req, res) => {
  const { name, email, phone, designation, department, company, notes } = req.body;
  const organizationId = req.organization._id;

  // Check if email already exists in organization
  const existingContact = await Contact.findOne({ organization: organizationId, email: email.toLowerCase() });
  if (existingContact) {
    const err = new Error("Contact with this email already exists in the organization");
    err.statusCode = 400;
    throw err;
  }

  const contact = await Contact.create({
    organization: organizationId,
    createdBy: req.user._id,
    name,
    email: email.toLowerCase(),
    phone,
    designation,
    department,
    company,
    notes,
    source: "manual",
  });

  res.status(201).json(contact);
});

// @desc    Update a contact
// @route   PUT /api/contacts/:id
const updateContact = asyncHandler(async (req, res) => {
  const { name, email, phone, designation, department, company, notes } = req.body;
  const organizationId = req.organization._id;

  let contact = await Contact.findOne({ _id: req.params.id, organization: organizationId });
  if (!contact) {
    const err = new Error("Contact not found");
    err.statusCode = 404;
    throw err;
  }

  if (email && email.toLowerCase() !== contact.email) {
    const existingContact = await Contact.findOne({ organization: organizationId, email: email.toLowerCase() });
    if (existingContact) {
      const err = new Error("Another contact with this email already exists");
      err.statusCode = 400;
      throw err;
    }
    contact.email = email.toLowerCase();
  }

  if (name) contact.name = name;
  if (phone !== undefined) contact.phone = phone;
  if (designation !== undefined) contact.designation = designation;
  if (department !== undefined) contact.department = department;
  if (company !== undefined) contact.company = company;
  if (notes !== undefined) contact.notes = notes;

  await contact.save();
  res.json(contact);
});

// @desc    Delete a contact
// @route   DELETE /api/contacts/:id
const deleteContact = asyncHandler(async (req, res) => {
  const organizationId = req.organization._id;
  const contact = await Contact.findOne({ _id: req.params.id, organization: organizationId });

  if (!contact) {
    const err = new Error("Contact not found");
    err.statusCode = 404;
    throw err;
  }

  // Remove contact from all groups in this organization
  await ContactGroup.updateMany(
    { organization: organizationId },
    { $pull: { members: contact._id } }
  );

  await contact.deleteOne();
  res.json({ message: "Contact deleted successfully" });
});

// ==========================================
// GROUP MANAGEMENT
// ==========================================

// @desc    Get all contact groups
// @route   GET /api/contacts/groups
const getContactGroups = asyncHandler(async (req, res) => {
  const groups = await ContactGroup.find({ organization: req.organization._id })
    .populate("members")
    .sort({ groupName: 1 });
  res.json(groups);
});

// @desc    Create a contact group
// @route   POST /api/contacts/groups
const createContactGroup = asyncHandler(async (req, res) => {
  const { groupName, description, members } = req.body;
  const organizationId = req.organization._id;

  const group = await ContactGroup.create({
    organization: organizationId,
    createdBy: req.user._id,
    groupName,
    description,
    members: members || [],
  });

  const populatedGroup = await group.populate("members");
  res.status(201).json(populatedGroup);
});

// @desc    Update a contact group
// @route   PUT /api/contacts/groups/:id
const updateContactGroup = asyncHandler(async (req, res) => {
  const { groupName, description, members } = req.body;
  const organizationId = req.organization._id;

  let group = await ContactGroup.findOne({ _id: req.params.id, organization: organizationId });
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }

  if (groupName) group.groupName = groupName;
  if (description !== undefined) group.description = description;
  if (members) group.members = members;

  await group.save();
  const populatedGroup = await group.populate("members");
  res.json(populatedGroup);
});

// @desc    Delete a contact group
// @route   DELETE /api/contacts/groups/:id
const deleteContactGroup = asyncHandler(async (req, res) => {
  const group = await ContactGroup.findOne({ _id: req.params.id, organization: req.organization._id });
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }

  await group.deleteOne();
  res.json({ message: "Group deleted successfully" });
});

module.exports = {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getContactGroups,
  createContactGroup,
  updateContactGroup,
  deleteContactGroup,
};

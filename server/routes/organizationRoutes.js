const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const { validateBody } = require("../middlewares/validateMiddleware");
const { 
  listOrganizations, 
  getOrganizationById, 
  createOrganization, 
  updateOrganization, 
  deleteOrganization 
} = require("../controllers/organizationController");

const router = express.Router();

// All organization routes require product_super_admin
router.use("/organizations", requireAuth, authorizeRoles("product_super_admin"));

router.get("/organizations", listOrganizations);
router.get("/organizations/:id", getOrganizationById);
router.post(
  "/organizations",
  validateBody(z.object({ 
    name: z.string().min(1),
    organizationCode: z.string().min(1),
    adminName: z.string().min(1),
    adminEmail: z.string().email(),
    logo: z.string().optional(),
    industry: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional()
  })),
  createOrganization
);
router.put("/organizations/:id", updateOrganization);
router.delete("/organizations/:id", deleteOrganization);

module.exports = router;


const express = require("express");
const { getSuperAdminDashboard } = require("../controllers/superAdminDashboardController");
const { getOrgDashboard } = require("../controllers/orgDashboardController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const { requireOrganization } = require("../middlewares/organizationMiddleware");

const router = express.Router();

// Product Super Admin Global Dashboard
router.get("/super-admin/dashboard", requireAuth, authorizeRoles("product_super_admin"), getSuperAdminDashboard);

// Organization Admin / Employee Filtered Dashboard
router.get("/dashboard", requireAuth, requireOrganization, getOrgDashboard);

module.exports = router;

async function requireOrganization(req, res, next) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    // Since each user belongs to exactly one organization, we just use the user's organizationId
    if (!req.user.organizationId) {
      res.status(403);
      throw new Error("User does not belong to any organization");
    }

    req.organization = { _id: req.user.organizationId };
    next();
  } catch (e) {
    next(e);
  }
}

function requireOrganizationRole(roles) {
  const allowed = new Set(Array.isArray(roles) ? roles : [roles]);
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowed.has(role)) {
      res.status(403);
      return next(new Error("Forbidden"));
    }
    return next();
  };
}

module.exports = { requireOrganization, requireOrganizationRole };


import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ requireRole }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-container-narrow">
          <div className="page-card p-4">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // If this route does not require a specific role, but the user is a super admin,
  // they should not be here. Redirect them to their dashboard.
  if (!requireRole && user?.role === "product_super_admin") {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  return <Outlet />;
}

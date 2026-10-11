import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Loader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
      }}
    >
      <div
        className="skeleton"
        style={{ width: 48, height: 48, borderRadius: "50%" }}
      />
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuth, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!isAuth)
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { isAuth, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!isAuth)
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

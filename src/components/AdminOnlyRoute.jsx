import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

// Membership pages are private to the admin in this copy of the app. Anyone else
// — signed in or not — is sent back to the open archive. The membership pages
// themselves are untouched; this gate is the only thing standing in front of them.
export default function AdminOnlyRoute() {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/archive" replace />;
  return <Outlet />;
}

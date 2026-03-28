import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isBackofficeUser } from "@/lib/auth/roles";

interface CustomerOnlyRouteProps {
  children: ReactNode;
}

export default function CustomerOnlyRoute({ children }: CustomerOnlyRouteProps) {
  const { user, isBootstrapping, isAuthenticated } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/connexion" replace />;
  }

  if (isBackofficeUser(user)) {
    return <Navigate to="/boss" replace />;
  }

  return <>{children}</>;
}

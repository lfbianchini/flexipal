import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

export default function AuthGuard({ children, requireVerified = true }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't do anything while loading
    if (loading) return;

    if (!user) {
      // Not logged in, redirect to home with return path
      navigate('/', { state: { from: location.pathname } });
      return;
    }

    if (requireVerified && !user.email_confirmed_at) {
      // Not verified, redirect to verification page
      if (location.pathname !== '/verify') {
        navigate('/verify');
      }
      return;
    }
  }, [user, loading, navigate, location, requireVerified]);

  // Show nothing while loading or checking auth
  if (loading || !user) return null;

  // Show nothing while checking verification
  if (requireVerified && !user.email_confirmed_at) return null;

  // Auth check passed, render children
  return <>{children}</>;
} 
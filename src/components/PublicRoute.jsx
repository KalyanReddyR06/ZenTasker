import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function PublicRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Show notification when authenticated user tries to access public pages
    if (user) {
      const pageName = location.pathname === "/login" ? "login" : "signup";
      toast.success(`You're already logged in! Redirecting to dashboard.`);
    }
  }, [user, location.pathname]);

  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  // If user is not authenticated, show the public page
  return children;
} 
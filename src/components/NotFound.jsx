import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    toast.error("Page not found!");
    navigate(user ? "/" : "/login", { replace: true });
  }, [user, navigate]);

  return (
    <div className="theme-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "48px", height: "48px",
          border: "3px solid var(--accent)",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 1rem",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="theme-text-muted">Redirecting...</p>
      </div>
    </div>
  );
}
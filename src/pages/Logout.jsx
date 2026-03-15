import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function doLogout() {
      try {
        await logout();
        toast.success("Logout successfully!");
        navigate("/login");
      } catch (err) {
        // Optionally show a toast for logout error
        toast.error("Logout failed. Please try again.");
      }
    }
    doLogout();
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-lg text-gray-600">Logging out...</div>
    </div>
  );
}

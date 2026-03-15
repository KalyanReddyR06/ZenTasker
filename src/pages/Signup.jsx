import { useState, useEffect } from "react";
import { auth, googleProvider, db } from "../services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { validateEmail, validatePassword } from "../utils/security";
import { handleAuthError } from "../utils/errorHandler";
import toast from "react-hot-toast";

const formCardStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "2rem",
  boxShadow: "var(--shadow)",
  width: "100%",
  maxWidth: "460px",
};

const fieldLabel = { fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.4rem", display: "block" };
const fieldError = { color: "#ff6b83", fontSize: "0.78rem", marginTop: "0.3rem" };

export default function Signup() {
  const [formData, setFormData] = useState({ fullName: "", username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setErrors({}); }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateField = (field, value) => {
    switch (field) {
      case "fullName":
        if (!value.trim()) return "Full name is required";
        if (value.trim().length < 2) return "At least 2 characters";
        if (value.trim().length > 50) return "Max 50 characters";
        return "";
      case "username":
        if (!value.trim()) return "Username is required";
        if (value.trim().length < 3) return "At least 3 characters";
        if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) return "Letters, numbers, _ and - only";
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!validateEmail(value.trim())) return "Enter a valid email";
        return "";
      case "password":
        if (!value) return "Password is required";
        const pv = validatePassword(value);
        if (!pv.isValid) return pv.feedback;
        return "";
      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== formData.password) return "Passwords do not match";
        return "";
      default: return "";
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(field => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { toast.error("Please fix the errors in the form"); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
      await updateProfile(cred.user, { displayName: formData.fullName.trim() });
      await sendEmailVerification(cred.user);
      await setDoc(doc(db, "users", cred.user.uid), {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      toast.success("Account created! Check your email for verification.");
      navigate("/login", { state: { fromSignup: true } });
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setErrors({ email: "Email already registered" });
        toast.error("Email already in use. Try logging in.");
      } else {
        toast.error(handleAuthError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Welcome to ZenTasker!");
      navigate("/");
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") toast.error(handleAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ open }) => (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </>
      )}
    </svg>
  );

  return (
    <div className="theme-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "var(--hero-glow)", pointerEvents: "none" }} />

      <div style={formCardStyle} className="fade-in">
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            width: "60px", height: "60px",
            background: "linear-gradient(135deg, #DC143C, #8B0000)",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem", boxShadow: "0 0 20px rgba(220,20,60,0.4)",
          }}>
            <svg width="28" height="28" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="theme-text" style={{ fontSize: "1.75rem", fontWeight: "800", margin: 0 }}>Create Account</h1>
          <p className="theme-text-muted" style={{ marginTop: "0.3rem", fontSize: "0.875rem" }}>Join ZenTasker — boost your productivity</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {/* Full Name */}
          <div>
            <label className="theme-text-muted" style={fieldLabel}>Full Name</label>
            <input type="text" value={formData.fullName} onChange={e => handleInputChange("fullName", e.target.value)} placeholder="Your full name" className="input-field" disabled={loading} style={errors.fullName ? { borderColor: "var(--accent)" } : {}} />
            {errors.fullName && <p style={fieldError}>{errors.fullName}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="theme-text-muted" style={fieldLabel}>Username</label>
            <input type="text" value={formData.username} onChange={e => handleInputChange("username", e.target.value)} placeholder="Choose a username" className="input-field" disabled={loading} style={errors.username ? { borderColor: "var(--accent)" } : {}} />
            {errors.username && <p style={fieldError}>{errors.username}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="theme-text-muted" style={fieldLabel}>Email Address</label>
            <input type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} placeholder="your@email.com" className="input-field" disabled={loading} style={errors.email ? { borderColor: "var(--accent)" } : {}} />
            {errors.email && <p style={fieldError}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="theme-text-muted" style={fieldLabel}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} value={formData.password} onChange={e => handleInputChange("password", e.target.value)} placeholder="Create a strong password" className="input-field" style={{ paddingRight: "2.8rem", ...(errors.password ? { borderColor: "var(--accent)" } : {}) }} disabled={loading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {errors.password && <p style={fieldError}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="theme-text-muted" style={fieldLabel}>Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={e => handleInputChange("confirmPassword", e.target.value)} placeholder="Confirm your password" className="input-field" style={{ paddingRight: "2.8rem", ...(errors.confirmPassword ? { borderColor: "var(--accent)" } : {}) }} disabled={loading} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <EyeIcon open={showConfirmPassword} />
              </button>
            </div>
            {errors.confirmPassword && <p style={fieldError}>{errors.confirmPassword}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-crimson" style={{ width: "100%", padding: "0.85rem", fontSize: "1rem", marginTop: "0.25rem" }}>
            {loading ? "Creating Account..." : "Create Account →"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", margin: "1.25rem 0", gap: "0.75rem" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span className="theme-text-muted" style={{ fontSize: "0.8rem" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        <button onClick={handleGoogleSignup} disabled={loading} className="btn-outline" style={{ width: "100%", padding: "0.7rem" }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p className="theme-text-muted" style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem" }}>
          Already have an account?{" "}
          <Link to="/login" className="accent-text" style={{ fontWeight: "700" }}>Sign in</Link>
        </p>

        <p className="theme-text-muted" style={{ textAlign: "center", marginTop: "0.75rem", fontSize: "0.72rem" }}>
          By creating an account you agree to our{" "}
          <a href="#" className="accent-text">Terms</a> and{" "}
          <a href="#" className="accent-text">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

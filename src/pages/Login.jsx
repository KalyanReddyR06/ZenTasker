import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { auth, googleProvider, db } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { validateEmail, rateLimiter } from "../utils/security";
import { handleAuthError } from "../utils/errorHandler";
import toast from "react-hot-toast";

const formCardStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "2.5rem 2rem",
  boxShadow: "var(--shadow)",
  width: "100%",
  maxWidth: "420px",
};

export default function Login() {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.fromSignup) {
      setSuccessMessage("Account created successfully! Please log in.");
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    if (!rateLimiter.isAllowed(email)) {
      setError("Too many login attempts. Please wait a moment and try again.");
      return;
    }
    if (!email || !password) { setError("Please enter both email and password."); return; }
    if (!validateEmail(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      await signInWithEmailAndPassword(auth, email, password);
      rateLimiter.reset(email);
      navigate("/");
    } catch (err) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await setDoc(doc(db, "users", user.uid), {
        fullName: user.displayName || "",
        username: user.email.split("@")[0],
        email: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate("/");
    } catch (err) {
      setError(handleAuthError(err));
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    if (!resetEmail) { setError("Please enter your email to reset password."); return; }
    if (!validateEmail(resetEmail)) { setError("Please enter a valid email address."); return; }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(handleAuthError(err));
    }
  };

  return (
    <div
      className="theme-bg"
      style={{ minHeight: "100vh", display: "flex", position: "relative" }}
    >
      {/* Red glow */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "var(--hero-glow)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Left: Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={formCardStyle} className="fade-in">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <img
              src={theme === "light" ? `${import.meta.env.BASE_URL}ZenTasker Light Mode logo.png` : `${import.meta.env.BASE_URL}ZenTasker Dark Mode logo.png`}
              alt="Logo"
              style={{ width: "110px", height: "auto", objectFit: "contain", borderRadius: "12px", marginBottom: "1rem" }}
            />
            <h2 className="theme-text" style={{ fontSize: "1.75rem", fontWeight: "800", margin: 0 }}>
              Welcome back
            </h2>
            <p className="theme-text-muted" style={{ marginTop: "0.4rem", fontSize: "0.9rem" }}>
              Sign in to your account
            </p>
          </div>

          {error && (
            <div style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              background: "rgba(220,20,60,0.1)",
              border: "1px solid rgba(220,20,60,0.3)",
              borderRadius: "8px",
              color: "#ff6b83",
              fontSize: "0.875rem",
            }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: "8px",
              color: "#22c55e",
              fontSize: "0.875rem",
            }}>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="theme-text-muted" style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.4rem" }}>
                Email address
              </label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={e => { setEmail(e.target.value); setResetEmail(e.target.value); }}
                required
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="theme-text-muted" style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.4rem" }}>
                Password
              </label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  style={{ accentColor: "var(--accent)" }}
                />
                <span className="theme-text-muted">Remember for 30 days</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="accent-text"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn-crimson" style={{ width: "100%", padding: "0.75rem" }}>
              {loading ? (
                <>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Logging in...
                </>
              ) : "Log in"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", margin: "1.25rem 0", gap: "0.75rem" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span className="theme-text-muted" style={{ fontSize: "0.8rem" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="btn-outline"
            style={{ width: "100%", padding: "0.7rem" }}
          >
            <img
              src={`${import.meta.env.BASE_URL}google-color.svg`}
              alt="Google"
              style={{ width: "20px", height: "20px" }}
            />
            Continue with Google
          </button>

          <p className="theme-text-muted" style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem" }}>
            Don't have an account?{" "}
            <Link to="/signup" className="accent-text" style={{ fontWeight: "700" }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Background Image */}
      <div
        className="hidden lg:block"
        style={{
          flex: 1,
          backgroundImage: `url('${import.meta.env.BASE_URL}bg.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(220,20,60,0.3), rgba(0,0,0,0.5))",
        }} />
      </div>
    </div>
  );
}

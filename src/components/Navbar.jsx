import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";


export default function Navbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [dateTime, setDateTime] = useState(new Date());
  const [profile, setProfile] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setProfile(snap.data());
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: "/", label: "Dashboard" },
    { to: "/add", label: "Add Task" },
    { to: "/pending", label: "Pending" },
    { to: "/completed", label: "Completed" },
    { to: "/calendar", label: "📅 Calendar" },
  ];

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <header className={`navbar sticky top-0 z-50${scrolled ? " scrolled" : ""}`}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1rem" }}>
        {/* Single row — never wraps, fixed height */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "64px",
          flexWrap: "nowrap",
          overflow: "hidden",
        }}>

          {/* Logo */}
          <Link to="/" style={{ flexShrink: 0 }}>
            <img
              src={theme === "light" ? `${import.meta.env.BASE_URL}ZenTasker Light Mode logo.png` : `${import.meta.env.BASE_URL}ZenTasker Dark Mode logo.png`}
              alt="ZenTasker Logo"
              className="h-12 md:h-14 lg:h-16 w-auto object-contain"
              style={{ borderRadius: "6px" }}
            />
          </Link>

          {/* Desktop Nav — only visible on large screens (lg = 1024px+) */}
          {user && (
            <nav className="hidden lg:flex" style={{ gap: "1.25rem", alignItems: "center" }}>
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link${isActive(link.to) ? " active" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side: time + toggle + user + hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>

            {/* Date/Time — only large screens */}
            <span
              className="hidden xl:block theme-text-muted"
              style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}
            >
              {dateTime.toLocaleDateString()} {dateTime.toLocaleTimeString()}
            </span>

            {/* Theme Toggle */}
            <label className="theme-toggle" title="Toggle theme">
              <input
                type="checkbox"
                checked={theme === "light"}
                onChange={toggleTheme}
                aria-label="Toggle dark/light mode"
              />
              <span className="toggle-track">
                <span>🌙</span>
                <span>☀️</span>
              </span>
              <span className="toggle-thumb" />
            </label>

            {/* Desktop: avatar + logout — hidden on mobile */}
            {user ? (
              <div className="hidden lg:flex" style={{ alignItems: "center", gap: "0.6rem" }}>
                {profile && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <div style={{
                      width: "30px", height: "30px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #DC143C, #8B0000)",
                      color: "white", display: "flex", alignItems: "center",
                      justifyContent: "center", fontWeight: "700", fontSize: "0.8rem",
                      boxShadow: "0 0 8px rgba(220,20,60,0.4)", flexShrink: 0,
                    }}>
                      {profile.username ? profile.username.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="theme-text hidden xl:block" style={{ fontSize: "0.825rem", fontWeight: "500" }}>
                      {profile.username}
                    </span>
                  </div>
                )}
                <button onClick={() => navigate("/logout")} className="btn-crimson" style={{ padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex" style={{ alignItems: "center", gap: "0.6rem" }}>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/signup" className="btn-crimson" style={{ padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}>Sign Up</Link>
              </div>
            )}

            {/* Hamburger — shown below lg */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden theme-text-muted"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", flexShrink: 0 }}
              aria-label="Open menu"
            >
              {isMobileMenuOpen ? (
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden"
          style={{
            background: "var(--navbar-bg)",
            borderTop: "1px solid var(--border)",
            padding: "0.75rem 1rem 1rem",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Nav links */}
          {user && (
            <nav style={{ display: "flex", flexDirection: "column", gap: "0.15rem", marginBottom: "0.75rem" }}>
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link${isActive(link.to) ? " active" : ""}`}
                  style={{ padding: "0.6rem 0.5rem", display: "block" }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* User + logout */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {profile && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #DC143C, #8B0000)",
                  color: "white", display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: "700", fontSize: "0.875rem",
                }}>
                  {profile.username ? profile.username.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="theme-text" style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                  {profile.username}
                </span>
              </div>
            )}
            {user ? (
              <button onClick={() => navigate("/logout")} className="btn-crimson" style={{ width: "100%" }}>
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-outline" style={{ width: "100%", textAlign: "center" }}>Login</Link>
                <Link to="/signup" className="btn-crimson" style={{ width: "100%", textAlign: "center" }}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

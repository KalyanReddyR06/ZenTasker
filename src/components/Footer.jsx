export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "1.5rem 1rem", textAlign: "center", marginTop: "auto" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <p className="accent-text" style={{ fontWeight: "700", fontSize: "0.9rem" }}>
          ⚡ <span style={{ color: "var(--accent)" }}>Zen</span><span style={{ color: "var(--text)" }}>Tasker</span>
        </p>
        <p className="theme-text-muted" style={{ fontSize: "0.75rem", marginTop: "0.35rem" }}>
          © {new Date().getFullYear()} · Stay organized, stay productive
        </p>
      </div>
    </footer>
  );
}

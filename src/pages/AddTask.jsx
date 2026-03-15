import { useState } from "react";
import { db } from "../services/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { validateTaskData, sanitizeTaskData } from "../utils/security";
import { handleDatabaseError } from "../utils/errorHandler";
import DateTimePicker from "../components/DateTimePicker";

const cardStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "2rem",
  boxShadow: "var(--shadow)",
  width: "100%",
  maxWidth: "700px",
  transition: "background-color 0.35s ease",
};

const sectionLabel = {
  fontSize: "0.8rem",
  fontWeight: "600",
  marginBottom: "0.4rem",
  display: "block",
};

// Priority options — "High Priority 🔥" encodes both priority=High and highPriority=true
const PRIORITY_OPTIONS = [
  { label: "Low", priority: "Low", highPriority: false },
  { label: "Medium", priority: "Medium", highPriority: false },
  { label: "🔥 High Priority", priority: "High", highPriority: true },
];

export default function AddTask() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(""); // ISO string
  const [category, setCategory] = useState("Personal");
  const [priorityKey, setPriorityKey] = useState("Medium"); // key = label
  const [tags, setTags] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedOpt = PRIORITY_OPTIONS.find(o => o.label === priorityKey) || PRIORITY_OPTIONS[1];

  const handleAdd = async () => {
    const taskData = {
      title,
      description,
      category,
      priority: selectedOpt.priority,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      duration,
      highPriority: selectedOpt.highPriority,
      dueDate: dueDate ? new Date(dueDate) : null,
    };

    const validation = validateTaskData(taskData);
    if (!validation.isValid) { toast.error(validation.errors.join(", ")); return; }
    setLoading(true);
    try {
      const sanitizedData = sanitizeTaskData(taskData);
      await addDoc(collection(db, "tasks"), {
        uid: user.uid, username: user.displayName || "Anonymous",
        userEmail: user.email || "No email",
        ...sanitizedData, completed: false, createdAt: serverTimestamp(),
      });
      setTitle(""); setDescription(""); setDueDate("");
      setCategory("Personal"); setPriorityKey("Medium");
      setTags(""); setDuration("");
      toast.success("✅ Task added successfully!");
    } catch (err) {
      toast.error(handleDatabaseError(err, "add_task"));
    } finally {
      setLoading(false);
    }
  };

  const priorityBadgeColor = {
    "High": { bg: "rgba(220,20,60,0.15)", text: "#ff6b83" },
    "Medium": { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" },
    "Low": { bg: "rgba(34,197,94,0.12)", text: "#22c55e" },
  };

  return (
    <div className="theme-bg" style={{ minHeight: "100vh", position: "relative" }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "250px",
        background: "var(--hero-glow)", pointerEvents: "none",
      }} />
      <div style={{ display: "flex", justifyContent: "center", padding: "2rem 1rem", position: "relative" }}>
        <div style={cardStyle} className="fade-in">
          <h2 className="gradient-text" style={{ fontSize: "1.75rem", fontWeight: "800", marginBottom: "1.5rem", textAlign: "center" }}>
            ✚ Add New Task
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            {/* Title */}
            <div>
              <label className="theme-text-muted" style={sectionLabel}>Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter task title" className="input-field" />
            </div>

            {/* Description */}
            <div>
              <label className="theme-text-muted" style={sectionLabel}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Add details..." className="input-field" style={{ resize: "vertical" }} />
            </div>

            {/* Category & Priority (with High Priority folded in) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="theme-text-muted" style={sectionLabel}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
                  <option>Personal</option><option>Work</option><option>Study</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="theme-text-muted" style={sectionLabel}>Priority</label>
                <select value={priorityKey} onChange={e => setPriorityKey(e.target.value)} className="input-field">
                  {PRIORITY_OPTIONS.map(o => (
                    <option key={o.label} value={o.label}>{o.label}</option>
                  ))}
                </select>
                {selectedOpt.highPriority && (
                  <div style={{ marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ background: "rgba(220,20,60,0.15)", color: "#ff6b83", padding: "0.15rem 0.6rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: "700" }}>
                      🔥 High Priority flag set
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="theme-text-muted" style={sectionLabel}>Tags (comma separated)</label>
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g., urgent, frontend, meeting" className="input-field" />
            </div>

            {/* Duration */}
            <div>
              <label className="theme-text-muted" style={sectionLabel}>Estimated Duration</label>
              <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 2h, 30min" className="input-field" />
            </div>

            {/* Due Date — custom popup */}
            <div>
              <label className="theme-text-muted" style={sectionLabel}>Due Date & Time</label>
              <DateTimePicker value={dueDate} onChange={setDueDate} placeholder="Pick date & time" />
            </div>

            {/* Submit */}
            <button onClick={handleAdd} disabled={loading} className="btn-crimson" style={{ width: "100%", padding: "0.85rem", fontSize: "1rem", marginTop: "0.5rem" }}>
              {loading ? "Adding..." : "✚ Add Task"}
            </button>
          </div>

          {/* Live Preview */}
          {(title || description) && (
            <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
              <h3 className="accent-text" style={{ fontWeight: "700", marginBottom: "0.75rem" }}>Live Preview</h3>
              <div style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem" }}>
                <div className="theme-text" style={{ fontWeight: "600", marginBottom: "0.3rem" }}>{title || "Task title..."}</div>
                <div className="theme-text-muted" style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>{description}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  <span style={{ background: "var(--accent-soft)", color: "var(--accent)", padding: "0.15rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>{category}</span>
                  <span style={{ background: priorityBadgeColor[selectedOpt.priority]?.bg, color: priorityBadgeColor[selectedOpt.priority]?.text, padding: "0.15rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>
                    {selectedOpt.highPriority ? "🔥 " : ""}{selectedOpt.priority}
                  </span>
                  {dueDate && <span style={{ background: "var(--bg-card2)", color: "var(--text-muted)", padding: "0.15rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem" }}>📅 {new Date(dueDate).toLocaleString()}</span>}
                  {duration && <span style={{ background: "var(--bg-card2)", color: "var(--text-muted)", padding: "0.15rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem" }}>⏱ {duration}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

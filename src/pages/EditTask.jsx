import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
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

const sectionLabel = { fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.4rem", display: "block" };

// Same priority options as AddTask
const PRIORITY_OPTIONS = [
  { label: "Low", priority: "Low", highPriority: false },
  { label: "Medium", priority: "Medium", highPriority: false },
  { label: "🔥 High Priority", priority: "High", highPriority: true },
];

export default function EditTask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priorityKey, setPriorityKey] = useState("Medium");
  const [category, setCategory] = useState("Personal");
  const [dueDate, setDueDate] = useState(""); // ISO string
  const [tags, setTags] = useState("");
  const [duration, setDuration] = useState("");

  const selectedOpt = PRIORITY_OPTIONS.find(o => o.label === priorityKey) || PRIORITY_OPTIONS[1];

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const ref = doc(db, "tasks", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setTitle(data.title || "");
          setDescription(data.description || "");
          setCategory(data.category || "Personal");
          setTags((data.tags || []).join(", "));
          setDuration(data.duration || "");

          // Restore priority key — if highPriority was set, use "🔥 High Priority"
          const hp = data.highPriority || false;
          const p = data.priority || "Medium";
          if (hp && p === "High") setPriorityKey("🔥 High Priority");
          else {
            const opt = PRIORITY_OPTIONS.find(o => o.priority === p && !o.highPriority);
            setPriorityKey(opt ? opt.label : "Medium");
          }

          // Restore dueDate as ISO string
          if (data.dueDate) {
            const d = data.dueDate.toDate ? data.dueDate.toDate() : new Date(data.dueDate);
            setDueDate(d.toISOString());
          }
        } else {
          toast.error("Task not found");
          navigate("/pending");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load task");
      } finally {
        setFetching(false);
      }
    };
    fetchTask();
  }, [id, navigate]);

  const handleUpdate = async () => {
    if (!title.trim()) return toast.error("Title is required");
    setLoading(true);
    try {
      await updateDoc(doc(db, "tasks", id), {
        title, description, category,
        priority: selectedOpt.priority,
        highPriority: selectedOpt.highPriority,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        duration,
        updatedAt: serverTimestamp(),
        uid: user.uid,
      });
      toast.success("✅ Task updated!");
      navigate("/pending");
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update task");
    } finally {
      setLoading(false);
    }
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
            ✏ Edit Task
          </h2>

          {fetching ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ width: "36px", height: "36px", border: "3px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 0.75rem" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p className="theme-text-muted">Loading task...</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              {/* Title */}
              <div>
                <label className="theme-text-muted" style={sectionLabel}>Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" className="input-field" />
              </div>

              {/* Description */}
              <div>
                <label className="theme-text-muted" style={sectionLabel}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Details..." className="input-field" style={{ resize: "vertical" }} />
              </div>

              {/* Priority & Category */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="theme-text-muted" style={sectionLabel}>Priority</label>
                  <select value={priorityKey} onChange={e => setPriorityKey(e.target.value)} className="input-field">
                    {PRIORITY_OPTIONS.map(o => (
                      <option key={o.label} value={o.label}>{o.label}</option>
                    ))}
                  </select>
                  {selectedOpt.highPriority && (
                    <div style={{ marginTop: "0.4rem" }}>
                      <span style={{ background: "rgba(220,20,60,0.15)", color: "#ff6b83", padding: "0.15rem 0.6rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: "700" }}>
                        🔥 High Priority flag set
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="theme-text-muted" style={sectionLabel}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
                    <option>Personal</option><option>Work</option><option>Study</option><option>Other</option>
                  </select>
                </div>
              </div>

              {/* Due Date — custom popup */}
              <div>
                <label className="theme-text-muted" style={sectionLabel}>Due Date & Time</label>
                <DateTimePicker value={dueDate} onChange={setDueDate} />
              </div>

              {/* Tags */}
              <div>
                <label className="theme-text-muted" style={sectionLabel}>Tags (comma separated)</label>
                <input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g., urgent, frontend" className="input-field" />
              </div>

              {/* Duration */}
              <div>
                <label className="theme-text-muted" style={sectionLabel}>Estimated Duration</label>
                <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 2h, 30min" className="input-field" />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
                <button onClick={handleUpdate} disabled={loading} className="btn-crimson" style={{ flex: 1, padding: "0.85rem" }}>
                  {loading ? "Updating..." : "✅ Update Task"}
                </button>
                <button onClick={() => navigate(-1)} className="btn-outline" style={{ flex: 1, padding: "0.85rem" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

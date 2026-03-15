import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { format, differenceInMinutes } from "date-fns";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const priorityStyles = {
  High: { background: "rgba(220,20,60,0.15)", color: "#ff6b83" },
  Medium: { background: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  Low: { background: "rgba(34,197,94,0.12)", color: "#22c55e" },
};

export default function PendingTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [checkedReminders, setCheckedReminders] = useState([]);
  const [sortBy, setSortBy] = useState("dueDate");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), where("uid", "==", user.uid), where("completed", "==", false));
    const unsub = onSnapshot(q, snapshot => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.dueDate && !checkedReminders.includes(task.id)) {
          const taskTime = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
          const diff = differenceInMinutes(taskTime, now);
          if (diff >= 0 && diff <= 1) {
            toast(`⏰ Task "${task.title}" is due now!`, { icon: "⏰" });
            setCheckedReminders(prev => [...prev, task.id]);
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [tasks, checkedReminders]);

  const markAsCompleted = async (id) => {
    try {
      await updateDoc(doc(db, "tasks", id), { completed: true, uid: user.uid });
      toast.success("✅ Task marked as completed!");
    } catch { toast.error("Something went wrong!"); }
  };

  const filteredAndSorted = tasks
    .filter(t => filterCategory === "All" || t.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === "priority") {
        const order = { High: 1, Medium: 2, Low: 3 };
        return (order[a.priority] || 4) - (order[b.priority] || 4);
      }
      const dA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate || 0);
      const dB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate || 0);
      return dA - dB;
    });

  return (
    <div className="theme-bg" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1rem" }} className="fade-in">
        <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: "800", marginBottom: "1.5rem" }}>
          🕒 <span className="gradient-text">Pending Tasks</span>
        </h2>

        {/* Filters */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <div>
            <label className="theme-text-muted" style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.3rem" }}>Sort by</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field" style={{ width: "auto", minWidth: "140px" }}>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
          <div>
            <label className="theme-text-muted" style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.3rem" }}>Filter by Category</label>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input-field" style={{ width: "auto", minWidth: "160px" }}>
              <option value="All">All Categories</option>
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Study">Study</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {filteredAndSorted.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
            <p className="theme-text" style={{ fontSize: "1.1rem", fontWeight: "600" }}>No pending tasks!</p>
            <p className="theme-text-muted" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Great job staying on top of things.</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredAndSorted.map(task => (
            <div
              key={task.id}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1.25rem",
                boxShadow: "var(--shadow)",
                transition: "box-shadow 0.25s ease, border-color 0.25s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 24px var(--accent-glow2)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "var(--shadow)"}
            >
              {task.highPriority && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                  <span style={{ background: "rgba(220,20,60,0.15)", color: "#ff6b83", padding: "0.15rem 0.7rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "700" }}>🔥 HIGH PRIORITY</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                {/* Content */}
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <h3 className="theme-text" style={{ fontWeight: "700", fontSize: "1.05rem", marginBottom: "0.3rem" }}>{task.title}</h3>
                  <p className="theme-text-muted" style={{ fontSize: "0.875rem", marginBottom: "0.75rem", lineHeight: "1.5" }}>{task.description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {task.dueDate && (
                      <span style={{ background: "var(--bg-card2)", color: "var(--text-muted)", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem" }}>
                        📅 {format(task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate), "dd MMM yyyy, p")}
                      </span>
                    )}
                    <span style={{ background: "var(--accent-soft)", color: "var(--accent)", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>{task.category}</span>
                    <span style={{ ...priorityStyles[task.priority], padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>{task.priority}</span>
                    {task.duration && (
                      <span style={{ background: "var(--bg-card2)", color: "var(--text-muted)", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem" }}>⏱ {task.duration}</span>
                    )}
                  </div>
                  {task.tags?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.5rem" }}>
                      {task.tags.map((tag, i) => (
                        <span key={i} style={{ background: "var(--accent-soft)", color: "var(--accent)", padding: "0.1rem 0.5rem", borderRadius: "100px", fontSize: "0.7rem", fontWeight: "600" }}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "100px" }}>
                  <button onClick={() => markAsCompleted(task.id)} style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>✓ Complete</button>
                  <Link to={`/edit/${task.id}`} style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", fontWeight: "600", textDecoration: "none", textAlign: "center", display: "block" }}>✏ Edit</Link>
                  <button onClick={() => { setTaskToDelete(task); setShowModal(true); }} style={{ background: "rgba(220,20,60,0.12)", color: "var(--accent)", border: "1px solid rgba(220,20,60,0.3)", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>🗑 Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Modal */}
      {showModal && taskToDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "1.75rem", maxWidth: "400px", width: "100%", boxShadow: "0 8px 40px rgba(220,20,60,0.2)" }}>
            <h3 className="theme-text" style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "0.75rem" }}>⚠ Confirm Delete</h3>
            <p className="theme-text-muted" style={{ fontSize: "0.9rem", marginBottom: "1.25rem" }}>
              Are you sure you want to delete <strong className="theme-text">"{taskToDelete.title}"</strong>?
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} className="btn-outline" style={{ padding: "0.5rem 1.1rem" }}>Cancel</button>
              <button
                onClick={async () => {
                  try {
                    await deleteDoc(doc(db, "tasks", taskToDelete.id));
                    toast.success("Task deleted!");
                  } catch { toast.error("Failed to delete task"); }
                  finally { setShowModal(false); setTaskToDelete(null); }
                }}
                className="btn-crimson"
                style={{ padding: "0.5rem 1.1rem" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

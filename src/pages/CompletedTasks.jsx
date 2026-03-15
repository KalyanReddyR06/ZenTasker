import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import toast from "react-hot-toast";

const priorityStyles = {
  High: { background: "rgba(220,20,60,0.15)", color: "#ff6b83" },
  Medium: { background: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  Low: { background: "rgba(34,197,94,0.12)", color: "#22c55e" },
};

export default function CompletedTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), where("uid", "==", user.uid), where("completed", "==", true));
    const unsub = onSnapshot(q, snapshot => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const markAsPending = async (id) => {
    try {
      await updateDoc(doc(db, "tasks", id), { completed: false });
      toast.success("Task moved back to pending!");
    } catch { toast.error("Something went wrong!"); }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteDoc(doc(db, "tasks", id));
      toast.success("Task deleted!");
    } catch { toast.error("Something went wrong!"); }
  };

  return (
    <div className="theme-bg" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1rem" }} className="fade-in">
        <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: "800", marginBottom: "1.5rem" }}>
          ✅ <span className="gradient-text">Completed Tasks</span>
        </h2>

        {tasks.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <p className="theme-text" style={{ fontSize: "1.1rem", fontWeight: "600" }}>No completed tasks yet.</p>
            <p className="theme-text-muted" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Start completing tasks to see them here!</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {tasks.map(task => (
            <div
              key={task.id}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1.25rem",
                boxShadow: "var(--shadow)",
                transition: "box-shadow 0.25s ease",
                borderLeft: "4px solid #22c55e",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <h3 className="theme-text-muted" style={{ fontWeight: "700", fontSize: "1.05rem", marginBottom: "0.3rem", textDecoration: "line-through" }}>{task.title}</h3>
                  <p className="theme-text-muted" style={{ fontSize: "0.875rem", marginBottom: "0.75rem" }}>{task.description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {task.dueDate && (
                      <span style={{ background: "var(--bg-card2)", color: "var(--text-muted)", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem" }}>
                        📅 {format(task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate), "dd MMM yyyy, p")}
                      </span>
                    )}
                    <span style={{ background: "var(--accent-soft)", color: "var(--accent)", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>{task.category}</span>
                    <span style={{ ...priorityStyles[task.priority], padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>{task.priority}</span>
                    <span style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>✓ Completed</span>
                  </div>
                  {task.tags?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.5rem" }}>
                      {task.tags.map((tag, i) => (
                        <span key={i} style={{ background: "var(--accent-soft)", color: "var(--accent)", padding: "0.1rem 0.5rem", borderRadius: "100px", fontSize: "0.7rem", fontWeight: "600" }}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "120px" }}>
                  <button onClick={() => markAsPending(task.id)} style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer" }}>↩ Pending</button>
                  <button onClick={() => deleteTask(task.id)} style={{ background: "rgba(220,20,60,0.12)", color: "var(--accent)", border: "1px solid rgba(220,20,60,0.3)", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer" }}>🗑 Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

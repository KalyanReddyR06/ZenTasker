import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { format, isSameDay } from "date-fns";
import Calendar from "react-calendar";
import toast from "react-hot-toast";


const priorityStyles = {
  High: { background: "rgba(220,20,60,0.15)", color: "#ff6b83" },
  Medium: { background: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  Low: { background: "rgba(34,197,94,0.12)", color: "#22c55e" },
};

export default function CalendarView() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(collection(db, "tasks"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q,
      snap => { setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      err => { console.error(err); setLoading(false); toast.error("Failed to load tasks"); }
    );
    return () => unsub();
  }, [user]);

  const tasksForDate = tasks.filter(task => {
    if (!task.dueDate) return false;
    const taskDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    return isSameDay(taskDate, selectedDate);
  });

  if (loading) {
    return (
      <div className="theme-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "3px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
          <p className="theme-text-muted">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-bg" style={{ minHeight: "100vh" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1rem" }} className="fade-in">
        <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: "800", marginBottom: "1.5rem" }}>
          📅 <span className="gradient-text">Calendar View</span>
        </h2>

        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {/* Calendar */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", boxShadow: "var(--shadow)" }}>
            <h3 className="accent-text" style={{ fontWeight: "700", marginBottom: "1rem" }}>Select Date</h3>
            <Calendar
              value={selectedDate}
              onChange={setSelectedDate}
              tileContent={({ date }) => {
                const hasTasks = tasks.some(t => {
                  if (!t.dueDate) return false;
                  const td = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
                  return isSameDay(td, date);
                });
                return hasTasks ? (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "2px" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent)" }} />
                  </div>
                ) : null;
              }}
            />
            <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--bg-card2)", borderRadius: "8px", fontSize: "0.75rem" }}>
              <p className="theme-text-muted">Total tasks: <span className="accent-text" style={{ fontWeight: "700" }}>{tasks.length}</span></p>
              <p className="theme-text-muted">With due dates: <span className="accent-text" style={{ fontWeight: "700" }}>{tasks.filter(t => t.dueDate).length}</span></p>
            </div>
          </div>

          {/* Tasks for Date */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", boxShadow: "var(--shadow)" }}>
            <h3 className="accent-text" style={{ fontWeight: "700", marginBottom: "1rem" }}>
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </h3>

            {tasksForDate.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📅</div>
                <p className="theme-text-muted" style={{ fontSize: "0.9rem" }}>No tasks for this date.</p>
                <p className="theme-text-muted" style={{ fontSize: "0.75rem", marginTop: "0.3rem" }}>Select another date or add new tasks.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {tasksForDate.map(task => (
                  <div
                    key={task.id}
                    style={{
                      background: "var(--bg-card2)",
                      border: `1px solid ${task.completed ? "rgba(34,197,94,0.3)" : "var(--accent-glow2)"}`,
                      borderRadius: "10px",
                      padding: "1rem",
                      borderLeft: `4px solid ${task.completed ? "#22c55e" : "var(--accent)"}`,
                    }}
                  >
                    <div className="theme-text" style={{ fontWeight: "600", marginBottom: "0.25rem", textDecoration: task.completed ? "line-through" : "none" }}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="theme-text-muted" style={{ fontSize: "0.8rem", marginBottom: "0.5rem" }}>{task.description}</div>
                    )}
                    {task.dueDate && (
                      <div className="theme-text-muted" style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                        ⏰ {format(task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate), "h:mm a")}
                      </div>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      <span style={{ ...priorityStyles[task.priority], padding: "0.15rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "600" }}>{task.priority}</span>
                      <span style={{ background: "var(--accent-soft)", color: "var(--accent)", padding: "0.15rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "600" }}>{task.category}</span>
                      {task.completed && <span style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", padding: "0.15rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "600" }}>✓ Done</span>}
                      {task.highPriority && <span style={{ background: "rgba(220,20,60,0.15)", color: "#ff6b83", padding: "0.15rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "700" }}>🔥 High</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Footer from "../components/Footer";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Papa from "papaparse";
import toast from "react-hot-toast";

ChartJS.register(ArcElement, Tooltip, Legend);

const quotesList = [
  { text: "Stay productive, stay positive!", author: "Unknown" },
  { text: "Focus on progress, not perfection.", author: "Unknown" },
  { text: "Small steps lead to big results.", author: "Unknown" },
  { text: "Consistency is the key to success.", author: "Unknown" },
  { text: "Make each day your masterpiece.", author: "John Wooden" },
  { text: "Believe in yourself and all that you are.", author: "Christian D. Larson" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Dream big, start small, act now.", author: "Robin Sharma" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "A little progress each day adds up to big results.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Don't stop until you're proud.", author: "Unknown" },
  { text: "If you get tired, learn to rest, not quit.", author: "Banksy" },
  { text: "The best way to predict your future is to create it.", author: "Peter Drucker" },
];

const cardStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow: "var(--shadow)",
  transition: "background-color 0.35s ease, border-color 0.35s ease",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [tasks, setTasks] = useState([]);
  const [quote, setQuote] = useState(quotesList[0]);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const random = quotesList[Math.floor(Math.random() * quotesList.length)];
    setQuote(random);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(list);
    });
    return () => unsub();
  }, [user]);

  const getNewQuote = () => {
    setFade(false);
    setTimeout(() => {
      const random = quotesList[Math.floor(Math.random() * quotesList.length)];
      setQuote(random);
      setFade(true);
    }, 200);
  };

  const exportToCSV = () => {
    if (tasks.length === 0) { toast.error("No tasks to export!"); return; }
    const taskData = tasks.map(task => ({
      Title: task.title,
      Description: task.description,
      Category: task.category,
      Priority: task.priority,
      Tags: (task.tags || []).join(", "),
      DueDate: task.dueDate?.toDate ? task.dueDate.toDate().toLocaleString() : "",
      Duration: task.duration || "",
      HighPriority: task.highPriority ? "Yes" : "No",
      Completed: task.completed ? "Yes" : "No",
      CreatedAt: task.createdAt?.toDate ? task.createdAt.toDate().toLocaleString() : "",
    }));
    const csv = Papa.unparse(taskData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "tasks.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("✅ CSV downloaded!");
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const chartData = {
    labels: ["Completed", "Pending"],
    datasets: [{
      data: [completedTasks, pendingTasks],
      backgroundColor: ["#DC143C", isDark ? "#f59e0b" : "#9ca3af"],
      borderColor: ["#8B0000", isDark ? "#b45309" : "#6b7280"],
      borderWidth: 2,
    }],
  };

  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          color: isDark ? "#f0f0f0" : "#111111",
          font: { size: 13 },
        },
      },
    },
  };

  const latestTasks = [...tasks]
    .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
    .slice(0, 3);

  return (
    <div className="theme-bg" style={{ minHeight: "100vh", position: "relative" }}>
      {/* Hero Glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "300px",
          background: "var(--hero-glow)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1rem", position: "relative", zIndex: 1 }}
        className="space-y-6 fade-in"
      >
        {/* Greeting */}
        <div>
          <h1
            style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: "800", marginBottom: "0.25rem" }}
          >
            Welcome back, <span className="gradient-text">{user?.displayName || "User"}</span>! 🎉
          </h1>
          <p className="theme-text-muted">Here's your productivity overview for today.</p>
        </div>

        {/* Quote Widget */}
        <div style={cardStyle}>
          <h3 className="accent-text" style={{ fontWeight: "700", fontSize: "1rem", marginBottom: "0.75rem" }}>
            🌟 Daily Motivation
          </h3>
          <p
            className="theme-text-muted"
            style={{
              fontStyle: "italic",
              fontSize: "1rem",
              opacity: fade ? 1 : 0,
              transition: "opacity 0.2s ease",
              lineHeight: "1.6",
            }}
          >
            "{quote.text}"
          </p>
          <p className="theme-text-muted" style={{ fontSize: "0.8rem", textAlign: "right", marginTop: "0.5rem" }}>
            — {quote.author}
          </p>
          <button onClick={getNewQuote} className="btn-crimson" style={{ marginTop: "1rem", fontSize: "0.8rem" }}>
            🔄 New Quote
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
          {[
            { label: "Total Tasks", value: totalTasks, color: "var(--text)" },
            { label: "Completed", value: completedTasks, color: "#22c55e" },
            { label: "Pending", value: pendingTasks, color: "#f59e0b" },
            { label: "Done %", value: `${completionRate}%`, color: "var(--accent)" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...cardStyle, textAlign: "center" }}>
              <div className="theme-text-muted" style={{ fontSize: "0.8rem", marginBottom: "0.4rem" }}>{label}</div>
              <div style={{ fontSize: "2rem", fontWeight: "800", color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <a href="/calendar" className="btn-crimson">📅 View Calendar</a>
          <button onClick={exportToCSV} className="btn-crimson">📥 Export to CSV</button>
        </div>

        {/* Chart + Latest Tasks */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {/* Chart */}
          <div style={cardStyle}>
            <h3 className="accent-text" style={{ fontWeight: "700", marginBottom: "1rem" }}>
              Task Status Overview
            </h3>
            <div style={{ maxWidth: "260px", margin: "0 auto" }}>
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Latest Tasks */}
          <div style={cardStyle}>
            <h3 className="accent-text" style={{ fontWeight: "700", marginBottom: "1rem" }}>
              Latest Tasks
            </h3>
            {latestTasks.length === 0 ? (
              <p className="theme-text-muted">No tasks yet. Start adding some!</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
                {latestTasks.map(task => (
                  <li
                    key={task.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: "0.75rem",
                    }}
                  >
                    <div>
                      <div className="theme-text" style={{ fontWeight: "600", fontSize: "0.9rem" }}>{task.title}</div>
                      <div className="theme-text-muted" style={{ fontSize: "0.75rem", marginTop: "0.2rem" }}>
                        {task.category} · {task.priority}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        color: task.completed ? "#22c55e" : "#f59e0b",
                        background: task.completed ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "100px",
                      }}
                    >
                      {task.completed ? "Done" : "Pending"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

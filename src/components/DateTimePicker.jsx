import { useState, useRef, useEffect } from "react";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

// Parse a stored ISO datetime string or Date into parts
function parseDatetime(value) {
    if (!value) return null;
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d)) return null;
    return d;
}

// Format for display in the trigger input
function formatDisplay(d) {
    if (!d) return "";
    const month = MONTHS[d.getMonth()].slice(0, 3);
    const day = d.getDate();
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${month} ${day}, ${year}  ${hours}:${minutes} ${ampm}`;
}

export default function DateTimePicker({ value, onChange, placeholder = "Pick date & time" }) {
    const parsed = parseDatetime(value);
    const today = new Date();

    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : today.getFullYear());
    const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : today.getMonth());
    const [selDay, setSelDay] = useState(parsed ? parsed.getDate() : null);
    const [selMonth, setSelMonth] = useState(parsed ? parsed.getMonth() : null);
    const [selYear, setSelYear] = useState(parsed ? parsed.getFullYear() : null);
    const [hour, setHour] = useState(parsed ? String(parsed.getHours() % 12 || 12).padStart(2, "0") : "12");
    const [minute, setMinute] = useState(parsed ? String(parsed.getMinutes()).padStart(2, "0") : "00");
    const [ampm, setAmpm] = useState(parsed ? (parsed.getHours() >= 12 ? "PM" : "AM") : "AM");

    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const selectDay = (day) => {
        setSelDay(day);
        setSelMonth(viewMonth);
        setSelYear(viewYear);
    };

    const applyAndClose = () => {
        if (!selDay) return;
        let h = parseInt(hour, 10);
        if (ampm === "PM" && h !== 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        const d = new Date(selYear, selMonth, selDay, h, parseInt(minute, 10));
        // Return as ISO string for compatibility with Firestore/Date
        onChange(d.toISOString());
        setOpen(false);
    };

    const clear = (e) => {
        e.stopPropagation();
        setSelDay(null); setSelMonth(null); setSelYear(null);
        onChange("");
    };

    const isSelected = (day) => day === selDay && viewMonth === selMonth && viewYear === selYear;
    const isToday = (day) => day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

    const clampHour = (raw) => {
        let n = parseInt(raw, 10);
        if (isNaN(n)) n = 12;
        n = Math.max(1, Math.min(12, n));
        return String(n).padStart(2, "0");
    };
    const clampMin = (raw) => {
        let n = parseInt(raw, 10);
        if (isNaN(n)) n = 0;
        n = Math.max(0, Math.min(59, n));
        return String(n).padStart(2, "0");
    };

    const triggerStyle = {
        width: "100%",
        padding: "0.7rem 1rem",
        background: "var(--input-bg)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        color: value ? "var(--text)" : "var(--text-muted)",
        fontSize: "0.95rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
        transition: "border-color 0.2s",
        userSelect: "none",
    };

    const popupStyle = {
        position: "absolute",
        zIndex: 999,
        top: "calc(100% + 6px)",
        left: 0,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
        padding: "1.1rem",
        minWidth: "310px",
        userSelect: "none",
    };

    return (
        <div ref={ref} style={{ position: "relative" }}>
            {/* Trigger */}
            <div
                style={triggerStyle}
                onClick={() => setOpen(o => !o)}
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && setOpen(o => !o)}
            >
                <span>{value ? formatDisplay(parseDatetime(value)) : placeholder}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {value && (
                        <span
                            onClick={clear}
                            style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1, cursor: "pointer", padding: "0 2px" }}
                            title="Clear"
                        >✕</span>
                    )}
                    <svg width="16" height="16" fill="none" stroke="var(--accent)" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="3" strokeWidth="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </span>
            </div>

            {/* Popup */}
            {open && (
                <div style={popupStyle}>
                    {/* Calendar header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                        <button onClick={prevMonth} style={navBtn}>‹</button>
                        <span className="theme-text" style={{ fontWeight: "700", fontSize: "0.95rem" }}>
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button onClick={nextMonth} style={navBtn}>›</button>
                    </div>

                    {/* Day names */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
                        {DAYS.map(d => (
                            <div key={d} style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: "700", color: "var(--text-muted)", padding: "2px 0" }}>{d}</div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const sel = isSelected(day);
                            const tod = isToday(day);
                            return (
                                <button
                                    key={day}
                                    onClick={() => selectDay(day)}
                                    style={{
                                        borderRadius: "8px",
                                        border: "none",
                                        padding: "6px 0",
                                        fontSize: "0.82rem",
                                        fontWeight: sel || tod ? "700" : "400",
                                        cursor: "pointer",
                                        background: sel ? "var(--accent)" : tod ? "var(--accent-soft)" : "transparent",
                                        color: sel ? "#fff" : tod ? "var(--accent)" : "var(--text)",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "var(--accent-soft)"; }}
                                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = tod ? "var(--accent-soft)" : "transparent"; }}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Time selector */}
                    <div style={{ marginTop: "0.85rem", borderTop: "1px solid var(--border)", paddingTop: "0.85rem" }}>
                        <div className="theme-text-muted" style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.5rem" }}>TIME</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {/* Hour */}
                            <input
                                type="number"
                                min={1} max={12}
                                value={hour}
                                onChange={e => setHour(e.target.value)}
                                onBlur={e => setHour(clampHour(e.target.value))}
                                style={timeInput}
                            />
                            <span className="theme-text" style={{ fontWeight: "700", fontSize: "1.1rem" }}>:</span>
                            {/* Minute */}
                            <input
                                type="number"
                                min={0} max={59}
                                value={minute}
                                onChange={e => setMinute(e.target.value)}
                                onBlur={e => setMinute(clampMin(e.target.value))}
                                style={timeInput}
                            />
                            {/* AM/PM toggle */}
                            <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", marginLeft: "4px" }}>
                                {["AM", "PM"].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setAmpm(p)}
                                        style={{
                                            padding: "0.4rem 0.7rem",
                                            border: "none",
                                            background: ampm === p ? "var(--accent)" : "var(--input-bg)",
                                            color: ampm === p ? "#fff" : "var(--text-muted)",
                                            fontWeight: "700",
                                            fontSize: "0.8rem",
                                            cursor: "pointer",
                                            transition: "background 0.15s, color 0.15s",
                                        }}
                                    >{p}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem" }}>
                        <button onClick={() => setOpen(false)} style={cancelBtn}>Cancel</button>
                        <button onClick={applyAndClose} disabled={!selDay} style={{ ...applyBtnBase, opacity: selDay ? 1 : 0.45, cursor: selDay ? "pointer" : "not-allowed" }}>Apply</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const navBtn = {
    background: "none", border: "none", cursor: "pointer",
    color: "var(--text)", fontSize: "1.3rem", lineHeight: 1,
    padding: "2px 8px", borderRadius: "6px",
};
const timeInput = {
    width: "52px", textAlign: "center", padding: "0.4rem 0.3rem",
    background: "var(--input-bg)", border: "1px solid var(--border)",
    borderRadius: "8px", color: "var(--text)", fontSize: "1rem",
    fontWeight: "600",
};
const cancelBtn = {
    flex: 1, padding: "0.55rem", background: "var(--bg-card2)",
    border: "1px solid var(--border)", borderRadius: "8px",
    color: "var(--text-muted)", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer",
};
const applyBtnBase = {
    flex: 1, padding: "0.55rem", background: "linear-gradient(135deg,#DC143C,#8B0000)",
    border: "none", borderRadius: "8px", color: "#fff",
    fontWeight: "700", fontSize: "0.85rem",
};

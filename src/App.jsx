import { useEffect, useState } from "react";
import ChatRoom from "./componenet/ChatRoom";
import "./App.css";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5050";
const RECENTS_KEY = "chatapp_recent_rooms";
const THEME_KEY = "chatapp_theme";

let socket;

function App() {
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);

  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [recentRooms, setRecentRooms] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");

  useEffect(() => {
    socket = io(SOCKET_URL);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    const stored = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    setRecentRooms(stored);

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  const saveRecentRoom = (name, roomName) => {
    const stored = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    const filtered = stored.filter((r) => r.room !== roomName);
    const updated = [{ username: name, room: roomName }, ...filtered].slice(0, 8);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
    setRecentRooms(updated);
  };

  const deleteRecentRoom = (roomName, e) => {
    e.stopPropagation();
    const stored = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    const updated = stored.filter((r) => r.room !== roomName);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
    setRecentRooms(updated);
  };

  const joinRoom = (name, roomName) => {
    const cleanRoom = roomName.trim().toLowerCase();
    const cleanName = name.trim();
    if (!cleanName || !cleanRoom) return;

    socket.emit("join", { room: cleanRoom, username: cleanName });
    setUsername(cleanName);
    setRoom(cleanRoom);
    setJoined(true);
    saveRecentRoom(cleanName, cleanRoom);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    joinRoom(username, room);
  };

  const handleQuickJoin = (item) => {
    joinRoom(item.username, item.room);
  };

  const handleLeave = () => {
    socket.emit("leave", room);
    setJoined(false);
  };

  return (
    <div className={`app-shell ${theme}`}>
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-topbar">
          <h1>Realtime Chat</h1>
          <div className="topbar-right">
            <span className={`status-pill ${connected ? "on" : "off"}`}>
              <span className="status-pill-dot" />
              {connected ? "Connected" : "Disconnected"}
            </span>
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </div>

        <form className="join-search-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Room name"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            required
          />
          <button type="submit">Join</button>
        </form>

        <div className="recent-list">
          <p className="recent-label">Recent</p>
          {recentRooms.length === 0 && (
            <p className="recent-empty">No chats yet</p>
          )}
          {recentRooms.map((r, idx) => (
            <div
              key={idx}
              className={`recent-item${joined && room === r.room ? " active" : ""}`}
              onClick={() => handleQuickJoin(r)}
            >
              <div className="recent-avatar">
                {r.room.charAt(0).toUpperCase()}
              </div>
              <div className="recent-info">
                <p className="recent-room">{r.room}</p>
                <p className="recent-user">as {r.username}</p>
              </div>
              <button
                className="recent-delete"
                onClick={(e) => deleteRecentRoom(r.room, e)}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CHAT PANEL */}
      <main className="main-panel">
        {joined ? (
          <ChatRoom
            username={username}
            room={room}
            socket={socket}
            onLeave={handleLeave}
          />
        ) : (
          <div className="empty-state">
            <p>Select a chat or join a room to start messaging</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
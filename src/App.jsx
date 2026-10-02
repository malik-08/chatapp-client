import { useEffect, useState, useRef } from "react";
import ChatRoom from "./componenet/ChatRoom";
import "./App.css";
import { io } from "socket.io-client";

const SOCKET_URL = "https://chatapp-server-three.vercel.app";
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

  // State for Join Modal popup via "+" button
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [modalUsername, setModalUsername] = useState("");
  const [modalRoom, setModalRoom] = useState("");

  useEffect(() => {
    socket = io(SOCKET_URL, {
      maxHttpBufferSize: 10 * 1024 * 1024,
    });

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
    setShowJoinModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    joinRoom(modalUsername, modalRoom);
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
      <aside className="sidebar">
        <div className="sidebar-topbar">
          <h1>ChatApp</h1>
          <div className="topbar-right">
            {/* Smaller, compact status pill without "Disconnected" text */}
            <span className={`status-pill ${connected ? "on" : "off"}`}>
              <span className="status-pill-dot" />
            </span>
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button
              className="add-room-btn"
              onClick={() => setShowJoinModal(true)}
              title="Join New Room"
            >
              +
            </button>
          </div>
        </div>

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
            <p>Select a chat or click <strong>+</strong> to join a room to start messaging</p>
          </div>
        )}
      </main>

      {/* Modal Popup with Green Header */}
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Join New Room</h3>
              <button className="modal-close" onClick={() => setShowJoinModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={modalUsername}
                  onChange={(e) => setModalUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Room Name</label>
                <input
                  type="text"
                  placeholder="Enter room name"
                  value={modalRoom}
                  onChange={(e) => setModalRoom(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
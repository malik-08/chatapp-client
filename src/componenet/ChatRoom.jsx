import { useEffect, useState, useRef } from "react";

const ChatRoom = ({ username, room, socket, onLeave }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (msg) => {
      setMessages((prev) => [...prev, { type: "chat", ...msg }]);
    };
    const handleSystem = (msg) => {
      setMessages((prev) => [...prev, { type: "system", text: msg.text }]);
    };

    socket.on("message", handleIncoming);
    socket.on("system", handleSystem);

    return () => {
      socket.off("message", handleIncoming);
      socket.off("system", handleSystem);
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit("send", { text: message, room, username });
      setMessage("");
    }
  };

  return (
    <div className="wa-container">
      <div className="wa-header">
        <div className="wa-header-info">
          <div className="wa-avatar">{room?.charAt(0)?.toUpperCase()}</div>
          <div>
            <div className="wa-room-name">{room}</div>
            <div className="wa-room-status">online</div>
          </div>
        </div>

        <div className="wa-header-right">
          <button className="wa-leave-btn" onClick={() => setShowConfirmModal(true)}>
            Leave
          </button>
        </div>
      </div>

      <div className="wa-messages">
        {messages.map((msg, idx) =>
          msg.type === "system" ? (
            <div key={idx} className="wa-system-msg">
              <span>{msg.text}</span>
            </div>
          ) : (
            <div
              key={idx}
              className={`wa-bubble-row${msg.username === username ? " own" : ""}`}
            >
              <div className="wa-bubble">
                {msg.username !== username && (
                  <span className="wa-sender">{msg.username}</span>
                )}
                <span className="wa-text">{msg.text}</span>
              </div>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      <form className="wa-input-form" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          autoFocus
        />
        <button type="submit" className="wa-send-btn">Send</button>
      </form>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "var(--bg-primary, #ffffff)",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            width: "320px",
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1rem", color: "var(--text-primary, #333)" }}>Leave Room</h3>
            <p style={{ margin: "0 0 20px 0", color: "var(--text-secondary, #666)", fontSize: "0.95rem" }}>
              Are you sure you want to leave this chat room?
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: "500",
                  color: "inherit"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  onLeave();
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#ea4335",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
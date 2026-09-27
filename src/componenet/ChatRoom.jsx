import { useEffect, useState, useRef } from "react";

const ChatRoom = ({ username, room, socket, onLeave }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
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
        <button className="wa-leave-btn" onClick={onLeave}>
          Leave
        </button>
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
    </div>
  );
};

export default ChatRoom;
import { useEffect, useState } from "react";
import io from "socket.io-client";
import "./Message.css";

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }
  }

  return process.env.REACT_APP_API_URL || "https://trustpermit-backend.onrender.com";
};

const API_URL = getApiBaseUrl();

const socket = io(API_URL, {
  path: "/socket.io",
  transports: ["polling", "websocket"],
  reconnection: true,
});

export default function Messages() {
  const [requests, setRequests] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [text, setText] = useState("");

  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chats`);
      const data = await res.json();

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching chats:", err);
    }
  };

  useEffect(() => {
    fetchChats();

    if (!socket.connected) {
      socket.io.opts.path = "/socket.io";
      socket.io.opts.transports = ["polling", "websocket"];
      socket.io.opts.reconnection = true;
      socket.connect();
    }

    socket.on("new_staff_request", (chat) => {
      setRequests((prev) => {
        const exists = prev.some((item) => item.roomId === chat.roomId);
        if (exists) {
          return prev.map((item) =>
            item.roomId === chat.roomId ? chat : item
          );
        }
        return [chat, ...prev];
      });
    });

    socket.on("chat_updated", (updatedChat) => {
      setRequests((prev) => {
        const exists = prev.some((item) => item.roomId === updatedChat.roomId);

        if (exists) {
          return prev.map((item) =>
            item.roomId === updatedChat.roomId ? updatedChat : item
          );
        }

        return [updatedChat, ...prev];
      });

      setSelectedChat((prev) =>
        prev?.roomId === updatedChat.roomId ? updatedChat : prev
      );
    });

    socket.on("receive_chat_message", (msg) => {
      setSelectedChat((prev) => {
        if (!prev || prev.roomId !== msg.roomId) return prev;

        return {
          ...prev,
          lastMessage: msg.text,
          messages: [
            ...(prev.messages || []),
            {
              sender: msg.sender,
              text: msg.text,
              createdAt: msg.createdAt,
            },
          ],
        };
      });
    });

    return () => {
      socket.off("new_staff_request");
      socket.off("chat_updated");
      socket.off("receive_chat_message");
    };
  }, []);

  const openChat = (chat) => {
    setSelectedChat(chat);

    socket.emit("join_chat_room", {
      roomId: chat.roomId,
    });
  };

  const approveChat = () => {
    if (!selectedChat) return;

    socket.emit("staff_approve_chat", {
      roomId: selectedChat.roomId,
    });
  };

  const sendMessage = () => {
    if (!selectedChat) return;
    if (!text.trim()) return;

    socket.emit("send_chat_message", {
      roomId: selectedChat.roomId,
      sender: "staff",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    setText("");
  };

  const getInitial = (name = "U") => name.trim().charAt(0).toUpperCase();
  const formatTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <section className="messages-workspace">
      <aside className="conversation-list">
        <div className="messages-heading">
          <h1>Messages</h1>
          <p>User support requests</p>
        </div>
        {requests.length === 0 ? <p className="messages-empty">No message requests yet.</p> : requests.map((chat) => {
          const name = chat.userName || "User";
          return (
            <button className={`conversation-card ${selectedChat?.roomId === chat.roomId ? "selected" : ""}`} key={chat.roomId} onClick={() => openChat(chat)}>
              <span className={`conversation-avatar avatar-${getInitial(name).toLowerCase()}`}>{getInitial(name)}</span>
              <span className="conversation-copy">
                <span className="conversation-topline"><strong>{name}</strong><time>{formatTime(chat.updatedAt || chat.createdAt)}</time></span>
                <span className="conversation-preview">{chat.lastMessage || "No message yet"}</span>
                <span className={`status-pill ${chat.status === "approved" ? "approved" : "pending"}`}>{chat.status || "pending"}</span>
              </span>
            </button>
          );
        })}
      </aside>

      <div className="active-conversation">
        {selectedChat ? <>
          <header className="conversation-header">
            <div>
              <h2>Active Chat: {selectedChat.userName || "User"} <span>(Permit Application Support)</span></h2>
              <p>{selectedChat.status === "approved" ? "Support request approved" : "Support request awaiting approval"}</p>
            </div>
            <div className="conversation-actions">
              {selectedChat.status !== "approved" && <button className="button button-approve" onClick={approveChat}>Approve Chat</button>}
              <button className="button button-secondary" type="button">View Profile</button>
            </div>
          </header>

          <div className="message-stream">
            {(!selectedChat.messages || selectedChat.messages.length === 0) ? <p className="messages-empty">No messages yet.</p> : selectedChat.messages.map((msg, index) => {
              const isStaff = msg.sender === "staff";
              return <div className={`message-row ${isStaff ? "from-staff" : "from-user"}`} key={msg._id || index}>
                {!isStaff && <span className="message-avatar">{getInitial(selectedChat.userName || "U")}</span>}
                <div className="message-group">
                  <div className="message-bubble"><strong>{isStaff ? "Staff (me)" : `${selectedChat.userName || "User"}:`}</strong><p>{msg.text}</p></div>
                  <time>{formatTime(msg.createdAt || msg.time)}</time>
                </div>
              </div>;
            })}
          </div>

          <form className="message-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Type your reply..." rows="2" />
            <div className="composer-footer"><div className="composer-tools"><button type="button" aria-label="Attach file">&#128206;</button><button type="button" aria-label="Add emoji">&#9786;</button></div><select aria-label="Canned responses" defaultValue=""><option value="" disabled>Canned Responses</option><option>We are checking your request.</option><option>Your application is being reviewed.</option></select><button className="send-button" type="submit">Send</button></div>
          </form>
        </> : <div className="messages-placeholder"><h2>Select a user message request</h2><p>Choose a conversation to view the support thread.</p></div>}
      </div>
    </section>
  );
}
import { Component, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import io from "socket.io-client";
import "./Message.css";

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return process.env.REACT_APP_API_URL || "http://localhost:5001";
    }
  }

  return process.env.REACT_APP_API_URL || "https://trustpermit-backend.onrender.com";
};

const API_URL = getApiBaseUrl();

const normalizeChat = (chat) => ({
  ...(chat && typeof chat === "object" ? chat : {}),
  roomId: String(chat?.roomId || `chat-${Date.now()}-${Math.random()}`),
  userName: typeof chat?.userName === "string" && chat.userName.trim()
    ? chat.userName.trim()
    : "User",
  messages: Array.isArray(chat?.messages) ? chat.messages : [],
});

const socket = io(API_URL, {
  path: "/socket.io",
  transports: ["polling", "websocket"],
  autoConnect: false,
  reconnection: true,
  timeout: 10000,
});

function MessagesView() {
  const [requests, setRequests] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [text, setText] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/chats`);
      if (!res.ok) throw new Error(`Chat request failed with status ${res.status}`);
      const data = await res.json();

      setRequests(Array.isArray(data) ? data.map(normalizeChat) : []);
      setLoadError("");
    } catch (err) {
      console.error("Error fetching chats:", err);
      setRequests([]);
      setLoadError("Unable to connect to chat service. The backend is not responding right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();

    if (!socket.connected) {
      try {
        if (socket.io) {
          socket.io.opts.path = "/socket.io";
          socket.io.opts.transports = ["polling", "websocket"];
          socket.io.opts.reconnection = true;
        }
        socket.connect();
      } catch (error) {
        console.warn("Socket connection skipped because backend is unavailable.");
      }
    }

    socket.on("new_staff_request", (chat) => {
      const nextChat = normalizeChat(chat);
      setRequests((prev) => {
        const exists = prev.some((item) => item.roomId === nextChat.roomId);
        if (exists) {
          return prev.map((item) =>
            item.roomId === nextChat.roomId ? nextChat : item
          );
        }
        return [nextChat, ...prev];
      });
    });

    socket.on("chat_updated", (updatedChat) => {
      const nextChat = normalizeChat(updatedChat);
      setRequests((prev) => {
        const exists = prev.some((item) => item.roomId === nextChat.roomId);

        if (exists) {
          return prev.map((item) =>
            item.roomId === nextChat.roomId ? nextChat : item
          );
        }

        return [nextChat, ...prev];
      });

      setSelectedChat((prev) =>
        prev?.roomId === nextChat.roomId ? nextChat : prev
      );
    });

    socket.on("receive_chat_message", (msg) => {
      if (!msg || !msg.roomId) return;

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
    const nextChat = normalizeChat(chat);
    setSelectedChat(nextChat);

    socket.emit("join_chat_room", {
      roomId: nextChat.roomId,
    });
  };

  const approveChat = () => {
    if (!selectedChat) return;

    socket.emit("staff_approve_chat", {
      roomId: selectedChat.roomId,
    });
  };

  const sendMessage = async () => {
    if (!selectedChat) return;
    if (!text.trim() && !selectedFile) return;

    let attachment = null;
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch(`${API_URL.replace(/\/$/, "")}/api/chats/${encodeURIComponent(selectedChat.roomId)}/attachment`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) return;
      attachment = await response.json();
    }

    const messageText = text.trim() || (attachment ? `Image: ${attachment.name}` : "Attachment");

    socket.emit("send_chat_message", {
      roomId: selectedChat.roomId,
      sender: "staff",
      text: messageText,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    setText("");
    setSelectedFile(null);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    event.target.value = "";
  };

  const viewProfile = async () => {
    if (!selectedChat) return;

    setProfileOpen(true);
    setProfile(null);
    setProfileLoading(true);
    setProfileError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL.replace(/\/$/, "")}/api/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Unable to load user account");

      const users = await response.json();
      const account = Array.isArray(users)
        ? users.find((user) => String(user._id || user.id) === String(selectedChat.userId))
        : null;

      if (!account) throw new Error("User account not found");
      setProfile(account);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfileError(error.message || "Unable to load user account.");
    } finally {
      setProfileLoading(false);
    }
  };

  const getInitial = (name = "U") => String(name || "U").trim().charAt(0).toUpperCase();
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
        {loadError && <div className="messages-connection-notice" role="alert">{loadError}</div>}
        {isLoading ? <p className="messages-empty">Loading message requests...</p> : requests.length === 0 ? <p className="messages-empty">No message requests yet.</p> : requests.map((chat) => {
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
              <button className="button button-secondary" type="button" onClick={viewProfile} disabled={profileLoading}>
                {profileLoading ? "Loading..." : "View Profile"}
              </button>
            </div>
          </header>

          <div className="message-stream">
            {(!selectedChat.messages || selectedChat.messages.length === 0) ? <p className="messages-empty">No messages yet.</p> : selectedChat.messages.map((msg, index) => {
              const isStaff = msg.sender === "staff";
              return <div className={`message-row ${isStaff ? "from-staff" : "from-user"}`} key={msg._id || index}>
                {!isStaff && <span className="message-avatar">{getInitial(selectedChat.userName || "U")}</span>}
                <div className="message-group">
                  <div className="message-bubble"><strong>{isStaff ? "Staff (me)" : `${selectedChat.userName || "User"}:`}</strong>{(msg.attachmentUrl || String(msg.text || "").match(/^(?:Attachment|Image):\s*(.+)$/i)) && <img className="message-attachment-image" src={(msg.attachmentUrl || `/uploads/${String(msg.text).replace(/^(?:Attachment|Image):\s*/i, "")}`).startsWith("http") ? (msg.attachmentUrl || `/uploads/${String(msg.text).replace(/^(?:Attachment|Image):\s*/i, "")}`) : `${API_URL.replace(/\/$/, "")}${msg.attachmentUrl || `/uploads/${String(msg.text).replace(/^(?:Attachment|Image):\s*/i, "")}`}`} alt={msg.attachmentName || "Chat attachment"} />}<p>{msg.text}</p></div>
                  <time>{formatTime(msg.createdAt || msg.time)}</time>
                </div>
              </div>;
            })}
          </div>

          <form className="message-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Type your reply..." rows="2" />
            <div className="composer-footer"><div className="composer-tools"><label className="upload-button" htmlFor="staff-message-upload">Upload image</label><input id="staff-message-upload" className="upload-input" type="file" accept="image/*" onChange={handleFileUpload} /></div>{selectedFile && <span className="selected-file" title={selectedFile.name}>{selectedFile.name}</span>}<select aria-label="Canned responses" defaultValue=""><option value="" disabled>Canned Responses</option><option>We are checking your request.</option><option>Your application is being reviewed.</option></select><button className="send-button" type="submit">Send</button></div>
          </form>
        </> : <div className="messages-placeholder"><h2>Select a user message request</h2><p>Choose a conversation to view the support thread.</p></div>}
      </div>

      {profileOpen && createPortal(<div className="profile-modal-backdrop" role="presentation" onClick={() => { setProfileOpen(false); setProfile(null); setProfileError(""); }}>
        <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title" onClick={(event) => event.stopPropagation()}>
          <button className="profile-close" type="button" aria-label="Close profile" onClick={() => { setProfileOpen(false); setProfile(null); setProfileError(""); }}>X</button>
          <h2 id="profile-title">User Account</h2>
          {profileLoading ? <p>Loading account...</p> : profileError ? <p className="profile-error">{profileError}</p> : profile && <><div className="profile-photo-wrap">{(profile.profileImage || profile.profilePicture || profile.avatar || profile.imageUrl) ? <img className="profile-photo" src={profile.profileImage || profile.profilePicture || profile.avatar || profile.imageUrl} alt={`${profile.fullName || "User"} profile`} /> : <span className="profile-photo-fallback">{getInitial(profile.fullName || selectedChat?.userName)}</span>}</div><strong>{profile.fullName || "User"}</strong><p>{profile.email || "No email available"}</p><p>Role: {profile.role || "citizen"}</p><p>Status: {profile.status || "Active"}</p></>}
        </section>
      </div>, document.body)}
    </section>
  );
}

class MessagesBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="messages-workspace messages-error-state">
          <div className="messages-placeholder">
            <h2>Messages are temporarily unavailable</h2>
            <p>Refresh this page to try loading staff messages again.</p>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

export default function Messages() {
  return (
    <MessagesBoundary>
      <MessagesView />
    </MessagesBoundary>
  );
}
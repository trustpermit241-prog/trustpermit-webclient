import { useEffect, useState } from "react";
import io from "socket.io-client";

const API_URL = "https://trustpermit-backend.onrender.com";

const socket = io(API_URL, {
  transports: ["websocket", "polling"],
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

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 40px)",
        background: "#f8fafc",
        borderRadius: "18px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          width: "330px",
          background: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          padding: "20px",
          overflowY: "auto",
        }}
      >
        <h2 style={{ marginBottom: "5px" }}>Messages</h2>

        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
          User support requests
        </p>

        {requests.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            No message requests yet.
          </p>
        ) : (
          requests.map((chat) => (
            <div
              key={chat.roomId}
              onClick={() => openChat(chat)}
              style={{
                padding: "14px",
                border: "1px solid #e5e7eb",
                marginBottom: "12px",
                borderRadius: "14px",
                background:
                  selectedChat?.roomId === chat.roomId ? "#eff6ff" : "#ffffff",
                cursor: "pointer",
              }}
            >
              <h4 style={{ margin: "0 0 6px" }}>
                {chat.userName || "User"}
              </h4>

              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                {chat.lastMessage || "No message yet"}
              </p>

              <span
                style={{
                  display: "inline-block",
                  padding: "5px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: "700",
                  background:
                    chat.status === "approved" ? "#dcfce7" : "#fef3c7",
                  color:
                    chat.status === "approved" ? "#166534" : "#92400e",
                }}
              >
                {chat.status}
              </span>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          flex: 1,
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {selectedChat ? (
          <>
            <div
              style={{
                paddingBottom: "15px",
                borderBottom: "1px solid #e5e7eb",
                marginBottom: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>
                  {selectedChat.userName || "User"}
                </h2>

                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  Status: {selectedChat.status}
                </p>
              </div>

              {selectedChat.status !== "approved" && (
                <button
                  onClick={approveChat}
                  style={{
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "12px",
                    background: "#2563eb",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontWeight: "700",
                  }}
                >
                  Approve Chat
                </button>
              )}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "15px",
              }}
            >
              {!selectedChat.messages || selectedChat.messages.length === 0 ? (
                <p style={{ color: "#64748b" }}>No messages yet.</p>
              ) : (
                selectedChat.messages.map((msg, index) => (
                  <div
                    key={msg._id || index}
                    style={{
                      display: "flex",
                      justifyContent:
                        msg.sender === "staff" ? "flex-end" : "flex-start",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "70%",
                        padding: "10px 14px",
                        borderRadius: "14px",
                        background:
                          msg.sender === "staff"
                            ? "#2563eb"
                            : msg.sender === "system"
                            ? "#f1f5f9"
                            : "#e5e7eb",
                        color:
                          msg.sender === "staff" ? "#ffffff" : "#111827",
                      }}
                    >
                      <strong style={{ fontSize: "12px" }}>
                        {msg.sender}
                      </strong>

                      <p style={{ margin: "4px 0 0" }}>
                        {msg.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Type your reply..."
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  outline: "none",
                }}
              />

              <button
                onClick={sendMessage}
                style={{
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  background: "#16a34a",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "700",
                }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
            }}
          >
            <h3>Select a user message request</h3>
          </div>
        )}
      </div>
    </div>
  );
}
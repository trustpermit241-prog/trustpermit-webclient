import { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import "./Askhelp.css";

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

export default function AskHelp() {
  const messagesEndRef = useRef(null);
  const idleTimeoutRef = useRef(null);

  const getTime = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id || user?.id || "guest";

  const CHAT_MESSAGES_KEY = `askhelp_messages_${userId}`;
  const CHAT_ROOM_KEY = `askhelp_roomId_${userId}`;
  const CHAT_APPROVED_KEY = `askhelp_approved_${userId}`;

  const [roomId, setRoomId] = useState(
    localStorage.getItem(CHAT_ROOM_KEY) || ""
  );

  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem(CHAT_MESSAGES_KEY);

    if (savedMessages) {
      return JSON.parse(savedMessages);
    }

    return [
      {
        sender: "agent",
        text: "Hello! I am your Trust Permit Assistant. How may I help you today?",
        showMenu: true,
        time: getTime(),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [humanConnected, setHumanConnected] = useState(
    !!localStorage.getItem(CHAT_ROOM_KEY)
  );

  const [chatApproved, setChatApproved] = useState(
    localStorage.getItem(CHAT_APPROVED_KEY) === "true"
  );

  const [idlePromptVisible, setIdlePromptVisible] = useState(false);

  const formatBackendMessages = (backendMessages = []) => {
    return backendMessages.map((msg) => {
      const legacyAttachment = String(msg.text || "").match(/^(?:Attachment|Image):\s*(.+)$/i);
      return {
      sender:
        msg.sender === "staff"
          ? "agent"
          : msg.sender === "system"
          ? "agent"
          : "user",
      text: msg.text,
      time:
        msg.time ||
        new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      attachmentUrl: msg.attachmentUrl || (legacyAttachment ? `/uploads/${legacyAttachment[1]}` : ""),
      attachmentName: msg.attachmentName || "",
      attachmentType: msg.attachmentType || "",
      showMenu: false,
      };
    });
  };

  const fetchChatHistory = async (currentRoomId) => {
    if (!currentRoomId) return;

    try {
      const res = await fetch(`${API_URL}/api/chats/${currentRoomId}`);

      if (!res.ok) return;

      const chat = await res.json();

      if (chat?.messages) {
        const restoredMessages = formatBackendMessages(chat.messages);

        setMessages(restoredMessages);
        setHumanConnected(true);
        setChatApproved(chat.status === "approved");

        localStorage.setItem(
          CHAT_MESSAGES_KEY,
          JSON.stringify(restoredMessages)
        );

        localStorage.setItem(CHAT_ROOM_KEY, currentRoomId);

        localStorage.setItem(
          CHAT_APPROVED_KEY,
          chat.status === "approved" ? "true" : "false"
        );
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  };

  useEffect(() => {
    if (roomId) {
      socket.emit("join_chat_room", {
        roomId,
      });

      fetchChatHistory(roomId);
    }

    socket.on("chat_approved", (data) => {
      setChatApproved(true);
      localStorage.setItem(CHAT_APPROVED_KEY, "true");

      setMessages((prev) => [
        ...prev,
        {
          sender: "agent",
          text: data.message || "City Hall staff approved your chat.",
          time: getTime(),
          showMenu: false,
        },
      ]);
    });

    socket.on("receive_chat_message", (msg) => {
      if (msg.sender === "staff" && msg.roomId === roomId) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "agent",
            text: msg.text,
            attachmentUrl: msg.attachmentUrl || "",
            attachmentName: msg.attachmentName || "",
            time: getTime(),
            showMenu: false,
          },
        ]);
      }
    });

    socket.on("chat_updated", (chat) => {
      if (chat?.roomId === roomId && chat?.messages) {
        const updatedMessages = formatBackendMessages(chat.messages);

        setMessages(updatedMessages);
        setChatApproved(chat.status === "approved");

        localStorage.setItem(
          CHAT_MESSAGES_KEY,
          JSON.stringify(updatedMessages)
        );

        localStorage.setItem(
          CHAT_APPROVED_KEY,
          chat.status === "approved" ? "true" : "false"
        );
      }
    });

    return () => {
      socket.off("chat_approved");
      socket.off("receive_chat_message");
      socket.off("chat_updated");
    };
  }, [roomId, CHAT_APPROVED_KEY, CHAT_MESSAGES_KEY]);

  useEffect(() => {
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));

    if (roomId) {
      localStorage.setItem(CHAT_ROOM_KEY, roomId);
    }
  }, [messages, roomId, CHAT_MESSAGES_KEY, CHAT_ROOM_KEY]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    if (humanConnected) {
      idleTimeoutRef.current = setTimeout(() => {
        setIdlePromptVisible(true);
      }, 10000);
    }
  }, [messages, isTyping, humanConnected]);

  const connectToStaff = () => {
    if (!user || userId === "guest") {
      alert("Please login first.");
      return;
    }

    const userName =
      user.name || user.fullName || user.email || "User";

    const newRoomId = `chat_${userId}`;

    setRoomId(newRoomId);
    setHumanConnected(true);
    setChatApproved(false);
    setIdlePromptVisible(false);

    localStorage.setItem(CHAT_ROOM_KEY, newRoomId);
    localStorage.setItem(CHAT_APPROVED_KEY, "false");

    socket.emit("join_chat_room", {
      roomId: newRoomId,
    });

    socket.emit("user_request_staff", {
      userId,
      userName,
      roomId: newRoomId,
      lastMessage: "User wants to connect to staff",
    });

    setMessages((prev) => [
      ...prev.map((msg) => ({
        ...msg,
        showMenu: false,
      })),
      {
        sender: "agent",
        text: "Waiting for staff approval...",
        time: getTime(),
        showMenu: false,
      },
    ]);
  };

  const restoreChat = () => {
    const savedRoomId = localStorage.getItem(CHAT_ROOM_KEY);

    if (!savedRoomId) {
      alert("No previous chat found for this account.");
      return;
    }

    setRoomId(savedRoomId);
    setHumanConnected(true);
    setIdlePromptVisible(false);

    socket.emit("join_chat_room", {
      roomId: savedRoomId,
    });

    fetchChatHistory(savedRoomId);
  };

  const refreshChat = () => {
    localStorage.removeItem(CHAT_MESSAGES_KEY);
    localStorage.removeItem(CHAT_ROOM_KEY);
    localStorage.removeItem(CHAT_APPROVED_KEY);

    setRoomId("");
    setHumanConnected(false);
    setChatApproved(false);
    setIdlePromptVisible(false);

    setMessages([
      {
        sender: "agent",
        text: "Chat has been refreshed. How may I help you today?",
        time: getTime(),
        showMenu: true,
      },
    ]);
  };

  const handleIdleChoice = (choice) => {
    setIdlePromptVisible(false);

    if (choice === "refresh") {
      refreshChat();
    }

    if (choice === "continue") {
      setMessages((prev) => [
        ...prev,
        {
          sender: "agent",
          text: "Okay, you can continue your chat.",
          time: getTime(),
          showMenu: false,
        },
      ]);
    }

    if (choice === "restore") {
      restoreChat();
    }
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text,
        time: getTime(),
      },
    ]);

    setInput("");

    if (humanConnected && roomId) {
      socket.emit("send_chat_message", {
        roomId,
        sender: "user",
        text,
        time: getTime(),
      });

      return;
    }

    setIsTyping(true);

    setTimeout(() => {
      generateAutomatedResponse(text.toLowerCase());
      setIsTyping(false);
    }, 300);
  };

  const generateAutomatedResponse = (input) => {
    let response = "";
    let showMenu = false;

    if (input.includes("inspection")) {
      response =
        "Inspection Types:\n• Fire Safety Inspection\n• Sanitary Inspection\n• Building & Electrical\n• Locational / Zoning\n• Environmental";
    } else if (input.includes("report")) {
      response =
        "Please describe the issue you are experiencing. A representative will be notified.";
    } else if (input.includes("billing") || input.includes("payment")) {
      response =
        "Billing Services:\n• Open your Account page\n• Go to Payment section\n• Select GCash or Bank/Card\n• Submit your payment details";
    } else if (input.includes("permit")) {
      response =
        "Permit Requirements:\n• Barangay Clearance\n• DTI / SEC Registration\n• Lease Contract\n• Valid ID";
    } else if (input.includes("back")) {
      response = "How may I help you today?";
      showMenu = true;
    } else {
      response = `I've received your request regarding "${input}".`;
      showMenu = false;
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: "agent",
        text: response,
        time: getTime(),
        showMenu,
      },
    ]);
  };

  const AutomatedMenu = () => (
    <div className="automated-menu">
      {!humanConnected && (
        <>
          <button
            type="button"
            onClick={() => sendMessage("Billing Services")}
          >
            Billing Services
          </button>

          <button
            type="button"
            onClick={() => sendMessage("Report a Problem")}
          >
            Report a Problem
          </button>

          <button
            type="button"
            onClick={() => sendMessage("Permit Requirements")}
          >
            Permit Requirements
          </button>

          <button
            type="button"
            onClick={() => sendMessage("Inspection Help")}
          >
            Inspection Help
          </button>

          <button type="button" onClick={connectToStaff}>
            Connect to Human Staff
          </button>
        </>
      )}

      <button type="button" className="restore-btn" onClick={restoreChat}>
        Restore Chat
      </button>
    </div>
  );

  return (
    <div className="askhelp-chat card">
      <h2>City Hall Chat Assistant</h2>

      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.sender}`}>
            <div className="avatar">
              {msg.sender === "agent" ? "🏛️" : "🧑"}
            </div>

            <div className="message-content">
              {msg.attachmentUrl && <img className="chat-attachment-image" src={msg.attachmentUrl.startsWith("http") || msg.attachmentUrl.startsWith("data:") ? msg.attachmentUrl : `${API_URL.replace(/\/$/, "")}${msg.attachmentUrl}`} alt={msg.attachmentName || "Chat attachment"} />}
              <div className="text">{msg.text}</div>

              <div className="time">{msg.time}</div>

              {msg.showMenu && <AutomatedMenu />}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="chat-message agent typing">
            <div className="avatar">🏛️</div>

            <div className="message-content">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}

        {idlePromptVisible && (
          <div className="idle-prompt">
            <p>
              You haven't responded for a while. What would you like to do?
            </p>

            <div className="idle-buttons">
              <button
                type="button"
                onClick={() => handleIdleChoice("refresh")}
              >
                Refresh Chat
              </button>

              <button
                type="button"
                onClick={() => handleIdleChoice("continue")}
              >
                Continue Chat
              </button>

              <button
                type="button"
                onClick={() => handleIdleChoice("restore")}
              >
                Restore Chat
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {humanConnected && !chatApproved && (
        <p className="chat-status">Waiting for staff approval...</p>
      )}

      {humanConnected && chatApproved && (
        <p className="chat-status approved">Staff approved your chat.</p>
      )}

      <form
        className="chat-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          type="text"
          placeholder={
            humanConnected && !chatApproved
              ? "You can type while waiting for approval..."
              : "Type a message..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button type="submit">Send</button>
      </form>
    </div>
  );
}
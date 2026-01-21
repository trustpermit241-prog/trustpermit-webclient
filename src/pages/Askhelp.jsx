import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Askhelp.css";

export default function AskHelp() {
  const navigate = useNavigate();

  // Time helper
  const getTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Chat state
  const [messages, setMessages] = useState([
    {
      sender: "agent",
      text: "Hello! I’m your City Hall assistant. How can I help you today?",
      time: getTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState({ topic: null, step: 0, subtopic: null });

  const messagesEndRef = useRef(null);
  const inactivityTimer = useRef(null);

  // --- Inactivity Timer (FIXED) ---
  const startInactivityTimer = useCallback(() => {
    inactivityTimer.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "agent",
          text: "It seems you haven't replied yet. You can choose to continue chatting or refresh the conversation.",
          time: getTime(),
          actionButtons: true,
        },
      ]);
    }, Math.floor(Math.random() * 5000) + 5000);
  }, []);

  useEffect(() => {
    startInactivityTimer();
    return () => clearTimeout(inactivityTimer.current);
  }, [startInactivityTimer]);

  // --- Send Message ---
  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      sender: "user",
      text: input,
      time: getTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    clearTimeout(inactivityTimer.current);
    startInactivityTimer();

    setTimeout(() => {
      const reply = generateAgentReply(input, context);
      setMessages((prev) => [
        ...prev,
        { sender: "agent", text: reply, time: getTime() },
      ]);
      setIsTyping(false);
    }, 800);
  };

  // --- Refresh Chat ---
  const refreshChat = () => {
    setMessages([
      {
        sender: "agent",
        text: "Hello! I’m your City Hall assistant. How can I help you today?",
        time: getTime(),
      },
    ]);
    setContext({ topic: null, step: 0, subtopic: null });
    setInput("");
    clearTimeout(inactivityTimer.current);
    startInactivityTimer();
  };

  // --- Continue Chat ---
  const continueChat = () => {
    setMessages((prev) => [
      ...prev,
      {
        sender: "agent",
        text: "Sure! Please continue typing your concern.",
        time: getTime(),
      },
    ]);
    clearTimeout(inactivityTimer.current);
    startInactivityTimer();
  };

  // --- Assistant Logic ---
  const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const setContextReturn = (topic, step, subtopic, reply) => {
    setContext({ topic, step, subtopic });
    return reply;
  };

  const generateAgentReply = (text, ctx) => {
    const lower = text.toLowerCase();

    if (/(hello|hi|hey)/.test(lower))
      return random([
        "Hello! How can I assist you today?",
        "Hi there! Need help with City Hall services?",
        "Hey! I’m here to guide you through permits, inspections, and more.",
      ]);

    if (/(bye|goodbye)/.test(lower))
      return random([
        "Goodbye! Have a great day!",
        "See you later! City Hall is always here to assist.",
      ]);

    if (!ctx.topic) {
      if (lower.includes("permit"))
        return setContextReturn(
          "permit",
          1,
          null,
          "I can help with permits. Are you applying for a business permit, building permit, or other?"
        );
      if (lower.includes("inspection"))
        return setContextReturn(
          "inspection",
          1,
          null,
          "I can assist with inspections. Do you want to schedule one or check status?"
        );
      if (lower.includes("fee") || lower.includes("cost"))
        return setContextReturn(
          "fee",
          1,
          null,
          "Which service or permit's fees do you want to know?"
        );
      if (lower.includes("requirement") || lower.includes("documents"))
        return setContextReturn(
          "requirement",
          1,
          null,
          "Please tell me which permit or service you need requirements for."
        );
      if (lower.includes("status") || lower.includes("track"))
        return setContextReturn(
          "status",
          1,
          null,
          "Which application or service status would you like to check?"
        );
      return "Could you specify if you need help with permits, inspections, fees, requirements, or status tracking?";
    }

    return "I’ve provided all guidance I can. Click 'Refresh Chat' if you want to start a new conversation.";
  };

  // --- Auto-scroll ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // --- Logo style ---
  const logoStyle = {
    width: "60px",
    height: "60px",
    backgroundImage: "url('/images/lugoo.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    borderRadius: "50%",
    cursor: "pointer",
    border: "2px solid #2c3e50",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  };

  return (
    <div className="askhelp-container">
      <div className="top-nav">
        <div style={logoStyle} onClick={() => navigate("/home")} />
        <div className="nav-buttons">
          <button onClick={() => navigate("/home")}>Home</button>
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
          <button onClick={() => navigate("/")}>Logout</button>
        </div>
      </div>

      <div className="askhelp-chat card">
        <h2>🏛️ City Hall Chat Assistant</h2>

        <div className="chat-window">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.sender}`}>
              <div className="avatar">{msg.sender === "agent" ? "🏛️" : "🧑"}</div>
              <div className="message-content">
                <div className="text">{msg.text}</div>
                <div className="time">{msg.time}</div>

                {msg.actionButtons && (
                  <div className="action-buttons">
                    <button onClick={refreshChat}>Refresh Chat</button>
                    <button onClick={continueChat}>Continue Chat</button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-message agent typing">
              <div className="avatar">🏛️</div>
              <div className="message-content">
                <div className="text">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="Type your concern..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

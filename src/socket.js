// ===================== SOCKET.IO FRONTEND =====================
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://trustpermit-backend.onrender.com"; // your Render backend

export default function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket
    socketRef.current = io(SOCKET_URL, {
      path: "/socket.io",      // must match server.js
      transports: ["websocket", "polling"],
    });

    // Listen for new chat messages
    socketRef.current.on("receive_chat_message", (message) => {
      console.log("New message:", message);
      // Update your chat state here
    });

    // Listen for chat approvals
    socketRef.current.on("chat_approved", (data) => {
      console.log("Chat approved:", data);
    });

    // Listen for updated chat list
    socketRef.current.on("chat_updated", (chat) => {
      console.log("Chat updated:", chat);
    });

    // Listen for staff messages
    socketRef.current.on("staff_receive_message", (message) => {
      console.log("Staff received message:", message);
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef;
}
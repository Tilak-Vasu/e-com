// ChatWidget.tsx

import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import AdminChatView from "./AdminChatView";
import CustomerChatView from "./CustomerChatView";
import { MessageCircle, X } from "lucide-react";
import "./ChatWidget.css";

const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);

  if (!user) return null;

  const handleToggleChat = () => {
    if (!isOpen) {
      if (user.is_staff) {
        setChatKey((prev) => prev + 1);
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="chat-widget-container">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span className="chat-title">
              {user.is_staff ? "Support Dashboard" : "Live Chat"}
            </span>
            <button className="chat-close-btn" onClick={handleToggleChat}>
              <X size={18} />
            </button>
          </div>

          {user.is_staff ? (
            <AdminChatView key={chatKey} />
          ) : (
            <CustomerChatView key="customer-chat" onClose={handleToggleChat} />
          )}
        </div>
      )}

      {!isOpen && (
        <button className="chat-toggle-button" onClick={handleToggleChat}>
          <MessageCircle size={26} />
        </button>
      )}
    </div>
  );
};

export default ChatWidget;

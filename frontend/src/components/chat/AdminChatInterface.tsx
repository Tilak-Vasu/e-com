// src/components/chat/AdminChatInterface.tsx

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { askAdminChatbotAPI, getAdminChatHistoryAPI } from '../../api';
import type { ApiChatMessage } from '../../api/types';
import './AdminChatInterface.css';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

const AdminChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await getAdminChatHistoryAPI();
      const apiMessages: ApiChatMessage[] = response.data;
      
      const convertedMessages: ChatMessage[] = apiMessages.map((msg, index) => ({
        id: `history-${msg.id || index}`,
        text: msg.message,
        // THE FIX: This now correctly identifies staff messages as 'user' messages.
        isUser: msg.is_staff,
        timestamp: new Date(msg.timestamp)
      }));
      
      setMessages(convertedMessages);
      setIsHistoryLoaded(true);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setIsHistoryLoaded(true); // Still mark as loaded to avoid infinite loading
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      text: 'Thinking...',
      isUser: false,
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await askAdminChatbotAPI(userMessage.text);
      
      // Remove loading message and add actual response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        return [...withoutLoading, {
          id: `assistant-${Date.now()}`,
          text: response.data.response,
          isUser: false,
          timestamp: new Date()
        }];
      });
    } catch (error) {
      console.error('Chat error:', error);
      
      // Replace loading message with error message
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        return [...withoutLoading, {
          id: `error-${Date.now()}`,
          text: 'Sorry, I encountered an error. Please try again.',
          isUser: false,
          timestamp: new Date()
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isHistoryLoaded) {
    return (
      <div className="admin-chat-loading">
        <div className="loading-spinner"></div>
        <p>Loading chat history...</p>
      </div>
    );
  }

  return (
    <div className="admin-chat-interface">
      {/* Messages Container */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h4>👋 Hello! I'm Gem, your AI assistant.</h4>
            <p>I can help you with:</p>
            <ul>
              <li>Sales performance and analytics</li>
              <li>Product information and inventory</li>
              <li>Order details and customer data</li>
              <li>Company policies and procedures</li>
            </ul>
            <p>Just ask me anything in plain English!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isUser ? 'user' : 'assistant'} ${
                message.isLoading ? 'loading' : ''
              }`}
            >
              <div className="message-header">
                <span className="sender">
                  {message.isUser ? 'You' : 'Gemini'}
                </span>
                <span className="timestamp">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <div className="message-content">
                {message.isLoading ? (
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : message.isUser ? (
                  <p>{message.text}</p>
                ) : (
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter Your Query ..."
            rows={1}
            disabled={isLoading}
            className="message-input"
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
        <div className="input-footer">
          <small>Press Enter to send, Shift+Enter for new line</small>
        </div>
      </div>
    </div>
  );
};

export default AdminChatInterface;
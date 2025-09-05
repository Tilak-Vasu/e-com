// src/pages/AdminChatbotPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import AdminChatInterface from '../components/chat/AdminChatInterface'; // Fixed import path
import './AdminChatbotPage.css';

const AdminChatbotPage: React.FC = () => {
  return (
    <div className="admin-chatbot-page">
      <div className="chatbot-header">
        <Link to="/admin/dashboard" className="back-link">&larr; Back to Dashboard</Link>
        <h1>Admin AI Assistant</h1>
        <p>Ask complex questions about sales, products, or company policies in plain English.</p>
      </div>
      <div className="chat-container">
        <AdminChatInterface />
      </div>
    </div>
  );
};

export default AdminChatbotPage;

// AdminChatView.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import ChatInput from './ChatInput';

interface Message {
    id?: number;
    username: string;
    message: string;
    timestamp?: string;
    is_staff?: boolean; 
}

// Reusable component for a single chat conversation
const ChatConversation: React.FC<{ thread: any; onBack: () => void }> = ({ thread, onBack }) => {
    //
    // THIS IS THE PRIMARY FIX: Map 'm.message' instead of 'm.text'.
    //
    const [messages, setMessages] = useState<Message[]>(thread.messages.map((m: any) => ({ 
        ...m, 
        message: m.message || m.text // Use the same robust mapping as CustomerChatView
    })));
    
    const socketRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const { user, authTokens } = useAuth();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!authTokens?.access) {
            console.error("Authentication error: No access token available for WebSocket.");
            return;
        }
        const wsUrl = `ws://127.0.0.1:8000/ws/chat/${thread.id}/?token=${authTokens.access}`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => console.log(`WebSocket connected for thread ${thread.id}`);
        ws.onclose = () => console.log(`WebSocket disconnected for thread ${thread.id}`);
        ws.onerror = (e) => console.error("WebSocket error:", e);
        
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            setMessages(prev => [...prev, data]);
        };

        return () => {
            ws.close();
        };
    }, [thread.id, authTokens]);
    
    const handleSendMessage = (message: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ message }));
        }
    };

    const getDisplayName = (msg: Message): string => {
        if (msg.username === user?.username) return 'You';
        if (!msg.is_staff) return msg.username;
        return msg.username;
    };

    const customerName = thread.participants_usernames.find((name: string) => name !== user?.username) || 'Customer';

    return (
        <div className="chat-view">
            <div className="chat-header admin-chat-header">
                <button className="back-button" onClick={onBack}>
                    ← Back to List
                </button>
                <span>Chat with {customerName}</span>
            </div>
            <div className="messages-area">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-bubble ${msg.username === user?.username ? 'sent' : 'received'}`}>
                        <strong>{getDisplayName(msg)}:</strong>
                        {' '}{msg.message}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-container">
                <ChatInput onSendMessage={handleSendMessage} />
            </div>
        </div>
    );
};

// Main Admin View (with the state management fix included)
const AdminChatView: React.FC = (_props) => {
    const [threads, setThreads] = useState<any[]>([]);
    const [selectedThread, setSelectedThread] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const api = useApi();
    const { user } = useAuth();
    
    const fetchThreads = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/chat_threads/');
            setThreads(response.data);
        } catch (error) {
            console.error("Failed to fetch chat threads", error);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchThreads();
        const interval = setInterval(() => {
            api.get('/chat_threads/').then(response => {
                setThreads(response.data);
            }).catch(err => console.error("Silent refresh failed:", err));
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchThreads, api]);

    const handleBackToList = () => {
        setSelectedThread(null);
        fetchThreads(); // Refreshes the parent's state
    };

    if (loading) return <div className="chat-loading">Loading Conversations...</div>;
    
    if (selectedThread) {
        return <ChatConversation thread={selectedThread} onBack={handleBackToList} />;
    }

    if (threads.length === 0) {
        return (
            <div className="admin-chat-list">
                <div className="chat-header">Active Conversations</div>
                <p className="no-chats-message">No active customer chats.</p>
            </div>
        )
    }

    return (
        <div className="admin-chat-list">
            <div className="chat-header">Active Conversations</div>
            <ul>
                {threads.map(thread => {
                    const customerName = thread.participants_usernames.find((name: string) => name !== user?.username) || 'Unknown User';
                    return (
                        <li key={thread.id} onClick={() => setSelectedThread(thread)}>
                           <span>Chat with {customerName}</span>
                           <span className="last-updated">
                                Last updated: {new Date(thread.updated_at).toLocaleTimeString()}
                           </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default AdminChatView;
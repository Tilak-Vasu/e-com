// CustomerChatView.tsx
import React, { useState, useEffect, useRef } from 'react';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import ChatInput from './ChatInput';
import { X } from "lucide-react";

interface Message {
    id?: number;
    username: string;
    message: string;
    timestamp?: string;
    is_staff?: boolean;
    is_admin?: boolean;
}

interface CustomerChatViewProps {
    onClose?: () => void;
}

const CustomerChatView: React.FC<CustomerChatViewProps> = ({ onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const api = useApi();
    const { user, authTokens } = useAuth();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (socketRef.current) {
            return;
        }

        const initializeChat = async () => {
            try {
                if (!authTokens?.access) {
                    setError("You must be logged in to chat.");
                    setLoading(false);
                    return;
                }

                setLoading(true);
                setError(null);
                const response = await api.get('/chat_threads/');
                let threadId: number | null = null;
                
                if (response.data && response.data.length > 0) {
                    const existingThread = response.data[0];
                    threadId = existingThread.id;
                    const mappedMessages = existingThread.messages.map((m: any) => ({
                        id: m.id,
                        username: m.username,
                        message: m.message || m.text,
                        timestamp: m.timestamp,
                        is_staff: m.is_staff || false,
                        is_admin: m.is_admin || false,
                    }));
                    setMessages(mappedMessages);
                } else {
                    const createResponse = await api.post('/chat_threads/', {});
                    threadId = createResponse.data.id;
                }

                if (threadId) {
                    const wsUrl = `ws://127.0.0.1:8000/ws/chat/${threadId}/?token=${authTokens.access}`;
                    const ws = new WebSocket(wsUrl);
                    socketRef.current = ws;

                    ws.onopen = () => console.log("WebSocket connected");
                    ws.onclose = () => console.log("WebSocket disconnected");
                    ws.onerror = (e) => console.error("WebSocket error:", e);

                    ws.onmessage = (e) => {
                        const data = JSON.parse(e.data);
                        const formattedMessage = {
                            username: data.username,
                            message: data.message,
                            timestamp: data.timestamp,
                            is_staff: data.is_staff || false,
                            is_admin: data.is_admin || false,
                        };
                        setMessages(prev => [...prev, formattedMessage]);
                    };
                } else {
                    throw new Error("Could not establish a chat thread.");
                }

            } catch (err) {
                console.error("Failed to initialize chat:", err);
                setError("Could not connect to chat. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        initializeChat();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [api, authTokens]);

    const handleSendMessage = (message: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ message }));
        }
    };

    const getDisplayName = (msg: Message): string => {
        if (msg.username === user?.username) {
            return 'You';
        }
        // ✅ treat staff and admin as same
        if (msg.is_staff || msg.is_admin) {
            return 'Customer Care';
        }
        return msg.username;
    };

    if (loading) return <div className="chat-loading">Connecting to Support...</div>;
    if (error) return <div className="chat-error">{error}</div>;

    return (
        <div className="chat-view">
            <div className="chat-header">
                <span>Support Chat</span>
                {onClose && (
                    <button className="chat-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                )}
            </div>
            <div className="messages-area">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-bubble ${msg.username === user?.username ? 'sent' : 'received'}`}>
                        <strong>{getDisplayName(msg)}:</strong> {msg.message}
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

export default CustomerChatView;

// src/components/chat/CustomerChatView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
// Import the specific API functions you need
import { askChatbotAPI } from '../../api';
import useApi from '../../hooks/useApi'; // Still needed for the chat_threads endpoint
import { X } from "lucide-react";
import ChatInput from './ChatInput';
// This interface matches your backend's ChatMessageSerializer
interface ApiMessage {
id: number;
message: string;
timestamp: string;
username: string;
}
// This interface is for the component's internal state
interface Message {
id: string;
sender: 'user' | 'bot';
text: string;
timestamp: Date;
}
interface CustomerChatViewProps {
onClose?: () => void;
}
const CustomerChatView: React.FC<CustomerChatViewProps> = ({ onClose }) => {
const [messages, setMessages] = useState<Message[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [, setError] = useState<string | null>(null);
const [isHistoryLoading, setIsHistoryLoading] = useState(true);
const messagesEndRef = useRef<HTMLDivElement | null>(null);
const api = useApi(); // We still need the generic instance for the threads endpoint
const { user } = useAuth();

useEffect(() => {
    if (!isHistoryLoading) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
}, [messages, isHistoryLoading]);

// --- FIX 1: FETCH CHAT HISTORY ON COMPONENT LOAD ---
useEffect(() => {
    const fetchChatHistory = async () => {
        if (!user) return;

        setIsHistoryLoading(true);
        try {
            // This POST request gets or creates the user's chat thread
            const response = await api.post('/chat_threads/', {}); 
            const thread = response.data;
            
            if (thread.messages && thread.messages.length > 0) {
                const formattedMessages: Message[] = thread.messages.map((msg: ApiMessage) => ({
                    id: `hist-${msg.id}`,
                    text: msg.message,
                    sender: msg.username === user.username ? 'user' : 'bot',
                    timestamp: new Date(msg.timestamp)
                }));
                setMessages(formattedMessages);
            } else {
                // Show a welcome message if there's no history
                setMessages([
                    {
                        id: 'welcome',
                        sender: 'bot',
                        text: `Hello ${user.username}! I'm your AI assistant. How can I help with your orders today?`,
                        timestamp: new Date()
                    }
                ]);
            }
        } catch (err) {
            console.error("Failed to fetch chat history:", err);
            setError("Could not load chat history.");
        } finally {
            setIsHistoryLoading(false);
        }
    };

    fetchChatHistory();
}, [user]); // Re-run this effect if the user object changes

// --- UPDATED to use your new askChatbotAPI function ---
const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: messageText,
        timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
        // Use your new, clean API function
        const response = await askChatbotAPI(messageText);
        
        const botMessage: Message = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: response.data.response,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);

    } catch (error: any) {
        const errorMessage: Message = {
            id: `error-${Date.now()}`,
            sender: 'bot',
            text: "I'm sorry, I'm having trouble connecting right now. Please try again.",
            timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setError("Failed to get response from AI assistant");
    } finally {
        setIsLoading(false);
    }
};

const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// The rest of the JSX remains the same...
return (
    <div className="chat-view">
        <div className="chat-header">
            <span>AI Assistant</span>
            {onClose && <button className="chat-close-btn" onClick={onClose}><X size={18} /></button>}
        </div>
        
        <div className="messages-area">
            {isHistoryLoading ? (
                <div className="message-bubble received"><span>Loading history...</span></div>
            ) : (
                messages.map((msg) => (
                    <div key={msg.id} className={`message-bubble ${msg.sender === 'user' ? 'sent' : 'received'}`}>
                        <div className="message-content">
                            <strong>{msg.sender === 'user' ? 'You' : 'Customer Care'}:</strong> {msg.text}
                        </div>
                        <div className="message-time">{formatTime(msg.timestamp)}</div>
                    </div>
                ))
            )}
            
            {isLoading && (
                <div className="message-bubble received typing-indicator">
                    <div className="message-content">
                        <strong>E-Shop Bot:</strong>
                        <div className="typing-dots"><span></span><span></span><span></span></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input-container">
            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading || isHistoryLoading} />
        </div>
    </div>
);
};
export default CustomerChatView;


// // src/components/chat/CustomerChatView.tsx
// import React, { useState, useEffect, useRef } from 'react';
// import { useAuth } from '../../hooks/useAuth';
// import { askChatbotAPI } from '../../api';
// import useApi from '../../hooks/useApi';
// import ChatInput from './ChatInput';
// import './c.css';

// // This interface matches your backend's ChatMessageSerializer
// interface ApiMessage {
//   id: number;
//   message: string;
//   timestamp: string;
//   username: string;
//   is_from_ai?: boolean; // Optional field to distinguish AI vs human staff
// }

// // This interface is for the component's internal state
// interface Message {
//   id: string;
//   sender: 'user' | 'bot' | 'staff';
//   text: string;
//   timestamp: Date;
// }

// interface CustomerChatViewProps {
//   onClose?: () => void;
// }

// const CustomerChatView: React.FC<CustomerChatViewProps> = ({ }) => {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isHistoryLoading, setIsHistoryLoading] = useState(true);
//   const messagesEndRef = useRef<HTMLDivElement | null>(null);
//   const api = useApi();
//   const { user } = useAuth();

//   // Auto-scroll to bottom when new messages arrive
//   useEffect(() => {
//     if (!isHistoryLoading) {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }
//   }, [messages, isHistoryLoading]);

//   // Fetch chat history on component load
//   useEffect(() => {
//     const fetchChatHistory = async () => {
//       if (!user) return;

//       setIsHistoryLoading(true);
//       setError(null);
      
//       try {
//         // This POST request gets or creates the user's chat thread
//         const response = await api.post('/chat_threads/', {}); 
//         const thread = response.data;
        
//         if (thread.messages && thread.messages.length > 0) {
//           const formattedMessages: Message[] = thread.messages.map((msg: ApiMessage) => {
//             let sender: 'user' | 'bot' | 'staff';
            
//             if (msg.username === user.username) {
//               sender = 'user';
//             } else if (msg.is_from_ai) {
//               sender = 'bot';
//             } else {
//               sender = 'staff'; // Human admin/staff response
//             }
            
//             return {
//               id: `hist-${msg.id}`,
//               text: msg.message,
//               sender: sender,
//               timestamp: new Date(msg.timestamp)
//             };
//           });
//           setMessages(formattedMessages);
//         } else {
//           // Show a welcome message if there's no history
//           setMessages([
//             {
//               id: 'welcome',
//               sender: 'bot' as const,
//               text: `Hello ${user.username}! I'm your AI assistant. How can I help with your orders today?`,
//               timestamp: new Date()
//             }
//           ]);
//         }
//       } catch (err) {
//         console.error("Failed to fetch chat history:", err);
//         setError("Could not load chat history. Please refresh the page.");
//         // Still show welcome message even if history fails
//         setMessages([
//           {
//             id: 'welcome',
//             sender: 'bot' as const,
//             text: `Hello ${user?.username || 'there'}! I'm your AI assistant. How can I help with your orders today?`,
//             timestamp: new Date()
//           }
//         ]);
//       } finally {
//         setIsHistoryLoading(false);
//       }
//     };

//     fetchChatHistory();
//   }, [user, api]);

//   const handleSendMessage = async (messageText: string) => {
//     if (!messageText.trim() || isLoading) return;

//     const userMessage: Message = {
//       id: `user-${Date.now()}`,
//       sender: 'user',
//       text: messageText,
//       timestamp: new Date()
//     };
    
//     setMessages(prev => [...prev, userMessage]);
//     setIsLoading(true);
//     setError(null);

//     try {
//       // Use the clean API function
//       const response = await askChatbotAPI(messageText);
      
//       const botMessage: Message = {
//         id: `bot-${Date.now()}`,
//         sender: 'bot',
//         text: response.data.response || "I received your message but couldn't generate a response.",
//         timestamp: new Date()
//       };
//       setMessages(prev => [...prev, botMessage]);

//     } catch (error: any) {
//       console.error("Chat API error:", error);
//       const errorMessage: Message = {
//         id: `error-${Date.now()}`,
//         sender: 'bot',
//         text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
//         timestamp: new Date()
//       };
//       setMessages(prev => [...prev, errorMessage]);
//       setError("Failed to get response from AI assistant");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Helper function to get display name based on sender type
//   const getSenderDisplayName = (sender: 'user' | 'bot' | 'staff') => {
//     switch (sender) {
//       case 'user':
//         return 'You';
//       case 'bot':
//         return 'AI Support';
//       case 'staff':
//         return 'Customer Care';
//       default:
//         return 'Support';
//     }
//   };

//   const formatTime = (timestamp: Date) => {
//     return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   return (
//     <div className="chat-view">
//       {error && (
//         <div className="chat-error">
//           {error}
//         </div>
//       )}
      
//       <div className="messages-area">
//         {isHistoryLoading ? (
//           <div className="message-bubble received">
//             <div className="message-content">
//               <strong>AI Support:</strong> Loading history...
//             </div>
//           </div>
//         ) : (
//           messages.map((msg) => (
//             <div key={msg.id} className={`message-bubble ${msg.sender === 'user' ? 'sent' : 'received'} ${msg.sender}`}>
//               <div className="message-content">
//                 <strong>{getSenderDisplayName(msg.sender)}:</strong> {msg.text}
//               </div>
//               <div className="message-time">{formatTime(msg.timestamp)}</div>
//             </div>
//           ))
//         )}
        
//         {isLoading && (
//           <div className="message-bubble received bot typing-indicator">
//             <div className="message-content">
//               <strong>AI Support:</strong>
//               <div className="typing-dots">
//                 <span></span><span></span><span></span>
//               </div>
//             </div>
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>
      
//       <div className="chat-input-container">
//         <ChatInput 
//           onSendMessage={handleSendMessage} 
//           disabled={isLoading || isHistoryLoading} 
//           placeholder={isHistoryLoading ? "Loading..." : "Type your message..."}
//         />
//       </div>
//     </div>
//   );
// };

// export default CustomerChatView;
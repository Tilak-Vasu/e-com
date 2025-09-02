// src/components/chat/ChatInput.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
    const [input, setInput] = useState('');
    const [isComposing, setIsComposing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when component mounts and not disabled
    useEffect(() => {
        if (!disabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [disabled]);

    const handleSend = () => {
        if (input.trim() && !disabled && !isComposing) {
            onSendMessage(input.trim());
            setInput('');
            // Keep focus on input after sending
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCompositionStart = () => {
        setIsComposing(true);
    };

    const handleCompositionEnd = () => {
        setIsComposing(false);
    };

    const isInputValid = input.trim().length > 0 && !disabled && !isComposing;

    return (
        <div className="input-area">
            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                placeholder={disabled ? "Please wait..." : "Type your message..."}
                maxLength={500}
                disabled={disabled}
                className={disabled ? 'input-disabled' : ''}
            />
            <button 
                onClick={handleSend}
                disabled={!isInputValid}
                className={isInputValid ? 'send-button-active' : 'send-button-disabled'}
                aria-label="Send message"
            >
                <Send size={18} />
            </button>
        </div>
    );
};

export default ChatInput;
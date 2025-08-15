import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { Bot, User, AlertCircle } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, error }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.type}`}>
          <div className="message-avatar">
            {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
          </div>
          <div className="message-content">
            <div className="message-text">
              {message.message || message.response}
            </div>
            {message.source && (
              <div className="message-source">
                {message.source}
              </div>
            )}
            {message.timestamp && (
              <div className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="message bot loading">
          <div className="message-avatar">
            <Bot size={16} />
          </div>
          <div className="message-content">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="message error">
          <div className="message-avatar">
            <AlertCircle size={16} />
          </div>
          <div className="message-content">
            <div className="message-text">
              Error: {error}
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

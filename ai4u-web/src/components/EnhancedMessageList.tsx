import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { Brain, User, AlertCircle } from 'lucide-react';

interface EnhancedMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string;
}

const EnhancedMessageList: React.FC<EnhancedMessageListProps> = ({ messages, isLoading, error }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="p-6 space-y-6">
      {messages.map((message, index) => (
        <div key={index} className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : ''}`}>
          {message.type === 'bot' && (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Brain size={16} className="text-white" />
            </div>
          )}
          
          <div className={`max-w-3xl ${
            message.type === 'user' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-800 text-gray-100'
          } p-4 rounded-2xl ${
            message.type === 'user' 
              ? 'rounded-br-md' 
              : 'rounded-bl-md'
          }`}>
            <div className="mb-2 whitespace-pre-wrap">{message.message || message.response}</div>
            <div className="flex items-center gap-2 text-xs opacity-70">
              {message.source && (
                <span className="bg-black bg-opacity-20 px-2 py-1 rounded">
                  {message.source}
                </span>
              )}
              <span>{message.timestamp && new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
          
          {message.type === 'user' && (
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-gray-300" />
            </div>
          )}
        </div>
      ))}
      
      {isLoading && (
        <div className="flex gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Brain size={16} className="text-white" />
          </div>
          <div className="bg-gray-800 text-gray-100 p-4 rounded-2xl rounded-bl-md">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-gray-400 text-sm">AI is thinking...</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex gap-4">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle size={16} className="text-white" />
          </div>
          <div className="bg-red-900 border border-red-600 text-red-100 p-4 rounded-2xl rounded-bl-md">
            <div className="font-medium">Error</div>
            <div className="text-sm opacity-90">{error}</div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default EnhancedMessageList;
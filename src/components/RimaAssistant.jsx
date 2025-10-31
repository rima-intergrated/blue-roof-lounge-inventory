import { useState, useRef, useEffect } from 'react';
import '../styles/RimaAssistant.css';

const RimaAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      text: 'Hello! I\'m Rima Assistant 🤖 How can I help you with Blue Roof Lounge today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Quick action suggestions
  const quickActions = [
    { icon: '📊', text: 'Today\'s sales total', query: 'What are today\'s total sales?' },
    { icon: '📦', text: 'Low stock items', query: 'Show me items with low stock' },
    { icon: '👥', text: 'Staff on duty', query: 'Who is on duty today?' },
    { icon: '💰', text: 'This month\'s revenue', query: 'What is this month\'s total revenue?' },
    { icon: '🔝', text: 'Top selling items', query: 'What are the top 5 selling items?' },
    { icon: '📈', text: 'Sales trend', query: 'How are sales trending this week?' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response (will connect to backend later)
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: `I received your question: "${messageText}"\n\nThis is a preview - once we connect the backend, I'll provide real data from your Blue Roof system! 🚀`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (query) => {
    handleSendMessage(query);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="rima-assistant-container">
      {/* Floating Chat Button */}
      <button 
        className={`rima-chat-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Rima Assistant"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
        {!isOpen && <span className="rima-notification-badge">AI</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="rima-chat-window">
          {/* Header */}
          <div className="rima-chat-header">
            <div className="rima-header-content">
              <div className="rima-avatar">
                <span>🤖</span>
              </div>
              <div className="rima-header-text">
                <h3>Rima Assistant</h3>
                <p className="rima-status">
                  <span className="status-indicator"></span>
                  Online • Blue Roof Lounge
                </p>
              </div>
            </div>
            <button 
              className="rima-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="rima-messages-container">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`rima-message ${message.type}`}
              >
                {message.type === 'assistant' && (
                  <div className="message-avatar">🤖</div>
                )}
                <div className="message-content">
                  <div className="message-bubble">
                    {message.text}
                  </div>
                  <div className="message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="rima-message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="message-bubble typing">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="rima-quick-actions">
              <p className="quick-actions-label">Quick questions:</p>
              <div className="quick-actions-grid">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="quick-action-button"
                    onClick={() => handleQuickAction(action.query)}
                  >
                    <span className="action-icon">{action.icon}</span>
                    <span className="action-text">{action.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="rima-input-container">
            <div className="rima-input-wrapper">
              <textarea
                className="rima-input"
                placeholder="Ask me anything about your business..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                rows="1"
              />
              <button 
                className="rima-send-button"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
                aria-label="Send message"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <p className="rima-disclaimer">
              Powered by Rima AI • Responses may take a few seconds
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RimaAssistant;

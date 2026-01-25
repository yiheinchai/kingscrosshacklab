import React, { useState, useEffect, useRef } from "react";
import logoImage from "../assets/logo.jpg";
import "../styles/chat.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

interface Message {
  id: string;
  timestamp: string;
  sender: string;
  content: string;
  isUser: boolean;
}

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

// Format timestamp for display
function formatTime(timestamp: string): string {
  const timeMatch = timestamp.match(/(\d{1,2}:\d{2})/);
  return timeMatch ? timeMatch[1] : timestamp;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [username, setUsername] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [models, setModels] = useState<ChatModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("kxhl-1");
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousMessageCountRef = useRef(0);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Check if user is near bottom of chat
  const checkIfNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;

    const threshold = 150; // pixels from bottom
    const isNear =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;
    setIsNearBottom(isNear);
    return isNear;
  };

  // Auto-scroll only if user is near bottom
  useEffect(() => {
    const newMessageCount = messages.length;
    const hadNewMessages = newMessageCount > previousMessageCountRef.current;

    if (hadNewMessages) {
      if (isNearBottom) {
        // User is at bottom, auto-scroll
        scrollToBottom("smooth");
        setShowNewMessagesButton(false);
      } else {
        // User is viewing past messages, show button
        setShowNewMessagesButton(true);
      }
    }

    previousMessageCountRef.current = newMessageCount;
  }, [messages, isNearBottom]);

  // Prevent iOS pull-to-refresh
  useEffect(() => {
    const preventPullToRefresh = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const messagesContainer = document.querySelector(".chat-messages");

      // Only prevent if we're at the top of the messages container
      if (
        messagesContainer &&
        messagesContainer.scrollTop === 0 &&
        target.closest(".chat-messages")
      ) {
        // If scrolling up, prevent default
        if (e.touches.length === 1) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener("touchmove", preventPullToRefresh, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", preventPullToRefresh);
    };
  }, []);

  // Track scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkIfNearBottom();
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Load saved username from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem("kxhl-chat-username");
    if (savedUsername) {
      setUsername(savedUsername);
      setIsUsernameSet(true);
    }
  }, []);

  // Fetch available models
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch(`${API_URL}/api/chat/models`);
        if (response.ok) {
          const data = await response.json();
          setModels(data.models || []);
        }
      } catch (err) {
        console.error("Failed to fetch models:", err);
      }
    }
    fetchModels();
  }, []);

  // Fetch messages from server
  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/chat/messages/${selectedModel}`,
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setMessages(data.messages || []);
      setIsGenerating(data.isGenerating || false);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setError("Failed to connect to server");
    }
  };

  // Initial fetch and polling setup
  useEffect(() => {
    // Fetch immediately
    const doFetch = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/chat/messages/${selectedModel}`,
        );
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        setMessages(data.messages || []);
        setIsGenerating(data.isGenerating || false);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setError("Failed to connect to server");
      }
    };

    doFetch();

    // Set up polling every 5 seconds
    pollIntervalRef.current = setInterval(doFetch, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedModel]);

  // Handle sending a user message
  const handleSend = async () => {
    if (!inputText.trim() || !isUsernameSet || isSending) return;

    setIsSending(true);

    try {
      const response = await fetch(
        `${API_URL}/api/chat/send/${selectedModel}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: username,
            content: inputText.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      // Add the message locally for immediate feedback
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }

      setInputText("");
      setError(null);

      // Scroll to bottom when user sends a message
      setTimeout(() => scrollToBottom("smooth"), 100);

      // Refresh messages to get the AI response
      setTimeout(fetchMessages, 1000);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Handle username submission
  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem("kxhl-chat-username", username.trim());
      setIsUsernameSet(true);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get current model info
  const currentModel = models.find((m) => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel.toUpperCase(),
    description: "Loading...",
  };

  return (
    <div className="chat-app">
      {/* Chat Header */}
      <header className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar">
            <img src={logoImage} alt="KXHL" />
          </div>
          <div
            className="chat-info"
            onClick={() => setShowModelSelector(!showModelSelector)}
          >
            <h1 className="chat-name">Kings Cross Hack Lab</h1>
            <p className="chat-status">
              <span className="model-badge">{currentModel.name}</span>
              {isGenerating && (
                <span className="typing-text"> • typing...</span>
              )}
            </p>
          </div>
        </div>
        <div className="chat-header-right">
          <button
            className="header-icon model-selector-btn"
            title="Select Model"
            onClick={() => setShowModelSelector(!showModelSelector)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Model Selector Dropdown */}
      {showModelSelector && (
        <div className="model-selector-dropdown">
          <div className="model-selector-header">
            <h3>Select Model</h3>
            <p>Each model is a separate chat universe</p>
          </div>
          {models.map((model) => (
            <button
              key={model.id}
              className={`model-option ${model.id === selectedModel ? "active" : ""}`}
              onClick={() => {
                setSelectedModel(model.id);
                setShowModelSelector(false);
                setMessages([]);
              }}
            >
              <div className="model-option-info">
                <span className="model-option-name">{model.name}</span>
                <span className="model-option-desc">{model.description}</span>
              </div>
              {model.id === selectedModel && (
                <svg
                  className="check-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="chat-messages"
        onClick={() => setShowModelSelector(false)}
      >
        {/* New Messages Button */}
        {showNewMessagesButton && (
          <button
            className="new-messages-button"
            onClick={() => {
              scrollToBottom("smooth");
              setShowNewMessagesButton(false);
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M7 10l5 5 5-5z" />
            </svg>
            New messages
          </button>
        )}

        <div className="messages-wrapper">
          {/* Welcome message */}
          <div className="system-message">
            <span>🤖 AI-Generated KXHL Chat</span>
            <p>
              Model: <strong>{currentModel.name}</strong>
            </p>
            <p>{currentModel.description}</p>
            <p>
              New messages appear every 5 minutes. Set your username to join!
            </p>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isUser ? "message-sent" : "message-received"}`}
            >
              {!message.isUser && (
                <span className="message-sender">{message.sender}</span>
              )}
              <p className="message-content">{message.content}</p>
              <span className="message-time">
                {formatTime(message.timestamp)}
              </span>
            </div>
          ))}

          {isGenerating && (
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Username Modal */}
      {!isUsernameSet && (
        <div className="username-modal">
          <form onSubmit={handleSetUsername} className="username-form">
            <h2>Join the Chat</h2>
            <p>Enter your name to send messages</p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name..."
              autoFocus
            />
            <button type="submit" disabled={!username.trim()}>
              Join Chat
            </button>
          </form>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        <button className="input-icon" title="Attach">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 015 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 005 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
          </svg>
        </button>
        <div className="input-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isUsernameSet ? "Type a message..." : "Set username first..."
            }
            disabled={!isUsernameSet || isSending}
          />
          <button className="emoji-btn" title="Emoji">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </button>
        </div>
        <button
          className={`send-btn ${inputText.trim() && isUsernameSet && !isSending ? "active" : ""}`}
          onClick={handleSend}
          disabled={!inputText.trim() || !isUsernameSet || isSending}
          title="Send"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

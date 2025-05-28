import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Settings, 
  Send, 
  Paperclip, 
  Mic,
  Code2,
  Lightbulb,
  Bug,
  BookOpen,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Bot,
  Clock,
  BookmarkIcon,
  FileText,
  Trash2,
  X
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  icon: string;
  lastMessage?: string;
  timestamp?: Date;
}

export default function CodeCompanionChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [conversationMessages, setConversationMessages] = useState<{[key: string]: Message[]}>({
    "1": [
      {
        id: "1",
        content: "How can I improve my loop performance in JavaScript?",
        role: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        id: "2",
        content: "Here are several ways to improve loop performance in JavaScript:\n\n1. **Use for loops instead of forEach for large datasets**\n2. **Cache array length**: `for(let i = 0, len = arr.length; i < len; i++)`\n3. **Use for...of for cleaner code when you don't need indices**\n4. **Consider using map(), filter(), reduce() for functional operations**\n\nWhat type of loop optimization are you specifically looking for?",
        role: "assistant",
        timestamp: new Date(Date.now() - 1000 * 60 * 29)
      }
    ],
    "2": [
      {
        id: "3",
        content: "I have a question about useEffect dependency arrays in React",
        role: "user", 
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        id: "4",
        content: "Great question! The dependency array in useEffect controls when the effect runs:\n\n```jsx\n// Runs after every render\nuseEffect(() => {\n  // effect logic\n});\n\n// Runs only once (on mount)\nuseEffect(() => {\n  // effect logic\n}, []);\n\n// Runs when dependencies change\nuseEffect(() => {\n  // effect logic\n}, [dependency1, dependency2]);\n```\n\nWhat specific scenario are you working with?",
        role: "assistant",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 60000)
      }
    ],
    "3": [
      {
        id: "5",
        content: "How should I handle async/await errors in API calls?",
        role: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24)
      },
      {
        id: "6", 
        content: "Here's the best way to handle async/await errors:\n\n```javascript\ntry {\n  const response = await fetch('/api/data');\n  if (!response.ok) {\n    throw new Error(`HTTP error! status: ${response.status}`);\n  }\n  const data = await response.json();\n  return data;\n} catch (error) {\n  console.error('API call failed:', error);\n  // Handle error appropriately\n  throw error; // or return default value\n}\n```\n\nAlways check response.ok and handle both network and HTTP errors!",
        role: "assistant",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 120000)
      }
    ]
  });
  const [conversations, setConversations] = useState<Conversation[]>([
    { 
      id: "1", 
      title: "JavaScript Fundamentals", 
      icon: "🟨",
      lastMessage: "How can I improve my loop performance?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30)
    },
    { 
      id: "2", 
      title: "React Components", 
      icon: "⚛️",
      lastMessage: "useEffect dependency array question",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    { 
      id: "3", 
      title: "API Integration", 
      icon: "🔗",
      lastMessage: "Handling async/await errors",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24)
    },
  ]);
  const [activeConversation, setActiveConversation] = useState("1");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load initial messages for the active conversation
  useEffect(() => {
    setMessages(conversationMessages[activeConversation] || []);
  }, []);

  // Load messages when switching conversations
  const switchToConversation = (conversationId: string) => {
    // Save current messages to conversation
    if (activeConversation && messages.length > 0) {
      setConversationMessages(prev => ({
        ...prev,
        [activeConversation]: messages
      }));
    }
    
    // Load messages for new conversation
    setActiveConversation(conversationId);
    setMessages(conversationMessages[conversationId] || []);
  };

  const quickActions = [
    { 
      icon: Code2, 
      label: "Debug Code", 
      color: "bg-red-50 text-red-700 border-red-200",
      prompt: "I have a bug in my code. Can you help me debug it? Here's my code:"
    },
    { 
      icon: Lightbulb, 
      label: "Explain Concept", 
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      prompt: "Can you explain this programming concept to me:"
    },
    { 
      icon: Bug, 
      label: "Code Review", 
      color: "bg-blue-50 text-blue-700 border-blue-200",
      prompt: "Can you review my code and suggest improvements? Here's my code:"
    },
    { 
      icon: BookOpen, 
      label: "Best Practices", 
      color: "bg-green-50 text-green-700 border-green-200",
      prompt: "What are the best practices for"
    },
  ];

  const languages = ["javascript", "python", "react", "typescript", "java", "css"];

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);

    // Save messages to current conversation
    setConversationMessages(prev => ({
      ...prev,
      [activeConversation]: newMessages
    }));

    try {
      const response = await fetch('/api/code-companion/tip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: selectedLanguage,
          context: inputMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.tip,
        role: "assistant",
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save final messages to current conversation
      setConversationMessages(prev => ({
        ...prev,
        [activeConversation]: finalMessages
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from Code Companion",
        variant: "destructive",
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

  const startNewChat = () => {
    const newId = (conversations.length + 1).toString();
    const newConversation: Conversation = {
      id: newId,
      title: `New Chat`,
      icon: "💻",
      timestamp: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newId);
    setMessages([]);
  };

  const deleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent clicking the conversation itself
    
    // Remove the conversation from the list
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    
    // If we're deleting the active conversation, switch to another one or clear
    if (activeConversation === conversationId) {
      const remainingConversations = conversations.filter(conv => conv.id !== conversationId);
      if (remainingConversations.length > 0) {
        setActiveConversation(remainingConversations[0].id);
      } else {
        setActiveConversation("");
        setMessages([]);
      }
    }

    toast({
      title: "Chat deleted",
      description: "The conversation has been removed.",
    });
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setInputMessage(action.prompt);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Code Companion</h1>
                <p className="text-sm text-gray-500">AI Programming Assistant</p>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-400 hover:text-gray-600"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              {!sidebarCollapsed && (
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {!sidebarCollapsed && (
            <Button 
              onClick={startNewChat}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          )}
        </div>

        {/* Conversations List */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3 px-2">
                Recent
              </div>
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`relative group rounded-lg transition-all ${
                      activeConversation === conv.id 
                        ? 'bg-purple-50 border border-purple-200 shadow-sm' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => switchToConversation(conv.id)}
                      className="w-full text-left p-3 rounded-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-lg flex-shrink-0 mt-0.5">{conv.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {conv.title}
                          </div>
                          {conv.lastMessage && (
                            <div className="text-xs text-gray-500 truncate mt-1">
                              {conv.lastMessage}
                            </div>
                          )}
                          {conv.timestamp && (
                            <div className="text-xs text-gray-400 mt-1">
                              {formatTime(conv.timestamp)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 text-gray-400 transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Collapsed Sidebar Icons */}
        {sidebarCollapsed && (
          <div className="flex-1 flex flex-col items-center py-4 space-y-4">
            {/* New Chat Icon */}
            <button
              onClick={startNewChat}
              className="p-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </button>

            {/* Quick Action Icons */}
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="p-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  title={action.label}
                >
                  <action.icon className="h-4 w-4 text-gray-600" />
                </button>
              ))}
            </div>

            {/* Additional Feature Icons */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <button
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                title="Code History"
              >
                <Clock className="h-4 w-4 text-gray-500" />
              </button>
              
              <button
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                title="Saved Snippets"
              >
                <BookmarkIcon className="h-4 w-4 text-gray-500" />
              </button>
              
              <button
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                title="Templates"
              >
                <FileText className="h-4 w-4 text-gray-500" />
              </button>
              
              <button
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                title="Settings"
              >
                <Settings className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Quick Actions
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all hover:shadow-sm ${action.color}`}
                >
                  <action.icon className="h-4 w-4 mx-auto mb-1" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-lg">💻</div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Code Companion</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-500">Language:</span>
                  <select 
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="text-sm bg-gray-100 border-0 rounded px-2 py-1 text-gray-700"
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-500">
                Share
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="relative mb-8">
                {/* Modern AI Avatar Container */}
                <div className="relative w-32 h-32 mx-auto">
                  {/* Main Avatar Circle */}
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 p-1 shadow-2xl">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-500 flex items-center justify-center relative overflow-hidden">
                      
                      {/* Animated Waveform Pattern */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center space-x-1">
                          <div className="w-1 bg-white/70 rounded-full animate-pulse" style={{ height: '20px', animationDelay: '0s' }}></div>
                          <div className="w-1 bg-white/70 rounded-full animate-pulse" style={{ height: '35px', animationDelay: '0.1s' }}></div>
                          <div className="w-1 bg-white/70 rounded-full animate-pulse" style={{ height: '25px', animationDelay: '0.2s' }}></div>
                          <div className="w-1 bg-white/80 rounded-full animate-pulse" style={{ height: '40px', animationDelay: '0.3s' }}></div>
                          <div className="w-1 bg-white/90 rounded-full animate-pulse" style={{ height: '50px', animationDelay: '0.4s' }}></div>
                          <div className="w-1 bg-white rounded-full animate-pulse" style={{ height: '45px', animationDelay: '0.5s' }}></div>
                          <div className="w-1 bg-white/90 rounded-full animate-pulse" style={{ height: '30px', animationDelay: '0.6s' }}></div>
                          <div className="w-1 bg-white/80 rounded-full animate-pulse" style={{ height: '35px', animationDelay: '0.7s' }}></div>
                          <div className="w-1 bg-white/70 rounded-full animate-pulse" style={{ height: '20px', animationDelay: '0.8s' }}></div>
                        </div>
                      </div>
                      
                      {/* Central Core */}
                      <div className="absolute inset-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white/80 animate-pulse flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Orbital Rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-purple-300/30 animate-spin" style={{ animationDuration: '20s' }}>
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-purple-400 rounded-full"></div>
                  </div>
                  <div className="absolute inset-2 rounded-full border border-blue-300/30 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                    <div className="absolute -top-0.5 right-4 w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                    <div className="absolute w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  
                  {/* Ambient Glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-xl scale-150 animate-pulse"></div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                How can I help you code today?
              </h3>
              <p className="text-gray-500 mb-8 max-w-md">
                Ask me anything about programming, debugging, best practices, or code explanations.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-lg">
                {[
                  "Explain async/await in JavaScript",
                  "How to optimize React performance?",
                  "Debug my Python function",
                  "Best practices for API design"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(suggestion)}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-sm text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3xl ${message.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white border'} rounded-2xl p-4 shadow-sm`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <div className="flex-1 bg-gray-100 rounded-2xl p-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about coding..."
                  className="border-0 bg-transparent resize-none focus:ring-0 text-sm"
                  disabled={isLoading}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-500 h-8 w-8 p-0">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 h-8 w-8 p-0">
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800 text-white h-8 w-8 p-0 rounded-full"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center mt-3">
              Code Companion can make mistakes. Please verify important information.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
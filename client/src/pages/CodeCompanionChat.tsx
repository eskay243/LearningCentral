import { useState } from "react";
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
  Bot
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

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

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

      setMessages(prev => [...prev, assistantMessage]);
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
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all hover:bg-gray-50 ${
                      activeConversation === conv.id 
                        ? 'bg-purple-50 border border-purple-200 shadow-sm' 
                        : 'hover:bg-gray-50'
                    }`}
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
                ))}
              </div>
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
              <div className="relative mb-6">
                {/* Robot Body */}
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-8 shadow-lg border-2 border-purple-300 animate-pulse">
                  {/* Robot Head */}
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl w-16 h-12 mx-auto mb-4 relative shadow-md">
                    {/* Eyes */}
                    <div className="absolute top-3 left-3 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                    <div className="absolute top-3 left-3 w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="absolute top-3 right-3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"></div>
                    
                    {/* Antenna */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-purple-400 rounded-full"></div>
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Robot Chest Panel */}
                  <div className="bg-purple-400 rounded-lg w-12 h-8 mx-auto mb-2 relative">
                    <div className="absolute top-2 left-2 w-2 h-1 bg-green-400 rounded animate-pulse"></div>
                    <div className="absolute top-2 right-2 w-2 h-1 bg-yellow-400 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-blue-400 rounded"></div>
                  </div>
                  
                  {/* Robot Arms */}
                  <div className="absolute top-8 -left-3 w-4 h-8 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="absolute top-8 -right-3 w-4 h-8 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.7s' }}></div>
                </div>
                
                {/* Status Indicator */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                
                {/* Floating Particles */}
                <div className="absolute -top-4 left-4 w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                <div className="absolute -bottom-2 right-6 w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute top-2 -left-2 w-1 h-1 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
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
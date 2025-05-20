import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Calendar } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { ChatMessage } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

interface MessageSearchProps {
  onMessageSelect: (message: ChatMessage) => void;
}

export function MessageSearch({ onMessageSelect }: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchQuery, 500);

  useEffect(() => {
    const searchMessages = async () => {
      if (debouncedSearchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/messages/search?query=${encodeURIComponent(debouncedSearchTerm)}`);
        if (!response.ok) throw new Error('Failed to search messages');
        
        const data = await response.json();
        setSearchResults(data.messages);
      } catch (error) {
        console.error('Error searching messages:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchMessages();
  }, [debouncedSearchTerm]);

  // Format date
  const formatMessageDate = (date: Date | null | undefined) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Highlight matching text
  const highlightMatches = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    try {
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    } catch (e) {
      return text;
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="relative">
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {searchQuery.trim().length > 0 && !isSearching && (
        <div className="text-sm text-muted-foreground">
          {searchResults.length > 0 
            ? `Found ${searchResults.length} results`
            : searchQuery.trim().length >= 2 
              ? 'No messages found' 
              : 'Type at least 2 characters to search'}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {searchResults.map((message) => (
            <Button
              key={message.id}
              variant="outline"
              className="w-full justify-start px-3 py-2 h-auto"
              onClick={() => onMessageSelect(message)}
            >
              <div className="flex items-start space-x-2 w-full text-left">
                <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-medium text-sm truncate">
                      {message.conversationTitle || 'Conversation'}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatMessageDate(message.sentAt)}
                    </div>
                  </div>
                  <p 
                    className="text-xs text-muted-foreground mt-1 line-clamp-2"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightMatches(message.content, debouncedSearchTerm)
                    }}
                  ></p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
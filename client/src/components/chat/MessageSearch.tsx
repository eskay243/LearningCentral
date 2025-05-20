import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ChatMessage } from '@shared/schema';
import { Loader2 } from 'lucide-react';

interface MessageSearchProps {
  onMessageSelect: (message: ChatMessage) => void;
}

export function MessageSearch({ onMessageSelect }: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { data: searchResults, isLoading, refetch } = useQuery({
    queryKey: ['/api/messages/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      setIsSearching(true);
      const results = await fetch(`/api/messages/search?query=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json());
      setIsSearching(false);
      return results;
    },
    enabled: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      refetch();
    }
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSearch} className="flex items-center space-x-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </form>

      {isSearching && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {searchResults && searchResults.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
          <h3 className="text-sm font-medium mb-2">Search Results</h3>
          {searchResults.map((message: ChatMessage) => (
            <div
              key={message.id}
              className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm"
              onClick={() => onMessageSelect(message)}
            >
              <div className="font-medium">
                {message.senderName || 'Unknown User'}
              </div>
              <div className="text-muted-foreground truncate">
                {message.content}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(message.sentAt || Date.now()).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {searchResults && searchResults.length === 0 && isSearching === false && searchQuery.trim() !== '' && (
        <div className="text-center p-4 text-muted-foreground">
          No messages found matching your search.
        </div>
      )}
    </div>
  );
}
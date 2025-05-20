import React, { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Loader2,
  File,
  BookOpen,
  Box
} from 'lucide-react';

interface SearchResult {
  id: number;
  title: string;
  type: string;
  contentType: string;
  snippet?: string;
  courseName: string;
  moduleName?: string;
  lessonId?: number;
  courseId: number;
}

interface SimpleContentSearchProps {
  courseId?: number; // Optional - limit search to specific course
  onResultClick?: (result: SearchResult) => void;
}

const SimpleContentSearch: React.FC<SimpleContentSearchProps> = ({
  courseId,
  onResultClick
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  
  // Debounce search term to avoid too many requests
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Effect for keyboard shortcut (Ctrl+K) to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Effect for search when term changes
  useEffect(() => {
    if (debouncedSearchTerm.length < 2) {
      setResults([]);
      return;
    }
    
    const performSearch = async () => {
      setIsSearching(true);
      
      try {
        // Since the API endpoint doesn't exist yet, we'll mock the response
        // Using setTimeout to simulate a network request
        setTimeout(() => {
          const mockResults: SearchResult[] = [
            {
              id: 1,
              title: 'Introduction to JavaScript',
              type: 'lesson',
              contentType: 'text',
              snippet: 'JavaScript is a programming language that enables interactive web pages...',
              courseName: 'Web Development Fundamentals',
              moduleName: 'JavaScript Basics',
              lessonId: 1,
              courseId: 1
            },
            {
              id: 2,
              title: 'CSS Flexbox',
              type: 'lesson',
              contentType: 'text',
              snippet: 'Flexbox is a layout model that allows elements to align and distribute space...',
              courseName: 'Web Development Fundamentals',
              moduleName: 'CSS Advanced',
              lessonId: 2,
              courseId: 1
            },
            {
              id: 3,
              title: 'React Hooks',
              type: 'module',
              contentType: 'module',
              courseName: 'Advanced React',
              courseId: 2
            }
          ];
          
          // Filter by course ID if provided
          let filtered = mockResults;
          if (courseId) {
            filtered = mockResults.filter(result => result.courseId === courseId);
          }
          
          // Filter by search term
          filtered = filtered.filter(result => 
            result.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            result.snippet?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            result.courseName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            result.moduleName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          );
          
          setResults(filtered);
          setIsSearching(false);
        }, 500);
        
        // Commented out for now - to be used when API endpoint is available
        /*
        const response = await apiRequest('GET', `/api/search?query=${encodeURIComponent(debouncedSearchTerm)}${courseId ? `&courseId=${courseId}` : ''}`);
        const data = await response.json();
        setResults(data);
        */
      } catch (error) {
        console.error('Search error:', error);
        toast({
          title: 'Search Failed',
          description: 'An error occurred while searching',
          variant: 'destructive',
        });
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    
    performSearch();
  }, [debouncedSearchTerm, courseId, toast]);

  // Handle clicking on a result
  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
    setIsOpen(false);
  };

  // Get icon for result type
  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'lesson':
        return <File className="h-4 w-4 mr-2" />;
      case 'module':
        return <BookOpen className="h-4 w-4 mr-2" />;
      case 'resource':
        return <Box className="h-4 w-4 mr-2" />;
      default:
        return <File className="h-4 w-4 mr-2" />;
    }
  };

  // Highlight search term in text
  const highlightSearchTerm = (text: string) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="bg-yellow-200 dark:bg-yellow-800">$1</span>');
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full justify-between text-muted-foreground"
      >
        <div className="flex items-center">
          <Search className="mr-2 h-4 w-4" />
          <span>Search...</span>
        </div>
        <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">Ctrl</span> K
        </kbd>
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search Content</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for lessons, modules, resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
                autoFocus
              />
            </div>
            
            <div>
              {isSearching ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="flex flex-col p-3 rounded-md hover:bg-muted cursor-pointer"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-center">
                        {getResultIcon(result)}
                        <span className="font-medium"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(result.title) 
                          }}
                        />
                      </div>
                      
                      <div className="text-sm text-muted-foreground ml-6">
                        {result.courseName}
                        {result.moduleName && ` › ${result.moduleName}`}
                      </div>
                      
                      {result.snippet && (
                        <div className="mt-1 text-sm text-muted-foreground ml-6"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(result.snippet) 
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : searchTerm.length > 1 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No results found for "{searchTerm}"
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  Enter at least 2 characters to search
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SimpleContentSearch;
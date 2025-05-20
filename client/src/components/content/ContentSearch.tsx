import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, FileText, Video, File, Book, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchResult {
  id: number;
  title: string;
  type: 'lesson' | 'resource' | 'module';
  contentType?: string;
  courseId: number;
  courseName: string;
  moduleName?: string;
  lessonId?: number;
  moduleId?: number;
  snippet?: string;
}

interface ContentSearchProps {
  courseId?: number;  // Optional: restrict search to a specific course
  placeholder?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

const ContentSearch: React.FC<ContentSearchProps> = ({
  courseId,
  placeholder = 'Search for lessons, resources...',
  buttonVariant = 'outline',
  fullWidth = false,
}) => {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Search when query changes
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [debouncedSearchQuery]);
  
  // Perform search against API
  const performSearch = async () => {
    if (debouncedSearchQuery.length < 2) return;
    
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        query: debouncedSearchQuery,
      });
      
      if (courseId) {
        params.append('courseId', courseId.toString());
      }
      
      const response = await apiRequest('GET', `/api/search?${params.toString()}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    setOpen(false);
    
    if (result.type === 'lesson') {
      navigate(`/courses/${result.courseId}/lessons/${result.id}`);
    } else if (result.type === 'module') {
      navigate(`/courses/${result.courseId}/modules/${result.id}`);
    } else if (result.type === 'resource' && result.lessonId) {
      navigate(`/courses/${result.courseId}/lessons/${result.lessonId}?resource=${result.id}`);
    }
  };
  
  // Get icon for result type
  const getResultIcon = (result: SearchResult) => {
    if (result.type === 'resource') {
      return <File className="h-4 w-4 mr-2 flex-shrink-0" />;
    }
    
    if (result.type === 'module') {
      return <Book className="h-4 w-4 mr-2 flex-shrink-0" />;
    }
    
    // For lessons, use content type
    if (result.contentType === 'video') {
      return <Video className="h-4 w-4 mr-2 flex-shrink-0" />;
    }
    
    return <FileText className="h-4 w-4 mr-2 flex-shrink-0" />;
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search dialog on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      
      // Close dialog on Escape
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          className={`${fullWidth ? 'w-full' : ''} flex items-center justify-start gap-2`}
        >
          <Search className="h-4 w-4" />
          <span className="truncate">{placeholder}</span>
          <Badge variant="outline" className="ml-auto text-xs">
            Ctrl K
          </Badge>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center">Search Content</DialogTitle>
        </DialogHeader>
        
        <div className="relative mt-2 mb-4">
          <Input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for lessons, resources, modules..."
            className="pl-9 pr-9"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3 py-2">
              {results.map((result) => (
                <div 
                  key={`${result.type}-${result.id}`}
                  className="flex px-3 py-2 hover:bg-muted rounded cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  {getResultIcon(result)}
                  
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-medium text-sm line-clamp-1">{result.title}</h4>
                    
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span className="truncate">{result.courseName}</span>
                      {result.moduleName && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="truncate">{result.moduleName}</span>
                        </>
                      )}
                    </div>
                    
                    {result.snippet && (
                      <p className="text-xs mt-1 line-clamp-2 text-muted-foreground">
                        <span 
                          dangerouslySetInnerHTML={{ 
                            __html: result.snippet.replace(
                              new RegExp(`(${debouncedSearchQuery})`, 'gi'), 
                              '<mark>$1</mark>'
                            )
                          }} 
                        />
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try different keywords or check your spelling
              </p>
            </div>
          ) : null}
        </div>
        
        <div className="flex justify-end mt-4">
          <DialogClose asChild>
            <Button variant="ghost">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentSearch;
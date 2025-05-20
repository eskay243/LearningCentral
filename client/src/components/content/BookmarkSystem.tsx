import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Bookmark, BookmarkCheck, Clock, Trash, FileText, Video, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Bookmark {
  id: number;
  userId: string;
  lessonId: number;
  courseId: number;
  title: string;
  note?: string;
  timestamp?: number;
  createdAt: string;
  contentType: string;
  courseName: string;
  lessonName: string;
}

interface BookmarkPosition {
  timestamp?: number;
  contentSelection?: string;
}

interface BookmarkSystemProps {
  lessonId?: number;
  courseId?: number;
  contentType?: string;
  position?: BookmarkPosition;
  size?: 'sm' | 'default';
  children?: React.ReactNode;
}

const BookmarkSystem: React.FC<BookmarkSystemProps> = ({
  lessonId,
  courseId,
  contentType = 'text',
  position,
  size = 'default',
  children,
}) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [showListDialog, setShowListDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Check if current lesson is bookmarked
  useEffect(() => {
    if (isAuthenticated && lessonId) {
      checkIfBookmarked();
    }
  }, [isAuthenticated, lessonId]);

  // Load all bookmarks when list dialog opens
  useEffect(() => {
    if (showListDialog && isAuthenticated) {
      fetchAllBookmarks();
    }
  }, [showListDialog, isAuthenticated]);

  // Check if current lesson is bookmarked
  const checkIfBookmarked = async () => {
    try {
      const response = await apiRequest('GET', `/api/bookmarks/check?lessonId=${lessonId}`);
      const data = await response.json();
      
      if (data.isBookmarked) {
        setIsBookmarked(true);
        setCurrentBookmark(data.bookmark);
      } else {
        setIsBookmarked(false);
        setCurrentBookmark(null);
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  // Fetch all user bookmarks
  const fetchAllBookmarks = async () => {
    setLoading(true);
    
    try {
      const response = await apiRequest('GET', '/api/bookmarks');
      const data = await response.json();
      setBookmarks(data);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast({
        title: 'Failed to load bookmarks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new bookmark
  const createBookmark = async (title: string, note: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to bookmark content',
        variant: 'destructive',
      });
      return;
    }

    if (!lessonId || !courseId) {
      toast({
        title: 'Bookmark Error',
        description: 'Missing lesson or course information',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest('POST', '/api/bookmarks', {
        lessonId,
        courseId,
        title,
        note,
        timestamp: position?.timestamp,
        contentSelection: position?.contentSelection,
        contentType,
      });

      const newBookmark = await response.json();
      setCurrentBookmark(newBookmark);
      setIsBookmarked(true);
      
      toast({
        title: 'Bookmark Added',
        description: 'Content has been bookmarked successfully',
      });
    } catch (error) {
      console.error('Error creating bookmark:', error);
      toast({
        title: 'Bookmark Failed',
        description: 'Failed to save bookmark',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setOpenDialog(false);
    }
  };

  // Update existing bookmark
  const updateBookmark = async (bookmarkId: number, title: string, note: string) => {
    setLoading(true);

    try {
      const response = await apiRequest('PATCH', `/api/bookmarks/${bookmarkId}`, {
        title,
        note,
        timestamp: position?.timestamp,
        contentSelection: position?.contentSelection,
      });

      const updatedBookmark = await response.json();
      setCurrentBookmark(updatedBookmark);
      
      toast({
        title: 'Bookmark Updated',
        description: 'Your bookmark has been updated',
      });
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update bookmark',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setOpenDialog(false);
    }
  };

  // Delete bookmark
  const deleteBookmark = async (bookmarkId: number) => {
    try {
      await apiRequest('DELETE', `/api/bookmarks/${bookmarkId}`);
      
      if (currentBookmark?.id === bookmarkId) {
        setCurrentBookmark(null);
        setIsBookmarked(false);
      }
      
      setBookmarks(bookmarks.filter(b => b.id !== bookmarkId));
      
      toast({
        title: 'Bookmark Removed',
        description: 'Bookmark has been deleted',
      });
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to remove bookmark',
        variant: 'destructive',
      });
    }
  };

  // Handle bookmark button click
  const handleBookmarkClick = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to bookmark content',
        variant: 'destructive',
      });
      return;
    }
    
    if (isBookmarked && currentBookmark) {
      // Pre-fill edit dialog
      setBookmarkTitle(currentBookmark.title);
      setBookmarkNote(currentBookmark.note || '');
    } else {
      // Pre-fill create dialog with lesson name as default
      setBookmarkTitle(document.title || 'Bookmarked Content');
      setBookmarkNote('');
    }
    
    setOpenDialog(true);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookmarkTitle.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please provide a title for your bookmark',
        variant: 'destructive',
      });
      return;
    }
    
    if (isBookmarked && currentBookmark) {
      updateBookmark(currentBookmark.id, bookmarkTitle, bookmarkNote);
    } else {
      createBookmark(bookmarkTitle, bookmarkNote);
    }
  };

  // Format timestamp for display (mm:ss)
  const formatTimestamp = (seconds?: number): string => {
    if (!seconds) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Navigate to bookmarked content
  const goToBookmark = (bookmark: Bookmark) => {
    navigate(`/courses/${bookmark.courseId}/lessons/${bookmark.lessonId}`);
    setShowListDialog(false);
    
    // If it's a video bookmark with timestamp, we'll handle it in the lesson page
    if (bookmark.timestamp) {
      toast({
        title: 'Timestamp Bookmark',
        description: `Jumping to ${formatTimestamp(bookmark.timestamp)}`,
      });
    }
  };

  // Get recently added bookmarks
  const getRecentBookmarks = (): Bookmark[] => {
    return [...bookmarks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  // Get icon for content type
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Render bookmark list
  const renderBookmarkList = (bookmarkList: Bookmark[]) => {
    if (bookmarkList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Bookmark className="mx-auto h-8 w-8 mb-2 opacity-30" />
          <p>No bookmarks found</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {bookmarkList.map((bookmark) => (
          <div key={bookmark.id} className="flex justify-between p-3 border rounded-md hover:bg-muted">
            <div className="flex-1 min-w-0 mr-2">
              <div className="flex items-center space-x-2">
                {getContentTypeIcon(bookmark.contentType)}
                <h4 className="font-medium truncate">{bookmark.title}</h4>
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span className="truncate">{bookmark.courseName}</span>
                <span className="mx-1">•</span>
                <span className="truncate">{bookmark.lessonName}</span>
                {bookmark.timestamp && (
                  <>
                    <span className="mx-1">•</span>
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatTimestamp(bookmark.timestamp)}</span>
                  </>
                )}
              </div>
              
              {bookmark.note && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{bookmark.note}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToBookmark(bookmark)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteBookmark(bookmark.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // If there's no lesson context and user is just browsing bookmarks
  if (!lessonId && !courseId && children) {
    return (
      <>
        <div onClick={() => setShowListDialog(true)}>
          {children}
        </div>
        
        <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
          <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>My Bookmarks</DialogTitle>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">All Bookmarks</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 h-[50vh] mt-4">
                <TabsContent value="all" className="m-0">
                  {renderBookmarkList(bookmarks)}
                </TabsContent>
                
                <TabsContent value="recent" className="m-0">
                  {renderBookmarkList(getRecentBookmarks())}
                </TabsContent>
              </ScrollArea>
            </Tabs>
            
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Main bookmark button for lesson content
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={size}
              onClick={handleBookmarkClick}
              className={isBookmarked ? 'text-primary' : ''}
            >
              {isBookmarked ? (
                <BookmarkCheck className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
              ) : (
                <Bookmark className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isBookmarked ? 'Edit bookmark' : 'Add bookmark'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {isBookmarked && currentBookmark && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="ml-1">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setOpenDialog(true)}>
              Edit Bookmark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowListDialog(true)}>
              View All Bookmarks
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => deleteBookmark(currentBookmark.id)}
              className="text-destructive"
            >
              Remove Bookmark
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      {/* Add/Edit Bookmark Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isBookmarked ? 'Edit Bookmark' : 'Add Bookmark'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={bookmarkTitle}
                onChange={(e) => setBookmarkTitle(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="note">Notes (optional)</Label>
              <Textarea
                id="note"
                value={bookmarkNote}
                onChange={(e) => setBookmarkNote(e.target.value)}
                rows={4}
              />
            </div>
            
            {contentType === 'video' && position?.timestamp && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span>Will bookmark at {formatTimestamp(position.timestamp)}</span>
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {isBookmarked ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Bookmarks List Dialog */}
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>My Bookmarks</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All Bookmarks</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 h-[50vh] mt-4">
              <TabsContent value="all" className="m-0">
                {renderBookmarkList(bookmarks)}
              </TabsContent>
              
              <TabsContent value="recent" className="m-0">
                {renderBookmarkList(getRecentBookmarks())}
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookmarkSystem;
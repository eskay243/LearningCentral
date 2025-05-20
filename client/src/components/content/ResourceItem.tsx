import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileIcon, FileText, FileImage, File, Link as LinkIcon, Download, Lock, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ResourceItemProps {
  id: number;
  lessonId: number;
  title: string;
  description?: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  fileSize?: number;
  isDownloadable: boolean;
  requiresAuth: boolean;
  isPreview: boolean;
}

const ResourceItem: React.FC<ResourceItemProps> = ({
  id,
  lessonId,
  title,
  description,
  type,
  url,
  thumbnailUrl,
  fileSize,
  isDownloadable,
  requiresAuth,
  isPreview,
}) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };
  
  // Get icon based on resource type
  const getResourceIcon = () => {
    switch (type) {
      case 'pdf':
        return <File className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'image':
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <FileImage className="h-8 w-8 text-green-500" />;
      case 'link':
        return <LinkIcon className="h-8 w-8 text-purple-500" />;
      default:
        return <FileIcon className="h-8 w-8 text-gray-500" />;
    }
  };
  
  // Track resource access
  const trackResourceAccess = async () => {
    if (!isAuthenticated || isPreview) return;
    
    try {
      await apiRequest('POST', `/api/resources/${id}/track`, {
        lessonId,
        action: 'view'
      });
    } catch (error) {
      console.error('Failed to track resource access:', error);
    }
  };
  
  // Handle resource access
  const handleResourceAccess = () => {
    // Check if authentication is required
    if (requiresAuth && !isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to access this resource.',
        variant: 'destructive'
      });
      return;
    }
    
    // Track resource access
    trackResourceAccess();
    
    // For links, open in new tab
    if (type === 'link') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // For downloadable files
    if (isDownloadable) {
      // Create an anchor element and trigger download
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = title;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: 'Download Started',
        description: `${title} is downloading...`,
      });
    } else {
      // Open non-downloadable files in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Resource icon or thumbnail */}
          <div className="flex-shrink-0">
            {thumbnailUrl ? (
              <div className="h-12 w-12 rounded overflow-hidden">
                <img 
                  src={thumbnailUrl} 
                  alt={title} 
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              getResourceIcon()
            )}
          </div>
          
          {/* Resource info */}
          <div className="flex-grow min-w-0">
            <h3 className="text-lg font-medium truncate">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
            )}
            {fileSize && fileSize > 0 && (
              <span className="text-xs text-muted-foreground mt-1 block">
                {formatFileSize(fileSize)}
              </span>
            )}
          </div>
          
          {/* Access button */}
          <div className="flex-shrink-0">
            {requiresAuth && !isAuthenticated ? (
              <Button variant="outline" size="sm" disabled>
                <Lock className="h-4 w-4 mr-1" />
                Login Required
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResourceAccess}
              >
                {isDownloadable ? (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceItem;
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  Printer,
  FileDown,
  FileText,
  File,
  ChevronDown,
  Loader2,
  Copy,
  Share2,
  Mail
} from 'lucide-react';

// Interface for Lesson content to export
interface ContentExportProps {
  id: number;
  title: string;
  content?: string;
  contentType: string;
  courseId: number;
  courseName: string;
}

/**
 * A simplified content export component that provides basic export functionality
 * including print, copy text, and sharing options
 */
const SimpleContentExport: React.FC<ContentExportProps> = ({
  id,
  title,
  content = '',
  contentType,
  courseId,
  courseName
}) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Print content
  const handlePrint = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to print content',
        variant: 'destructive',
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast({
        title: 'Popup Blocked',
        description: 'Please allow popups to print content',
        variant: 'destructive',
      });
      return;
    }
    
    // Create print-friendly document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} | ${courseName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 20px;
              color: #333;
            }
            h1 {
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
              font-size: 24px;
            }
            .metadata {
              color: #666;
              font-size: 14px;
              margin-bottom: 20px;
            }
            .content {
              margin-bottom: 30px;
              font-size: 16px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #999;
              margin-top: 50px;
              border-top: 1px solid #eee;
              padding-top: 10px;
            }
            @media print {
              body {
                font-size: 12pt;
              }
              h1 {
                font-size: 18pt;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="metadata">
            <div>Course: ${courseName}</div>
          </div>
          <div class="content">
            ${content || ''}
          </div>
          <div class="footer">
            Printed from ${window.location.hostname} on ${new Date().toLocaleDateString()}
          </div>
          <div class="no-print" style="position: fixed; top: 20px; right: 20px;">
            <button onclick="window.print();return false;" style="padding: 10px 15px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print Document
            </button>
          </div>
          <script>
            setTimeout(() => {
              window.print();
            }, 1000);
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Copy content as text
  const handleCopyText = async () => {
    try {
      // Create temporary element
      const temp = document.createElement('div');
      temp.innerHTML = content;
      // Get text content
      const textContent = temp.textContent || temp.innerText || '';
      
      await navigator.clipboard.writeText(textContent);
      
      toast({
        title: 'Content Copied',
        description: 'The content has been copied to your clipboard',
      });
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy content to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Generate shareable link
  const handleShare = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to share content',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      toast({
        title: 'Feature Coming Soon',
        description: 'Content sharing will be available soon',
      });
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Email content
  const handleEmailContent = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to email content',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      toast({
        title: 'Feature Coming Soon',
        description: 'Email content will be available soon',
      });
    } catch (error) {
      console.error('Email error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Export
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleCopyText}>
          <Copy className="mr-2 h-4 w-4" />
          Copy as Text
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleEmailContent}>
          <Mail className="mr-2 h-4 w-4" />
          Email to Me
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SimpleContentExport;
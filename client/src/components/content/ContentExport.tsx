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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Printer,
  FileDown,
  FileText,
  File,
  FileSpreadsheet,
  ChevronDown,
  Loader2,
  Settings,
  Mail,
  Share2,
  Copy,
  Check
} from 'lucide-react';

// Export formats supported
type ExportFormat = 'pdf' | 'word' | 'excel' | 'text' | 'html';

// Interface for Lesson content to export
interface ExportContent {
  id: number;
  title: string;
  content?: string;
  contentType: string;
  courseId: number;
  courseName: string;
  moduleName?: string;
  resources?: Array<{
    id: number;
    title: string;
    type: string;
    url: string;
  }>;
}

interface ContentExportProps {
  content: ExportContent;
  variant?: 'icon' | 'button' | 'dropdown';
  buttonText?: string;
  iconOnly?: boolean;
  children?: React.ReactNode;
}

const ContentExport: React.FC<ContentExportProps> = ({
  content,
  variant = 'dropdown',
  buttonText = 'Export',
  iconOnly = false,
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [includeResources, setIncludeResources] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Handle export request
  const handleExport = async (format: ExportFormat, skipDialog = false) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to export content',
        variant: 'destructive',
      });
      return;
    }

    if (!skipDialog && format !== 'text') {
      setExportFormat(format);
      setShowOptionsDialog(true);
      return;
    }

    setLoading(true);

    try {
      const exportOptions = {
        lessonId: content.id,
        courseId: content.courseId,
        format,
        options: {
          includeResources,
          includeNotes,
          includeMetadata,
        },
      };

      // For text format, just copy to clipboard
      if (format === 'text') {
        const textContent = extractPlainText(content.content || '');
        await navigator.clipboard.writeText(textContent);
        
        toast({
          title: 'Content Copied',
          description: 'The content has been copied to your clipboard',
        });
        
        setLoading(false);
        return;
      }

      // For other formats, request from API
      const response = await apiRequest('POST', '/api/export', exportOptions, { responseType: 'blob' });
      
      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Generate filename
      let filename = content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      switch (format) {
        case 'pdf':
          a.download = `${filename}.pdf`;
          break;
        case 'word':
          a.download = `${filename}.docx`;
          break;
        case 'excel':
          a.download = `${filename}.xlsx`;
          break;
        case 'html':
          a.download = `${filename}.html`;
          break;
        default:
          a.download = `${filename}.txt`;
      }
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Export Successful',
        description: `Content exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowOptionsDialog(false);
    }
  };

  // Print content directly
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
          <title>${content.title} | ${content.courseName}</title>
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
            .resources {
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .resources h2 {
              font-size: 18px;
            }
            .resources ul {
              padding-left: 20px;
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
          <h1>${content.title}</h1>
          <div class="metadata">
            <div>Course: ${content.courseName}</div>
            ${content.moduleName ? `<div>Module: ${content.moduleName}</div>` : ''}
          </div>
          <div class="content">
            ${content.content || ''}
          </div>
          ${
            includeResources && content.resources && content.resources.length > 0 
            ? `
              <div class="resources">
                <h2>Resources</h2>
                <ul>
                  ${content.resources.map(resource => 
                    `<li>${resource.title} (${resource.type})</li>`
                  ).join('')}
                </ul>
              </div>
            `
            : ''
          }
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

  // Extract plain text from HTML content
  const extractPlainText = (html: string): string => {
    // Create temporary element
    const temp = document.createElement('div');
    temp.innerHTML = html;
    // Get text content
    return temp.textContent || temp.innerText || '';
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
    setLinkCopied(false);

    try {
      const response = await apiRequest('POST', '/api/share', {
        lessonId: content.id,
        courseId: content.courseId,
      });
      
      const data = await response.json();
      setShareLink(data.shareUrl);
      setShowShareDialog(true);
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: 'Share Failed',
        description: 'Failed to generate share link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy share link to clipboard
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
      
      toast({
        title: 'Link Copied',
        description: 'Share link copied to clipboard',
      });
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
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

    // First generate a PDF to attach
    setLoading(true);

    try {
      const exportOptions = {
        lessonId: content.id,
        courseId: content.courseId,
        format: 'email',
        options: {
          includeResources,
          includeNotes,
          includeMetadata,
        },
      };

      const response = await apiRequest('POST', '/api/export/email', exportOptions);
      
      toast({
        title: 'Email Sent',
        description: 'Content has been emailed to your address',
      });
    } catch (error) {
      console.error('Email error:', error);
      toast({
        title: 'Email Failed',
        description: 'Failed to email content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get format icon
  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return <File className="h-4 w-4 mr-2" />;
      case 'word':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 mr-2" />;
      case 'text':
        return <Copy className="h-4 w-4 mr-2" />;
      case 'html':
        return <FileText className="h-4 w-4 mr-2" />;
      default:
        return <FileDown className="h-4 w-4 mr-2" />;
    }
  };

  // If custom children are provided (custom trigger)
  if (children) {
    return (
      <>
        <div onClick={() => setShowOptionsDialog(true)}>
          {children}
        </div>
        
        {/* Export options dialog */}
        <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Options</DialogTitle>
              <DialogDescription>
                Choose export format and options for "{content.title}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className={exportFormat === 'pdf' ? 'ring-2 ring-primary' : ''}
                  onClick={() => setExportFormat('pdf')}
                >
                  <File className="h-5 w-5 mr-2" />
                  PDF
                </Button>
                
                <Button 
                  variant="outline"
                  className={exportFormat === 'word' ? 'ring-2 ring-primary' : ''}
                  onClick={() => setExportFormat('word')}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Word
                </Button>
                
                <Button 
                  variant="outline"
                  className={exportFormat === 'html' ? 'ring-2 ring-primary' : ''}
                  onClick={() => setExportFormat('html')}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  HTML
                </Button>
                
                <Button 
                  variant="outline"
                  className={exportFormat === 'text' ? 'ring-2 ring-primary' : ''}
                  onClick={() => setExportFormat('text')}
                >
                  <Copy className="h-5 w-5 mr-2" />
                  Text
                </Button>
              </div>
              
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-resources" 
                    checked={includeResources} 
                    onCheckedChange={(checked) => setIncludeResources(!!checked)}
                  />
                  <Label htmlFor="include-resources">Include resources</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-notes" 
                    checked={includeNotes} 
                    onCheckedChange={(checked) => setIncludeNotes(!!checked)}
                  />
                  <Label htmlFor="include-notes">Include personal notes</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-metadata" 
                    checked={includeMetadata} 
                    onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
                  />
                  <Label htmlFor="include-metadata">Include course metadata</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOptionsDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleExport(exportFormat, true)}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Export {exportFormat.toUpperCase()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Share dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Content</DialogTitle>
              <DialogDescription>
                Share this content with others
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button variant="outline" size="icon" onClick={copyShareLink}>
                {linkCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Render as icon only
  if (variant === 'icon') {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowOptionsDialog(true)}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />}
        </Button>
        
        {/* Export options dialog */}
        <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Options</DialogTitle>
              <DialogDescription>
                Choose export format and options for "{content.title}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className={exportFormat === 'pdf' ? 'ring-2 ring-primary' : ''}
                  onClick={() => setExportFormat('pdf')}
                >
                  <File className="h-5 w-5 mr-2" />
                  PDF
                </Button>
                
                <Button 
                  variant="outline"
                  className={exportFormat === 'word' ? 'ring-2 ring-primary' : ''}
                  onClick={() => setExportFormat('word')}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Word
                </Button>
                
                <Button 
                  variant="outline"
                  className={exportFormat === 'html' ? 'ring-2 ring-primary' : ''}
                  onClick={() => setExportFormat('html')}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  HTML
                </Button>
                
                <Button 
                  variant="outline"
                  className={exportFormat === 'text' ? 'ring-2 ring-primary' : ''}
                  onClick={() => setExportFormat('text')}
                >
                  <Copy className="h-5 w-5 mr-2" />
                  Text
                </Button>
              </div>
              
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-resources" 
                    checked={includeResources} 
                    onCheckedChange={(checked) => setIncludeResources(!!checked)}
                  />
                  <Label htmlFor="include-resources">Include resources</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-notes" 
                    checked={includeNotes} 
                    onCheckedChange={(checked) => setIncludeNotes(!!checked)}
                  />
                  <Label htmlFor="include-notes">Include personal notes</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-metadata" 
                    checked={includeMetadata} 
                    onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
                  />
                  <Label htmlFor="include-metadata">Include course metadata</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOptionsDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleExport(exportFormat, true)}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Export {exportFormat.toUpperCase()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Render as regular button
  if (variant === 'button') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOptionsDialog(true)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          {iconOnly ? null : buttonText}
        </Button>
        
        {/* Export options dialog */}
        <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Options</DialogTitle>
              <DialogDescription>
                Choose export format and options for "{content.title}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className={exportFormat === 'pdf' ? 'ring-2 ring-primary' : ''}
                  onClick={() => setExportFormat('pdf')}
                >
                  <File className="h-5 w-5 mr-2" />
                  PDF
                </Button>
                
                <Button 
                  variant="outline"
                  className={exportFormat === 'word' ? 'ring-2 ring-primary' : ''}
                  onClick={() => setExportFormat('word')}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Word
                </Button>
                
                <Button 
                  variant="outline"
                  className={exportFormat === 'html' ? 'ring-2 ring-primary' : ''}
                  onClick={() => setExportFormat('html')}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  HTML
                </Button>
                
                <Button 
                  variant="outline"
                  className={exportFormat === 'text' ? 'ring-2 ring-primary' : ''}
                  onClick={() => setExportFormat('text')}
                >
                  <Copy className="h-5 w-5 mr-2" />
                  Text
                </Button>
              </div>
              
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-resources" 
                    checked={includeResources} 
                    onCheckedChange={(checked) => setIncludeResources(!!checked)}
                  />
                  <Label htmlFor="include-resources">Include resources</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-notes" 
                    checked={includeNotes} 
                    onCheckedChange={(checked) => setIncludeNotes(!!checked)}
                  />
                  <Label htmlFor="include-notes">Include personal notes</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-metadata" 
                    checked={includeMetadata} 
                    onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
                  />
                  <Label htmlFor="include-metadata">Include course metadata</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOptionsDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleExport(exportFormat, true)}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Export {exportFormat.toUpperCase()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Default: render as dropdown
  return (
    <>
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
            {iconOnly ? null : buttonText}
            {!iconOnly && <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            {getFormatIcon('pdf')}
            Export as PDF
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleExport('word')}>
            {getFormatIcon('word')}
            Export as Word
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleExport('text')}>
            {getFormatIcon('text')}
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
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowOptionsDialog(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Export Options
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Export options dialog */}
      <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Options</DialogTitle>
            <DialogDescription>
              Choose export format and options for "{content.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className={exportFormat === 'pdf' ? 'ring-2 ring-primary' : ''}
                onClick={() => setExportFormat('pdf')}
              >
                <File className="h-5 w-5 mr-2" />
                PDF
              </Button>
              
              <Button 
                variant="outline"
                className={exportFormat === 'word' ? 'ring-2 ring-primary' : ''}
                onClick={() => setExportFormat('word')}
              >
                <FileText className="h-5 w-5 mr-2" />
                Word
              </Button>
              
              <Button 
                variant="outline"
                className={exportFormat === 'html' ? 'ring-2 ring-primary' : ''}
                onClick={() => setExportFormat('html')}
              >
                <FileText className="h-5 w-5 mr-2" />
                HTML
              </Button>
              
              <Button 
                variant="outline"
                className={exportFormat === 'text' ? 'ring-2 ring-primary' : ''}
                onClick={() => setExportFormat('text')}
              >
                <Copy className="h-5 w-5 mr-2" />
                Text
              </Button>
            </div>
            
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-resources" 
                  checked={includeResources} 
                  onCheckedChange={(checked) => setIncludeResources(!!checked)}
                />
                <Label htmlFor="include-resources">Include resources</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-notes" 
                  checked={includeNotes} 
                  onCheckedChange={(checked) => setIncludeNotes(!!checked)}
                />
                <Label htmlFor="include-notes">Include personal notes</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-metadata" 
                  checked={includeMetadata} 
                  onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
                />
                <Label htmlFor="include-metadata">Include course metadata</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOptionsDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleExport(exportFormat, true)}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Export {exportFormat.toUpperCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Share dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Content</DialogTitle>
            <DialogDescription>
              Share this content with others
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button variant="outline" size="icon" onClick={copyShareLink}>
              {linkCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContentExport;
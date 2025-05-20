import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileText, Image, Upload, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FileAttachmentButtonProps {
  onFileAttached: (fileUrl: string, fileName: string, fileType: string) => void;
  disabled?: boolean;
}

export function FileAttachmentButton({ onFileAttached, disabled = false }: FileAttachmentButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Start upload immediately
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/uploads/message-attachment', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      
      // Call the callback with the file info
      onFileAttached(data.fileUrl, file.name, file.type);
      
      toast({
        title: 'File attached',
        description: `${file.name} has been attached to your message.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload the file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileSelector = () => {
    fileInputRef.current?.click();
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setIsUploading(false);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
      />
      
      {selectedFile ? (
        <div className="flex items-center space-x-2 p-1 bg-muted rounded">
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            getFileIcon(selectedFile)
          )}
          <span className="text-xs truncate max-w-[120px]">
            {selectedFile.name}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={cancelUpload}
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={triggerFileSelector}
          disabled={disabled || isUploading}
          title="Attach a file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
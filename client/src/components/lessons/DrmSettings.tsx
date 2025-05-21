import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Shield, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DrmSettingsProps {
  lessonId: number;
  currentDrmType: string | null;
  onDrmUpdated?: () => void;
}

export function DrmSettings({ lessonId, currentDrmType, onDrmUpdated }: DrmSettingsProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDrmType, setSelectedDrmType] = React.useState(currentDrmType || 'none');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const handleDrmChange = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest('POST', `/api/drm/admin/lessons/${lessonId}/drm`, {
        drmType: selectedDrmType,
      });
      
      toast({
        title: 'DRM Settings Updated',
        description: selectedDrmType === 'none'
          ? 'Content protection has been removed'
          : `Content protection has been set to ${selectedDrmType}`,
      });
      
      setOpen(false);
      if (onDrmUpdated) {
        onDrmUpdated();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to update DRM settings',
        description: 'Please try again or contact support if the problem persists.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Shield className="h-4 w-4" />
          <span>DRM Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Digital Rights Management</DialogTitle>
          <DialogDescription>
            Choose the level of protection for your premium content. DRM helps prevent unauthorized 
            copying and sharing of your educational materials.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="drm-type">Protection Level</Label>
            <Select 
              value={selectedDrmType} 
              onValueChange={setSelectedDrmType}
            >
              <SelectTrigger id="drm-type">
                <SelectValue placeholder="Select protection level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Protection</SelectItem>
                <SelectItem value="basic">Basic (Simple Encryption)</SelectItem>
                <SelectItem value="watermark">Watermarked (User Attribution)</SelectItem>
                <SelectItem value="timed">Time-Limited Access</SelectItem>
                <SelectItem value="premium">Premium (Full Protection)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted p-3 rounded-md">
            {selectedDrmType === 'none' ? (
              <p className="text-sm text-muted-foreground">
                Content will be delivered without any protection. Anyone with access can copy and share.
              </p>
            ) : selectedDrmType === 'basic' ? (
              <p className="text-sm text-muted-foreground">
                Basic encryption prevents casual copying. Content is decrypted only for enrolled students.
              </p>
            ) : selectedDrmType === 'watermark' ? (
              <p className="text-sm text-muted-foreground">
                Content includes personalized watermarks showing the student's name and ID, discouraging sharing.
              </p>
            ) : selectedDrmType === 'timed' ? (
              <p className="text-sm text-muted-foreground">
                Access expires after a set period. Students must be actively enrolled to access content.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Maximum protection with encryption, watermarking, and device-specific access controls.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleDrmChange} disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Apply Protection'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
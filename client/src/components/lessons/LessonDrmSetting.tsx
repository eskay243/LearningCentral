import React from 'react';
import { DrmSettings } from './DrmSettings';
import { Shield, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

interface LessonDrmSettingProps {
  lessonId: number;
  drmType: string | null;
  onDrmUpdated?: () => void;
}

export function LessonDrmSetting({ lessonId, drmType, onDrmUpdated }: LessonDrmSettingProps) {
  const { user } = useAuth();
  
  // Only admins and mentors can manage DRM settings
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MENTOR)) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-4">
      {drmType && drmType !== 'none' ? (
        <Badge variant="outline" className="flex items-center gap-1 px-2">
          <Shield className="h-3 w-3" />
          <span>Protected: {drmType}</span>
        </Badge>
      ) : (
        <Badge variant="outline" className="flex items-center gap-1 px-2 bg-muted/50">
          <Shield className="h-3 w-3" />
          <span>Not Protected</span>
        </Badge>
      )}
      
      <DrmSettings 
        lessonId={lessonId} 
        currentDrmType={drmType}
        onDrmUpdated={onDrmUpdated} 
      />
    </div>
  );
}
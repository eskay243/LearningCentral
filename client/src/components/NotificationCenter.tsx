import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Settings,
  Filter,
  MarkAsUnread,
  Archive,
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: AlertTriangle,
};

export function NotificationCenter() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false,
    onError: () => {
      // Show a user-friendly error message
      console.log("Unable to load notifications at the moment. Please try again later.");
    }
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PUT', '/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest('DELETE', `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'high':
        return notification.priority === 'high' || notification.priority === 'urgent';
      default:
        return true;
    }
  });

  // Sort by priority and creation date
  const sortedNotifications = filteredNotifications.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.isRead).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const getNotificationIcon = (type: string) => {
    const Icon = typeIcons[type as keyof typeof typeIcons] || Info;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant={urgentCount > 0 ? "destructive" : "default"}
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="p-0">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </DropdownMenuLabel>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Button 
                  variant={filter === 'all' ? 'default' : 'ghost'} 
                  className="w-full justify-start" 
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button 
                  variant={filter === 'unread' ? 'default' : 'ghost'} 
                  className="w-full justify-start" 
                  onClick={() => setFilter('unread')}
                >
                  Unread
                </Button>
                <Button 
                  variant={filter === 'high' ? 'default' : 'ghost'} 
                  className="w-full justify-start" 
                  onClick={() => setFilter('high')}
                >
                  High Priority
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>

            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : sortedNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications found
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {sortedNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <Card 
                    className={`cursor-pointer transition-colors hover:bg-muted/50 border-l-4 ${
                      notification.priority === 'urgent' ? 'border-l-red-500' :
                      notification.priority === 'high' ? 'border-l-orange-500' :
                      notification.priority === 'medium' ? 'border-l-yellow-500' :
                      'border-l-blue-500'
                    } ${!notification.isRead ? 'bg-muted/20' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-1 rounded-full ${
                            notification.type === 'error' ? 'bg-red-100 text-red-600' :
                            notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                            notification.type === 'success' ? 'bg-green-100 text-green-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">
                                {notification.title}
                              </h4>
                              <Badge 
                                className={`text-xs ${priorityColors[notification.priority]}`}
                                variant="secondary"
                              >
                                {notification.priority}
                              </Badge>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {index < sortedNotifications.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {sortedNotifications.length > 0 && (
          <div className="p-2 border-t">
            <Button variant="ghost" className="w-full" size="sm">
              View All Notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
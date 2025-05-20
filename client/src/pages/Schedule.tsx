import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import useAuth from "@/hooks/useAuth";
import { formatDate, formatTimeFromNow, formatDuration, getInitials } from "@/lib/utils";
import { LiveSession } from "@/types";

const Schedule = () => {
  const { user, isMentor, isAdmin } = useAuth();
  const [view, setView] = useState<"upcoming" | "past">("upcoming");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch live sessions
  const { data: liveSessions, isLoading } = useQuery({
    queryKey: ["/api/live-sessions"],
    enabled: !!user,
  });

  // Filter and sort sessions
  const upcomingSessions = liveSessions?.filter((session: LiveSession) => 
    new Date(session.startTime) > new Date()
  ).sort((a: LiveSession, b: LiveSession) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const pastSessions = liveSessions?.filter((session: LiveSession) => 
    new Date(session.startTime) <= new Date()
  ).sort((a: LiveSession, b: LiveSession) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  
  // Filter sessions by selected date
  const sessionsByDate = liveSessions?.filter((session: LiveSession) => {
    if (!date) return true;
    
    const sessionDate = new Date(session.startTime);
    return (
      sessionDate.getDate() === date.getDate() &&
      sessionDate.getMonth() === date.getMonth() &&
      sessionDate.getFullYear() === date.getFullYear()
    );
  });

  // Get dates with sessions for calendar highlighting
  const datesWithSessions = liveSessions?.map((session: LiveSession) => 
    new Date(session.startTime)
  );

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-800">Schedule</h1>
          <p className="mt-1 text-gray-500">Manage your upcoming and past live classes</p>
        </div>
        
        {(isMentor || isAdmin) && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <i className="ri-add-line mr-2"></i>
            Schedule Class
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select a date to view sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              disabled={{ before: new Date(new Date().setDate(new Date().getDate() - 30)) }}
              modifiers={{
                booked: datesWithSessions || [],
              }}
              modifiersStyles={{
                booked: { 
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                  color: 'var(--primary)' 
                }
              }}
            />
            {date && (
              <div className="text-center mt-4">
                <p className="text-sm font-medium">
                  {formatDate(date, false)}
                </p>
                <p className="text-xs text-gray-500">
                  {sessionsByDate?.length || 0} session{sessionsByDate?.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => setDate(new Date())}>
              Today
            </Button>
          </CardFooter>
        </Card>
        
        {/* Sessions List */}
        <div className="lg:col-span-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "upcoming" | "past")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-4 mt-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : upcomingSessions?.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No upcoming sessions scheduled</p>
                    {(isMentor || isAdmin) && (
                      <Button 
                        className="mt-4"
                        onClick={() => setShowCreateDialog(true)}
                      >
                        Schedule a Class
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {upcomingSessions?.filter(s => 
                    !date || 
                    sessionsByDate?.some(sd => sd.id === s.id)
                  ).map((session: LiveSession) => (
                    <Card key={session.id} className="overflow-hidden">
                      <div className="bg-primary-50 px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge variant="secondary" className="mr-3">
                            {formatTimeFromNow(session.startTime)}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {formatDate(session.startTime, true)}
                          </span>
                        </div>
                        <Badge>{session.status}</Badge>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-medium">{session.lesson?.title}</h3>
                            <p className="text-sm text-gray-500">
                              {session.course?.title} • {session.module?.title}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                              <div className="flex items-center">
                                <i className="ri-time-line mr-1"></i>
                                <span>Duration: {formatDuration(session.lesson?.duration || 0)}</span>
                              </div>
                              <div className="flex items-center">
                                <i className="ri-user-line mr-1"></i>
                                <span>{session.enrolledCount || 0} enrolled</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            {new Date(session.startTime).getTime() - new Date().getTime() < 15 * 60 * 1000 ? (
                              <Button>
                                Join Now
                              </Button>
                            ) : (
                              <Button variant="outline">
                                Set Reminder
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="past" className="space-y-4 mt-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : pastSessions?.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No past sessions found</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {pastSessions?.filter(s => 
                    !date || 
                    sessionsByDate?.some(sd => sd.id === s.id)
                  ).map((session: LiveSession) => (
                    <Card key={session.id} className="overflow-hidden">
                      <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-3">
                            {formatTimeFromNow(session.startTime)}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {formatDate(session.startTime, true)}
                          </span>
                        </div>
                        <Badge variant="outline">{session.status}</Badge>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-medium">{session.lesson?.title}</h3>
                            <p className="text-sm text-gray-500">
                              {session.course?.title} • {session.module?.title}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                              <div className="flex items-center">
                                <i className="ri-time-line mr-1"></i>
                                <span>Duration: {formatDuration(session.lesson?.duration || 0)}</span>
                              </div>
                              <div className="flex items-center">
                                <i className="ri-user-line mr-1"></i>
                                <span>{session.enrolledCount || 0} attended</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            {session.recordingUrl ? (
                              <Button variant="outline">
                                <i className="ri-play-circle-line mr-1"></i>
                                Watch Recording
                              </Button>
                            ) : (
                              <Button variant="outline" disabled>
                                No Recording
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Create Session Dialog */}
      {(isMentor || isAdmin) && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Schedule a Live Class</DialogTitle>
              <DialogDescription>
                Create a new live class session for your students
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="js">Advanced JavaScript</SelectItem>
                    <SelectItem value="python">Python for Beginners</SelectItem>
                    <SelectItem value="sql">SQL for Data Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Module</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mod1">Module 1: Introduction</SelectItem>
                    <SelectItem value="mod2">Module 2: Core Concepts</SelectItem>
                    <SelectItem value="mod3">Module 3: Advanced Topics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Title</label>
                <Input placeholder="Enter session title" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="custom">Custom date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9am">9:00 AM</SelectItem>
                      <SelectItem value="12pm">12:00 PM</SelectItem>
                      <SelectItem value="3pm">3:00 PM</SelectItem>
                      <SelectItem value="6pm">6:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration</label>
                <Select defaultValue="60">
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button>Schedule Class</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Schedule;

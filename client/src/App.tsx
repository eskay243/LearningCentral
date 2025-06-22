import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelpBubbleProvider } from "./contexts/HelpBubbleContext";
import FloatingRoleSwitcher from "@/components/FloatingRoleSwitcher";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import CourseView from "@/pages/CourseView";
import CourseExercises from "@/pages/CourseExercises";
import CreateCourse from "@/pages/CreateCourse";
import CourseCurriculum from "@/pages/CourseCurriculum";
import LessonEditor from "@/pages/LessonEditor";
import LessonViewer from "@/pages/LessonViewer";
import CoursePreview from "@/pages/CoursePreview";
import Schedule from "@/pages/Schedule";
import Students from "@/pages/Students";
import Assessments from "@/pages/Assessments";
import AssessmentDashboard from "@/pages/AssessmentDashboard";
import QuizTaking from "@/pages/QuizTaking";
import AssignmentSubmissions from "@/pages/AssignmentSubmissions";
import AssignmentSubmission from "@/pages/AssignmentSubmission";
import QuizResultsOld from "@/pages/QuizResults";
import QuizViewer from "@/pages/quiz-viewer";
import QuizResults from "@/pages/quiz-results";
import MessagesPage from "@/pages/Messages";
import NotificationsPage from "@/pages/Notifications";
import Analytics from "@/pages/Analytics";
import Earnings from "@/pages/Earnings";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import UserManagement from "@/pages/UserManagement";
import Login from "@/pages/Login";
import AuthPage from "@/pages/AuthPage";
import { useAuth } from "@/hooks/useAuth";
import AdminSetup from "@/pages/AdminSetup";
import AdminOAuthSettings from "@/pages/AdminOAuthSettings";
import PaymentCallback from "@/pages/payment-callback";
import PaymentPage from "@/pages/PaymentPage";
import BankTransferInstructions from "@/pages/BankTransferInstructions";
import ContentDemo from "@/pages/ContentDemo";
import InteractiveLearning from "@/pages/InteractiveLearning";
import InteractiveCodingPage from "@/pages/InteractiveCodingPage";
import DirectCodingPlayground from "@/pages/DirectCodingPlayground";
import SimpleCodingTest from "@/pages/SimpleCodingTest";
import TestCodingPage from "@/pages/TestCodingPage";
import SimpleRoutingTest from "@/pages/SimpleRoutingTest";
import Certificates from "@/pages/Certificates";
import LiveClasses from "@/pages/live-classes";
import AdminVideoSettings from "@/pages/admin-video-settings";
import CertificateVerification from "@/pages/CertificateVerification";
import CertificateAdmin from "@/pages/CertificateAdmin";
import InteractiveCodingChallenge from "@/pages/InteractiveCodingChallenge";
import AdvancedQuizTaking from "@/pages/AdvancedQuizTaking";
import AdvancedAssignmentSubmission from "@/pages/AdvancedAssignmentSubmission";
import DiscussionForum from "@/pages/DiscussionForum";
import AdminPayments from "@/pages/admin-payments";
import AdminUsers from "@/pages/admin-users";
import AdminMentors from "@/pages/admin-mentors";
import ProfilePage from "@/pages/Profile";
import AdminPermissions from "@/pages/admin-permissions";
import AdminMentorDetails from "@/pages/admin-mentor-details";
import StudentInvoices from "@/pages/StudentInvoices";
import StudentPayments from "@/pages/student-payments";
import CertificateAnalytics from "@/pages/CertificateAnalytics";
import CodeCompanion from "@/pages/CodeCompanion";
import CodeCompanionChat from "@/pages/CodeCompanionChat";

import DemoUsers from "@/pages/DemoUsers";
import CustomizableDashboard from "@/pages/CustomizableDashboard";
import StudentDashboard from "@/pages/student-dashboard";
import StableStudentDashboard from "@/pages/stable-student-dashboard";
import MentorDashboard from "@/pages/MentorDashboard";
import MyCourses from "@/pages/MyCourses";
import CourseDiscussion from "@/pages/CourseDiscussion";
import CourseContentManagement from "@/pages/course-content-management";
import LiveSession from "@/pages/live-session";
import KycMentorPage from "@/pages/kyc-mentor";
import KycStudentPage from "@/pages/kyc-student";
import AdminUserPermissions from "@/pages/admin-user-permissions";
import AdminEditProfile from "@/pages/admin-edit-profile";
import ComprehensiveMentorManagement from "@/pages/ComprehensiveMentorManagement";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/customizable" component={CustomizableDashboard} />
        <Route path="/student-dashboard" component={StableStudentDashboard} />
        <Route path="/courses" component={Courses} />
        <Route path="/my-courses" component={MyCourses} />
        <Route path="/courses/:id" component={CourseDetail} />
        <Route path="/courses/:id/edit" component={CreateCourse} />
        <Route path="/courses/:id/exercises" component={CourseExercises} />
        <Route path="/courses/:id/view" component={CourseView} />
        <Route path="/courses/:id/discussion" component={CourseDiscussion} />
        <Route path="/courses/:id/curriculum" component={CourseCurriculum} />
        <Route path="/courses/:id/payment" component={PaymentPage} />
        <Route path="/courses/:id/bank-transfer" component={BankTransferInstructions} />
        <Route path="/courses/:id/preview" component={CoursePreview} />
        <Route path="/courses/:courseId/lessons/:lessonId/edit" component={LessonEditor} />
        <Route path="/courses/:courseId/lessons/:lessonId" component={LessonViewer} />
        <Route path="/create-course" component={CreateCourse} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/students" component={Students} />

        <Route path="/assessments" component={Assessments} />
        <Route path="/assessment-dashboard" component={AssessmentDashboard} />
        <Route path="/assessment" component={AssessmentDashboard} />
        <Route path="/quiz/:id/take" component={QuizTaking} />
        <Route path="/quiz/:quizId/view" component={QuizViewer} />
        <Route path="/quiz/:quizId/results" component={QuizResults} />
        <Route path="/quizzes" component={Assessments} />
        <Route path="/assignments" component={Assessments} />
        <Route path="/quiz-results/:attemptId" component={QuizResultsOld} />
        <Route path="/assignments/:assignmentId/submit" component={AssignmentSubmission} />
        <Route path="/assignment/:assignmentId/submissions" component={AssignmentSubmissions} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/earnings" component={Earnings} />
        <Route path="/invoices" component={StudentInvoices} />
        <Route path="/payments" component={StudentPayments} />
        <Route path="/settings" component={Settings} />
        <Route path="/profile" component={Profile} />
        <Route path="/users" component={UserManagement} />
        <Route path="/login" component={Login} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/admin-setup" component={AdminSetup} />
        <Route path="/admin/oauth-settings" component={AdminOAuthSettings} />
        <Route path="/admin/video-settings" component={AdminVideoSettings} />
        <Route path="/admin/payments" component={AdminPayments} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/mentors" component={AdminMentors} />
        <Route path="/profile/:id" component={ProfilePage} />
        <Route path="/admin/permissions/:id" component={AdminPermissions} />
        <Route path="/admin/mentor-details/:id" component={AdminMentorDetails} />
        <Route path="/payment/callback" component={PaymentCallback} />
        <Route path="/content-demo" component={ContentDemo} />
        <Route path="/interactive-learning" component={InteractiveLearning} />
        <Route path="/coding-playground" component={DirectCodingPlayground} />
        <Route path="/interactive-coding" component={InteractiveCodingPage} />
        <Route path="/test-coding" component={TestCodingPage} />
        <Route path="/certificates" component={Certificates} />
        <Route path="/certificate/verify/:id" component={CertificateVerification} />
        <Route path="/certificate/verify" component={CertificateVerification} />
        <Route path="/certificate/admin" component={CertificateAdmin} />
        <Route path="/certificate/analytics" component={CertificateAnalytics} />
        <Route path="/live-classes" component={LiveClasses} />
        <Route path="/live-sessions/:id" component={LiveSession} />
        <Route path="/code-companion" component={CodeCompanionChat} />
        <Route path="/code-companion/old" component={CodeCompanion} />
        <Route path="/mentor-dashboard" component={MentorDashboard} />
        <Route path="/demo-users" component={DemoUsers} />
        <Route path="/coding-challenges/:challengeId" component={InteractiveCodingChallenge} />
        <Route path="/advanced-quizzes/:quizId" component={AdvancedQuizTaking} />
        <Route path="/advanced-assignments/:assignmentId" component={AdvancedAssignmentSubmission} />
        <Route path="/courses/:courseId/forums" component={DiscussionForum} />
        <Route path="/courses/:courseId/forums/:forumId" component={DiscussionForum} />
        <Route path="/courses/:courseId/forums/:forumId/topics/:topicId" component={DiscussionForum} />
        <Route path="/content-management" component={CourseContentManagement} />
        <Route path="/admin/user-permissions" component={AdminUserPermissions} />
        <Route path="/admin/edit-profile" component={AdminEditProfile} />
        <Route path="/kyc/mentor" component={KycMentorPage} />
        <Route path="/kyc/student" component={KycStudentPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const [roleSwitcherEnabled, setRoleSwitcherEnabled] = useState(() => {
    const saved = localStorage.getItem('role-switcher-enabled');
    return saved ? JSON.parse(saved) : true; // Default to enabled
  });

  const handleToggleRoleSwitcher = (enabled: boolean) => {
    setRoleSwitcherEnabled(enabled);
    localStorage.setItem('role-switcher-enabled', JSON.stringify(enabled));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HelpBubbleProvider>
          <Toaster />
          <Router />
          <FloatingRoleSwitcher 
            isEnabled={roleSwitcherEnabled}
            onToggleEnabled={handleToggleRoleSwitcher}
          />
        </HelpBubbleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

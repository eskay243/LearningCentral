import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import CourseView from "@/pages/CourseView";
import CourseExercises from "@/pages/CourseExercises";
import CreateCourse from "@/pages/CreateCourse";
import Schedule from "@/pages/Schedule";
import Students from "@/pages/Students";
import Assessments from "@/pages/Assessments";
import Messages from "@/pages/Messages";
import Analytics from "@/pages/Analytics";
import Earnings from "@/pages/Earnings";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import UserManagement from "@/pages/UserManagement";
import Login from "@/pages/Login";
import AdminSetup from "@/pages/AdminSetup";
import PaymentCallback from "@/pages/PaymentCallback";
import PaymentPage from "@/pages/PaymentPage";
import ContentDemo from "@/pages/ContentDemo";
import InteractiveLearning from "@/pages/InteractiveLearning";
import Certificates from "@/pages/Certificates";
import CertificateVerification from "@/pages/CertificateVerification";
import CertificateAdmin from "@/pages/CertificateAdmin";
import CertificateAnalytics from "@/pages/CertificateAnalytics";
import CodeCompanion from "@/pages/CodeCompanion";
import DemoUsers from "@/pages/DemoUsers";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/courses" component={Courses} />
        <Route path="/courses/:id" component={CourseDetail} />
        <Route path="/courses/:id/exercises" component={CourseExercises} />
        <Route path="/courses/:id/view" component={CourseView} />
        <Route path="/courses/:id/payment" component={PaymentPage} />
        <Route path="/create-course" component={CreateCourse} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/students" component={Students} />
        <Route path="/assessments" component={Assessments} />
        <Route path="/messages" component={Messages} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/earnings" component={Earnings} />
        <Route path="/settings" component={Settings} />
        <Route path="/profile" component={Profile} />
        <Route path="/users" component={UserManagement} />
        <Route path="/login" component={Login} />
        <Route path="/admin-setup" component={AdminSetup} />
        <Route path="/payment-callback" component={PaymentCallback} />
        <Route path="/content-demo" component={ContentDemo} />
        <Route path="/interactive-learning" component={InteractiveLearning} />
        <Route path="/certificates" component={Certificates} />
        <Route path="/certificate/verify/:id" component={CertificateVerification} />
        <Route path="/certificate/verify" component={CertificateVerification} />
        <Route path="/certificate/admin" component={CertificateAdmin} />
        <Route path="/certificate/analytics" component={CertificateAnalytics} />
        <Route path="/code-companion" component={CodeCompanion} />
        <Route path="/demo-users" component={DemoUsers} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";

import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import RoomPage from "@/pages/room";
import CampusVibePage from "@/pages/campus-vibe";
import CareerPathwayPage from "@/pages/career-pathway";
import MicroSkillPage from "@/pages/micro-skill";
import ComingSoonPage from "@/pages/coming-soon";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/:mode" component={AuthPage} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/room/:id" component={RoomPage} />
      <Route path="/campus-vibe" component={CampusVibePage} />
      <Route path="/career-pathway" component={CareerPathwayPage} />
      <Route path="/micro-skill" component={MicroSkillPage} />
      <Route path="/coming-soon/:key" component={ComingSoonPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

import { useEffect, useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const heroImage = "/stackburn-hero.jpg";
const Dashboard = lazy(() => import("./Dashboard"));
import { MobileDashboard } from "./MobileDashboard";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { BurnScoreWidget } from "@/components/BurnScoreWidget";
import { ShowChainModal } from "@/components/ShowChainModal";
import { BurnCompleteModal } from "@/components/BurnCompleteModal";
import ErrorBoundary from "@/components/ErrorBoundary";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showChainModal, setShowChainModal] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show onboarding on first visit (persistent)
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('stackburn-onboarding-seen');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
      localStorage.setItem('stackburn-onboarding-seen', 'true');
    }
  }, []);

  const handleGetStarted = () => {
    setIsScanning(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleStartScan = () => {
    toast({
      title: "🔥 Scan Initiated",
      description: "Hunting for digital clutter across your stack...",
    });
  };

  // Mock data for demo modals
  const mockVersions = [
    {
      id: "1",
      name: "project-proposal-final.docx",
      size: 1024000,
      modifiedAt: new Date("2024-01-15"),
      path: "/documents/proposals/project-proposal-final.docx",
      isNewest: true,
      suggestion: "keep" as const
    },
    {
      id: "2", 
      name: "project-proposal-v2.docx",
      size: 987000,
      modifiedAt: new Date("2024-01-10"),
      path: "/documents/proposals/project-proposal-v2.docx",
      isNewest: false,
      suggestion: "burn" as const
    },
    {
      id: "3",
      name: "project-proposal-draft.docx", 
      size: 756000,
      modifiedAt: new Date("2024-01-05"),
      path: "/documents/proposals/project-proposal-draft.docx",
      isNewest: false,
      suggestion: "burn" as const
    }
  ];

  // Show mobile dashboard on mobile devices
  if (isMobile) {
    return <MobileDashboard />;
  }

  // Show hero + desktop dashboard on larger screens
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/70" />
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Flame className="h-16 w-16 text-flame animate-flame-flicker" />
            <h1 className="text-6xl md:text-8xl font-bold text-white">
              StackBurn
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Post-AI survival weapon. Burn the bloat before it burns you.
          </p>
          
          <div className="space-y-4">
            <Button 
              size="xl" 
              variant="ignite"
              onClick={handleGetStarted}
              disabled={isScanning}
              className="text-lg px-8 py-4 gap-3 relative overflow-hidden"
            >
              {isScanning ? (
                <>
                  <Flame className="h-6 w-6 animate-flame-flicker" />
                  Scanning Your Stack...
                </>
              ) : (
                <>
                  <Flame className="h-6 w-6" />
                  Ignite Hunt
                </>
              )}
            </Button>
            
            <div className="text-sm text-gray-400">
              Digital cleanup engine for founders drowning in stack clutter
            </div>

{/* Demo Buttons */}
          </div>
        </div>
      </div>


      {/* Dashboard Section */}
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-flame mx-auto"></div>
              <p className="text-muted-foreground">Loading Dashboard...</p>
            </div>
          </div>
        }>
          <Dashboard />
        </Suspense>
      </ErrorBoundary>

      {/* Modals */}
      {showOnboarding && (
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
          onStartScan={handleStartScan}
        />
      )}

      <ShowChainModal
        isOpen={showChainModal}
        onClose={() => setShowChainModal(false)}
        fileName="project-proposal.docx"
        versions={mockVersions}
        onBurnVersion={(id) => {
          toast({ title: "🔥 Version Burned", description: `Removed version ${id}` });
        }}
        onKeepVersion={(id) => {
          toast({ title: "📁 Version Kept", description: `Kept version ${id}` });
        }}
        onArchiveVersion={(id) => {
          toast({ title: "📦 Version Archived", description: `Archived version ${id}` });
        }}
      />

      <BurnCompleteModal
        isOpen={showBurnModal}
        onClose={() => setShowBurnModal(false)}
        filesBurned={247}
        gbFreed={15.7}
        oldScore={67}
        newScore={84}
        onShare={() => {
          toast({ title: "🔥 Shared!", description: "Burn score shared to social media" });
        }}
      />
    </div>
  );
};

export default Index;

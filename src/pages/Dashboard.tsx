import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BurnScore } from "@/components/BurnScore";
import { IntegrationPanel, defaultIntegrations } from "@/components/IntegrationPanel";
import { ClutterFilters, ClutterType } from "@/components/ClutterFilters";
import { ClutterResults, ClutterItem } from "@/components/ClutterResults";
import { BurnCompleteModal } from "@/components/BurnCompleteModal";
import { Flame, Zap } from "lucide-react";

// Mock data for demonstration
const mockClutterItems: ClutterItem[] = [
  {
    id: "1",
    name: "MarketingPlan_final_v2_copy.docx",
    path: "/Documents/Marketing/MarketingPlan_final_v2_copy.docx",
    type: "file",
    size: 2048576,
    lastModified: new Date(2023, 8, 15),
    score: 85,
    reason: "Part of version chain with 4 files. No edits in 8 months.",
    source: "gdrive",
    duplicateCount: 3,
    versionChain: [
      "MarketingPlan.docx",
      "MarketingPlan_v2.docx", 
      "MarketingPlan_final.docx",
      "MarketingPlan_final_v2_copy.docx"
    ]
  },
  {
    id: "2", 
    name: "old-landing-page",
    path: "https://github.com/user/old-landing-page",
    type: "repo",
    size: 1024000,
    lastModified: new Date(2022, 11, 3),
    score: 92,
    reason: "No commits in 14 months. Appears redundant.",
    source: "github"
  },
  {
    id: "3",
    name: "IMG_2847.jpg",
    path: "/Photos/IMG_2847.jpg", 
    type: "file",
    size: 3145728,
    lastModified: new Date(2023, 5, 22),
    score: 78,
    reason: "Duplicate of file IMG_2847_copy.jpg (same hash, same size).",
    source: "windows",
    duplicateCount: 2
  }
];

const Dashboard = () => {
  const { toast } = useToast();
  const [burnScore, setBurnScore] = useState(67);
  const [filesScanned, setFilesScanned] = useState(1247);
  const [clutterFound, setClutterFound] = useState(89);
  const [integrations, setIntegrations] = useState(defaultIntegrations);
  const [activeFilter, setActiveFilter] = useState<ClutterType>("all");
  const [clutterItems, setClutterItems] = useState<ClutterItem[]>(mockClutterItems);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [lastBurnStats, setLastBurnStats] = useState({
    filesBurned: 0,
    gbFreed: 0,
    oldScore: 0,
    newScore: 0
  });

  const handleConnect = async (integrationId: string) => {
    setIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { ...int, status: "connected" as const }
        : int
    ));
    
    toast({
      title: "Integration Activated",
      description: `${integrations.find(i => i.id === integrationId)?.name} is now active and ready to hunt`,
    });
  };

  const handleScan = async (integrationId: string) => {
    setIsScanning(true);
    setIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { ...int, status: "scanning" as const }
        : int
    ));

    // Simulate scanning
    setTimeout(() => {
      setIntegrations(prev => prev.map(int => 
        int.id === integrationId 
          ? { ...int, status: "connected" as const, filesFound: Math.floor(Math.random() * 500) + 100 }
          : int
      ));
      
      setIsScanning(false);
      setBurnScore(prev => prev + 8);
      setFilesScanned(prev => prev + 200);
      setClutterFound(prev => prev + 15);
      
      toast({
        title: "Hunt Complete",
        description: `Exposed clutter hiding in your stack`,
      });
    }, 3000);
  };

  const handleIgniteScan = () => {
    const connectedIntegrations = integrations.filter(i => i.status === "connected");
    if (connectedIntegrations.length === 0) {
      toast({
        title: "No Active Integrations", 
        description: "Activate at least one integration to begin the hunt",
        variant: "destructive"
      });
      return;
    }
    
    connectedIntegrations.forEach(integration => {
      handleScan(integration.id);
    });
  };

  const handleBurn = async (ids: string[]) => {
    const itemCount = ids.length;
    const burnedItems = clutterItems.filter(item => ids.includes(item.id));
    const totalSizeGB = burnedItems.reduce((acc, item) => acc + item.size, 0) / (1024 * 1024 * 1024);
    const oldScore = burnScore;
    const newScore = Math.min(burnScore + (itemCount * 3), 100);
    
    setClutterItems(prev => prev.filter(item => !ids.includes(item.id)));
    setSelectedIds([]);
    setBurnScore(newScore);
    setClutterFound(prev => prev - itemCount);
    
    setLastBurnStats({
      filesBurned: itemCount,
      gbFreed: totalSizeGB,
      oldScore,
      newScore
    });
    setShowBurnModal(true);
  };

  const handleKeep = (ids: string[]) => {
    setClutterItems(prev => prev.filter(item => !ids.includes(item.id)));
    setSelectedIds([]);
    
    toast({
      title: "Files Preserved",
      description: `${ids.length} files marked as essential`,
    });
  };

  const handleIgnore = (ids: string[]) => {
    setClutterItems(prev => prev.filter(item => !ids.includes(item.id)));
    setSelectedIds([]);
    
    toast({
      title: "Bloat Dismissed",
      description: `${ids.length} files banished from results`,
    });
  };

  const handleViewDetails = (item: ClutterItem) => {
    toast({
      title: item.name,
      description: `${item.reason} | ${item.path}`,
    });
  };
  // Calculate filter counts
  const filterCounts: Record<ClutterType, number> = {
    all: clutterItems.length,
    duplicates: clutterItems.filter(item => item.duplicateCount && item.duplicateCount > 1).length,
    versioned: clutterItems.filter(item => item.versionChain && item.versionChain.length > 1).length,
    stale: clutterItems.filter(item => item.score >= 70).length,
    archived: clutterItems.filter(item => item.path.includes('archive') || item.path.includes('old')).length
  };

  const filteredItems = activeFilter === "all" 
    ? clutterItems 
    : clutterItems.filter(item => {
        switch (activeFilter) {
          case "duplicates":
            return item.duplicateCount && item.duplicateCount > 1;
          case "versioned":
            return item.versionChain && item.versionChain.length > 1;
          case "stale":
            return item.score >= 70;
          case "archived":
            return item.path.includes('archive') || item.path.includes('old');
          default:
            return true;
        }
      });

  return (
    <div className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-2 md:gap-3">
              <Flame className="h-8 w-8 md:h-10 md:w-10 text-flame animate-flame-flicker flex-shrink-0" />
              <span className="truncate">StackBurn</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Post-AI survival weapon. Burn the bloat before it burns you.
            </p>
          </div>
          
          <Button 
            variant="ignite" 
            size={isScanning ? "default" : "xl"}
            onClick={handleIgniteScan}
            disabled={isScanning}
            className="gap-2 md:gap-3 w-full sm:w-auto whitespace-nowrap text-sm md:text-base"
          >
            <Zap className="h-4 w-4 md:h-6 md:w-6" />
            {isScanning ? "Hunting..." : "Ignite Hunt"}
          </Button>
        </div>

        {/* Top row - Score and Integrations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-1">
            <BurnScore 
              score={burnScore}
              filesScanned={filesScanned}
              clutterFound={clutterFound}
              onIgniteScan={handleIgniteScan}
            />
          </div>
          <div className="lg:col-span-2">
            <IntegrationPanel 
              integrations={integrations}
              onConnect={handleConnect}
              onScan={handleScan}
            />
          </div>
        </div>

        {/* Bottom row - Filters and Results */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <ClutterFilters 
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={filterCounts}
            />
          </div>
          <div className="lg:col-span-3 order-1 lg:order-2">
            <ClutterResults 
              items={filteredItems}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onBurn={handleBurn}
              onKeep={handleKeep}
              onIgnore={handleIgnore}
              onViewDetails={handleViewDetails}
            />
          </div>
        </div>
      </div>

      <BurnCompleteModal
        isOpen={showBurnModal}
        onClose={() => setShowBurnModal(false)}
        filesBurned={lastBurnStats.filesBurned}
        gbFreed={lastBurnStats.gbFreed}
        oldScore={lastBurnStats.oldScore}
        newScore={lastBurnStats.newScore}
        onShare={() => {
          // Share functionality
          const shareText = `Just purged ${lastBurnStats.filesBurned} files and freed ${lastBurnStats.gbFreed.toFixed(1)}GB with StackBurn! My Burn Score improved from ${lastBurnStats.oldScore} to ${lastBurnStats.newScore}. 🔥`;
          if (navigator.share) {
            navigator.share({
              title: 'StackBurn Victory',
              text: shareText,
              url: window.location.href
            });
          } else {
            navigator.clipboard.writeText(shareText);
            toast({
              title: "Victory Copied",
              description: "Share text copied to clipboard for maximum bragging rights."
            });
          }
        }}
      />
    </div>
  );
};

export default Dashboard;
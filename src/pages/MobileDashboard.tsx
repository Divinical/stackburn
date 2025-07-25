import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MobileFloatingBar } from "@/components/MobileFloatingBar";
import { MobileClutterCard } from "@/components/MobileClutterCard";
import { MobileIntegrationCard } from "@/components/MobileIntegrationCard";
import { defaultIntegrations } from "@/components/IntegrationPanel";
import { ClutterType } from "@/components/ClutterFilters";
import { ClutterItem } from "@/components/ClutterResults";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame } from "lucide-react";

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

export const MobileDashboard = () => {
  const { toast } = useToast();
  const [burnScore, setBurnScore] = useState(67);
  const [filesScanned, setFilesScanned] = useState(1247);
  const [clutterFound, setClutterFound] = useState(89);
  const [integrations, setIntegrations] = useState(defaultIntegrations);
  const [activeFilter, setActiveFilter] = useState<ClutterType>("all");
  const [clutterItems, setClutterItems] = useState<ClutterItem[]>(mockClutterItems);
  const [isScanning, setIsScanning] = useState(false);

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
        description: `Exposed ${89} pieces of bloat hiding in your stack`,
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

  const handleBurn = async (id: string) => {
    setClutterItems(prev => prev.filter(item => item.id !== id));
    setBurnScore(prev => Math.min(prev + 3, 100));
    setClutterFound(prev => prev - 1);
    
    toast({
      title: "🔥 Bloat Purged",
      description: "Digital waste burned. Stack integrity +3.",
    });
  };

  const handleKeep = (id: string) => {
    setClutterItems(prev => prev.filter(item => item.id !== id));
    
    toast({
      title: "File Preserved",
      description: "Marked as essential and moved to safe zone.",
    });
  };

  const handleIgnore = (id: string) => {
    setClutterItems(prev => prev.filter(item => item.id !== id));
    
    toast({
      title: "Bloat Dismissed",
      description: "Banished from hunt results.",
    });
  };

  const handleViewDetails = (item: ClutterItem) => {
    toast({
      title: item.name,
      description: `${item.reason} | ${item.path}`,
    });
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
          default:
            return true;
        }
      });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="p-4 border-b border-iron">
        <div className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-flame animate-flame-flicker" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">StackBurn</h1>
            <p className="text-sm text-muted-foreground">
              Post-AI survival weapon
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <Tabs defaultValue="clutter" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-forge border border-iron">
            <TabsTrigger value="clutter" className="data-[state=active]:bg-ember data-[state=active]:text-ember">
              Clutter ({clutterFound})
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-ember data-[state=active]:text-ember">
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clutter" className="mt-4">
            {/* Quick Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <Button
                variant={activeFilter === "all" ? "ember" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("all")}
                className="whitespace-nowrap"
              >
                All ({clutterItems.length})
              </Button>
              <Button
                variant={activeFilter === "duplicates" ? "ember" : "outline"}
                size="sm"  
                onClick={() => setActiveFilter("duplicates")}
                className="whitespace-nowrap"
              >
                Duplicates
              </Button>
            </div>

            {/* Clutter Items */}
            <div className="space-y-0">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <Flame className="h-12 w-12 mx-auto mb-4 text-ash" />
                  <h3 className="text-lg font-semibold mb-2">Stack clean</h3>
                  <p className="text-muted-foreground text-sm">
                    Activate integrations and hunt for bloat hiding in your stack.
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <MobileClutterCard
                    key={item.id}
                    item={item}
                    onBurn={handleBurn}
                    onKeep={handleKeep}
                    onIgnore={handleIgnore}
                    onViewDetails={handleViewDetails}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="mt-4">
            <div className="space-y-0">
              {integrations.map((integration) => (
                <MobileIntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={handleConnect}
                  onScan={handleScan}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Bottom Bar */}
      <MobileFloatingBar 
        burnScore={burnScore}
        onIgniteScan={handleIgniteScan}
        isScanning={isScanning}
      />
    </div>
  );
};

export default MobileDashboard;
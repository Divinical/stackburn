import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Flame, Eye, RotateCcw, Info, ExternalLink } from "lucide-react";
import { useState } from "react";

export interface ClutterItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder" | "repo";
  size: number;
  lastModified: Date;
  score: number;
  reason: string;
  source: "gdrive" | "windows" | "github";
  duplicateCount?: number;
  versionChain?: string[];
}

interface ClutterResultsProps {
  items: ClutterItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onBurn: (ids: string[]) => void;
  onKeep: (ids: string[]) => void;
  onIgnore: (ids: string[]) => void;
  onViewDetails: (item: ClutterItem) => void;
}

export const ClutterResults = ({ 
  items, 
  selectedIds, 
  onSelectionChange, 
  onBurn, 
  onKeep, 
  onIgnore,
  onViewDetails 
}: ClutterResultsProps) => {
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getSourceBadge = (source: string) => {
    const colors = {
      gdrive: "border-blue-500 text-blue-400",
      windows: "border-green-500 text-green-400", 
      github: "border-purple-500 text-purple-400"
    };
    return colors[source as keyof typeof colors] || "border-ash text-ash";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-flame";
    if (score >= 50) return "text-ember";
    return "text-ash";
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(item => item.id));
    }
  };

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedChains);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedChains(newExpanded);
  };

  if (items.length === 0) {
    return (
      <Card className="p-8 bg-forge border-iron text-center">
        <div className="text-muted-foreground">
          <Flame className="h-12 w-12 mx-auto mb-4 text-ash" />
          <h3 className="text-lg font-semibold mb-2">Stack clean</h3>
          <p>Activate integrations and hunt for bloat hiding in your stack.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-forge border-iron">
      {/* Header with batch actions */}
      <div className="p-4 border-b border-iron">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedIds.length === items.length}
              onCheckedChange={toggleSelectAll}
              className="border-iron"
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} of {items.length} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (expandedChains.size === items.length) {
                  setExpandedChains(new Set());
                } else {
                  setExpandedChains(new Set(items.map(item => item.id)));
                }
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {expandedChains.size === items.length ? "Collapse All" : "Expand All"}
            </Button>
          </div>
          
          {selectedIds.length > 0 && (
            <div className="flex gap-2">
              <Button 
                variant="burn" 
                size="sm"
                onClick={() => onBurn(selectedIds)}
                className="gap-2"
              >
                <Flame className="h-4 w-4" />
                Burn ({selectedIds.length})
              </Button>
              <Button 
                variant="ember" 
                size="sm"
                onClick={() => onKeep(selectedIds)}
              >
                Keep
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onIgnore(selectedIds)}
              >
                Ignore
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results list */}
      <div className="divide-y divide-iron">
        {items.map((item) => (
          <div key={item.id} className="p-3 md:p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3 md:gap-4">
              <Checkbox
                checked={selectedIds.includes(item.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectionChange([...selectedIds, item.id]);
                  } else {
                    onSelectionChange(selectedIds.filter(id => id !== item.id));
                  }
                }}
                className="mt-1 border-iron flex-shrink-0"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2 min-w-0">
                    <h4 className="font-semibold text-foreground truncate text-sm md:text-base max-w-48 sm:max-w-none">{item.name}</h4>
                    <Badge variant="outline" className={`${getSourceBadge(item.source)} text-xs flex-shrink-0`}>
                      {item.source}
                    </Badge>
                    {item.duplicateCount && (
                      <Badge variant="outline" className="border-ember text-ember text-xs flex-shrink-0">
                        {item.duplicateCount} clones
                      </Badge>
                    )}
                    {item.score >= 80 && (
                      <Badge variant="outline" className="border-flame text-flame">
                        🔥 Safe to burn
                      </Badge>
                    )}
                    {item.score >= 50 && item.score < 80 && (
                      <Badge variant="outline" className="border-ember text-ember">
                        ⚠️ Review before burning
                      </Badge>
                    )}
                  </div>
                  <div className={`text-lg font-bold ${getScoreColor(item.score)}`}>
                    {item.score}
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-2">
                  {item.path}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <span>{formatSize(item.size)}</span>
                  <span>Modified {formatDate(item.lastModified)}</span>
                  <span className="capitalize">{item.type}</span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-3 w-3 text-ember" />
                  <span className="text-sm text-ember">{item.reason}</span>
                </div>
                
                {item.versionChain && item.versionChain.length > 1 && (
                  <div className="mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(item.id)}
                      className="text-xs p-1 h-auto"
                    >
                      Expose chain ({item.versionChain.length} versions)
                    </Button>
                    
                    {expandedChains.has(item.id) && (
                      <div className="mt-2 ml-4 space-y-1">
                        {item.versionChain.map((fileName, index) => (
                          <div key={index} className="text-xs text-muted-foreground">
                            • {fileName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onViewDetails(item)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View details</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open location</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
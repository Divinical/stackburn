import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, MoreHorizontal, Eye, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ClutterItem } from "./ClutterResults";

interface MobileClutterCardProps {
  item: ClutterItem;
  onBurn: (id: string) => void;
  onKeep: (id: string) => void;
  onIgnore: (id: string) => void;
  onViewDetails: (item: ClutterItem) => void;
}

export const MobileClutterCard = ({ item, onBurn, onKeep, onIgnore, onViewDetails }: MobileClutterCardProps) => {
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
    
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
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

  const getSeverityBadge = (score: number) => {
    if (score >= 80) return { text: "🔥 Safe to burn", class: "border-flame text-flame" };
    if (score >= 50) return { text: "⚠️ Review first", class: "border-ember text-ember" };
    return { text: "Low risk", class: "border-ash text-ash" };
  };

  const severity = getSeverityBadge(item.score);

  return (
    <Card className="p-4 bg-forge border-iron mb-3">
      {/* Header with score and actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate text-lg">{item.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={getSourceBadge(item.source)}>
              {item.source}
            </Badge>
            <Badge variant="outline" className={severity.class}>
              {severity.text}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-3">
          <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
            {item.score}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-forge border-iron z-50">
              <DropdownMenuItem 
                onClick={() => onBurn(item.id)}
                className="text-flame hover:bg-flame/10"
              >
                <Flame className="h-4 w-4 mr-2" />
                Burn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onKeep(item.id)}>
                Keep
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onIgnore(item.id)}>
                Ignore
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewDetails(item)}>
                <Eye className="h-4 w-4 mr-2" />
                Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* File details */}
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground truncate">
          {item.path}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatSize(item.size)}</span>
          <span>{formatDate(item.lastModified)}</span>
        </div>
        
        <div className="text-sm text-ember">
          {item.reason}
        </div>

        {item.duplicateCount && (
          <Badge variant="outline" className="border-ember text-ember text-xs">
            {item.duplicateCount} clones found
          </Badge>
        )}

        {item.versionChain && item.versionChain.length > 1 && (
          <div className="text-xs text-muted-foreground">
            Version chain: {item.versionChain.length} files
          </div>
        )}
      </div>
    </Card>
  );
};
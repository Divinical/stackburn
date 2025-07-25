import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, FileText, Trash2, Archive, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface FileVersion {
  id: string;
  name: string;
  size: number;
  modifiedAt: Date;
  path: string;
  isNewest: boolean;
  suggestion: "burn" | "keep" | "archive";
}

interface ShowChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  versions: FileVersion[];
  onBurnVersion: (versionId: string) => void;
  onKeepVersion: (versionId: string) => void;
  onArchiveVersion: (versionId: string) => void;
}

export function ShowChainModal({
  isOpen,
  onClose,
  fileName,
  versions,
  onBurnVersion,
  onKeepVersion,
  onArchiveVersion
}: ShowChainModalProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getSuggestionBadge = (suggestion: string, isNewest: boolean) => {
    if (isNewest) {
      return <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Current</Badge>;
    }
    
    switch (suggestion) {
      case "burn":
        return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Burn</Badge>;
      case "archive":
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">Archive</Badge>;
      case "keep":
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Keep</Badge>;
      default:
        return null;
    }
  };

  const toggleExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const sortedVersions = [...versions].sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm md:max-w-2xl max-h-[85vh] md:max-h-[80vh] flex flex-col mx-4">
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base md:text-xl">
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            <span className="truncate">Version Chain: {fileName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
          Found {versions.length} versions • {versions.filter(v => v.suggestion === 'burn').length} suggested for burning
        </div>

        <ScrollArea className="flex-1 pr-2 md:pr-4 min-h-0">
          <div className="space-y-2 md:space-y-3">
            {sortedVersions.map((version, index) => (
              <div key={version.id} className="border border-border rounded-lg p-3 md:p-4 bg-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => toggleExpanded(version.id)}
                        className="flex items-center gap-1 hover:text-foreground text-muted-foreground transition-colors min-w-0"
                      >
                        {expandedVersions.has(version.id) ? 
                          <ChevronDown className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" /> : 
                          <ChevronRight className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                        }
                        <span className="font-medium text-foreground truncate text-sm md:text-base">{version.name}</span>
                      </button>
                      {getSuggestionBadge(version.suggestion, version.isNewest)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="truncate">{formatDate(version.modifiedAt)}</span>
                      </div>
                      <div>{formatFileSize(version.size)}</div>
                      {index === 0 && <Badge variant="outline" className="text-xs">Latest</Badge>}
                    </div>

                    {expandedVersions.has(version.id) && (
                      <div className="mt-3 pt-3 border-t border-border animate-accordion-down">
                        <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded break-all">
                          {version.path}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-2 ml-2">
                    {!version.isNewest && (
                      <>
                        {version.suggestion === 'burn' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onBurnVersion(version.id)}
                            className="h-7 md:h-8 px-2 md:px-3 text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Burn</span>
                          </Button>
                        )}
                        {version.suggestion === 'archive' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onArchiveVersion(version.id)}
                            className="h-7 md:h-8 px-2 md:px-3 text-xs"
                          >
                            <Archive className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Archive</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onKeepVersion(version.id)}
                          className="h-7 md:h-8 px-2 md:px-3 text-xs"
                        >
                          <span className="hidden sm:inline">Keep</span>
                          <span className="sm:hidden">✓</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 gap-3">
          <div className="text-xs md:text-sm text-muted-foreground">
            Total potential savings: {formatFileSize(versions.filter(v => !v.isNewest && v.suggestion === 'burn').reduce((sum, v) => sum + v.size, 0))}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none text-sm">
              Close
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                versions.filter(v => !v.isNewest && v.suggestion === 'burn').forEach(v => onBurnVersion(v.id));
                onClose();
              }}
              disabled={versions.filter(v => !v.isNewest && v.suggestion === 'burn').length === 0}
              className="flex-1 sm:flex-none text-sm"
            >
              Burn All Suggested
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
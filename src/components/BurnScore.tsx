import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, TrendingUp, TrendingDown } from "lucide-react";

interface BurnScoreProps {
  score: number;
  filesScanned: number;
  clutterFound: number;
  onIgniteScan?: () => void;
}

export const BurnScore = ({ score, filesScanned, clutterFound, onIgniteScan }: BurnScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-flame";
    if (score >= 50) return "text-ember";
    return "text-ash";
  };

  return (
    <Card className="p-4 md:p-6 bg-gradient-to-br from-forge to-background border-iron">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <Flame className={`h-6 w-6 md:h-8 md:w-8 ${getScoreColor(score)} animate-flame-flicker`} />
          <div>
            <h3 className="text-base md:text-lg font-semibold text-foreground">Burn Score</h3>
            <p className="text-xs md:text-sm text-muted-foreground">Stack health metric</p>
          </div>
        </div>
        <div className={`text-3xl md:text-4xl font-bold ${getScoreColor(score)}`}>
          {score}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 md:gap-4 text-sm">
        <div className="text-center p-2 md:p-3 rounded-lg bg-gradient-to-br from-background/50 to-forge/30 border border-iron/50">
          <div className="text-lg md:text-2xl font-bold text-foreground">{filesScanned.toLocaleString()}</div>
          <div className="text-xs md:text-sm text-muted-foreground">Files Scanned</div>
        </div>
        <div className="text-center p-2 md:p-3 rounded-lg bg-gradient-to-br from-background/50 to-forge/30 border border-iron/50">
          <div className="text-lg md:text-2xl font-bold text-destructive">{clutterFound}</div>
          <div className="text-xs md:text-sm text-muted-foreground">Clutter Found</div>
        </div>
      </div>
      
      {onIgniteScan && (
        <div className="mt-4 pt-4 border-t border-iron/50">
          <Button 
            variant="ignite" 
            size="sm"
            onClick={onIgniteScan}
            className="w-full gap-2 text-sm"
          >
            <Flame className="h-4 w-4" />
            Run a Free Burn
          </Button>
        </div>
      )}
    </Card>
  );
};
import { Button } from "@/components/ui/button";
import { Flame, Zap } from "lucide-react";

interface MobileFloatingBarProps {
  burnScore: number;
  onIgniteScan: () => void;
  isScanning: boolean;
}

export const MobileFloatingBar = ({ burnScore, onIgniteScan, isScanning }: MobileFloatingBarProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-flame";
    if (score >= 50) return "text-ember";
    return "text-ash";
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:hidden z-50">
      <div className="bg-forge border border-iron rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className={`h-6 w-6 ${getScoreColor(burnScore)} animate-flame-flicker`} />
            <div>
              <div className={`text-xl font-bold ${getScoreColor(burnScore)}`}>{burnScore}</div>
              <div className="text-xs text-muted-foreground">Burn Score</div>
            </div>
          </div>
          
          <Button 
            variant="ignite" 
            size="lg"
            onClick={onIgniteScan}
            disabled={isScanning}
            className="gap-2 px-6"
          >
            <Zap className="h-5 w-5" />
            {isScanning ? "Hunting..." : "Ignite"}
          </Button>
        </div>
      </div>
    </div>
  );
};
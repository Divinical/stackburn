import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BurnScoreWidgetProps {
  score: number;
  maxScore?: number;
  lastChange?: number;
  onRunBurn?: () => void;
  className?: string;
}

export const BurnScoreWidget = ({
  score,
  maxScore = 100,
  lastChange = 0,
  onRunBurn,
  className
}: BurnScoreWidgetProps) => {
  const percentage = Math.round((score / maxScore) * 100);
  const isImprovement = lastChange > 0;
  const hasChange = lastChange !== 0;

  const getScoreColor = () => {
    if (score >= 80) return "text-flame";
    if (score >= 60) return "text-ember";
    if (score >= 40) return "text-forge";
    return "text-ash";
  };

  const getScoreGradient = () => {
    if (score >= 80) return "from-flame/20 to-ember/10";
    if (score >= 60) return "from-ember/20 to-forge/10";
    if (score >= 40) return "from-forge/20 to-iron/10";
    return "from-ash/20 to-muted/10";
  };

  return (
    <Card className={cn(
      "w-full max-w-[280px] bg-card border-border p-6 relative overflow-hidden",
      "hover:border-flame/30 transition-colors duration-300",
      className
    )}>
      {/* Background gradient effect */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50",
        getScoreGradient()
      )} />
      
      {/* Content */}
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-flame animate-flame-flicker" />
            <span className="text-sm font-medium text-foreground">Burn Score</span>
          </div>
          
          {hasChange && (
            <Badge 
              variant={isImprovement ? "default" : "secondary"}
              className={cn(
                "text-xs gap-1",
                isImprovement ? "bg-flame/20 text-flame border-flame/30" : "bg-ash/20 text-ash border-ash/30"
              )}
            >
              {isImprovement ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isImprovement ? '+' : ''}{lastChange}
            </Badge>
          )}
        </div>

        {/* Score Display */}
        <div className="text-center space-y-2">
          <div className={cn("text-4xl font-bold", getScoreColor())}>
            {score}
          </div>
          <div className="text-xs text-muted-foreground">
            Stack Health Score
          </div>
        </div>

        {/* Progress Ring */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            {/* Background circle */}
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${percentage * 1.76} 176`}
                className={cn(
                  "transition-all duration-500 ease-out",
                  score >= 80 ? "text-flame" : 
                  score >= 60 ? "text-ember" :
                  score >= 40 ? "text-forge" : "text-ash"
                )}
                strokeLinecap="round"
              />
            </svg>
            {/* Center percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-foreground">{percentage}%</span>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {score >= 80 && "🔥 Stack running clean"}
            {score >= 60 && score < 80 && "⚡ Minor bloat detected"}
            {score >= 40 && score < 60 && "⚠️ Clutter building up"}
            {score < 40 && "🚨 Stack needs urgent attention"}
          </p>
        </div>

        {/* CTA Button */}
        <Button 
          onClick={onRunBurn}
          className={cn(
            "w-full gap-2 text-sm font-medium",
            "bg-flame hover:bg-flame/90 text-white",
            "border-flame/30 hover:border-flame/50",
            "transition-all duration-200",
            "group"
          )}
        >
          <Flame className="w-4 h-4 group-hover:animate-flame-flicker" />
          Run a Free Burn
        </Button>

        {/* Subtle branding */}
        <div className="text-center pt-1">
          <span className="text-[10px] text-muted-foreground/60 tracking-wider">
            STACKBURN
          </span>
        </div>
      </div>
    </Card>
  );
};
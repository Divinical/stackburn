import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flame, Zap, Target, ArrowRight } from "lucide-react";
import { useState } from "react";

interface OnboardingScreenProps {
  onComplete: () => void;
  onStartScan: () => void;
}

export function OnboardingScreen({ onComplete, onStartScan }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: <Target className="h-12 w-12 text-primary" />,
      title: "You have clutter.",
      subtitle: "Hidden across your digital world",
      description: "Duplicate files, old versions, forgotten downloads. They're everywhere."
    },
    {
      icon: <Zap className="h-12 w-12 text-amber-400" />,
      title: "We find it.",
      subtitle: "AI-powered detection",
      description: "Our intelligent scanner hunts down digital waste across all your connected services."
    },
    {
      icon: <Flame className="h-12 w-12 text-destructive" />,
      title: "You burn it.",
      subtitle: "One satisfying click",
      description: "Watch your Burn Score climb as you incinerate the digital debris."
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleIgnite();
    }
  };

  const handleIgnite = () => {
    onStartScan();
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm md:max-w-md p-6 md:p-8 bg-card border-border relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-destructive/5 animate-pulse" />
        
        <div className="relative z-10">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-primary w-6' 
                    : index < currentStep 
                    ? 'bg-primary/60' 
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="text-center space-y-6 min-h-[280px] flex flex-col justify-center">
            <div className="flex justify-center">
              {steps[currentStep].icon}
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {steps[currentStep].title}
              </h1>
              <p className="text-primary font-medium">
                {steps[currentStep].subtitle}
              </p>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              {steps[currentStep].description}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-8">
            {currentStep < steps.length - 1 ? (
              <>
                <Button
                  variant="outline"
                  onClick={onComplete}
                  className="flex-1"
                >
                  Skip Intro
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleIgnite}
                size="lg"
                className="w-full bg-gradient-to-r from-destructive to-primary hover:from-destructive/90 hover:to-primary/90 text-white font-semibold py-4 text-lg relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-red-400/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                <Flame className="h-5 w-5 mr-2 relative z-10" />
                <span className="relative z-10">IGNITE FIRST BURN</span>
              </Button>
            )}
          </div>

          {/* Quick stats teaser */}
          {currentStep === steps.length - 1 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex justify-between text-sm">
                <div className="text-center">
                  <div className="font-semibold text-foreground">127GB</div>
                  <div className="text-muted-foreground">Avg. First Burn</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">2,847</div>
                  <div className="text-muted-foreground">Files Torched</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">47min</div>
                  <div className="text-muted-foreground">Time Saved</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Files, Copy, Clock, Archive } from "lucide-react";

export type ClutterType = "all" | "duplicates" | "versioned" | "stale" | "archived";

interface ClutterFiltersProps {
  activeFilter: ClutterType;
  onFilterChange: (filter: ClutterType) => void;
  counts: Record<ClutterType, number>;
}

export const ClutterFilters = ({ activeFilter, onFilterChange, counts }: ClutterFiltersProps) => {
  const filters = [
    { id: "all" as const, label: "All Clutter", icon: Flame, color: "text-flame" },
    { id: "duplicates" as const, label: "Duplicates", icon: Copy, color: "text-ember" },
    { id: "versioned" as const, label: "Versioned", icon: Files, color: "text-copper" },
    { id: "stale" as const, label: "Stale Files", icon: Clock, color: "text-ash" },
    { id: "archived" as const, label: "Old Archives", icon: Archive, color: "text-muted-foreground" }
  ];

  return (
    <div className="flex flex-wrap gap-1.5 md:gap-2 p-3 md:p-4 bg-forge border-b border-iron overflow-x-auto md:sticky md:top-0 md:z-10">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        const count = counts[filter.id] || 0;
        
        return (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            className={`flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-2 md:px-3 h-8 md:h-9 whitespace-nowrap flex-shrink-0 ${
              isActive 
                ? "bg-background text-foreground border border-iron" 
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <Icon className={`h-3 w-3 md:h-4 md:w-4 ${isActive ? filter.color : "text-current"}`} />
            <span className="hidden sm:inline">{filter.label}</span>
            <span className="sm:hidden">{filter.label.split(' ')[0]}</span>
            {count > 0 && (
              <Badge variant="secondary" className="ml-0.5 md:ml-1 h-4 md:h-5 px-1 md:px-1.5 text-xs">
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};
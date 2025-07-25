import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Integration {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  status: "connected" | "disconnected" | "scanning";
  description: string;
  filesFound?: number;
}

interface MobileIntegrationCardProps {
  integration: Integration;
  onConnect: (id: string) => void;
  onScan: (id: string) => void;
}

export const MobileIntegrationCard = ({ integration, onConnect, onScan }: MobileIntegrationCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "ember";
      case "scanning": return "flame";
      default: return "ash";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected": return "Active";
      case "scanning": return "Hunting...";
      default: return "Dormant";
    }
  };

  const Icon = integration.icon;

  return (
    <Card className="p-4 bg-forge border-iron mb-3">
      <div className="flex items-center gap-3 mb-3">
        <Icon className="h-8 w-8 text-foreground" />
        <div className="flex-1">
          <div className="font-semibold text-foreground text-lg">{integration.name}</div>
          <div className="text-sm text-muted-foreground">{integration.description}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`border-${getStatusColor(integration.status)} text-${getStatusColor(integration.status)}`}
          >
            {getStatusText(integration.status)}
          </Badge>
          {integration.filesFound && (
            <span className="text-xs text-ember">
              {integration.filesFound.toLocaleString()} files
            </span>
          )}
        </div>

        {integration.status === "disconnected" ? (
          <Button 
            variant="ember" 
            size="sm"
            onClick={() => onConnect(integration.id)}
          >
            Activate
          </Button>
        ) : integration.status === "connected" ? (
          <Button 
            variant="ignite" 
            size="sm"
            onClick={() => onScan(integration.id)}
          >
            Hunt
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled>
            Hunting...
          </Button>
        )}
      </div>
    </Card>
  );
};
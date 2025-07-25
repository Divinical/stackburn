import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, HardDrive, Cloud } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  status: "connected" | "disconnected" | "scanning";
  description: string;
  filesFound?: number;
}

interface IntegrationPanelProps {
  integrations: Integration[];
  onConnect: (integrationId: string) => void;
  onScan: (integrationId: string) => void;
}

export const IntegrationPanel = ({ integrations, onConnect, onScan }: IntegrationPanelProps) => {
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

  return (
    <Card className="p-6 bg-forge border-iron">
      <h3 className="text-xl font-bold text-foreground mb-4">Integrations</h3>
      <div className="space-y-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <div key={integration.id} className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border hover:border-iron transition-colors">
              <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-foreground" />
                <div>
                  <div className="font-semibold text-foreground">{integration.name}</div>
                  <div className="text-sm text-muted-foreground">{integration.description}</div>
                  {integration.filesFound && (
                    <div className="text-xs text-ember mt-1">
                      {integration.filesFound.toLocaleString()} files found
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={`border-${getStatusColor(integration.status)} text-${getStatusColor(integration.status)}`}
                >
                  {getStatusText(integration.status)}
                </Badge>
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
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const defaultIntegrations: Integration[] = [
  {
    id: "gdrive",
    name: "Google Drive",
    icon: Cloud,
    status: "disconnected",
    description: "Hunt documents, images, and duplicate bloat"
  },
  {
    id: "windows",
    name: "Windows Folders",
    icon: HardDrive,
    status: "disconnected", 
    description: "Expose folder bloat, skip system directories"
  },
  {
    id: "github",
    name: "GitHub Repos",
    icon: Github,
    status: "disconnected",
    description: "Purge dead repos and abandoned branches"
  }
];

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import NetworkSelector from "../NetworkSelector";
import { NetworkKey } from "@/utils/blockchainUtils";

interface SettingsPanelProps {
  userEmail: string;
  usingBlockchain: boolean;
  onToggleBlockchainMode: () => void;
  onNetworkChange: (network: NetworkKey) => void;
  onLogout: () => void;
}

export default function SettingsPanel({
  userEmail,
  usingBlockchain,
  onToggleBlockchainMode,
  onNetworkChange,
  onLogout
}: SettingsPanelProps) {
  return (
    <Card className="glass-morphism">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Your account details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Email Address</p>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
          
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Blockchain Settings</p>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Blockchain Mode</p>
                <p className="text-xs text-muted-foreground">
                  {usingBlockchain 
                    ? "Using real blockchain testnet" 
                    : "Using mock transactions"}
                </p>
              </div>
              <Button 
                variant={usingBlockchain ? "default" : "outline"} 
                onClick={onToggleBlockchainMode}
                className="button-3d"
              >
                {usingBlockchain ? "Disable" : "Enable"}
              </Button>
            </div>
            
            {usingBlockchain && (
              <div className="pt-2">
                <p className="text-sm mb-2">Network</p>
                <NetworkSelector onNetworkChange={onNetworkChange} />
              </div>
            )}
          </div>
          
          <Button 
            variant="destructive" 
            onClick={onLogout}
            className="w-full button-3d-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

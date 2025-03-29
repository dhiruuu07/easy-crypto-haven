
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";

interface ReceiveFormProps {
  walletAddress: string;
  onCopyAddress: () => void;
}

export default function ReceiveForm({ walletAddress, onCopyAddress }: ReceiveFormProps) {
  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <h3 className="font-medium">Your Wallet Address</h3>
      <div className="flex gap-2">
        <Input
          value={walletAddress}
          readOnly
          className="flex-1"
        />
        <Button onClick={onCopyAddress} variant="outline" className="button-3d">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

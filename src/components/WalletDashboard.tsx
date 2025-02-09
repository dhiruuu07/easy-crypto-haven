
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Copy, Check, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WalletDashboard() {
  const [addresses, setAddresses] = useState<{ name: string; address: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [copiedAddress, setCopiedAddress] = useState("");
  const { toast } = useToast();

  const handleAddAddress = () => {
    if (!newName || !newAddress) {
      toast({
        title: "Error",
        description: "Please fill in both name and address fields",
        variant: "destructive",
      });
      return;
    }

    setAddresses([...addresses, { name: newName, address: newAddress }]);
    setNewName("");
    setNewAddress("");
    toast({
      title: "Success",
      description: "Address added successfully",
    });
  };

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(""), 2000);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  return (
    <div className="space-y-6 animate-in">
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Add New Address
          </CardTitle>
          <CardDescription>Add a new crypto address to your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Name (e.g. My Bitcoin Wallet)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder="Crypto Address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
            <Button onClick={handleAddAddress} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle>Your Addresses</CardTitle>
          <CardDescription>Manage your saved crypto addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No addresses added yet
              </p>
            ) : (
              addresses.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-card/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{item.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.address)}
                    >
                      {copiedAddress === item.address ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground break-all">
                    {item.address}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Copy, Check, Wallet, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateTestnetUSDTAddress } from "@/utils/walletUtils";
import { supabase } from "@/integrations/supabase/client";

export default function WalletDashboard() {
  const [addresses, setAddresses] = useState<{ name: string; address: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [copiedAddress, setCopiedAddress] = useState("");
  const { toast } = useToast();

  const generateNewAddress = () => {
    const generatedAddress = generateTestnetUSDTAddress();
    setNewAddress(generatedAddress);
    toast({
      title: "Address Generated",
      description: "New USDT testnet address has been generated.",
    });
  };

  const handleAddAddress = async () => {
    if (!newName || !newAddress) {
      toast({
        title: "Error",
        description: "Please fill in both name and address fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add addresses",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('wallets')
        .insert([
          { 
            user_id: user.id,
            walletaddress: newAddress
          }
        ]);

      if (error) throw error;

      setAddresses([...addresses, { name: newName, address: newAddress }]);
      setNewName("");
      setNewAddress("");
      toast({
        title: "Success",
        description: "Address added successfully",
      });
    } catch (error) {
      console.error('Error adding address:', error);
      toast({
        title: "Error",
        description: "Failed to add address",
        variant: "destructive",
      });
    }
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
          <CardDescription>Add a new USDT testnet address to your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Name (e.g. My USDT Wallet)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                placeholder="USDT Testnet Address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={generateNewAddress}
                variant="outline"
                className="flex-shrink-0"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
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
          <CardDescription>Manage your saved USDT testnet addresses</CardDescription>
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

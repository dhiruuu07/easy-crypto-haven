
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Download, Settings, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateTestnetUSDTAddress } from "@/utils/walletUtils";
import { supabase } from "@/integrations/supabase/client";

export default function WalletDashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [copiedAddress, setCopiedAddress] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
    loadTransactions();
    loadOrCreateWallet();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || "");
    }
  };

  const loadOrCreateWallet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First try to load existing wallet
    const { data: wallets, error: fetchError } = await supabase
      .from('wallets')
      .select('walletaddress')
      .eq('user_id', user.id)
      .single();

    if (wallets) {
      setWalletAddress(wallets.walletaddress);
      return;
    }

    // If no wallet exists, create one
    const generatedAddress = generateTestnetUSDTAddress();
    const { error: insertError } = await supabase
      .from('wallets')
      .insert([
        { 
          user_id: user.id,
          walletaddress: generatedAddress
        }
      ]);

    if (insertError) {
      console.error('Error creating wallet:', insertError);
      toast({
        title: "Error",
        description: "Failed to create wallet address",
        variant: "destructive",
      });
      return;
    }

    setWalletAddress(generatedAddress);
    toast({
      title: "Wallet Created",
      description: "Your permanent USDT testnet wallet address has been created.",
    });
  };

  const loadTransactions = async () => {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      return;
    }

    setTransactions(transactions || []);
  };

  const handleTransaction = async (type: 'send' | 'receive') => {
    if (!walletAddress) {
      toast({
        title: "Error",
        description: "No wallet address available",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to perform transactions",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .insert([
          { 
            user_id: user.id,
            amount: 100, // Example amount
            recipient_address: walletAddress,
            transaction_type: type
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Transaction ${type} initiated successfully`,
      });

      loadTransactions();
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Wallet Dashboard</h1>
        <Button
          variant="outline"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {showSettings && (
        <Card className="glass-morphism">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">Email Address</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Your Wallet Address
          </CardTitle>
          <CardDescription>Your permanent USDT testnet address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="USDT Testnet Address"
                value={walletAddress}
                readOnly
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleTransaction('send')} 
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
              <Button 
                onClick={() => handleTransaction('receive')} 
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Receive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No transactions yet
              </p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-lg border bg-card/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium capitalize">
                        {tx.transaction_type}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {tx.amount} USDT
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tx.status}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground break-all">
                    Address: {tx.recipient_address}
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

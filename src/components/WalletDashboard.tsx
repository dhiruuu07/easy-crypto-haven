
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Download, Settings, Wallet, Copy, ArrowRight, LogOut, Sun, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateTestnetUSDTAddress } from "@/utils/walletUtils";
import { supabase } from "@/integrations/supabase/client";

export default function WalletDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState<number>(0);
  const [showSendForm, setShowSendForm] = useState(false);
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
    loadOrCreateWallet();
  }, []);

  // Add a separate effect for loading transactions that depends on walletAddress
  useEffect(() => {
    if (walletAddress) {
      loadTransactions();
    }
  }, [walletAddress]);

  useEffect(() => {
    // Check if user prefers dark mode
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

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
      .select('walletaddress, balance')
      .eq('user_id', user.id)
      .single();

    if (wallets) {
      setWalletAddress(wallets.walletaddress);
      setBalance(wallets.balance || 0);
      return;
    }

    // If no wallet exists, create one
    const generatedAddress = generateTestnetUSDTAddress();
    const { error: insertError } = await supabase
      .from('wallets')
      .insert([
        { 
          user_id: user.id,
          walletaddress: generatedAddress,
          balance: 100 // Initial balance for new users
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
    setBalance(100);
    toast({
      title: "Wallet Created",
      description: "Your permanent USDT testnet wallet has been created with 100 USDT.",
    });
  };

  const loadTransactions = async () => {
    if (!walletAddress) return;

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`sender_address.eq.${walletAddress},recipient_address.eq.${walletAddress}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      return;
    }

    // Process transactions to include transaction direction
    const processedTransactions = transactions?.map(tx => ({
      ...tx,
      // Add isReceived flag to determine if this wallet received the transaction
      isReceived: tx.recipient_address === walletAddress,
      // Format the display amount based on whether it was received or sent
      displayAmount: tx.recipient_address === walletAddress ? `+${tx.amount}` : `-${tx.amount}`
    })) || [];

    setTransactions(processedTransactions);
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy address",
        variant: "destructive",
      });
    }
  };

  const handleSendTransaction = async () => {
    if (!walletAddress || !recipientAddress || !sendAmount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Error",
        description: "Insufficient balance",
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

      // First, check if recipient wallet exists and get its current balance
      const { data: recipientWallet, error: recipientCheckError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('walletaddress', recipientAddress)
        .single();

      if (!recipientWallet || recipientCheckError) {
        toast({
          title: "Error",
          description: "Recipient wallet not found",
          variant: "destructive",
        });
        return;
      }

      // Create the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([
          { 
            user_id: user.id,
            amount: amount,
            recipient_address: recipientAddress,
            sender_address: walletAddress,
            transaction_type: 'send',
            status: 'completed'
          }
        ]);

      if (transactionError) throw transactionError;

      // Update sender's balance
      const { error: senderUpdateError } = await supabase
        .from('wallets')
        .update({ balance: balance - amount })
        .eq('walletaddress', walletAddress);

      if (senderUpdateError) throw senderUpdateError;

      // Update recipient's balance
      const { error: recipientUpdateError } = await supabase
        .from('wallets')
        .update({ 
          balance: recipientWallet.balance + amount 
        })
        .eq('walletaddress', recipientAddress);

      if (recipientUpdateError) throw recipientUpdateError;

      toast({
        title: "Success",
        description: "Transaction completed successfully",
      });

      // Reset form
      setShowSendForm(false);
      setRecipientAddress("");
      setSendAmount("");
      
      // Refresh data
      loadTransactions();
      loadOrCreateWallet();
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to complete transaction",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Wallet Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={toggleTheme}
            className="button-3d"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="button-3d"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {showSettings && (
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
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="w-full button-3d-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Your Wallet
          </CardTitle>
          <CardDescription>Your USDT testnet wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Current Balance</p>
                <p className="text-2xl font-bold">{balance} USDT</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setShowSendForm(true);
                  setShowReceiveForm(false);
                }}
                className="flex-1 button-3d"
                variant={showSendForm ? "secondary" : "default"}
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
              <Button 
                onClick={() => {
                  setShowReceiveForm(true);
                  setShowSendForm(false);
                }}
                className="flex-1 button-3d"
                variant={showReceiveForm ? "secondary" : "default"}
              >
                <Download className="h-4 w-4 mr-2" />
                Receive
              </Button>
            </div>

            {showReceiveForm && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium">Your Wallet Address</h3>
                <div className="flex gap-2">
                  <Input
                    value={walletAddress}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={handleCopyAddress} variant="outline" className="button-3d">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {showSendForm && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium">Send USDT</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Recipient Address</label>
                    <Input
                      placeholder="Enter recipient's wallet address"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Amount (USDT)</label>
                    <Input
                      type="number"
                      placeholder="Enter amount to send"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleSendTransaction}
                    className="w-full button-3d"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Send USDT
                  </Button>
                </div>
              </div>
            )}
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
                      <h3 className="font-medium">
                        {tx.isReceived ? 'Received' : 'Sent'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${tx.isReceived ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.displayAmount} USDT
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tx.status}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground break-all">
                    {tx.isReceived ? 'From: ' : 'To: '}
                    {tx.isReceived ? tx.sender_address : tx.recipient_address}
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

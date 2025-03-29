
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Download, Settings, Wallet, Copy, ArrowRight, LogOut, Sun, Moon, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateTestnetUSDTAddress } from "@/utils/walletUtils";
import {
  NetworkKey,
  createWalletFromPrivateKey,
  generateNewWallet,
  getWalletBalance,
  sendTransaction,
  getRecentTransactions,
  getCurrentNetwork
} from "@/utils/blockchainUtils";
import { supabase } from "@/integrations/supabase/client";
import NetworkSelector from "./NetworkSelector";

export default function WalletDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [privateKey, setPrivateKey] = useState(""); // Store private key safely
  const [balance, setBalance] = useState<number>(0);
  const [showSendForm, setShowSendForm] = useState(false);
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usingBlockchain, setUsingBlockchain] = useState(false); // Toggle between mock and real blockchain
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
    loadOrCreateWallet();
  }, []);

  // Add a separate effect for loading transactions that depends on walletAddress
  useEffect(() => {
    if (walletAddress) {
      if (usingBlockchain) {
        loadBlockchainTransactions();
      } else {
        loadMockTransactions();
      }
    }
  }, [walletAddress, usingBlockchain]);

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
      .select('walletaddress, balance, private_key')
      .eq('user_id', user.id)
      .single();

    if (wallets) {
      setWalletAddress(wallets.walletaddress);
      setBalance(wallets.balance || 0);
      if (wallets.private_key) {
        setPrivateKey(wallets.private_key);
      }
      return;
    }

    try {
      // If no wallet exists, create one
      let generatedAddress = "";
      let generatedPrivateKey = "";
      
      if (usingBlockchain) {
        // Create a real blockchain wallet
        const wallet = generateNewWallet();
        generatedAddress = wallet.address;
        generatedPrivateKey = wallet.privateKey;
      } else {
        // Create a mock wallet address
        generatedAddress = generateTestnetUSDTAddress();
        // For mock wallets, we don't need a real private key
        generatedPrivateKey = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      }

      const { error: insertError } = await supabase
        .from('wallets')
        .insert([
          { 
            user_id: user.id,
            walletaddress: generatedAddress,
            balance: 100, // Initial balance for new users
            private_key: generatedPrivateKey
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
      setPrivateKey(generatedPrivateKey);
      setBalance(100);
      toast({
        title: "Wallet Created",
        description: `Your ${usingBlockchain ? "blockchain" : "testnet"} wallet has been created with 100 ${usingBlockchain ? getCurrentNetwork().symbol : "USDT"}.`,
      });
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast({
        title: "Error",
        description: "Failed to create wallet",
        variant: "destructive",
      });
    }
  };

  const loadMockTransactions = async () => {
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

  const loadBlockchainTransactions = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      // First update the wallet balance from blockchain
      const blockchainBalance = await getWalletBalance(walletAddress);
      setBalance(parseFloat(blockchainBalance));
      
      // Then fetch recent transactions
      const txs = await getRecentTransactions(walletAddress);
      setTransactions(txs);
    } catch (error) {
      console.error('Error loading blockchain data:', error);
      toast({
        title: "Error",
        description: "Failed to load blockchain data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

    setIsLoading(true);

    try {
      if (usingBlockchain) {
        // Send a real blockchain transaction
        if (!privateKey) {
          throw new Error("Private key not found");
        }
        
        const result = await sendTransaction(privateKey, recipientAddress, sendAmount);
        
        if (!result.success) {
          throw new Error(result.error || "Transaction failed");
        }
        
        toast({
          title: "Transaction Sent",
          description: `Transaction submitted with hash: ${result.hash?.slice(0, 10)}...`,
        });
        
        // Reload blockchain data after transaction
        await loadBlockchainTransactions();
      } else {
        // Send a mock transaction
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
        
        // Refresh data
        loadMockTransactions();
        setBalance(prev => prev - amount);
      }

      // Reset form
      setShowSendForm(false);
      setRecipientAddress("");
      setSendAmount("");
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to complete transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNetworkChange = (network: NetworkKey) => {
    // Reload blockchain data when network changes
    if (usingBlockchain && walletAddress) {
      loadBlockchainTransactions();
    }
  };

  const toggleBlockchainMode = () => {
    const newMode = !usingBlockchain;
    setUsingBlockchain(newMode);
    
    toast({
      title: newMode ? "Blockchain Mode Enabled" : "Mock Mode Enabled",
      description: newMode 
        ? "You are now using actual blockchain testnet. Transactions will be real." 
        : "You are now using mock transactions in the Supabase database.",
    });
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

  const getExplorerUrl = (txHash: string) => {
    const network = getCurrentNetwork();
    return `${network.blockExplorer}/tx/${txHash}`;
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
                    onClick={toggleBlockchainMode}
                    className="button-3d"
                  >
                    {usingBlockchain ? "Disable" : "Enable"}
                  </Button>
                </div>
                
                {usingBlockchain && (
                  <div className="pt-2">
                    <p className="text-sm mb-2">Network</p>
                    <NetworkSelector onNetworkChange={handleNetworkChange} />
                  </div>
                )}
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
            {usingBlockchain && (
              <NetworkSelector onNetworkChange={handleNetworkChange} />
            )}
          </CardTitle>
          <CardDescription>
            {usingBlockchain 
              ? `Your ${getCurrentNetwork().name} wallet` 
              : "Your USDT testnet wallet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Current Balance</p>
                <p className="text-2xl font-bold">
                  {isLoading ? "Loading..." : `${balance} ${usingBlockchain ? getCurrentNetwork().symbol : "USDT"}`}
                </p>
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                <h3 className="font-medium">Send {usingBlockchain ? getCurrentNetwork().symbol : "USDT"}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Recipient Address</label>
                    <Input
                      placeholder="Enter recipient's wallet address"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Amount ({usingBlockchain ? getCurrentNetwork().symbol : "USDT"})</label>
                    <Input
                      type="number"
                      placeholder="Enter amount to send"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    onClick={handleSendTransaction}
                    className="w-full button-3d"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Send {usingBlockchain ? getCurrentNetwork().symbol : "USDT"}
                      </>
                    )}
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
            {isLoading ? (
              <div className="flex justify-center p-4">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No transactions yet
              </p>
            ) : (
              transactions.map((tx, index) => (
                <div
                  key={tx.id || tx.hash || index}
                  className="p-4 rounded-lg border bg-card/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">
                        {tx.isReceived ? 'Received' : 'Sent'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {tx.created_at 
                          ? new Date(tx.created_at).toLocaleString() 
                          : tx.timestamp 
                            ? new Date(tx.timestamp).toLocaleString()
                            : 'Unknown date'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${tx.isReceived ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.displayAmount} {usingBlockchain ? getCurrentNetwork().symbol : "USDT"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tx.status || 'completed'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground break-all">
                    {tx.isReceived ? 'From: ' : 'To: '}
                    {tx.isReceived 
                      ? tx.sender_address || tx.from 
                      : tx.recipient_address || tx.to}
                  </p>
                  
                  {usingBlockchain && tx.hash && (
                    <div className="pt-1">
                      <a 
                        href={getExplorerUrl(tx.hash)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center hover:underline"
                      >
                        View on Explorer
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

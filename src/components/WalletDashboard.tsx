
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateTestnetUSDTAddress } from "@/utils/walletUtils";
import {
  NetworkKey,
  generateNewWallet,
  getWalletBalance,
  sendTransaction,
  getRecentTransactions,
  getCurrentNetwork
} from "@/utils/blockchainUtils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Moon, Settings, Sun } from "lucide-react";

// Import refactored components
import WalletInfo from "./wallet/WalletInfo";
import SendForm from "./wallet/SendForm";
import ReceiveForm from "./wallet/ReceiveForm";
import TransactionList from "./wallet/TransactionList";
import SettingsPanel from "./wallet/SettingsPanel";

export default function WalletDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [privateKey, setPrivateKey] = useState(""); 
  const [balance, setBalance] = useState<number>(0);
  const [showSendForm, setShowSendForm] = useState(false);
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usingBlockchain, setUsingBlockchain] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
    loadOrCreateWallet();
  }, []);

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

    if (fetchError) {
      console.error('Error fetching wallet:', fetchError);
      
      // If error is not 'no rows returned', handle it differently
      if (!fetchError.message.includes('no rows returned')) {
        toast({
          title: "Error",
          description: "Failed to load wallet data",
          variant: "destructive",
        });
        return;
      }
      
      // Continue to wallet creation if no wallet exists
    } else if (wallets) {
      // Successfully retrieved wallet
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

  const handleSendTransaction = async (recipientAddress: string, sendAmount: string) => {
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
        <SettingsPanel 
          userEmail={userEmail}
          usingBlockchain={usingBlockchain}
          onToggleBlockchainMode={toggleBlockchainMode}
          onNetworkChange={handleNetworkChange}
          onLogout={handleLogout}
        />
      )}

      <WalletInfo
        balance={balance}
        walletAddress={walletAddress}
        isLoading={isLoading}
        usingBlockchain={usingBlockchain}
        onNetworkChange={handleNetworkChange}
        onShowSendForm={() => {
          setShowSendForm(true);
          setShowReceiveForm(false);
        }}
        onShowReceiveForm={() => {
          setShowReceiveForm(true);
          setShowSendForm(false);
        }}
        showSendForm={showSendForm}
        showReceiveForm={showReceiveForm}
      />

      {showReceiveForm && (
        <ReceiveForm 
          walletAddress={walletAddress}
          onCopyAddress={handleCopyAddress}
        />
      )}

      {showSendForm && (
        <SendForm
          usingBlockchain={usingBlockchain}
          isLoading={isLoading}
          onSendTransaction={handleSendTransaction}
        />
      )}

      <TransactionList 
        transactions={transactions}
        isLoading={isLoading}
        usingBlockchain={usingBlockchain}
      />
    </div>
  );
}


import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { getCurrentNetwork } from "@/utils/blockchainUtils";
import { useToast } from "@/hooks/use-toast";

interface SendFormProps {
  usingBlockchain: boolean;
  isLoading: boolean;
  onSendTransaction: (recipientAddress: string, amount: string) => void;
}

export default function SendForm({ usingBlockchain, isLoading, onSendTransaction }: SendFormProps) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [errors, setErrors] = useState<{address?: string; amount?: string}>({});
  const { toast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: {address?: string; amount?: string} = {};
    
    // Validate address
    if (!recipientAddress) {
      newErrors.address = "Recipient address is required";
    } else if (usingBlockchain && !recipientAddress.startsWith('0x')) {
      newErrors.address = "Invalid blockchain address format";
    }
    
    // Validate amount
    if (!sendAmount) {
      newErrors.amount = "Amount is required";
    } else {
      const amount = parseFloat(sendAmount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = "Amount must be a positive number";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = () => {
    if (validateForm()) {
      try {
        onSendTransaction(recipientAddress, sendAmount);
      } catch (error) {
        console.error("Transaction submission error:", error);
        toast({
          title: "Transaction Error",
          description: "Failed to submit transaction",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <h3 className="font-medium">Send {usingBlockchain ? getCurrentNetwork().symbol : "USDT"}</h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Recipient Address</label>
          <Input
            placeholder={usingBlockchain ? "Enter 0x... blockchain address" : "Enter recipient's wallet address"}
            value={recipientAddress}
            onChange={(e) => {
              setRecipientAddress(e.target.value);
              if (errors.address) setErrors({...errors, address: undefined});
            }}
            disabled={isLoading}
            className={errors.address ? "border-red-500" : ""}
          />
          {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Amount ({usingBlockchain ? getCurrentNetwork().symbol : "USDT"})</label>
          <Input
            type="number"
            placeholder="Enter amount to send"
            value={sendAmount}
            onChange={(e) => {
              setSendAmount(e.target.value);
              if (errors.amount) setErrors({...errors, amount: undefined});
            }}
            disabled={isLoading}
            className={errors.amount ? "border-red-500" : ""}
          />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
        </div>
        <Button 
          onClick={handleSend}
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
  );
}

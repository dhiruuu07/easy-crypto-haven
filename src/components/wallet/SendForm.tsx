
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { getCurrentNetwork } from "@/utils/blockchainUtils";

interface SendFormProps {
  usingBlockchain: boolean;
  isLoading: boolean;
  onSendTransaction: (recipientAddress: string, amount: string) => void;
}

export default function SendForm({ usingBlockchain, isLoading, onSendTransaction }: SendFormProps) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");

  const handleSend = () => {
    onSendTransaction(recipientAddress, sendAmount);
    // Let parent component handle clearing form fields after successful transaction
  };

  return (
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

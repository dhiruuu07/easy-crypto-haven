
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Send, Download } from "lucide-react";
import NetworkSelector from "../NetworkSelector";
import { NetworkKey, getCurrentNetwork } from "@/utils/blockchainUtils";

interface WalletInfoProps {
  balance: number;
  walletAddress: string;
  isLoading: boolean;
  usingBlockchain: boolean;
  onNetworkChange: (network: NetworkKey) => void;
  onShowSendForm: () => void;
  onShowReceiveForm: () => void;
  showSendForm: boolean;
  showReceiveForm: boolean;
}

export default function WalletInfo({
  balance,
  walletAddress,
  isLoading,
  usingBlockchain,
  onNetworkChange,
  onShowSendForm,
  onShowReceiveForm,
  showSendForm,
  showReceiveForm
}: WalletInfoProps) {
  return (
    <Card className="glass-morphism">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Your Wallet
          {usingBlockchain && (
            <NetworkSelector onNetworkChange={onNetworkChange} />
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
              onClick={onShowSendForm}
              className="flex-1 button-3d"
              variant={showSendForm ? "secondary" : "default"}
              disabled={isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
            <Button 
              onClick={onShowReceiveForm}
              className="flex-1 button-3d"
              variant={showReceiveForm ? "secondary" : "default"}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Receive
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { getCurrentNetwork } from "@/utils/blockchainUtils";
import { Button } from "@/components/ui/button";

interface Transaction {
  id?: string | number;
  hash?: string;
  from?: string;
  to?: string;
  sender_address?: string;
  recipient_address?: string;
  amount?: number;
  value?: string;
  displayAmount?: string;
  isReceived?: boolean;
  status?: string;
  created_at?: string;
  timestamp?: string | number;
}

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  usingBlockchain: boolean;
}

export default function TransactionList({ transactions, isLoading, usingBlockchain }: TransactionListProps) {
  const getExplorerUrl = (txHash: string) => {
    const network = getCurrentNetwork();
    return `${network.blockExplorer}/tx/${txHash}`;
  };

  return (
    <Card className="glass-morphism">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          {usingBlockchain 
            ? `Your ${getCurrentNetwork().name} transaction history. Click on "View on Explorer" to see details on the blockchain.` 
            : "Your transaction history"}
        </CardDescription>
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
                          ? new Date(typeof tx.timestamp === 'number' ? tx.timestamp * 1000 : new Date(tx.timestamp).getTime()).toLocaleString()
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(getExplorerUrl(tx.hash!), '_blank')}
                      className="text-xs text-primary flex items-center hover:bg-primary/10 w-full justify-center"
                    >
                      View on {getCurrentNetwork().name} Explorer
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

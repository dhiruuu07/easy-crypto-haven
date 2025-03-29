
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NetworkKey, getAvailableNetworks, getCurrentNetwork, setNetwork } from '@/utils/blockchainUtils';

interface NetworkSelectorProps {
  onNetworkChange?: (network: NetworkKey) => void;
}

export default function NetworkSelector({ onNetworkChange }: NetworkSelectorProps) {
  const networks = getAvailableNetworks();
  const [currentNetwork, setCurrentNetwork] = useState(getCurrentNetwork());

  const handleNetworkChange = (networkKey: NetworkKey) => {
    const network = setNetwork(networkKey);
    setCurrentNetwork(network);
    if (onNetworkChange) {
      onNetworkChange(networkKey);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          {currentNetwork.name}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(networks) as NetworkKey[]).map((key) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleNetworkChange(key)}
            className="flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {networks[key].name}
            {currentNetwork.name === networks[key].name && (
              <Check className="h-4 w-4 ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

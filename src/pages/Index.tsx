
import { useState } from "react";
import AuthForm from "@/components/AuthForm";
import WalletDashboard from "@/components/WalletDashboard";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen w-full bg-[#1a1a1a] p-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 text-[#007bff]">
            PD's Crypto Wallet
          </h1>
          <p className="text-gray-400">
            Your secure gateway to cryptocurrency management
          </p>
        </header>

        <main className="page-transition">
          {!isAuthenticated ? (
            <AuthForm
              mode={authMode}
              onToggleMode={() =>
                setAuthMode(authMode === "signin" ? "signup" : "signin")
              }
            />
          ) : (
            <WalletDashboard />
          )}
        </main>
      </div>
    </div>
  );
}

export default Index;

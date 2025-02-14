
import { useState, useEffect } from "react";
import AuthForm from "@/components/AuthForm";
import WalletDashboard from "@/components/WalletDashboard";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        toast({
          title: "Session Error",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
      }
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'TOKEN_REFRESHED') {
        console.log('Token was refreshed successfully');
      }
      if (_event === 'SIGNED_OUT') {
        // Clear any user data from state
        setSession(null);
        toast({
          title: "Signed Out",
          description: "You have been signed out successfully.",
        });
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  // Handle session refresh errors
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error refreshing session:', error);
          setSession(null);
          toast({
            title: "Session Expired",
            description: "Please sign in again to continue.",
            variant: "destructive",
          });
        } else {
          setSession(data.session);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [toast]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 text-[#0EA5E9] dark:text-[#38BDF8]">
            Test Wallet
          </h1>
          <p className="text-muted-foreground">
            Your secure gateway to cryptocurrency management
          </p>
        </header>

        <main className="page-transition">
          {!session ? (
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
};

export default Index;


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Loader2 } from "lucide-react";

interface AuthFormProps {
  mode: "signin" | "signup";
  onToggleMode: () => void;
}

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement actual auth logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: mode === "signin" ? "Welcome back!" : "Account created successfully!",
        description: "You are now logged in.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-[#222222] border-none shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-medium text-center text-[#007bff]">
          {mode === "signin" ? "Sign In" : "Sign Up"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Enter Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-[#333333] border-[#007bff] text-white placeholder:text-gray-400 focus:ring-[#007bff] focus:border-[#007bff]"
                required
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Enter Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 bg-[#333333] border-[#007bff] text-white placeholder:text-gray-400 focus:ring-[#007bff] focus:border-[#007bff]"
                required
              />
            </div>
          </div>
          <div className="space-y-4">
            <Button 
              className="w-full h-12 bg-[#007bff] hover:bg-[#0056b3] text-white text-lg transform transition-transform duration-200 active:scale-95 shadow-lg hover:shadow-xl"
              type="submit" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </Button>
            <button
              type="button"
              onClick={onToggleMode}
              className="w-full h-12 bg-[#007bff] hover:bg-[#0056b3] text-white text-lg transform transition-transform duration-200 active:scale-95 shadow-lg hover:shadow-xl rounded-md"
            >
              {mode === "signin"
                ? "Sign Up"
                : "Sign In"}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

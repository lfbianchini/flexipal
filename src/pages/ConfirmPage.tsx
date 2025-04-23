import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token = searchParams.get("token");
        const type = searchParams.get("type");
        const email = searchParams.get("email");

        if (!token) {
          setError("No confirmation token found");
          setStatus("error");
          return;
        }

        if (type !== "signup" && type !== "invite") {
          setError("Invalid confirmation type");
          setStatus("error");
          return;
        }

        // Verify the user's email with the token
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token: token,
          type: type,
          email: email,
        });

        if (verifyError) {
          throw verifyError;
        }

        setStatus("success");
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Failed to verify email");
        setStatus("error");
      }
    };

    confirmEmail();
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-70px)] p-4 bg-gradient-to-br from-[#fbed96] via-[#E5DEFF] to-[#abecd6] animate-fade-in">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border-2 border-white p-8 flex flex-col items-center gap-6">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-usfgreen/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-usfgreen animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-usfgreen">Verifying Email</h1>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-usfgreen/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-usfgreen" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-usfgreen">Email Verified!</h1>
              <p className="text-gray-600">Your email has been successfully verified.</p>
              <p className="text-sm text-gray-500">Welcome to FlexiPal!</p>
            </div>
            <Button 
              onClick={() => navigate("/")}
              className="bg-usfgreen hover:bg-usfgreen-light text-white shadow-sm transition-all active:bg-usfgreen/90"
            >
              <Home size={18} /> 
              Continue to Home
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-red-600">Verification Failed</h1>
              <p className="text-gray-600">{error || "Something went wrong during verification."}</p>
              <p className="text-sm text-gray-500">Please try again or contact support if the problem persists.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => navigate("/")}
                className="w-full bg-usfgreen hover:bg-usfgreen-light text-white shadow-sm transition-all active:bg-usfgreen/90"
              >
                Back to Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 
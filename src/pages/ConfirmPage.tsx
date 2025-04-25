import { useState, useRef, KeyboardEvent, ClipboardEvent, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function ConfirmPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"input" | "loading" | "success" | "error">("input");
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle");
  const [resendError, setResendError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastScrollPosition = useRef(0);

  useEffect(() => {
    // Countdown timer for resend cooldown
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        const newValue = Math.max(0, prev - 1);
        if (newValue === 0) {
          // Clear resend status when cooldown ends
          setResendStatus("idle");
          setResendError(null);
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleResendCode = async () => {
    try {
      const email = searchParams.get("email");
      if (!email) {
        throw new Error("Email address not found");
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) throw error;

      // Set cooldown to 60 seconds
      setResendCooldown(60);
      setResendStatus("success");
      setResendError(null);
    } catch (err: any) {
      setResendStatus("error");
      setResendError(err.message || "Failed to resend code");
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all digits are filled, try to verify
    if (index === 5 && value && !newCode.includes("")) {
      verifyCode(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleContinue = () => {
    navigate("/");
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    // Only proceed if pasted content is 6 digits
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split("");
    setCode(digits);
    
    // Focus last input
    inputRefs.current[5]?.focus();
    
    // Verify the code
    verifyCode(pastedData);
  };

  const verifyCode = async (verificationCode: string) => {
    try {
      setStatus("loading");
      const email = searchParams.get("email");

      if (!email) {
        throw new Error("Email address not found");
      }

      // Verify the user's email with the code
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token: verificationCode,
        type: "signup",
        email: email
      });

      if (verifyError) {
        throw verifyError;
      }

      setStatus("success");
      refreshProfile();
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Failed to verify email");
      setStatus("error");
      // Clear the code on error
      setCode(Array(6).fill(""));
      // Focus first input
      inputRefs.current[0]?.focus();
    }
  };

  const handleInputFocus = () => {
    // Save current scroll position when keyboard appears
    if (window.innerWidth < 1024) { // Only on mobile/tablet
      lastScrollPosition.current = window.scrollY;
    }
  };

  const handleInputBlur = () => {
    // Scroll to top when keyboard is dismissed on mobile
    if (window.innerWidth < 1024) { // Only on mobile/tablet
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#fbed96] via-[#E5DEFF] to-[#abecd6] overflow-hidden">
      <div className="h-full flex flex-col items-center justify-start md:justify-center p-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border-2 border-white p-8 flex flex-col items-center gap-6 mt-8 md:mt-0">
          {status === "input" && (
            <>
              <div className="w-16 h-16 bg-usfgreen/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-usfgreen" />
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-usfgreen">Enter Verification Code</h1>
                <p className="text-gray-600">Please enter the 6-digit code sent to your email.</p>
                <p className="text-sm text-gray-500">{searchParams.get("email")}</p>
              </div>
              <div className="flex gap-2 justify-center my-4">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={code[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="w-12 h-14 text-center text-xl font-semibold border-2 rounded-lg focus:border-usfgreen focus:outline-none transition-colors bg-white/50"
                    autoFocus={index === 0}
                    style={{ fontSize: '16px' }}
                  />
                ))}
              </div>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  className={`text-sm ${
                    resendCooldown > 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-usfgreen hover:underline"
                  }`}
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Didn't receive the code? Resend"}
                </button>
                {resendStatus === "success" && (
                  <p className="text-sm text-usfgreen flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    New code sent to your email
                  </p>
                )}
                {resendStatus === "error" && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {resendError}
                  </p>
                )}
              </div>
            </>
          )}

          {status === "loading" && (
            <>
              <div className="w-16 h-16 bg-usfgreen/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-usfgreen animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-usfgreen">Verifying Code</h1>
                <p className="text-gray-600">Please wait while we verify your code...</p>
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
                onClick={handleContinue}
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
                <p className="text-gray-600">{error || "Invalid verification code. Please try again."}</p>
              </div>
              <div className="flex gap-2 justify-center my-4">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={code[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="w-12 h-14 text-center text-xl font-semibold border-2 rounded-lg focus:border-usfgreen focus:outline-none transition-colors bg-white/50 border-red-200"
                    autoFocus={index === 0}
                    style={{ fontSize: '16px' }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 
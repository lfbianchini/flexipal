import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AuthModalProps {
  open: boolean;
  mode: "signin" | "signup";
  onClose: () => void;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@dons\.usfca\.edu$/;

export default function AuthModal({ open, mode, onClose }: AuthModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setSignupSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSignupSuccess(false);

    if (!EMAIL_REGEX.test(email)) {
      setError("Only @dons.usfca.edu emails are allowed.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await signUp(email, password, name);
        
        if (error) {
          setError(error.message);
          return;
        }

        if (!data?.user) {
          setError("Failed to create account. Please try again.");
          return;
        }

        setSignupSuccess(true);
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          window.location.reload();
          handleClose();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {mode === "signup" && signupSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle>Check Your Email</DialogTitle>
              <DialogDescription>
                We've sent you a verification link
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-6 space-y-4">
              <div className="w-16 h-16 bg-usfgreen/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-usfgreen" />
              </div>
              <div className="text-center space-y-3">
                <p className="text-gray-600">
                  We've sent a verification email to:
                </p>
                <p className="font-medium text-gray-900">{email}</p>
                <p className="text-sm text-gray-500">
                  Click the link in the email to verify your account. After verification, you can log in to access all features.
                </p>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                onClick={() => setSignupSuccess(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign Up
              </Button>
              <Button
                className="w-full bg-usfgreen hover:bg-usfgreen-light active:bg-usfgreen/90 text-white transition-colors"
                onClick={handleClose}
              >
                Got It
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{mode === "signup" ? "Sign Up" : "Sign In"}</DialogTitle>
              <DialogDescription>
                {mode === "signup" ? "Create a new account with your USFCA email." : "Sign in to your account."}
              </DialogDescription>
            </DialogHeader>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              {mode === "signup" && (
                <Input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full Name"
                  required
                />
              )}
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email (@dons.usfca.edu)"
                required
              />
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
              />
              <DialogFooter>
                <div className="flex flex-col-reverse sm:flex-row w-full gap-2">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full bg-usfgreen hover:bg-usfgreen-light active:bg-usfgreen/90 text-white transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? "Loading..." : mode === "signup" ? "Sign Up" : "Sign In"}
                  </Button>
                  <DialogClose asChild>
                    <Button 
                      type="button" 
                      variant="outline"
                      className="w-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                </div>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

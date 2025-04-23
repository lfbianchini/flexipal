import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function NotVerified() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-5">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="bg-yellow-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-usfgreen">Verify Your Email</h1>
        <p className="text-gray-600">
          We've sent a verification email to <span className="font-medium">{user?.email}</span>.
          Please check your inbox and click the verification link to access all features.
        </p>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or sign out and try again.
          </p>
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
} 
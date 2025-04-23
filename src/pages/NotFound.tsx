import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-70px)] p-4 bg-gradient-to-br from-[#fbed96] via-[#E5DEFF] to-[#abecd6] animate-fade-in">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border-2 border-white p-8 flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-usfgold/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-usfgold" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-usfgreen">404</h1>
          <h2 className="text-2xl font-semibold text-usfgreen">Page Not Found</h2>
          <p className="text-gray-600 mt-2">Oops! The page you're looking for doesn't exist.</p>
        </div>
        <Button 
          onClick={() => navigate("/")}
          className="bg-usfgreen hover:bg-usfgreen-light text-white shadow-sm transition-all active:bg-usfgreen/90 flex items-center gap-2"
        >
          <Home size={18} />
          Back to Home
        </Button>
      </div>
    </div>
  );
}

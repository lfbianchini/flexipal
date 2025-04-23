import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useVendorStatus } from "@/hooks/useVendorStatus";
import { Switch } from "@/components/ui/switch";
import { MapPin, Play, StopCircle, Clock, Sparkles } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const LOCATIONS = [
  "undercaf",
  "market café (uppercaf)",
  "lomo caf",
];

const VendorDashboard = () => {
  const { status, loading, goLive, goOffline } = useVendorStatus();
  const [location, setLocation] = useState<string>(LOCATIONS[0]);
  const [note, setNote] = useState("");
  const [endTime, setEndTime] = useState("1 hour");

  useEffect(() => {
    if (status?.is_live) {
      setLocation(status.location || LOCATIONS[0]);
      setNote(status.note || "");
    }
  }, [status]);

  const handleGoLive = async () => {
    const endTimeDate = new Date();
    let hours = 1;
    
    if (endTime === "30 minutes") hours = 0.5;
    if (endTime === "2 hours") hours = 2;
    if (endTime === "3 hours") hours = 3;
    
    endTimeDate.setHours(endTimeDate.getHours() + hours);

    const { error } = await goLive(location, note || null, endTimeDate);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to go live. Please try again.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "You're now live!",
      description: `Vending at ${location} until ${endTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    });

    window.location.reload();
  };

  const handleStopVending = async () => {
    const { error } = await goOffline();
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to stop vending. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setNote("");
    toast({
      title: "Stopped vending",
      description: "You are no longer visible to users",
    });

    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usfgreen"></div>
      </div>
    );
  }

  const isLive = status?.is_live || false;
  const endTimeDisplay = status?.end_time 
    ? new Date(status.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex flex-col items-center p-5 w-full max-w-xl mx-auto animate-fade-in">
      {/* Header Section */}
      <div className="text-center space-y-2 mb-6 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-usfgreen inline-flex items-center gap-2 justify-center">
          <MapPin className="h-6 w-6" />
          Vendor Dashboard
          <Sparkles className="h-5 w-5 text-usfgold" />
        </h2>
        <p className="text-gray-600">Manage your vending status and location</p>
      </div>

      <div className="w-full bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white p-6 flex flex-col gap-6 group transition-all hover:shadow-md animate-fade-in-up" style={{ animationDelay: "150ms" }}>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-usfgreen mb-1 flex items-center gap-2 group-hover:text-usfgreen-light transition-colors">
            <MapPin className="h-4 w-4 text-usfgold" /> Location
          </label>
          <Select
            value={location}
            onValueChange={setLocation}
            disabled={isLive}
          >
            <SelectTrigger className="w-full rounded-lg border-white/20 bg-white/95 shadow-sm transition-all hover:border-white/40">
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent className="!bg-white !backdrop-blur-none shadow-lg border border-white/20">
              {LOCATIONS.map(loc => (
                <SelectItem 
                  className="hover:bg-gray-100/80 transition-colors" 
                  key={loc} 
                  value={loc}
                >
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-usfgreen mb-1 flex items-center gap-2 group-hover:text-usfgreen-light transition-colors">
            <Clock className="h-4 w-4 text-usfgold" /> Available Until
          </label>
          <Select
            value={endTime}
            onValueChange={setEndTime}
            disabled={isLive}
          >
            <SelectTrigger className="w-full rounded-lg border-white/20 bg-white/95 shadow-sm transition-all hover:border-white/40">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent className="!bg-white !backdrop-blur-none shadow-lg border border-white/20">
              <SelectItem className="hover:bg-gray-100/80 transition-colors" value="30 minutes">30 minutes</SelectItem>
              <SelectItem className="hover:bg-gray-100/80 transition-colors" value="1 hour">1 hour</SelectItem>
              <SelectItem className="hover:bg-gray-100/80 transition-colors" value="2 hours">2 hours</SelectItem>
              <SelectItem className="hover:bg-gray-100/80 transition-colors" value="3 hours">3 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-usfgreen mb-1 flex items-center gap-2 group-hover:text-usfgreen-light transition-colors">
            Optional Note
          </label>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. 'No sushi available today'"
            className="rounded-lg border-white/20 bg-white/95 focus:ring-2 focus:ring-usfgold transition-all hover:border-white/40 shadow-sm"
            maxLength={60}
            disabled={isLive}
          />
        </div>
        
        {isLive ? (
          <Button 
            onClick={handleStopVending}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white shadow-sm transition-all active:bg-red-500/90"
          >
            <StopCircle className="h-5 w-5" /> Stop Vending
          </Button>
        ) : (
          <Button 
            onClick={handleGoLive}
            className="w-full flex items-center justify-center gap-2 bg-usfgreen hover:bg-usfgreen-light text-white shadow-sm transition-all active:bg-usfgreen/90"
          >
            <Play className="h-5 w-5" /> Go Live
          </Button>
        )}
        
        {isLive && endTimeDisplay && (
          <div className="mt-2 text-center animate-fade-in">
            <span className="px-4 py-2 rounded-full bg-white/80 text-usfgreen font-semibold text-sm inline-flex items-center gap-2 shadow-sm border border-white">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              LIVE until {endTimeDisplay}
            </span>
          </div>
        )}

        {isLive && status?.note && (
          <div className="mt-2 text-center text-gray-600 bg-white/80 rounded-lg p-3 border border-white/50 animate-fade-in">
            {status.note}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import VendorCard from "../components/VendorCard";
import EmptyState from "../components/EmptyState";
import { useVendors } from "@/hooks/useVendors";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Search, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LOCATIONS = [
  "undercafé",
  "market café (upper café)",
  "lomo café",
  "misc. location"
];

const FindVendor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [results, setResults] = useState<ReturnType<typeof useVendors>['vendors'] | null>(null);
  const { loading, getVendorsByLocation } = useVendors();
  const { startConversation } = useChat();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = getVendorsByLocation(location);
    setResults(found);
  };

  const handleChatClick = async (vendorId: string) => {
    const conversationId = await startConversation(vendorId);
    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    }
  };

  const formatTimeWindow = (endTime: string | null) => {
    if (!endTime) return "No end time specified";
    const end = new Date(endTime);
    const now = new Date();
    return `Until ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatName = (fullName: string | undefined) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return `${parts[0]} ${parts[1]?.[0] || ''}`;
  };

  return (
    <div className="flex flex-col items-center p-5 w-full max-w-2xl mx-auto animate-fade-in">
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-usfgreen inline-flex items-center gap-2 justify-center">
            <MapPin className="h-6 w-6" />
            Find a Vendor
            <Sparkles className="h-5 w-5 text-usfgold" />
          </h2>
          <p className="text-gray-600">Discover available vendors across campus</p>
        </div>

        {/* Search Form */}
        <form
          className="w-full flex flex-col md:flex-row gap-3 bg-white/50 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white animate-fade-in-up"
          onSubmit={handleSearch}
        >
          <Select
            value={location}
            onValueChange={setLocation}
          >
            <SelectTrigger className="w-full rounded-lg border-white/20 bg-white/95">
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent className="!bg-white !backdrop-blur-none shadow-lg border border-white/20">
              {LOCATIONS.map(loc => (
                <SelectItem className="hover:bg-gray-200/80" key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="submit"
            className="rounded-lg bg-usfgreen px-5 py-2.5 text-white font-semibold transition hover:bg-usfgreen-light active:bg-usfgreen/90 flex items-center justify-center gap-2 min-w-[120px] shadow-sm"
            disabled={loading}
          >
            <Search className="h-4 w-4" />
            {loading ? "Loading..." : "Search"}
          </button>
        </form>

        {/* Results Section */}
        <div className="space-y-4">
          {results === null ? (
            <div className="text-center py-8 animate-fade-in">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white shadow-sm">
                <MapPin className="h-8 w-8 text-usfgold mx-auto mb-3 opacity-80" />
                <p className="text-gray-600">Choose a location and search for vendors!</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-32 animate-fade-in">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usfgreen"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="animate-fade-in">
              <EmptyState />
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {results.map((vendor, index) => (
                <div
                  key={vendor.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <VendorCard
                    name={formatName(vendor.profiles?.full_name)}
                    location={vendor.location}
                    note={vendor.note || ''}
                    window={formatTimeWindow(vendor.end_time)}
                    img={vendor.profiles?.avatar_url || ''}
                    live={vendor.is_live}
                    userId={vendor.user_id}
                    currentUserId={user?.id}
                    onChatClick={() => handleChatClick(vendor.user_id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindVendor;

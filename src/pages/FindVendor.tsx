import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VendorCard from "../components/VendorCard";
import EmptyState from "../components/EmptyState";
import { useVendors } from "@/hooks/useVendors";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Search, Sparkles, Loader2 } from "lucide-react";
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
  const { profile } = useAuth();
  const [location, setLocation] = useState(LOCATIONS[0]);
  const { loading, getVendorsByLocation, filteredVendors } = useVendors();
  const [lastSearchedLocation, setLastSearchedLocation] = useState<string | null>(null);
  const { startConversation } = useChat();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initial search when component mounts
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const searchLocation = location;
    await getVendorsByLocation(searchLocation);
    console.log("filteredVendors", filteredVendors);
    console.log("loading", loading);
    setLastSearchedLocation(searchLocation);
    setIsInitialLoad(false);
  };

  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
  };

  const handleChatClick = async (hashedId: string) => {
    const conversationId = await startConversation(hashedId);
    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    }
  };

  const formatTimeWindow = (endTime: string | null) => {
    if (!endTime) return "No end time specified";
    const end = new Date(endTime);
    return `Until ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatName = (fullName: string | undefined) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return `${parts[0]} ${parts[1]?.[0] || ''}`;
  };

  const renderContent = () => {
    if (loading || isInitialLoad) {
      return (
        <div className="flex flex-col items-center justify-center h-32 animate-fade-in gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-usfgreen" />
          <p className="text-gray-600">Searching for vendors...</p>
        </div>
      );
    }
    console.log("filteredVendors", filteredVendors);
    console.log("loading", loading);
    if (filteredVendors.length === 0 && !loading && lastSearchedLocation) {
      return (
        <div className="animate-fade-in">
          <EmptyState location={lastSearchedLocation || location} />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 w-full">
        {filteredVendors.map((vendor, index) => (
          <div
            key={vendor.hashed_id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <VendorCard
              name={formatName(vendor.profile?.full_name)}
              location={vendor.location}
              note={vendor.note || ''}
              window={formatTimeWindow(vendor.end_time)}
              img={vendor.profile?.avatar_url || ''}
              live={vendor.is_live}
              userId={vendor.hashed_id}
              currentUserId={profile?.id}
              onChatClick={() => handleChatClick(vendor.hashed_id)}
            />
          </div>
        ))}
      </div>
    );
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
          <div className="flex-1">
            <Select
              value={location}
              onValueChange={handleLocationChange}
              disabled={loading}
            >
              <SelectTrigger className={`w-full rounded-lg border-white/20 bg-white/95 ${loading ? 'opacity-75' : ''}`}>
                <SelectValue placeholder="Select a location">
                  <div className="flex items-center gap-2">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {location}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="!bg-white !backdrop-blur-none shadow-lg border border-white/20">
                {LOCATIONS.map(loc => (
                  <SelectItem className="hover:bg-gray-200/80" key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-usfgreen px-5 py-2.5 text-white font-semibold transition hover:bg-usfgreen-light active:bg-usfgreen/90 flex items-center justify-center gap-2 min-w-[120px] shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search
              </>
            )}
          </button>
        </form>

        {/* Results Section */}
        <div className="space-y-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FindVendor;

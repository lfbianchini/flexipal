import { MapPin, Clock, MessageCircle } from "lucide-react";

export type VendorCardProps = {
  name: string;
  location: string;
  note: string;
  window: string;
  img: string;
  live: boolean;
  userId: string;
  currentUserId?: string;
  onChatClick?: () => void;
};

const VendorCard = ({
  name,
  location,
  note,
  window,
  img,
  live,
  userId,
  currentUserId,
  onChatClick
}: VendorCardProps) => {
  const isOwnProfile = currentUserId === userId;

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 flex gap-4 border border-white shadow-sm hover:shadow-md transition-all group">
      <div className="relative">
        <img
          src={img || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`}
          alt={name}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm group-hover:ring-usfgold transition-all"
        />
        {live && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold break-words max-w-full text-usfgreen group-hover:text-usfgreen-light transition-colors">{name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <MapPin size={14} className="text-usfgold" /> 
              <span className="group-hover:text-gray-700 transition-colors">{location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} className="text-usfgold" /> 
              <span className="group-hover:text-gray-700 transition-colors">{window}</span>
            </div>
          </div>
          <button
            onClick={onChatClick}
            disabled={isOwnProfile}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              isOwnProfile 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                : "bg-white text-usfgreen hover:bg-usfgreen hover:text-white active:bg-usfgreen/90 shadow-sm"
            }`}
            title={isOwnProfile ? "You cannot chat with yourself" : "Start chat"}
          >
            <MessageCircle size={16} />
            <span>Chat</span>
          </button>
        </div>
        {note && (
          <div className="mt-2 max-w-full break-words text-sm whitespace-pre-wrap overflow-x-hidden text-gray-600 bg-white/80 rounded-lg p-2 border border-white/50 group-hover:border-white transition-all overflow-hidden">
            {note}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorCard;


import { MapPin } from "lucide-react";

const EmptyState = ({ location }: { location: string }) => (
  <div className="flex flex-col items-center justify-center py-12 bg-graybg rounded-xl">
    <MapPin size={40} className="text-usfgold mb-3" />
    <span className="text-gray-500 font-medium text-base">No vendors live right now at {location}. Try again soon!</span>
  </div>
);

export default EmptyState;

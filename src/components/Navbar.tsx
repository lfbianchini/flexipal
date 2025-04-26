import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, User, Users, MessageCircle, MapPin, Menu, MessagesSquare } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVendorStatus } from "@/hooks/useVendorStatus";
import AuthModal from "./AuthModal";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/**
 * Limit the display length of a name for navbar display.
 * @param name The full name string.
 * @param maxLen The max number of characters to keep.
 */
const truncateName = (name: string, maxLen = 18) => {
  if (!name) return "";
  return name.length > maxLen ? name.slice(0, maxLen).trim() + "…" : name;
};

const navItems = [
  { name: "Find Vendor", path: "/find", icon: MapPin, requireAuth: true },
  { name: "Vendor Dashboard", path: "/dashboard", icon: User, requireAuth: true },
  { name: "Community", path: "/community", icon: MessagesSquare, requireAuth: true },
  { name: "Chat", path: "/chat", icon: MessageCircle, requireAuth: true },
];

const LiveIndicator = () => (
  <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">
    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
    <span>Live</span>
  </div>
);

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModal, setAuthModal] = useState<null | "signin" | "signup">(null);
  const { user, profile, signOut } = useAuth();
  const { status } = useVendorStatus();
  const navRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileOpen]);

  // Only show nav items that are permitted for the auth status
  const filteredNavItems = navItems.filter(
    item => !item.requireAuth || user
  );

  // Always show Home when not logged in, otherwise filtered items
  const visibleNavItems = !user ? navItems.filter(item => item.name === "home") : filteredNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <nav ref={navRef} className="w-full bg-white shadow-card rounded-b-xl px-4 py-2 lg:py-3 lg:px-8 flex items-center z-30 relative">
      <span className="text-usfgreen font-bold text-xl tracking-tight select-none pr-4 lg:pr-8 flex-shrink-0">
        <Link to="/" className="hover:opacity-80 transition" onClick={() => setMobileOpen(false)}>
          <span className="text-usfgreen">Flexi</span>
          <span className="text-usfgold">Pal</span>
        </Link>
      </span>
      <button
        className="ml-auto inline-flex lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
        onClick={() => setMobileOpen((val) => !val)}
        aria-label="Toggle menu"
      >
        <Menu size={22} className="text-usfgreen" />
      </button>
      {/* Center nav items horizontally on desktop */}
      <div className="hidden lg:flex flex-1 items-center justify-center space-x-4 min-w-0">
        {visibleNavItems.map(({ name, path, icon: Icon }) => (
          <Link
            key={name}
            to={path}
            className={`flex items-center px-2.5 py-1.5 rounded-lg text-sm font-medium gap-1.5 transition hover:bg-gray-100 hover:text-usfgreen whitespace-nowrap ${
              pathname === path
                ? "bg-usfgreen text-white shadow"
                : "text-usfgreen"
            }`}
          >
            <Icon size={18} className={pathname === path ? "text-white" : "text-usfgreen"} />
            <span className="inline">{name}</span>
            {name === "Vendor Dashboard" && status?.is_live && <LiveIndicator />}
          </Link>
        ))}
      </div>
      <div className="hidden lg:flex items-center gap-2 ml-4 flex-shrink-0">
        {user === undefined ? (
          // Loading state
          <div className="flex items-center gap-2">
            <div className="w-[160px] h-9 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : !user ? (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setAuthModal("signin")}
              className="hover:bg-gray-100 active:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Sign In
            </Button>
            <Button 
              variant="default"
              onClick={() => setAuthModal("signup")}
              className="bg-usfgreen hover:bg-usfgreen-light active:bg-usfgreen/90 text-white transition-colors whitespace-nowrap"
            >
              Sign Up
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <Avatar className="flex-shrink-0">
                <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                {!profile?.avatar_url && (
                  <div className="absolute inset-0 bg-gray-200 rounded-full animate-pulse" />
                )}
              </Avatar>
            </div>
            {profile?.full_name ? (
              <Link
                to="/profile"
                className="max-w-[100px] truncate block text-usfgreen font-semibold hover:text-usfgreen-light transition"
                title={profile?.full_name}
                onClick={() => setMobileOpen(false)}
              >
                {truncateName(profile?.full_name, 12)}
              </Link>
            ) : (
              <div className="w-[80px] h-5 bg-gray-200 rounded animate-pulse" />
            )}
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="hover:bg-gray-100 active:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Logout
            </Button>
          </div>
        )}
      </div>
      {mobileOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-t border-graydivider shadow-card z-20 flex flex-col items-stretch animate-fade-in lg:hidden">
          {visibleNavItems.map(({ name, path, icon: Icon }) => (
            <Link
              key={name}
              to={path}
              className={`flex items-center px-4 py-3 border-b last:border-b-0 text-base font-medium gap-2 transition hover:bg-gray-100 hover:text-usfgreen ${
                pathname === path
                  ? "bg-usfgreen text-white shadow"
                  : "text-usfgreen"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={20} className={pathname === path ? "text-white" : "text-usfgreen"} />
              <span>{name}</span>
              {name === "Vendor Dashboard" && status?.is_live && <LiveIndicator />}
            </Link>
          ))}
          {user === undefined ? (
            // Loading state for mobile
            <div className="flex items-center gap-2 p-4">
              <div className="w-full h-9 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : !user ? (
            <div className="flex gap-2 p-4">
              <Button 
                variant="outline" 
                onClick={() => { setAuthModal("signin"); setMobileOpen(false); }}
                className="hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                Sign In
              </Button>
              <Button 
                variant="default"
                onClick={() => { setAuthModal("signup"); setMobileOpen(false); }}
                className="bg-usfgreen hover:bg-usfgreen-light active:bg-usfgreen/90 text-white transition-colors"
              >
                Sign Up
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4">
              <div className="relative flex-shrink-0">
                <Avatar>
                  <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                  {!profile?.avatar_url && (
                    <div className="absolute inset-0 bg-gray-200 rounded-full animate-pulse" />
                  )}
                </Avatar>
              </div>
              {profile?.full_name ? (
                <Link
                  to="/profile"
                  className="max-w-[130px] truncate block text-usfgreen font-semibold hover:text-usfgreen-light transition"
                  title={profile?.full_name}
                  onClick={() => setMobileOpen(false)}
                >
                  {truncateName(profile?.full_name)}
                </Link>
              ) : (
                <div className="w-[100px] h-5 bg-gray-200 rounded animate-pulse" />
              )}
              <Button 
                variant="outline" 
                onClick={() => { handleSignOut(); setMobileOpen(false); }}
                className="hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      )}
      <AuthModal open={!!authModal} mode={authModal ?? "signin"} onClose={() => setAuthModal(null)} />
    </nav>
  );
};

export default Navbar;
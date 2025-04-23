import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { User, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        // Upload the file
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, selectedFile, {
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        avatarUrl = publicUrl;
      }

      // Update profile with new name and/or avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      handleCancelPreview();
    } catch (error) {
        console.log(error)
    } finally {
      setSaving(false);
      window.location.reload();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
  };

  const handleCancelPreview = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
    setSelectedFile(null);
  };

  const hasChanges = fullName !== profile?.full_name || selectedFile !== null;

  return (
    <div className="flex flex-col items-center p-5 w-full max-w-xl mx-auto animate-fade-in">
      <h2 className="text-xl font-bold mb-4 text-usfgreen text-center animate-fade-in-up">Profile Settings</h2>
      <div className="w-full bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white p-6 flex flex-col gap-6 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-usfgold overflow-hidden bg-white/80 shadow-sm">
              {previewImage ? (
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || "Profile"} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/80">
                  <User size={40} className="text-gray-400" />
                </div>
              )}
            </div>
            <label 
              htmlFor="avatar-upload" 
              className="absolute bottom-0 right-0 p-2 bg-usfgreen text-white rounded-full cursor-pointer hover:bg-usfgreen-light transition shadow-md"
            >
              <Camera size={16} />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={saving}
            />
          </div>
          {previewImage && (
            <Button
              onClick={handleCancelPreview}
              variant="outline"
              className="text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              Cancel Image
            </Button>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-usfgreen mb-1 flex items-center gap-2">
            Full Name
          </label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className="rounded-lg border-white/20 bg-white/95 shadow-sm transition-all hover:border-white/40"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-usfgreen mb-1">
            Email
          </label>
          <Input
            value={user?.email || ""}
            disabled
            className="rounded-lg border-white/20 bg-white/80 text-gray-500"
          />
          <p className="text-xs text-gray-500">Email cannot be changed</p>
        </div>

        <Button 
          onClick={handleUpdateProfile}
          disabled={saving || !hasChanges}
          className="w-full bg-usfgreen hover:bg-usfgreen-light text-white shadow-sm transition-all active:bg-usfgreen/90"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
} 
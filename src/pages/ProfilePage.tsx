import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { User, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const MAX_NAME_LENGTH = 30;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateName = (name: string) => {
    if (name.length > MAX_NAME_LENGTH) {
      return false;
    }
    // Only allow letters, spaces, and basic punctuation
    return /^[a-zA-Z\s\-'.]+$/.test(name);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFullName(newName);
    setError(null);
    
    if (newName && !validateName(newName)) {
      setError("Name can only contain letters, spaces, hyphens, and apostrophes");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    if (!validateName(fullName)) {
      setError("Please enter a valid name");
      return;
    }
    
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
          full_name: fullName.trim(),
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      handleCancelPreview();
    } catch (error) {
      console.error(error);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
      window.location.reload();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setError(null);

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }
    
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
  };

  const handleCancelPreview = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
    setSelectedFile(null);
    setError(null);
  };

  const hasChanges = fullName !== profile?.full_name || selectedFile !== null;
  const isNameValid = !fullName || validateName(fullName);

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
              accept={ALLOWED_IMAGE_TYPES.join(',')}
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
            <span className="text-xs font-normal text-gray-500">({MAX_NAME_LENGTH} chars max)</span>
          </label>
          <Input
            value={fullName}
            onChange={handleNameChange}
            placeholder="Enter your full name"
            maxLength={MAX_NAME_LENGTH}
            className={`rounded-lg border-white/20 bg-white/95 shadow-sm transition-all hover:border-white/40 ${
              !isNameValid ? 'border-red-300' : ''
            }`}
          />
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
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
          disabled={saving || !hasChanges || !isNameValid}
          className="w-full bg-usfgreen hover:bg-usfgreen-light text-white shadow-sm transition-all active:bg-usfgreen/90 disabled:bg-gray-300"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
} 
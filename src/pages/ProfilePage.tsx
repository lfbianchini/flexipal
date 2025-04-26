import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { User, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from 'browser-image-compression';

const MAX_NAME_LENGTH = 30;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateName = (name: string) => /^[a-zA-Z\s\-'.]+$/.test(name) && name.length <= MAX_NAME_LENGTH;

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const updates: any = {
        full_name: fullName
      };

      // Handle file upload
      if (selectedFile) {
        try {
          // Compress and resize the image before uploading
          const compressedFile = await imageCompression(selectedFile, {
            maxWidthOrHeight: 512,
            maxSizeMB: 0.3,
            useWebWorker: true,
            fileType: 'image/jpeg'
          });

          // Upload to temp folder first
          const tempFileName = `temp/${Date.now()}-${compressedFile.name.replace(/\.[^/.]+$/, "")}.jpg`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(tempFileName, compressedFile, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) throw uploadError;

          // Add the temp file path to the updates
          updates.temp_avatar_path = tempFileName;
        } catch (error) {
          console.error('Upload error:', error);
          throw new Error('Failed to upload image');
        }
      }

      // Call edge function to handle the profile update and image move
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to update profile');
      }

      await refreshProfile();
      handleCancelPreview();
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
      window.location.reload();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, or WebP)");
      return;
    }

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
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
              ) : profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || "Profile"} className="w-full h-full object-cover" />
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
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
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

import { useState, useMemo } from 'react';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CommunityPostCard from '@/components/CommunityPostCard';

const ROLES = ["Buyer", "Vendor"] as const;

export default function CommunityPage() {
  const navigate = useNavigate();
  const { posts, loading, createPost, deletePost } = useCommunityPosts();
  const { user } = useAuth();
  const { startConversation } = useChat();
  const [formData, setFormData] = useState({
    role: 'Buyer' as 'Buyer' | 'Vendor',
    title: '',
    details: '',
    availabilityWindow: '',
    contactInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createPost(
        formData.role,
        formData.title,
        formData.details,
        formData.availabilityWindow || undefined,
        formData.contactInfo || undefined
      );
      // Reset form and refresh page
      setFormData({
        role: 'Buyer',
        title: '',
        details: '',
        availabilityWindow: '',
        contactInfo: ''
      });
      navigate(0);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (isDeleting) return; // Prevent multiple clicks
        setIsDeleting(true);
        try {
        const success = await deletePost(postId);
        if (success) {
            navigate(0); // Refresh the page after successful deletion
        }
        } catch (error) {
        console.error('Error deleting post:', error);
        } finally {
        setIsDeleting(false);
        }
  };

  const handleChatClick = async (userId: string) => {
    const conversationId = await startConversation(userId);
    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    }
  };

  // Memoize the post cards to prevent unnecessary re-renders
  const postCards = useMemo(() => (
    posts.map(post => (
      <CommunityPostCard
        key={post.id}
        post={post}
        currentUserId={user?.id}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        onChatClick={handleChatClick}
      />
    ))
  ), [posts, user?.id, isDeleting, handleDelete, handleChatClick]);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="text-usfgold" size={28} />
        <h1 className="text-2xl font-bold text-usfgreen">Community Board</h1>
      </div>

      {/* Create Post Form */}
      <form onSubmit={handleSubmit} className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-usfgreen mb-4">Create a Post</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <Select
                value={formData.role}
                onValueChange={(value: 'Buyer' | 'Vendor') => setFormData(prev => ({ ...prev, role: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full rounded-lg border-white/20 bg-white/95">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="!bg-white !backdrop-blur-none shadow-lg border border-white/20">
                  {ROLES.map(role => (
                    <SelectItem className="hover:bg-gray-200/80" key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                maxLength={80}
                placeholder="Short description of what you're looking for"
                className="w-full px-3 py-2 rounded-lg border border-white/50 bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-usfgold transition-all hover:border-white shadow-sm disabled:opacity-50"
                required
                disabled={isSubmitting}
              />
              <div className="mt-1 text-xs text-gray-500">
                {formData.title.length}/80 characters
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details *</label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
              maxLength={500}
              rows={3}
              placeholder="Provide more details about your request or offer"
              className="w-full px-3 py-2 rounded-lg border border-white/50 bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-usfgold transition-all hover:border-white shadow-sm resize-none disabled:opacity-50"
              required
              disabled={isSubmitting}
            />
            <div className="mt-1 text-xs text-gray-500">
              {formData.details.length}/500 characters
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Availability Window</label>
              <input
                type="text"
                value={formData.availabilityWindow}
                onChange={(e) => setFormData(prev => ({ ...prev, availabilityWindow: e.target.value.slice(0, 100) }))}
                placeholder="e.g., M-F afternoons"
                maxLength={100}
                className="w-full px-3 py-2 rounded-lg border border-white/50 bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-usfgold transition-all hover:border-white shadow-sm disabled:opacity-50"
                disabled={isSubmitting}
              />
              <div className="mt-1 text-xs text-gray-500">
                {formData.availabilityWindow.length}/100 characters
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
              <input
                type="text"
                value={formData.contactInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value.slice(0, 100) }))}
                placeholder="e.g., IG: @username"
                maxLength={100}
                className="w-full px-3 py-2 rounded-lg border border-white/50 bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-usfgold transition-all hover:border-white shadow-sm disabled:opacity-50"
                disabled={isSubmitting}
              />
              <div className="mt-1 text-xs text-gray-500">
                {formData.contactInfo.length}/100 characters
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto md:self-end px-6 py-2.5 bg-usfgreen text-white rounded-lg font-medium hover:bg-usfgreen/90 focus:outline-none focus:ring-2 focus:ring-usfgold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            ) : (
              'Post to Community'
            )}
          </button>
        </div>
      </form>

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-usfgreen" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-xl border border-white shadow-sm">
            <MessageCircle className="w-12 h-12 mx-auto text-usfgold opacity-80 mb-3" />
            <h3 className="text-lg font-semibold text-usfgreen mb-1">No Posts Yet</h3>
            <p className="text-gray-500">Be the first to post in the community!</p>
          </div>
        ) : postCards}
      </div>
    </div>
  );
} 
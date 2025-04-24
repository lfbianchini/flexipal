import { Loader2, Trash2, Clock, Mail, MessageCircle, Check } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { useState } from 'react';

type CommunityPost = Database['public']['Tables']['community_posts']['Row'] & {
  profile: {
    full_name: string;
    avatar_url: string;
  } | null;
};

type CommunityPostCardProps = {
  post: CommunityPost;
  currentUserId?: string;
  onDelete: (postId: string) => void;
  isDeleting: boolean;
  onChatClick?: (userId: string) => void;
};

export default function CommunityPostCard({ post, currentUserId, onDelete, isDeleting, onChatClick }: CommunityPostCardProps) {
  const isOwnProfile = currentUserId === post.user_id;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete(post.id);
    } else {
      setShowDeleteConfirm(true);
      // Auto-reset after 3 seconds if not confirmed
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white shadow-sm hover:shadow-md transition-all group">
      <div className="flex gap-4">
        <div className="relative flex-shrink-0">
          <img
            src={post.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profile?.full_name || 'User')}&background=ABECD6&color=155D31`}
            alt={post.profile?.full_name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm group-hover:ring-usfgold transition-all"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-usfgreen group-hover:text-usfgreen-light transition-colors break-all overflow-wrap-anywhere max-w-[calc(100%-4rem)]">
                  {post.profile?.full_name}
                </h3>
                <span className={`inline-flex flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
                  post.role === 'Buyer' ? 'bg-usfgold/20 text-usfgreen' : 'bg-usfgreen/10 text-usfgreen'
                }`}>
                  {post.role}
                </span>
              </div>
              <p className="text-gray-900 font-medium mt-0.5 break-all overflow-wrap-anywhere">{post.title}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onChatClick?.(post.user_id)}
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
              {currentUserId === post.user_id && (
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className={`p-1.5 rounded-lg transition-all disabled:opacity-50 ${
                    showDeleteConfirm 
                      ? "text-red-500 bg-red-50 hover:bg-red-100" 
                      : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                  }`}
                  title={showDeleteConfirm ? "Click again to confirm delete" : "Delete post"}
                >
                  {isDeleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : showDeleteConfirm ? (
                    <Check size={16} className="animate-pulse" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 text-gray-600 whitespace-pre-wrap break-words bg-white/80 rounded-lg p-2 border border-white/50 group-hover:border-white transition-all">
            {post.details}
          </div>
          {(post.availability_window || post.contact_info) && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {post.availability_window && (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Clock size={14} className="text-usfgold flex-shrink-0" />
                  <span className="break-words">{post.availability_window}</span>
                </div>
              )}
              {post.contact_info && (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Mail size={14} className="text-usfgold flex-shrink-0" />
                  <span className="break-words">{post.contact_info}</span>
                </div>
              )}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-400">
            {new Date(post.created_at || '').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 
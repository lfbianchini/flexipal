import { useState, useRef, useEffect } from "react";
import { MessageCircle, Image as ImageIcon, Send, Loader2 } from "lucide-react";
import { useChat, Message } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    conversations, 
    messages,
    setMessages,
    loading,
    loadMessages,
    sendMessage 
  } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(true);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
    }
  };

  // Handle loading timeout
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setShowLoadingSpinner(false);
      }, 5000);
      return () => clearTimeout(timeout);
    } else {
      setShowLoadingSpinner(true);
    }
  }, [loading]);

  // Scroll to bottom when messages change or when loading completes
  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [messages, loading]);

  // Load messages and setup subscription
  useEffect(() => {
    if (!conversationId) return;
    
    loadMessages(conversationId);
   
    const messageSubscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [conversationId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !selectedFile || !conversationId) return;

    await sendMessage(conversationId, messageInput, selectedFile || undefined);
    setMessageInput("");
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="w-full flex flex-col md:flex-row max-w-4xl mx-auto bg-white/50 backdrop-blur-sm rounded-t-2xl md:rounded-xl shadow-sm hover:shadow-md transition-all border border-white mt-2 md:mt-8 animate-fade-in min-h-[440px] overflow-hidden">
      {/* Chat list */}
      <aside className="bg-white/90 md:w-80 w-full md:min-h-[440px] border-r border-white flex-shrink-0 flex flex-col shadow-[1px_0_0_0_rgba(255,255,255,0.8)] md:mr-[1px]">
        <div className="py-3 px-4 border-b border-white sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
          <h2 className="font-semibold text-base md:text-lg text-usfgreen flex gap-2 items-center">
            <MessageCircle size={20} className="inline-block text-usfgold" /> Chats
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[44vh] md:max-h-[450px] pb-2 bg-gradient-to-b from-white/50 to-transparent">
          <div className="flex flex-col gap-1.5 p-2">
            {loading && showLoadingSpinner && !conversations.length ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 text-usfgreen animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-500 p-8 text-center bg-white/80 rounded-xl border border-white shadow-sm">
                <MessageCircle size={32} className="text-usfgold mb-3 opacity-80" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">Start chatting with vendors to see them here</p>
              </div>
            ) : (
              conversations.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className={`flex items-center gap-3 px-4 py-2.5 transition rounded-xl border hover:shadow-sm ${
                    conversationId === chat.id
                      ? "bg-white border-usfgold shadow-sm"
                      : "border-white/40 hover:bg-white/90 hover:border-white"
                  }`}
                >
                  <img 
                    src={chat.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.profile?.full_name || 'User')}`} 
                    alt={chat.profile?.full_name} 
                    className={`w-10 h-10 rounded-full object-cover flex-shrink-0 transition shadow-sm ${
                      conversationId === chat.id
                        ? "ring-2 ring-usfgold"
                        : "ring-1 ring-white/50"
                    }`}
                  />
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-usfgreen text-sm truncate font-medium group-hover:text-usfgreen-light transition-colors">
                      {chat.profile?.full_name?.length > 22
                        ? chat.profile?.full_name?.slice(0, 20) + "…"
                        : chat.profile?.full_name
                      }
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-[120px]">
                      {chat.last_message || "No messages yet"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Chat conversation or welcome screen */}
      <section className="flex-1 min-w-0 min-h-[300px] flex flex-col bg-gradient-to-br from-white/80 via-white/60 to-white/70 relative">
        {conversationId ? (
          <>
            {/* Chat header (mobile only) */}
            <div className="flex md:hidden items-center gap-3 border-b border-white px-4 py-3 sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm mb-[1px]">
              {(() => {
                const chat = conversations.find(c => c.id === conversationId);
                return (
                  <>
                    <img 
                      src={chat?.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat?.profile?.full_name || 'User')}`}
                      className="w-9 h-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                      alt={chat?.profile?.full_name}
                    />
                    <div className="bg-white/80 px-3 py-1.5 rounded-lg border border-white/50">
                      <div className="font-semibold text-usfgreen text-sm">{chat?.profile?.full_name}</div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Messages scroll area */}
            <div className="px-2 py-3 md:px-6 md:py-6 flex flex-col overflow-x-hidden gap-3 flex-1 w-full max-w-full overflow-y-auto max-h-[44vh] md:max-h-[450px] min-h-[250px] md:min-h-[300px] relative">
              {loading && showLoadingSpinner ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 text-usfgreen animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 py-6 text-sm rounded-xl mt-4 bg-white/90 border border-white shadow-sm">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-usfgold opacity-80" />
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`
                        max-w-[86%] md:max-w-[80%]
                        break-words animate-fade-in
                        ${msg.sender_id === user?.id
                          ? "self-end bg-usfgreen/90 text-white ml-10 md:ml-32 hover:bg-usfgreen transition-colors shadow-md"
                          : "self-start bg-white text-usfgreen border border-white mr-10 md:mr-32 hover:border-white transition-all shadow-sm"
                        }
                        px-4 py-2 rounded-[1.5rem] text-sm mb-1
                        flex flex-col
                        relative
                      `}
                    >
                      {msg.content && (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                      {msg.image_url && (
                        <img 
                          src={msg.image_url} 
                          alt="Shared image" 
                          className="mt-2 rounded-lg max-w-full h-auto max-h-40 object-contain border border-white shadow-sm"
                        />
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Send bar */}
            <form onSubmit={handleSendMessage} className="px-2 md:px-6 pt-3 md:pt-4 pb-4 bg-white backdrop-blur-sm border-t border-white shadow-[0_-1px_2px_0_rgba(255,255,255,0.5)] mt-[1px]">
              <div className="flex gap-2.5">
                <input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 px-4 py-2 rounded-xl border border-white bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-usfgold transition-all hover:border-white/40 shadow-sm"
                  maxLength={1000}
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() && !selectedFile}
                  className="p-2 text-usfgreen disabled:text-gray-300 hover:bg-white/90 rounded-lg transition flex-shrink-0 disabled:hover:bg-transparent border border-white/20 hover:border-white disabled:border-transparent"
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : conversations.length > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center">
            <div className="bg-white/90 rounded-2xl border border-white p-8 shadow-sm hover:shadow-md transition-all">
              <MessageCircle size={44} className="text-usfgold mb-3 opacity-80" />
              <h3 className="text-lg font-semibold text-usfgreen mb-2">Your Messages</h3>
              <p className="text-gray-500 text-sm max-w-sm">
                Select a conversation from the list to start chatting
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center">
            <div className="bg-white/90 rounded-2xl border border-white p-8 shadow-sm hover:shadow-md transition-all">
              <MessageCircle size={44} className="text-usfgold mb-3 opacity-80" />
              <h3 className="text-lg font-semibold text-usfgreen mb-2">No Messages Yet</h3>
              <p className="text-gray-500 text-sm max-w-sm">
                Your conversations will appear here once you start chatting with vendors
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

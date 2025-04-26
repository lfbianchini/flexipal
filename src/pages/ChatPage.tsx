import { useState, useRef, useEffect } from "react";
import { MessageCircle, Image as ImageIcon, Send, Loader2 } from "lucide-react";
import { useChat, Message } from "@/hooks/useChat";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { 
    hour: 'numeric',
    minute: 'numeric',
    hour12: true 
  }).toLowerCase();
};

const formatLastMessageTime = (dateString: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    // Today, show time
    return formatMessageTime(dateString);
  } else if (diffInDays === 1) {
    // Yesterday
    return 'yesterday';
  } else if (diffInDays < 7) {
    // Within a week, show day name
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  } else {
    // More than a week ago, show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();
  }
};

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { 
    conversations, 
    messages,
    setMessages,
    loading,
    loadMessages,
    sendMessage,
    currentUserHashedId,
    setConversations
  } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(true);
  const subscriptionRef = useRef<any>(null);
  const previousConversationId = useRef<string | undefined>(conversationId);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollPosition = useRef(0);
  const [isSending, setIsSending] = useState(false);

  // Scroll to top when component mounts or conversationId changes
  useEffect(() => {
    scrollToBottom();
  }, [conversationId]);

  // Remove initial load effect since we'll handle scrolling in polling
  useEffect(() => {
    if (conversationId && isInitialLoad) {
      loadMessages(conversationId);
      setIsInitialLoad(false);
    }
  }, [conversationId, loadMessages, isInitialLoad]);

  // Reset messages when switching conversations
  useEffect(() => {
    if (!isInitialLoad) {
      if (conversationId) {
        if (conversationId !== previousConversationId.current) {
          setMessages([]);
          loadMessages(conversationId);
        }
      } else {
        setMessages([]); // Clear messages when no conversation is selected
      }
      previousConversationId.current = conversationId;
    }
  }, [conversationId, setMessages, loadMessages, isInitialLoad]);

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

  // Load messages and setup polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    async function pollMessages() {
      if (!conversationId) return;

      try {
        const { data: messages, error } = await supabase.functions.invoke('get-messages', {
          body: { conversation_id: conversationId }
        });

        if (!error && messages?.data) {
          setMessages(messages.data);

          // Update last message in conversations list
          const lastMessage = messages.data[messages.data.length - 1];
          if (lastMessage) {
            setConversations(prevConversations => 
              prevConversations.map(conv => 
                conv.id === conversationId
                  ? {
                      ...conv,
                      last_message: lastMessage.content,
                      last_message_at: lastMessage.created_at
                    }
                  : conv
              )
            );
          }
          console.log("isInitialLoad", isInitialLoad);
          // Scroll to bottom on first load only
          if (isInitialLoad) {
            setTimeout(() => {
              scrollToBottom();
              setIsInitialLoad(false);
            }, 500);
          }
        }
      } catch (err) {
        console.error('Error polling messages:', err);
      }
    }

    if (conversationId) {
      // Initial load
      pollMessages();

      // Setup polling every 1.5 seconds
      pollInterval = setInterval(pollMessages, 1500);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [conversationId, setConversations, isInitialLoad]);

  // Reset isInitialLoad when conversation changes
  useEffect(() => {
    setIsInitialLoad(true);
  }, [conversationId]);

  // Save scroll position when keyboard appears
  useEffect(() => {
    const handleFocus = () => {
      setIsKeyboardVisible(true);
      if (messagesContainerRef.current) {
        lastScrollPosition.current = messagesContainerRef.current.scrollTop;
      }
    };

    // Restore scroll position when keyboard hides
    const handleBlur = () => {
      setIsKeyboardVisible(false);
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = lastScrollPosition.current;
        }
      }, 100);
    };

    const input = document.querySelector('input[type="text"]');
    input?.addEventListener('focus', handleFocus);
    input?.addEventListener('blur', handleBlur);

    return () => {
      input?.removeEventListener('focus', handleFocus);
      input?.removeEventListener('blur', handleBlur);
    };
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const messagesContainer = messagesEndRef.current.parentElement;
      if (messagesContainer) {
        messagesContainer.scrollTo({
          top: messagesContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  };

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
    if (!messageInput.trim() && !selectedFile || !conversationId || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(conversationId, messageInput, selectedFile || undefined);
      setMessageInput("");
      setSelectedFile(null);
      setPreviewUrl(null);
    } finally {
      setIsSending(false);
    }
  };
  return (
    <div className="w-full flex flex-col md:flex-row max-w-4xl mx-auto bg-white/50 backdrop-blur-sm rounded-t-2xl md:rounded-xl shadow-sm hover:shadow-md transition-all border border-white mt-0 md:mt-4 animate-fade-in h-[calc(90dvh)] md:h-[550px] overflow-hidden">
      {/* Chat list - Hide on mobile when conversation is selected */}
      <aside className={`bg-white/90 md:w-80 w-full h-full border-r border-white flex-shrink-0 flex flex-col shadow-[1px_0_0_0_rgba(255,255,255,0.8)] md:mr-[1px] overflow-hidden ${
        conversationId ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="py-2 px-4 border-b border-white/20 sticky top-0 z-10 bg-white shadow-[0_4px_15px_-3px_rgba(0,0,0,0.05)] backdrop-blur-sm">
          <h2 className="font-semibold text-base md:text-lg text-usfgreen flex gap-2 items-center">
            <MessageCircle size={20} className="inline-block text-usfgold" /> Chats
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain pb-2 bg-gradient-to-b from-white/50 to-transparent">
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
                    src={chat.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.profile?.full_name || 'User')}&background=ABECD6&color=155D31`} 
                    alt={chat.profile?.full_name} 
                    className={`w-10 h-10 rounded-full object-cover flex-shrink-0 transition shadow-sm ${
                      conversationId === chat.id
                        ? "ring-2 ring-usfgold"
                        : "ring-1 ring-white/50"
                    }`}
                  />
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <div className="text-usfgreen text-sm truncate font-medium group-hover:text-usfgreen-light transition-colors">
                        {chat.profile?.full_name?.length > 22
                          ? chat.profile?.full_name?.slice(0, 20) + "…"
                          : chat.profile?.full_name
                        }
                      </div>
                      <div className="text-[10px] text-gray-400 whitespace-nowrap">
                        {formatLastMessageTime(chat.last_message_at)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-[180px]">
                      {chat.last_message || "No messages yet"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="h-1 bg-gradient-to-b from-white/50 to-transparent md:hidden"></div>
      </aside>

      {/* Chat conversation or welcome screen - Show on mobile when conversation is selected */}
      <section className={`flex-1 min-w-0 flex flex-col bg-gradient-to-br from-white/80 via-white/60 to-white/70 relative h-full overflow-hidden ${
        conversationId ? 'flex' : 'hidden md:flex'
      }`}>
        {conversationId ? (
          <>
            {/* Chat header (mobile only) */}
            <div className="flex-shrink-0 flex md:hidden items-center gap-3 border-b border-white/20 px-4 py-2 sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.05)]">
              <button 
                onClick={() => navigate('/chat')} 
                className="p-1 hover:bg-white/80 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-usfgreen" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {(() => {
                const chat = conversations.find(c => c.id === conversationId);
                return (
                  <>
                    <img 
                      src={chat?.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat?.profile?.full_name || 'User')}&background=ABECD6&color=155D31`}
                      className="w-9 h-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                      alt={chat?.profile?.full_name}
                    />
                    <div className="bg-white/80 px-3 py-1.5 rounded-lg border border-white/50 shadow-sm">
                      <div className="font-semibold text-usfgreen text-sm">{chat?.profile?.full_name}</div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Messages scroll area */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 min-h-0 px-2 py-3 md:px-6 md:py-6 flex flex-col overflow-x-hidden gap-3 overflow-y-auto overscroll-contain"
            >
              {loading && showLoadingSpinner ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 text-usfgreen animate-spin" />
                </div>
              ) : !messages || messages.length === 0 ? (
                <div className="text-center text-gray-400 py-6 text-sm rounded-xl mt-4 bg-white/90 border border-white shadow-sm">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-usfgold opacity-80" />
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <>
                  <div className="flex-1" /> {/* Spacer to push messages down */}
                  {Array.isArray(messages) && messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`
                        max-w-[86%] md:max-w-[80%]
                        break-words animate-fade-in
                        ${msg.hashed_sender_id === currentUserHashedId
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
                      <span className={`text-[10px] mt-1 opacity-70 ${
                        msg.hashed_sender_id === currentUserHashedId
                          ? "text-white/80"
                          : "text-gray-500"
                      }`}>
                        {formatLastMessageTime(msg.created_at)}
                      </span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} className="h-0" />
                </>
              )}
            </div>

            {/* Send bar */}
            <form onSubmit={handleSendMessage} className="flex-shrink-0 px-2 md:px-6 pt-3 md:pt-4 pb-4 bg-white backdrop-blur-sm border-t border-white/20 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] relative">
              {isSending && (
                <div className="absolute inset-x-0 -top-1">
                  <div className="h-1 bg-usfgold/30 overflow-hidden rounded-full mx-4">
                    <div className="h-full bg-usfgold animate-progress-infinite rounded-full w-1/3"></div>
                  </div>
                </div>
              )}
              <div className="flex gap-2.5">
                <input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={isSending}
                  onFocus={() => {
                    if (window.innerWidth < 1024) {
                      lastScrollPosition.current = window.scrollY;
                    }
                  }}
                  onBlur={() => {
                    if (window.innerWidth < 1024) {
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  placeholder={isSending ? "Sending..." : "Type a message…"}
                  className="flex-1 px-4 py-2 rounded-xl border border-white/50 bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-usfgold transition-all hover:border-white shadow-sm disabled:opacity-50"
                  maxLength={200}
                  style={{ fontSize: '16px' }}
                  enterKeyHint="send"
                />
                <button
                  type="submit"
                  disabled={(!messageInput.trim() && !selectedFile) || isSending}
                  className="p-2 text-usfgreen disabled:text-gray-300 hover:bg-white/90 rounded-lg transition flex-shrink-0 disabled:hover:bg-transparent border border-white/50 hover:border-white disabled:border-transparent shadow-sm"
                  aria-label="Send message"
                >
                  {isSending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {messageInput.length}/200 characters
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

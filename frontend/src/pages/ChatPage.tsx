import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Menu,
  X,
  Bot,
} from 'lucide-react';
import {
  getConversations,
  deleteConversation,
  getMessageHistory,
} from '../api/conversations';
import { streamChatSSE } from '../api/chat';
import { Conversation, ChatMessage as ChatMessageType } from '../types/chat';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ToolEventBadge } from '../components/chat/ToolEventBadge';
import { SuggestedPrompts } from '../components/chat/SuggestedPrompts';
import { useToast } from '../hooks/useToast';

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    conversationId || null
  );
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamedText, setCurrentStreamedText] = useState('');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamedText, activeTool]);

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data.conversations || []);
    } catch (err: any) {
      toast.error('Failed to load conversations.');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    setIsLoadingMessages(true);
    try {
      const history = await getMessageHistory(convId);
      setMessages(history.messages || []);
    } catch (err: any) {
      toast.error('Failed to load messages for conversation.');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [toast]);

  useEffect(() => {
    if (conversationId) {
      setActiveConversationId(conversationId);
      loadMessages(conversationId);
    } else {
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [conversationId, loadMessages]);

  const handleStartNewChat = () => {
    navigate('/app/chat');
    setActiveConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      toast.success('Conversation deleted.');
      if (activeConversationId === id) {
        handleStartNewChat();
      }
      loadConversations();
    } catch (err: any) {
      toast.error('Failed to delete conversation.');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isStreaming) return;

    setInputValue('');
    setIsStreaming(true);
    setCurrentStreamedText('');
    setActiveTool(null);

    const tempUserMsg: ChatMessageType = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId || '',
      role: 'USER',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    abortControllerRef.current = new AbortController();

    let resolvedConversationId = activeConversationId;
    let accumulatedText = '';

    streamChatSSE(
      text,
      resolvedConversationId,
      {
        onConversation: (data) => {
          resolvedConversationId = data.conversation_id;
          setActiveConversationId(data.conversation_id);
          navigate(`/app/chat/${data.conversation_id}`, { replace: true });
        },
        onToken: (data) => {
          accumulatedText += data.content;
          setCurrentStreamedText((prev) => prev + data.content);
        },
        onToolStart: (data) => {
          setActiveTool(data.tool);
        },
        onToolEnd: () => {
          setActiveTool(null);
        },
        onComplete: (data) => {
          setIsStreaming(false);
          setActiveTool(null);
          const assistantMessage: ChatMessageType = {
            id: `asst-${Date.now()}`,
            conversation_id: data.conversation_id || resolvedConversationId || '',
            role: 'ASSISTANT',
            content: data.response || accumulatedText,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setCurrentStreamedText('');
          loadConversations();
        },
        onError: (err: any) => {
          setIsStreaming(false);
          setActiveTool(null);
          toast.error(err.message || 'Error occurred while streaming response.');
          if (resolvedConversationId) {
            loadMessages(resolvedConversationId);
          }
        },
      },
      abortControllerRef.current.signal
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen bg-notebook-grid overflow-hidden">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Conversations Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r-2 border-slate-900 flex flex-col justify-between transition-transform duration-200 ease-in-out shadow-sm`}
      >
        <div className="p-4 border-b-2 border-slate-900 border-dashed flex items-center justify-between">
          <Button
            variant="primary"
            size="sm"
            className="w-full font-heading font-bold"
            onClick={handleStartNewChat}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Chat</span>
          </Button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden ml-2 p-1.5 text-slate-500 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {isLoadingConversations ? (
            <div className="p-4 flex justify-center">
              <Spinner size="sm" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-xs font-sans text-slate-500 text-center">
              No conversations yet. Ask a question to start!
            </p>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    navigate(`/app/chat/${conv.id}`);
                    setSidebarOpen(false);
                  }}
                  className={`group flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-50 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]'
                      : 'hover:bg-slate-50 border border-transparent hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <span
                      className={`text-xs truncate font-medium ${
                        isActive ? 'text-slate-900 font-bold' : 'text-slate-700'
                      }`}
                    >
                      {conv.title || 'Conversation'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition-opacity"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-transparent">
        {/* Chat Top Bar */}
        <div className="px-4 py-3 bg-white/90 border-b-2 border-slate-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-md border-2 border-slate-900 text-slate-900 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a]">
                <Bot className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-bold text-slate-900 text-base">
                Dukaan AI Assistant
              </h2>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleStartNewChat}
            className="text-xs font-heading font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>New Chat</span>
          </Button>
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-lg bg-blue-100 border-2 border-slate-900 flex items-center justify-center text-blue-600 shadow-[3px_3px_0px_#0f172a]">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900">
                  AI Se Poochho (Shop Assistant)
                </h3>
                <p className="text-sm font-sans text-slate-600 mt-1">
                  Query sales totals, top customers, item quantities, or pending drafts instantly.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isStreaming && (
                <div className="space-y-2">
                  {activeTool && <ToolEventBadge tool={activeTool} />}
                  {currentStreamedText && (
                    <ChatMessage
                      message={{
                        id: 'streaming-msg',
                        conversation_id: activeConversationId || '',
                        role: 'ASSISTANT',
                        content: currentStreamedText,
                        created_at: new Date().toISOString(),
                      }}
                      isStreaming={true}
                    />
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggested Prompts if at start of conversation */}
        {messages.length === 0 && !isStreaming && (
          <SuggestedPrompts onSelectPrompt={(p) => handleSendMessage(p)} />
        )}

        {/* Input Bar */}
        <div className="p-4 bg-white/95 border-t-2 border-slate-900">
          <div className="max-w-4xl mx-auto flex items-end gap-2 bg-white border-2 border-slate-900 rounded-lg p-2 shadow-[2px_2px_0px_#0f172a] focus-within:border-blue-600 focus-within:shadow-[3px_3px_0px_#2563eb] transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your invoices or sales..."
              className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm font-sans text-slate-900 placeholder-slate-400 focus:outline-none max-h-32"
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!inputValue.trim() || isStreaming}
              onClick={() => handleSendMessage()}
              className="h-9 px-3 shrink-0 font-heading font-bold"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[11px] font-sans text-center text-slate-500 mt-1.5">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Bot, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage as ChatMessageType } from '../../types/chat';

export const ChatMessage: React.FC<{ message: ChatMessageType; isStreaming?: boolean }> = ({
  message,
  isStreaming = false,
}) => {
  const isUser = message.role === 'USER';

  return (
    <div className={`flex gap-3 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-md bg-yellow-500 border-2 border-slate-900 flex items-center justify-center text-white shrink-0 font-bold shadow-[2px_2px_0px_#0f172a] mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[75%] p-4 text-sm leading-relaxed transition-all ${
          isUser
            ? 'bg-orange-500 text-white font-medium rounded-2xl rounded-tr-sm border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]'
            : 'bg-yellow-50 text-slate-900 border-2 border-yellow-400 rounded-2xl rounded-tl-sm shadow-[2px_2px_0px_#ca8a04]'
        }`}
      >
        {isUser ? (
          <div className="break-words">{message.content}</div>
        ) : (
          <div className="break-words prose prose-sm prose-slate max-w-none
            prose-headings:font-bold prose-headings:text-slate-900 prose-headings:mb-1 prose-headings:mt-2
            prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
            prose-p:my-1 prose-p:leading-relaxed
            prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5
            prose-ol:my-1 prose-ol:pl-4
            prose-code:bg-yellow-100 prose-code:text-yellow-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-yellow-100 prose-pre:border prose-pre:border-yellow-300 prose-pre:rounded-lg prose-pre:p-3 prose-pre:overflow-x-auto
            prose-pre:code:bg-transparent prose-pre:code:p-0
            prose-strong:font-bold prose-strong:text-slate-900
            prose-em:italic
            prose-blockquote:border-l-4 prose-blockquote:border-yellow-400 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-slate-600
            prose-a:text-orange-600 prose-a:underline hover:prose-a:text-orange-800
            prose-hr:border-yellow-300
            prose-table:text-xs prose-th:bg-yellow-100 prose-th:p-1 prose-td:p-1 prose-td:border prose-td:border-yellow-200
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-3.5 ml-1 bg-yellow-500 animate-pulse align-middle rounded-sm" />
            )}
          </div>
        )}

        <div
          className={`mt-1.5 text-[10px] font-mono flex items-center justify-end ${
            isUser ? 'text-orange-100' : 'text-yellow-700'
          }`}
        >
          {message.created_at
            ? new Date(message.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Just now'}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-md bg-orange-500 border-2 border-slate-900 flex items-center justify-center text-white shrink-0 font-bold shadow-[2px_2px_0px_#0f172a] mt-0.5">
          <UserIcon className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

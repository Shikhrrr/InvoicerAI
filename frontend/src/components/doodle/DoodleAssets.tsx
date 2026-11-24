import React from 'react';

// Hand-drawn wavy underline
export const DoodleUnderline: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-48 h-3 text-red-600',
  color = 'currentColor',
}) => (
  <svg
    viewBox="0 0 200 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="none"
  >
    <path
      d="M2 9.5C35 3.5 70 11.5 102 7C134 2.5 168 10 198 4.5"
      stroke={color}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 11C40 6 75 11 106 8.5C138 6 172 10.5 194 7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.75"
    />
  </svg>
);

// Hand-drawn scribble loop / circle around a word
export const DoodleLoop: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-full h-full text-red-600',
  color = 'currentColor',
}) => (
  <svg
    viewBox="0 0 220 70"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="none"
  >
    <path
      d="M18 38C15 20 52 8 110 8C175 8 206 18 208 35C210 52 170 63 108 63C42 63 8 50 12 33C14 22 36 14 74 12"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="400"
      strokeDashoffset="0"
    />
  </svg>
);

// Hand-drawn curved arrow
export const DoodleArrow: React.FC<{
  className?: string;
  direction?: 'down-left' | 'down-right' | 'right' | 'up-right';
  color?: string;
}> = ({ className = 'w-16 h-12 text-blue-600', direction = 'down-left', color = 'currentColor' }) => {
  return (
    <svg
      viewBox="0 0 80 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {direction === 'down-left' && (
        <>
          <path
            d="M68 8C55 8 25 15 18 42C16 48 15 50 14 52"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M8 38C10 44 14 50 15 52C21 51 28 48 34 45"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {direction === 'down-right' && (
        <>
          <path
            d="M12 8C25 8 55 15 62 42C64 48 65 50 66 52"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M72 38C70 44 66 50 65 52C59 51 52 48 46 45"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {direction === 'right' && (
        <>
          <path
            d="M8 30C28 26 50 28 70 30"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M55 18C62 23 68 28 72 30C68 33 62 38 56 42"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {direction === 'up-right' && (
        <>
          <path
            d="M14 50C20 30 40 18 64 12"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M48 10C56 10 62 11 65 12C64 17 62 25 60 32"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
};

// Hand-drawn sketchy 5-point star
export const DoodleStar: React.FC<{ className?: string; color?: string; fill?: string }> = ({
  className = 'w-6 h-6 text-blue-600',
  color = 'currentColor',
  fill = 'none',
}) => (
  <svg
    viewBox="0 0 40 40"
    fill={fill}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M20 4L24.5 14.5L36 16L27.5 24L30 35.5L20 29.5L9.5 35.5L12 24L4 16L15.5 14.5L20 4Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Hand-drawn sparkle / asterisks
export const DoodleSparkle: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-5 h-5 text-red-600',
  color = 'currentColor',
}) => (
  <svg
    viewBox="0 0 30 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M15 3V27M3 15H27M6.5 6.5L23.5 23.5M23.5 6.5L6.5 23.5"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

// Paper airplane doodle
export const DoodlePaperPlane: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-10 h-10 text-blue-600',
  color = 'currentColor',
}) => (
  <svg
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8 28L52 10L36 50L26 36L8 28Z"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#EFF6FF"
    />
    <path
      d="M52 10L26 36"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M6 38C2 44 8 50 14 48C20 46 22 40 18 36"
      stroke="#DC2626"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="3 3"
    />
  </svg>
);

// Hand-drawn crown for Dukaan / InvoicerAI
export const DoodleCrown: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-6 h-5 text-red-600',
  color = 'currentColor',
}) => (
  <svg
    viewBox="0 0 36 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3 21L6 7L14 14L18 4L22 14L30 7L33 21H3Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#FEF08A"
    />
    <circle cx="6" cy="6" r="1.5" fill={color} />
    <circle cx="18" cy="3.5" r="1.5" fill={color} />
    <circle cx="30" cy="6" r="1.5" fill={color} />
  </svg>
);

// Paperclip doodle
export const DoodlePaperclip: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-6 h-12 text-slate-700',
  color = 'currentColor',
}) => (
  <svg
    viewBox="0 0 24 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M7 16V36C7 41 10.5 45 15 45C19.5 45 22 41 22 36V12C22 6 18 2 12 2C6 2 2 6 2 12V38"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

// Washi Tape component
export const DoodleTape: React.FC<{
  className?: string;
  color?: 'yellow' | 'blue' | 'red';
  variant?: 'yellow' | 'blue' | 'red';
  rotate?: string;
}> = ({ className = 'w-24 h-6', color, variant = 'yellow', rotate = '-rotate-2' }) => {
  const chosenColor = color || variant;
  const bgClass =
    chosenColor === 'yellow'
      ? 'washi-tape-yellow'
      : chosenColor === 'blue'
      ? 'washi-tape-blue'
      : 'washi-tape-red';

  return (
    <div
      className={`absolute ${rotate} ${bgClass} z-20 pointer-events-none ${className}`}
    />
  );
};

// Hand-drawn checkmark
export const DoodleCheck: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-5 h-5 text-blue-600',
  color = 'currentColor',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3 13L9 19L21 5"
      stroke={color}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Playful Online Doodle Sticker image with resilient fallback
export const DoodleSticker: React.FC<{
  src: string;
  alt: string;
  fallbackEmoji?: string;
  className?: string;
  badgeText?: string;
  rotate?: string;
}> = ({
  src,
  alt,
  fallbackEmoji = '✏️',
  className = 'w-16 h-16',
  badgeText,
  rotate = 'rotate-3',
}) => {
  const [error, setError] = React.useState(false);

  return (
    <div
      className={`inline-flex flex-col items-center select-none pointer-events-none transition-transform hover:scale-110 ${rotate}`}
    >
      <div
        className={`p-1.5 bg-white border-2 border-slate-900 shadow-doodle border-doodle flex items-center justify-center overflow-hidden ${className}`}
      >
        {!error ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setError(true)}
            className="w-full h-full object-contain filter drop-shadow-sm"
          />
        ) : (
          <span className="text-2xl">{fallbackEmoji}</span>
        )}
      </div>
      {badgeText && (
        <span className="mt-1 font-doodle text-[11px] font-bold px-1.5 py-0.5 bg-yellow-200 border border-slate-900 border-doodle-sm text-slate-900 shadow-[1px_1px_0px_#0f172a]">
          {badgeText}
        </span>
      )}
    </div>
  );
};

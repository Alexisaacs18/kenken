import { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareText: string;
}

export default function ShareModal({ isOpen, onClose, shareText }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const encodedText = encodeURIComponent(shareText);
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodedText}&hashtags=Puzzalo,KenKen,DailyPuzzle`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://puzzalo.com')}&quote=${encodedText}`;
  const whatsappUrl = `https://wa.me/?text=${encodedText}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent('Puzzalo Daily Puzzle')}&body=${encodedText}`;
  const smsUrl = `sms:?&body=${encodedText}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      console.error('Failed to copy share text', e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm shadow-2xl max-w-lg w-full p-6 border border-[#E0E0E0]">
        <h3
          className="text-xl font-semibold text-[#1A1A1A] mb-3"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Share your result
        </h3>

        <textarea
          readOnly
          value={shareText}
          className="w-full h-40 p-3 border border-[#E0E0E0] rounded-sm bg-[#FAFAF8] text-xs font-mono whitespace-pre-wrap mb-4"
        />

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-xs font-semibold text-white rounded-sm bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-colors"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-xs font-semibold text-[#1A1A1A] border border-[#E0E0E0] rounded-sm hover:bg-[#F5F5F5]"
          >
            Twitter / X
          </a>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-xs font-semibold text-[#1A1A1A] border border-[#E0E0E0] rounded-sm hover:bg-[#F5F5F5]"
          >
            Facebook
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-xs font-semibold text-[#1A1A1A] border border-[#E0E0E0] rounded-sm hover:bg-[#F5F5F5]"
          >
            WhatsApp
          </a>
          <a
            href={emailUrl}
            className="px-3 py-2 text-xs font-semibold text-[#1A1A1A] border border-[#E0E0E0] rounded-sm hover:bg-[#F5F5F5]"
          >
            Email
          </a>
          <a
            href={smsUrl}
            className="px-3 py-2 text-xs font-semibold text-[#1A1A1A] border border-[#E0E0E0] rounded-sm hover:bg-[#F5F5F5]"
          >
            SMS
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 px-4 py-2 text-sm font-medium bg-[#1A1A1A] text-white border border-[#1A1A1A] rounded-sm hover:bg-[#333333] transition-colors"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}



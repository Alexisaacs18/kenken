interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
}

export default function ComingSoonModal({ isOpen, onClose, gameName }: ComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm shadow-2xl max-w-md w-full p-8 border border-[#E0E0E0]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            {gameName} Coming Soon!
          </h2>
          <p className="text-base text-[#666666] mb-6" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            We're working hard to bring you {gameName}. Check back soon!
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium bg-[#1A1A1A] text-white border border-[#1A1A1A] rounded-sm hover:bg-[#333333] transition-colors"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


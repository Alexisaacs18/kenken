interface DailyInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyInstructionsModal({ isOpen, onClose }: DailyInstructionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm shadow-2xl max-w-md w-full p-6 border border-[#E0E0E0]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            🧩 How to Play KenKen
          </h2>
          <button
            onClick={onClose}
            className="text-[#666666] hover:text-[#1A1A1A] text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
          <div>
            <p className="font-medium mb-2">1️⃣ Fill the grid so each row & column has every number exactly once.</p>
            <p className="text-sm text-[#666666] ml-4">
              - For a 4×4 puzzle → use 1–4<br />
              - For a 6×6 → use 1–6
            </p>
          </div>

          <div>
            <p className="font-medium mb-2">2️⃣ Follow the cage clues.</p>
            <p className="text-sm text-[#666666] ml-4">
              - Each cage (outlined block) shows a target number & math symbol.<br />
              - The numbers inside the cage must combine (using that symbol) to make the target.<br />
              - Example: "6+" means total = 6; "12×" means product = 12.
            </p>
          </div>

          <div>
            <p className="font-medium mb-2">3️⃣ No repeats!</p>
            <p className="text-sm text-[#666666] ml-4">
              - Numbers can't repeat within a row or column — even if the math works.
            </p>
          </div>

          <div className="pt-2 border-t border-[#E0E0E0]">
            <p className="font-medium mb-2">💡 Tips</p>
            <ul className="text-sm text-[#666666] ml-4 space-y-1 list-disc list-inside">
              <li>Start with cages that have only one square (the number is given).</li>
              <li>Try scanning rows/columns with few empty cells to narrow options.</li>
              <li>Use logic, not guessing!</li>
            </ul>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-3 text-sm font-medium bg-[#1A1A1A] text-white border border-[#1A1A1A] rounded-sm hover:bg-[#333333] transition-colors"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}


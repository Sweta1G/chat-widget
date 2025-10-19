import { MessageCircle, X } from 'lucide-react';

interface WidgetButtonProps {
  isOpen: boolean;
  onClick: () => void;
  primaryColor: string;
  position: string;
}

export function WidgetButton({ isOpen, onClick, primaryColor, position }: WidgetButtonProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <button
      onClick={onClick}
      className={`fixed ${positionClasses[position as keyof typeof positionClasses]} z-[999999] w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center`}
      style={{ backgroundColor: primaryColor }}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? (
        <X className="w-6 h-6 text-white" />
      ) : (
        <MessageCircle className="w-6 h-6 text-white" />
      )}
    </button>
  );
}

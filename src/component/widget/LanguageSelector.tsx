import { Languages } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../../config/languages';

interface LanguageSelectorProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  primaryColor: string;
}

export function LanguageSelector({ currentLanguage, onLanguageChange, primaryColor }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Select language"
      >
        <Languages className="w-5 h-5 text-white" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => {
                onLanguageChange(code as LanguageCode);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                currentLanguage === code ? 'font-medium' : ''
              }`}
              style={currentLanguage === code ? { color: primaryColor } : {}}
            >
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

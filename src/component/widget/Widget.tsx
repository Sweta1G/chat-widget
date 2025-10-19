import { useState, useEffect } from 'react';
import { WidgetConfig } from '../../types/widget';
import { WidgetButton } from './WidgetButton';
import { ChatWidget } from './ChatWidget';

interface WidgetProps {
  config: WidgetConfig;
}

export function Widget({ config }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const primaryColor = config.theme?.primaryColor || '#4F46E5';
  const position = config.position || 'bottom-right';

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <WidgetButton
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        primaryColor={primaryColor}
        position={position}
      />

      {isOpen && (
        <ChatWidget
          config={config}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

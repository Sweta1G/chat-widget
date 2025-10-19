import { createRoot } from 'react-dom/client';
import { Widget } from './component/widget/Widget';
import { WidgetConfig } from './types/widget';
import './index.css';

declare global {
  interface Window {
    AgentWidgetConfig?: WidgetConfig;
    initAgentWidget?: (config?: WidgetConfig) => void;
  }
}

function initWidget(config?: WidgetConfig) {
  const finalConfig: WidgetConfig = {
    ...config,
    ...(window.AgentWidgetConfig || {})
  };

  const containerId = 'agent-widget-root';
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  const root = createRoot(container);
  root.render(<Widget config={finalConfig} />);
}

if (typeof window !== 'undefined') {
  window.initAgentWidget = initWidget;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initWidget();
    });
  } else {
    initWidget();
  }
}

export { initWidget };

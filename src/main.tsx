import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import InfiniteTypewriterCanvas from './components/InfiniteTypewriterCanvas';
import './index.css';

// Apply initial theme based on saved theme (default to light mode)
const savedTheme = localStorage.getItem('nntype_session');
if (savedTheme) {
  try {
    const session = JSON.parse(savedTheme);
    if (session.theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    // Light mode is default, no need to add class
  } catch (e) {
    // If parsing fails, default to light mode (no class added)
  }
}
// Default to light mode if no saved theme (no class added)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <InfiniteTypewriterCanvas />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
); 

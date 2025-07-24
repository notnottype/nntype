import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import InfiniteTypewriterCanvas from './components/InfiniteTypewriterCanvas';
import './index.css';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <InfiniteTypewriterCanvas />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
); 

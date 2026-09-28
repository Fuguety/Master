import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/styles/globals.css';
import { App } from '@/App';

const rootElement = document.getElementById('root');

if (rootElement === null)
{
    throw new Error('The application root element was not found.');
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
);

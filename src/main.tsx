import { ErrorBoundary } from './components/ErrorBoundary';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary fullPage>
    <App />
  </ErrorBoundary>,
);

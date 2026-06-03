import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { applyBrandTheme, brand } from './config'
import { initTheme } from './components/ThemeToggle'
import { initObservability } from './lib/observability'
import { wireSentry } from './lib/sentryAdapter'
import { registerServiceWorker } from './lib/registerServiceWorker'
import './index.css'

applyBrandTheme();
initTheme();
initObservability(brand.id);
void wireSentry();
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);

import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';

import { AppComponent } from './src/app.component';

// Debug: print injected key (if any) to help diagnose env injection
console.log('[startup] window.GEMINI_API_KEY (before load) =', (window as any).GEMINI_API_KEY);

(async () => {
  // Try to load generated client env file before bootstrapping the app.
  try {
    const resp = await fetch('/assets/env.js', { cache: 'no-store' });
    if (resp.ok) {
      const js = await resp.text();
      // evaluate in global scope
      (0, eval)(js);
      console.log('[startup] loaded /assets/env.js');
    } else {
      console.log('[startup] /assets/env.js not found (status ' + resp.status + ')');
    }
  } catch (e) {
    console.warn('[startup] failed to load /assets/env.js', e);
  }

  console.log('[startup] window.GEMINI_API_KEY (after load) =', (window as any).GEMINI_API_KEY);

  bootstrapApplication(AppComponent, {
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
    ],
  }).catch((err) => console.error(err));
})();

// AI Studio always uses an `index.tsx` file for all project types.

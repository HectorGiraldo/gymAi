import { Injectable } from '@angular/core';

export interface UnsplashResult {
  url: string;
  author?: { name: string; link: string };
}

@Injectable({ providedIn: 'root' })
export class UnsplashService {
  private accessKey: string | undefined = (typeof window !== 'undefined' ? (window as any).UNSPLASH_ACCESS_KEY : undefined) || undefined;
  private placeholder = 'https://via.placeholder.com/400?text=Image+not+available';

  constructor() {}

  private async fetchJson(url: string, options: any = {}) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // Search Unsplash for a photo matching `query`. Returns first result or throws.
  async searchPhoto(query: string): Promise<UnsplashResult> {
    // If we have an access key, use the official API
    if (this.accessKey) {
      const url = `https://api.unsplash.com/search/photos?page=1&per_page=1&query=${encodeURIComponent(query)}`;
      try {
        const json = await this.fetchJson(url, { headers: { Authorization: `Client-ID ${this.accessKey}` } });
        const hit = json.results && json.results[0];
        if (hit && hit.urls && hit.urls.small) {
          const authorName = hit.user?.name;
          const authorLink = hit.user?.links?.html ? `${hit.user.links.html}?utm_source=gymai&utm_medium=referral` : undefined;
          return { url: hit.urls.small, author: authorName ? { name: authorName, link: authorLink } : undefined };
        }
      } catch (err) {
        console.warn('Unsplash API search failed', err);
        throw err;
      }
    }

    // Fallback to the simple source.unsplash.com endpoint (no key) — less reliable
    const srcUrl = `https://source.unsplash.com/400x400/?${encodeURIComponent(query)}`;
    // We can't inspect the image metadata from source.unsplash; return the URL and let caller handle failures.
    return { url: srcUrl };
  }

  // Attempt to get an image with retries; returns a usable URL (or placeholder on failure)
  async getImageUrlForQuery(query: string, retries = 3): Promise<UnsplashResult> {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await this.searchPhoto(query);
        // Quick check: try to HEAD the URL to ensure it's available (source.unsplash may redirect)
        try {
          const head = await fetch(res.url, { method: 'HEAD' });
          if (head.ok) return res;
        } catch (headErr) {
          // ignore and return res if it's from official API (we assume it's valid)
          if (res.author) return res;
          throw headErr;
        }
      } catch (err) {
        // exponential backoff
        if (i < retries - 1) await new Promise(r => setTimeout(r, 300 * Math.pow(2, i)));
      }
    }
    return { url: this.placeholder };
  }
}

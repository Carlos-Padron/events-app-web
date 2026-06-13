import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

/** How long a "copied" confirmation should stay visible, in ms. */
export const COPY_FEEDBACK_MS = 2000;

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private readonly doc = inject(DOCUMENT);

  /** Copies text to the clipboard. Resolves `true` on success, `false` otherwise. */
  async copy(text: string): Promise<boolean> {
    const clipboard = this.doc.defaultView?.navigator.clipboard;
    if (!clipboard || !text) return false;
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}

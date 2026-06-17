import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-mobile-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <div class="h-dvh bg-ink-soft flex justify-center">
      <div class="w-full max-w-sm h-full flex flex-col overflow-x-hidden">
        <router-outlet class="hidden" />
      </div>
    </div>
  `,
})
export class MobileShell {}

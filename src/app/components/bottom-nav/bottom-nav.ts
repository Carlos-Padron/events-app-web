import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <nav class="bg-ink border-t border-paper/10 flex-shrink-0" aria-label="Navegación principal">
      <div class="flex">
        <a
          routerLink="/eventos"
          [class]="
            isFilms()
              ? 'flex-1 flex flex-col items-center justify-center py-3 gap-1 text-ember transition-colors'
              : 'flex-1 flex flex-col items-center justify-center py-3 gap-1 text-paper/40 transition-colors'
          "
          aria-label="Films"
        >
          <i class="ph ph-film-strip text-xl"></i>
          <span class="text-[9px] tracking-widest uppercase font-semibold">Films</span>
        </a>
        <a
          routerLink="/eventos/perfil"
          [class]="
            isPerfil()
              ? 'flex-1 flex flex-col items-center justify-center py-3 gap-1 text-ember transition-colors'
              : 'flex-1 flex flex-col items-center justify-center py-3 gap-1 text-paper/40 transition-colors'
          "
          aria-label="Perfil"
        >
          <i class="ph ph-user text-xl"></i>
          <span class="text-[9px] tracking-widest uppercase font-semibold">Perfil</span>
        </a>
      </div>
    </nav>
  `,
})
export class BottomNav {
  private readonly router = inject(Router);
  private readonly url = signal(this.router.url);

  readonly isFilms = () => this.url() === '/eventos';
  readonly isPerfil = () => this.url().startsWith('/eventos/perfil');

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.url.set(e.urlAfterRedirects));
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../../common/services/auth.service';
import { BottomNav } from '../../../../components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col min-h-0' },
  imports: [BottomNav],
  templateUrl: './profile.html',
})
export class Profile {
  private readonly authService = inject(AuthService);

  readonly showDeleteConfirm = signal(false);

  logout(): void {
    this.authService.logout();
  }
}

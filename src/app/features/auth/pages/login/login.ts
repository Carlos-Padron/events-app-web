import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Input } from '../../../../components/input/input';
import { Button } from '../../../../components/button/button';
import { Spinner } from '../../../../components/spinner/spinner';
import { Divider } from '../../../../components/divider/divider';
import { AuthService } from '../../../../common/services/auth.service';
import { catchFormError } from '../../../../common/utils/catch-form-error';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [ReactiveFormsModule, RouterLink, Input, Button, Spinner, Divider],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  isLoading = signal(false);

  get emailError(): string {
    const ctrl = this.form.get('email');
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required')) return 'El correo es requerido.';
    if (ctrl.hasError('email')) return 'Ingresa un correo válido.';
    if (ctrl.hasError('backend')) return ctrl.getError('backend');
    return '';
  }

  get passwordError(): string {
    const ctrl = this.form.get('password');
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required')) return 'La contraseña es requerida.';
    if (ctrl.hasError('backend')) return ctrl.getError('backend');
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;

    this.isLoading.set(true);
    this.auth
      .login({ email: email!, password: password! })
      .pipe(catchFormError(this.form, this.toastr))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/eventos']);
        },
        error: () => this.isLoading.set(false),
      });
  }
}

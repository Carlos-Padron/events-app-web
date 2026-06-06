import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Input } from '../../../../components/input/input';
import { Button } from '../../../../components/button/button';
import { Spinner } from '../../../../components/spinner/spinner';
import { Divider } from '../../../../components/divider/divider';
import { AuthService } from '../../../../common/services/auth.service';

function matchPasswords(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [ReactiveFormsModule, RouterLink, Input, Button, Spinner, Divider],
  templateUrl: './register.html',
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      // lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchPasswords },
  );

  isLoading = signal(false);

  get nameError(): string {
    const ctrl = this.form.get('name');
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required')) return 'El nombre es requerido.';
    if (ctrl.hasError('minlength')) return 'Mínimo 2 caracteres.';
    return '';
  }

  // get lastNameError(): string {
  //   const ctrl = this.form.get('lastName');
  //   if (!ctrl?.touched) return '';
  //   if (ctrl.hasError('required')) return 'El apellido es requerido.';
  //   if (ctrl.hasError('minlength')) return 'Mínimo 2 caracteres.';
  //   return '';
  // }

  get emailError(): string {
    const ctrl = this.form.get('email');
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required')) return 'El correo es requerido.';
    if (ctrl.hasError('email')) return 'Ingresa un correo válido.';
    return '';
  }

  get passwordError(): string {
    const ctrl = this.form.get('password');
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required')) return 'La contraseña es requerida.';
    return '';
  }

  get confirmPasswordError(): string {
    const ctrl = this.form.get('confirmPassword');
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required')) return 'Confirma tu contraseña.';
    if (this.form.hasError('passwordMismatch')) return 'Las contraseñas no coinciden.';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.form.value;

    this.isLoading.set(true);
    this.auth.register({ name: name!, email: email!, password: password! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/eventos']);
      },
      error: (e) => {
        this.isLoading.set(false);
        alert(`error: ${JSON.stringify(e)}`);
      },
    });
  }
}

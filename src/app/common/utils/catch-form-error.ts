import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { MonoTypeOperatorFunction, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

export function catchFormError<T>(
  form: FormGroup,
  toastr: ToastrService,
): MonoTypeOperatorFunction<T> {
  return catchError((e: HttpErrorResponse) => {
    switch (e.status) {
      case 400:
      case 422: {
        const fieldErrors: Record<string, string[]> = e.error?.errors ?? {};
        if (Object.keys(fieldErrors).length) {
          Object.entries(fieldErrors).forEach(([field, msgs]) =>
            form.get(field)?.setErrors({ backend: msgs.join('\n') }),
          );
        } else {
          toastr.error(e.error?.message ?? 'Datos inválidos.');
        }
        break;
      }
      case 409:
        toastr.error(e.error?.message ?? 'Ya existe un registro con estos datos.');
        break;
    }
    return throwError(() => e);
  });
}

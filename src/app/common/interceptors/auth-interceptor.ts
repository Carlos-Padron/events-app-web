import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SKIP_AUTH_RETRY_ENDPOINTS } from '../../shared/constants/api-endpoints';
import { AuthService } from '../services/auth.service';

// Build full URLs from the path constants so we can match against req.url at runtime.
const SKIP_AUTH_RETRY = SKIP_AUTH_RETRY_ENDPOINTS.map(path => `${environment.API_ENDPOINT}${path}`);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.getAccessToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError(error => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;
      const isRetryable    = !SKIP_AUTH_RETRY.some(url => req.url.includes(url));

      if (isUnauthorized && isRetryable) {
        return auth.handle401(req, next); // pass original req — handle401 attaches the refreshed token
      }

      return throwError(() => error);
    })
  );
};

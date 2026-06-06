import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../shared/constants/api-endpoints';
import { AuthResponse, LoginPayload, RefreshResponse, RegisterPayload } from '../../shared/interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly http   = inject(HttpClient);

  private readonly loginUrl    = `${environment.API_ENDPOINT}${API_ENDPOINTS.auth.login}`;
  private readonly registerUrl = `${environment.API_ENDPOINT}${API_ENDPOINTS.auth.register}`;
  private readonly refreshUrl  = `${environment.API_ENDPOINT}${API_ENDPOINTS.auth.refresh}`;

  private readonly ACCESS_TOKEN_KEY  = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';

  private refreshInProgress = false;
  // null = refresh in progress, true = succeeded, false = failed
  private readonly refreshStatus$ = new BehaviorSubject<boolean | null>(null);

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.loginUrl, payload).pipe(
      tap(res => this.storeTokens(res.accessToken, res.refreshToken))
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.registerUrl, payload).pipe(
      tap(res => this.storeTokens(res.accessToken, res.refreshToken))
    );
  }

  // Entry point called by the interceptor on every 401.
  // Routes to the right strategy depending on whether a refresh is already running.
  handle401(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    return this.refreshInProgress
      ? this.waitForRefresh(req, next)  // another request already triggered the refresh — wait for it
      : this.initiateRefresh(req, next); // first 401 — kick off the refresh
  }

  // Fires the refresh request and retries the original request on success.
  // On failure, clears tokens and redirects to login so the user can re-authenticate.
  private initiateRefresh(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.refreshStatus$.next(false);
      this.router.navigate(['/login']);
      return throwError(() => new Error('No refresh token'));
    }

    this.refreshInProgress = true;
    this.refreshStatus$.next(null); // signal that refresh has started

    return this.http.post<RefreshResponse>(this.refreshUrl, { refreshToken }).pipe(
      switchMap(res => {
        this.storeTokens(res.accessToken, res.refreshToken);
        this.refreshInProgress = false;
        this.refreshStatus$.next(true); // signal success so waiting requests can proceed
        const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } });
        return next(retryReq);
      }),
      catchError(err => {
        this.clearTokens();
        this.refreshInProgress = false;
        this.refreshStatus$.next(false); // signal failure so waiting requests can bail out
        this.router.navigate(['/login']); // refresh token expired — force re-login
        return throwError(() => err);
      })
    );
  }

  // Waits for an in-progress refresh to settle, then retries or bails out.
  // This prevents duplicate refresh calls when multiple requests 401 at the same time.
  private waitForRefresh(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    return this.refreshStatus$.pipe(
      filter(status => status !== null), // skip the null emitted while refresh is running
      take(1),                           // unsubscribe after the first result
      switchMap(refreshed => {
        if (!refreshed) return throwError(() => new Error('Session expired'));
        const token = this.getAccessToken(); // freshly stored by initiateRefresh
        const retryReq = token
          ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : req;
        return next(retryReq);
      })
    );
  }
}

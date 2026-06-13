---
name: new-api-method
description: Add a new backend API integration following the project's three-file pattern. Use when asked to call a new endpoint or add a new API method to a service.
---

The user wants to integrate a new API endpoint. $ARGUMENTS describes the endpoint (method, path, request/response shape).

Follow all three steps — never skip one:

## 1. Register the endpoint constant

File: `src/app/shared/constants/api-endpoints.ts`

Add under the appropriate domain object:
```typescript
// Static path:
newEndpoint: '/resource/path',

// Parameterized path:
newEndpoint: (id: string) => `/resource/${id}/action`,
```

If the endpoint must skip the 401 auth-retry flow (e.g. login, register, token refresh), also add it to `SKIP_AUTH_RETRY_ENDPOINTS`. Never bypass interceptors with `HttpBackend`.

## 2. Add or update the TypeScript interface

File: `src/app/shared/interfaces/<domain>.interface.ts`

- Add request DTO interface (if POST/PATCH with a body)
- Add response interface (if the shape isn't already covered by an existing type)
- Export a `PaginatedResponse<T>` wrapper if the endpoint paginates

Use precise types — avoid `string` where a union is known (e.g. `'scheduled' | 'live' | 'closed' | 'archived' | 'deleted'`).

## 3. Add the service method

File: `src/app/features/<feature>/services/<feature>.service.ts`

Pattern for a simple GET:
```typescript
getResource(id: string): Observable<ResourceResponse> {
  return this.http.get<ResourceResponse>(`${API}${API_ENDPOINTS.domain.getResource(id)}`);
}
```

Pattern for a paginated GET:
```typescript
getResources(page = 1, limit = 50): Observable<PaginatedResponse<ResourceResponse>> {
  const params = { page: String(page), limit: String(limit) };
  return this.http.get<PaginatedResponse<ResourceResponse>>(
    `${API}${API_ENDPOINTS.domain.resources}`, { params }
  );
}
```

Rules:
- `const API = environment.API_ENDPOINT` is already declared at the top of each service file — use it
- Return `Observable<T>`, never subscribe inside the service
- The auth interceptor attaches tokens automatically — don't add Authorization headers manually

## 4. Verify

Run `ng build --configuration development` and confirm zero TypeScript errors.

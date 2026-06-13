/** Shape of an error body returned by the backend API. */
export interface ApiErrorResponse {
  message?: string;
  /** Field-level validation errors, keyed by form control name. */
  errors?: Record<string, string[]>;
}

/** Shape of an error body returned by the backend API. */
export interface ApiErrorResponse {
  statusCode?: number;
  message?: string;
  /** Field-level validation errors — each field may carry multiple messages. */
  errors?: Record<string, string[]>;
}

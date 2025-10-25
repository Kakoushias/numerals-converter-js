export interface Conversion {
  arabic: number;
  roman: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ConversionResponse {
  inputValue: string | number;
  convertedValue: string | number;
}

export interface DeleteResponse {
  deleted: number;
}

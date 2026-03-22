// Centralized configuration constants

// API base URL — uses env variable in production, falls back to localhost for dev
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// localStorage keys
export const STORAGE_KEYS = {
  USER: 'pinkcafe_user',
  LAST_ACTIVITY: 'pinkcafe_last_activity',
  TOKEN: 'pinkcafe_token',
  FORECAST_DATA: 'uploadedForecastData',
  SELECTED_DATASET: 'selectedDatasetId',
  AUTO_FORECAST: 'autoGenerateForecast',
};

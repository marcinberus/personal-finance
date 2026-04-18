import { environment } from '../../../environments/environment';

export const API_ENDPOINTS = {
  identityBaseUrl: environment.api.identityBaseUrl,
  ledgerBaseUrl: environment.api.ledgerBaseUrl,
  reportingBaseUrl: environment.api.reportingBaseUrl,
} as const;

const env = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
const isDev = Boolean(env?.DEV);

export const CONFIG = {
  // Si se deja vacío (""), la aplicación usará datos simulados (Mocks) para desarrollo local.
  // Para producción, coloca aquí la URL de tu backend, ej: 'http://localhost:8080'
  API_BASE_URL: isDev ? '/api' : 'https://espaoil-server.onrender.com',
  API_PROXY_TARGET: 'https://espaoil-server.onrender.com',
  DEFAULT_SEARCH_RADIUS_KM: 20,
  DEFAULT_FUEL_TYPE: 'GASOLINA_95_E5',
};
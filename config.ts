export const CONFIG = {
  // El frontend siempre consume /api para evitar CORS en producción.
  // En local, Vite proxy reenvía a Render; en Vercel, lo maneja vercel.json.
  API_BASE_URL: '/api',
  API_PROXY_TARGET: 'espaoilserver-v7pg66dplldqk7srhg6hemdr-204207070399:8080',
  DEFAULT_SEARCH_RADIUS_KM: 20,
  DEFAULT_FUEL_TYPE: 'GASOLINA_95_E5',
};

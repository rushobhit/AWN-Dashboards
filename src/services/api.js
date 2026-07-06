import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Response interceptor — gracefully log errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;
    if (status === 404) {
      console.warn(`[API] 404 Not Found: ${url}`);
    } else if (status >= 500) {
      console.error(`[API] Server Error (${status}): ${url}`);
    } else if (error.code === 'ERR_CANCELED') {
      // Request was aborted — not an error
    } else {
      console.error('[API] Request failed:', error.message);
    }
    return Promise.reject(error);
  }
);

export const dashboardApi = {
  getKpis: (params, signal) => api.get('/dashboard/kpis', { params, signal }),
  getMonthlySales: (params, signal) => api.get('/dashboard/monthly-sales', { params, signal }),
  getSalesByCategory: (params, signal) => api.get('/dashboard/sales-by-category', { params, signal }),
  getSalesByTerritory: (params, signal) => api.get('/dashboard/sales-by-territory', { params, signal }),
  getTopProducts: (params, signal) => api.get('/dashboard/top-products', { params, signal }),
  getTopCustomers: (params, signal) => api.get('/dashboard/top-customers', { params, signal }),
  getSalesTrend: (params, signal) => api.get('/dashboard/sales-trend', { params, signal }),
  getProductPerformance: (params, signal) => api.get('/dashboard/product-performance', { params, signal }),
  getSalesChannels: (params, signal) => api.get('/dashboard/sales-channels', { params, signal }),
  getSalesPeople: (params, signal) => api.get('/dashboard/sales-people', { params, signal }),
  getSubcategoryMargins: (params, signal) => api.get('/dashboard/subcategory-margins', { params, signal }),
  getOlapFacts: (params, signal) => api.get('/dashboard/olap-facts', { params, signal }),
  getFilterOptions: (signal) => api.get('/dashboard/filter-options', { signal }),
};

export const entityApi = {
  getProducts: (page, size, sortBy, direction, filters = {}) =>
    api.get('/products', { params: { page, size, sort: `${sortBy},${direction}`, ...filters } }),
  getCustomers: (page, size, sortBy, direction, filters = {}) =>
    api.get('/customers', { params: { page, size, sort: `${sortBy},${direction}`, ...filters } }),
  getSalesOrders: (page, size, sortBy, direction, filters = {}) =>
    api.get('/sales-orders', { params: { page, size, sort: `${sortBy},${direction}`, ...filters } }),
};

export default api;

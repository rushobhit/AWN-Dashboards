import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const dashboardApi = {
  getKpis: (params) => api.get('/dashboard/kpis', { params }),
  getMonthlySales: (params) => api.get('/dashboard/monthly-sales', { params }),
  getSalesByCategory: (params) => api.get('/dashboard/sales-by-category', { params }),
  getSalesByTerritory: (params) => api.get('/dashboard/sales-by-territory', { params }),
  getTopProducts: (params) => api.get('/dashboard/top-products', { params }),
  getTopCustomers: (params) => api.get('/dashboard/top-customers', { params }),
  getSalesTrend: (params) => api.get('/dashboard/sales-trend', { params }),
  getProductPerformance: (params) => api.get('/dashboard/product-performance', { params }),
  getSalesChannels: (params) => api.get('/dashboard/sales-channels', { params }),
  getSalesPeople: (params) => api.get('/dashboard/sales-people', { params }),
  getSubcategoryMargins: (params) => api.get('/dashboard/subcategory-margins', { params }),
  getOlapFacts: (params) => api.get('/dashboard/olap-facts', { params }),
};

export const entityApi = {
  getProducts: (page, size, sortBy, direction) => 
    api.get('/products', { params: { page, size, sortBy, direction } }),
  getCustomers: (page, size, sortBy, direction) => 
    api.get('/customers', { params: { page, size, sortBy, direction } }),
  getSalesOrders: (page, size, sortBy, direction) => 
    api.get('/sales-orders', { params: { page, size, sortBy, direction } }),
};

export default api;

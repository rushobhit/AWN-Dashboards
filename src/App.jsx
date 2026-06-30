import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import KpiGrid from './components/KpiGrid';
import DashboardCharts from './components/DashboardCharts';
import DataExplorer from './components/DataExplorer';
import DashboardSkeleton from './components/DashboardSkeleton';
import OlapAnalyzer from './components/OlapAnalyzer';
import { dashboardApi, entityApi } from './services/api';
import { Sparkles, Palette, Sun, Moon } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    territoryId: null,
    categoryName: null,
  });

  const [kpis, setKpis] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [salesByTerritory, setSalesByTerritory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [salesChannels, setSalesChannels] = useState([]);
  const [salesPeople, setSalesPeople] = useState([]);
  const [subcategoryMargins, setSubcategoryMargins] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleCategoryClick = (categoryName) => {
    setFilters((prev) => ({
      ...prev,
      categoryName: prev.categoryName === categoryName ? null : categoryName,
    }));
    triggerToast(
      filters.categoryName === categoryName
        ? 'Cleared category filter'
        : `Filtering by category: ${categoryName}`
    );
  };

  const handleTerritoryClick = (territoryName) => {
    const territoriesList = [
      { id: 1, name: 'Northwest' },
      { id: 2, name: 'Northeast' },
      { id: 3, name: 'Southwest' },
      { id: 4, name: 'Southeast' },
      { id: 5, name: 'Northwest Canada' },
      { id: 6, name: 'Canada' },
      { id: 7, name: 'France' },
      { id: 8, name: 'Germany' },
      { id: 9, name: 'Australia' },
      { id: 10, name: 'United Kingdom' },
    ];
    const match = territoriesList.find(
      (t) => t.name.toLowerCase() === territoryName.toLowerCase()
    );
    if (match) {
      setFilters((prev) => ({
        ...prev,
        territoryId: prev.territoryId === match.id ? null : match.id,
      }));
      triggerToast(
        filters.territoryId === match.id
          ? 'Cleared territory filter'
          : `Filtering by territory: ${match.name}`
      );
    }
  };

  // OLAP Facts state
  const [olapFacts, setOlapFacts] = useState([]);
  const [olapLoading, setOlapLoading] = useState(false);

  const getFilterParams = () => {
    const params = {};
    if (filters.startDate) params.startDate = `${filters.startDate}T00:00:00`;
    if (filters.endDate) params.endDate = `${filters.endDate}T23:59:59`;
    if (filters.territoryId) params.territoryId = parseInt(filters.territoryId);
    if (filters.categoryName) params.categoryName = filters.categoryName;
    return params;
  };

  const loadDashboardData = async () => {
    setLoading(true);
    const params = getFilterParams();
    try {
      const [
        resKpis,
        resMonthly,
        resCategory,
        resTerritory,
        resTopProd,
        resTopCust,
        resChannels,
        resPeople,
        resMargins,
        resTrend,
        resPerformance
      ] = await Promise.all([
        dashboardApi.getKpis(params),
        dashboardApi.getMonthlySales(params),
        dashboardApi.getSalesByCategory(params),
        dashboardApi.getSalesByTerritory(params),
        dashboardApi.getTopProducts(params),
        dashboardApi.getTopCustomers(params),
        dashboardApi.getSalesChannels(params),
        dashboardApi.getSalesPeople(params),
        dashboardApi.getSubcategoryMargins(params),
        dashboardApi.getSalesTrend(params),
        dashboardApi.getProductPerformance(params)
      ]);

      setKpis(resKpis.data);
      setMonthlySales(resMonthly.data);
      setSalesByCategory(resCategory.data);
      setSalesByTerritory(resTerritory.data);
      setTopProducts(resTopProd.data);
      setTopCustomers(resTopCust.data);
      setSalesChannels(resChannels.data);
      setSalesPeople(resPeople.data);
      setSubcategoryMargins(resMargins.data);
      setSalesTrend(resTrend.data);
      setProductPerformance(resPerformance.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOlapData = async () => {
    setOlapLoading(true);
    const params = getFilterParams();
    try {
      const res = await dashboardApi.getOlapFacts(params);
      setOlapFacts(res.data || []);
    } catch (err) {
      console.error('Failed to load OLAP facts:', err);
    } finally {
      setOlapLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    } else if (activeTab === 'olap') {
      loadOlapData();
    }
  }, [activeTab, filters]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'N/A';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(val);
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (val) => {
    if (!val) return 'N/A';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Define Columns for Data Explorers
  const productColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'productNumber', label: 'Product Number', sortable: true },
    { key: 'color', label: 'Color', format: (val) => val || 'N/A' },
    { key: 'listPrice', label: 'List Price', sortable: true, format: (val) => formatCurrency(val) },
  ];

  const customerColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'accountNumber', label: 'Account Number', sortable: true },
    { key: 'personId', label: 'Person ID', format: (val) => val || 'N/A' },
    { key: 'storeId', label: 'Store ID', format: (val) => val || 'N/A' },
  ];

  const orderColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'salesOrderNumber', label: 'Order Number', sortable: true },
    { key: 'orderDate', label: 'Order Date', sortable: true, format: (val) => formatDate(val) },
    { key: 'customerId', label: 'Customer ID', sortable: true },
    { key: 'totalDue', label: 'Total Due', sortable: true, format: (val) => formatCurrency(val) },
  ];

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      <main className="main-content">
        <header className="header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="mobile-menu-toggle"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="4" y1="5" x2="20" y2="5" />
                <line x1="4" y1="10" x2="20" y2="10" />
                <line x1="4" y1="15" x2="20" y2="15" />
                <line x1="4" y1="20" x2="20" y2="20" />
              </svg>
            </button>
            <div>
              <h1 className="view-title">
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'orders' && 'Sales Orders'}
                {activeTab === 'products' && 'Product Directory'}
                {activeTab === 'customers' && 'Customer Base'}
                {activeTab === 'olap' && 'OLAP Cube Analyzer'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                AWN Dashboards Enterprise Analytics System
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Portfolio-Style Theme Toggle Button */}
            <button
              className="theme-toggle"
              type="button"
              onClick={() => {
                const next = theme === 'light' ? 'dark' : 'light';
                setTheme(next);
                triggerToast(`Switched theme to ${next === 'dark' ? 'Dark Mode' : 'Light Mode'}`);
              }}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <span className={`theme-icon-wrapper ${theme}`}>
                {theme === 'light' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="theme-icon moon">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="theme-icon sun">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" /><path d="M12 20v2" />
                    <path d="M2 12h2" /><path d="M20 12h2" />
                    <path d="m4.9 4.9 1.4 1.4" /><path d="m17.7 17.7 1.4 1.4" />
                    <path d="m4.9 19.1 1.4-1.4" /><path d="m17.7 6.3 1.4-1.4" />
                  </svg>
                )}
              </span>
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <>
            <FilterBar
              filters={filters}
              setFilters={setFilters}
            />

            {loading && !kpis ? (
              <DashboardSkeleton />
            ) : (
              <>
                <KpiGrid kpis={kpis} />
                <DashboardCharts
                  monthlySales={monthlySales}
                  salesByCategory={salesByCategory}
                  salesByTerritory={salesByTerritory}
                  topProducts={topProducts}
                  topCustomers={topCustomers}
                  salesChannels={salesChannels}
                  salesPeople={salesPeople}
                  subcategoryMargins={subcategoryMargins}
                  salesTrend={salesTrend}
                  productPerformance={productPerformance}
                  onCategoryClick={handleCategoryClick}
                  onTerritoryClick={handleTerritoryClick}
                  activeFilters={filters}
                />
              </>
            )}
          </>
        )}

        {activeTab === 'olap' && (
          <OlapAnalyzer
            facts={olapFacts}
            loading={olapLoading}
            onRefresh={loadOlapData}
          />
        )}

        {activeTab === 'orders' && (
          <DataExplorer
            key="orders"
            title="Sales Orders Registry"
            columns={orderColumns}
            fetchData={entityApi.getSalesOrders}
            defaultSortBy="id"
          />
        )}

        {activeTab === 'products' && (
          <DataExplorer
            key="products"
            title="Products Catalog"
            columns={productColumns}
            fetchData={entityApi.getProducts}
            defaultSortBy="id"
          />
        )}

        {activeTab === 'customers' && (
          <DataExplorer
            key="customers"
            title="Customers Registry"
            columns={customerColumns}
            fetchData={entityApi.getCustomers}
            defaultSortBy="id"
          />
        )}
      </main>

      {showToast && (
        <div className="toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;

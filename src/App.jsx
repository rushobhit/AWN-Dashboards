import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import KpiGrid from './components/KpiGrid';
import DashboardCharts from './components/DashboardCharts';
import DataExplorer from './components/DataExplorer';
import DashboardSkeleton from './components/DashboardSkeleton';
import OlapAnalyzer from './components/OlapAnalyzer';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { dashboardApi, entityApi } from './services/api';


function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('awn-theme') || 'dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    territoryId: null,
    territoryId: null,
    categoryName: null,
  });
  const [granularity, setGranularity] = useState('month');

  const queryClient = useQueryClient();

  const getFilterParams = () => {
    const params = {};
    if (filters.startDate) params.startDate = `${filters.startDate}T00:00:00`;
    if (filters.endDate) params.endDate = `${filters.endDate}T23:59:59`;
    const tid = parseInt(filters.territoryId, 10);
    if (!isNaN(tid) && tid > 0) params.territoryId = tid;
    if (filters.categoryName) params.categoryName = filters.categoryName;
    return params;
  };

  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ['dashboard', filters],
    queryFn: async ({ signal }) => {
      const params = getFilterParams();
      const [
        resKpis, resMonthly, resCategory, resTerritory,
        resTopProd, resTopCust, resChannels, resPeople,
        resMargins, resPerformance
      ] = await Promise.all([
        dashboardApi.getKpis(params, signal),
        dashboardApi.getMonthlySales(params, signal),
        dashboardApi.getSalesByCategory(params, signal),
        dashboardApi.getSalesByTerritory(params, signal),
        dashboardApi.getTopProducts(params, signal),
        dashboardApi.getTopCustomers(params, signal),
        dashboardApi.getSalesChannels(params, signal),
        dashboardApi.getSalesPeople(params, signal),
        dashboardApi.getSubcategoryMargins(params, signal),
        dashboardApi.getProductPerformance(params, signal)
      ]);

      return {
        kpis: resKpis.data,
        monthlySales: resMonthly.data,
        salesByCategory: resCategory.data,
        salesByTerritory: resTerritory.data,
        topProducts: resTopProd.data,
        topCustomers: resTopCust.data,
        salesChannels: resChannels.data,
        salesPeople: resPeople.data,
        subcategoryMargins: resMargins.data,
        productPerformance: resPerformance.data
      };
    },
    placeholderData: keepPreviousData,
    enabled: activeTab === 'dashboard'
  });

  const { data: salesTrend = [], isLoading: trendLoading } = useQuery({
    queryKey: ['salesTrend', filters, granularity],
    queryFn: async ({ signal }) => {
      const params = getFilterParams();
      params.granularity = granularity;
      const res = await dashboardApi.getSalesTrend(params, signal);
      return res.data;
    },
    placeholderData: keepPreviousData,
    enabled: activeTab === 'dashboard'
  });

  const { data: olapFacts = [], isLoading: olapLoading } = useQuery({
    queryKey: ['olapFacts', filters],
    queryFn: async ({ signal }) => {
      const res = await dashboardApi.getOlapFacts(getFilterParams(), signal);
      return res.data || [];
    },
    placeholderData: keepPreviousData,
    enabled: activeTab === 'olap'
  });

  const { data: filterOptions } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: async ({ signal }) => {
      const res = await dashboardApi.getFilterOptions(signal);
      return res.data;
    }
  });

  const kpis = dashboardData?.kpis;
  const monthlySales = dashboardData?.monthlySales || [];
  const salesByCategory = dashboardData?.salesByCategory || [];
  const salesByTerritory = dashboardData?.salesByTerritory || [];
  const topProducts = dashboardData?.topProducts || [];
  const topCustomers = dashboardData?.topCustomers || [];
  const salesChannels = dashboardData?.salesChannels || [];
  const salesPeople = dashboardData?.salesPeople || [];
  const subcategoryMargins = dashboardData?.subcategoryMargins || [];
  const productPerformance = dashboardData?.productPerformance || [];

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCategoryClick = (categoryName) => {
    setFilters((prev) => {
      const isClearing = prev.categoryName === categoryName;
      triggerToast(isClearing ? 'Cleared category filter' : `Filtering by: ${categoryName}`);
      return { ...prev, categoryName: isClearing ? null : categoryName };
    });
  };

  const handleTerritoryClick = (territoryName) => {
    // Dynamic territory resolution from filterOptions
    const territories = filterOptions?.territories || [];
    const match = territories.find(
      (t) => t.name.toLowerCase() === territoryName.toLowerCase()
    );
    if (match) {
      setFilters((prev) => {
        const isClearing = prev.territoryId === match.id;
        triggerToast(isClearing ? 'Cleared territory filter' : `Filtering by: ${match.name}`);
        return { ...prev, territoryId: isClearing ? null : match.id };
      });
    }
  };

  const handlePeriodClick = (periodStr) => {
    if (!periodStr) return;
    
    let nextGranularity = granularity;
    let startDate, endDate;

    try {
      if (granularity === 'year') {
        // e.g. "2012"
        const year = parseInt(periodStr, 10);
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
        nextGranularity = 'month'; // drill down to month
      } else if (granularity === 'quarter') {
        // e.g. "2012 Q3"
        const parts = periodStr.split(' ');
        const year = parseInt(parts[0], 10);
        const q = parseInt(parts[1].replace('Q', ''), 10);
        const startMonth = (q - 1) * 3 + 1;
        const endMonth = q * 3;
        startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`;
        const end = new Date(year, endMonth, 0);
        endDate = `${year}-${String(endMonth).padStart(2, '0')}-${end.getDate()}`;
        nextGranularity = 'month'; // drill down to month
      } else if (granularity === 'month') {
        // e.g. "2012-05"
        const [year, month] = periodStr.split('-');
        startDate = `${year}-${month}-01`;
        const end = new Date(year, month, 0);
        endDate = `${year}-${month}-${end.getDate()}`;
        nextGranularity = 'day'; // drill down to day
      } else if (granularity === 'week') {
        // e.g. "2012-23"
        // Postgres ISO week is tough to parse precisely in plain JS without a library.
        // As a fallback, we just don't set dates and let them know.
        triggerToast(`Week drilldown not fully supported yet.`);
        return;
      } else if (granularity === 'day') {
        // e.g. "2012-05-13"
        startDate = periodStr;
        endDate = periodStr;
        nextGranularity = 'day'; // stay on day
      }

      setFilters((prev) => {
        triggerToast(`Drilled down into: ${periodStr}`);
        return { ...prev, startDate, endDate };
      });
      if (nextGranularity !== granularity) {
        setGranularity(nextGranularity);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        queryClient.invalidateQueries(['dashboard']);
        queryClient.invalidateQueries(['olapFacts']);
        triggerToast('Refreshing dashboard data...');
      }
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
        setShowToast(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [queryClient]);

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
    { key: 'productId', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'productNumber', label: 'Product Number', sortable: true },
    { key: 'color', label: 'Color', format: (val) => val || 'N/A' },
    { key: 'listPrice', label: 'List Price', sortable: true, format: (val) => formatCurrency(val) },
  ];

  const customerColumns = [
    { key: 'customerId', label: 'ID', sortable: true },
    { key: 'accountNumber', label: 'Account Number', sortable: true },
    { key: 'personId', label: 'Person ID', sortable: true, format: (val) => val || 'N/A' },
    { key: 'storeId', label: 'Store ID', sortable: true, format: (val) => val || 'N/A' },
  ];

  const orderColumns = [
    { key: 'salesOrderId', label: 'ID', sortable: true },
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
                localStorage.setItem('awn-theme', next);
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
              filterOptions={filterOptions}
            />

            {loading ? (
              <DashboardSkeleton />
            ) : (
              <>
                <KpiGrid kpis={kpis} monthlySales={monthlySales} salesTrend={salesTrend} />
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
                  onMonthClick={handlePeriodClick}
                  activeFilters={filters}
                  granularity={granularity}
                  setGranularity={setGranularity}
                  trendLoading={trendLoading}
                />
              </>
            )}
          </>
        )}

        {activeTab === 'olap' && (
          <OlapAnalyzer
            facts={olapFacts}
            loading={olapLoading}
            onRefresh={() => queryClient.invalidateQueries(['olapFacts'])}
          />
        )}

        {activeTab === 'orders' && (
          <DataExplorer
            key="orders"
            title="Sales Orders Registry"
            columns={orderColumns}
            fetchData={entityApi.getSalesOrders}
            defaultSortBy="salesOrderId"
          />
        )}

        {activeTab === 'products' && (
          <DataExplorer
            key="products"
            title="Products Catalog"
            columns={productColumns}
            fetchData={entityApi.getProducts}
            defaultSortBy="productId"
          />
        )}

        {activeTab === 'customers' && (
          <DataExplorer
            key="customers"
            title="Customers Registry"
            columns={customerColumns}
            fetchData={entityApi.getCustomers}
            defaultSortBy="customerId"
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

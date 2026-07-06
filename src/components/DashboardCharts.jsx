import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Trophy, Layers, Activity } from 'lucide-react';
import { ChartSkeleton } from './DashboardSkeleton';
import EmptyState from './EmptyState';

const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

// Static mapping for clean, fast in-memory slicing
const subcategoryToCategoryMap = {
  'Mountain Bikes': 'Bikes',
  'Road Bikes': 'Bikes',
  'Touring Bikes': 'Bikes',
  'Helmets': 'Accessories',
  'Bottles and Cages': 'Accessories',
  'Cleaners': 'Accessories',
  'Fenders': 'Accessories',
  'Hydration Packs': 'Accessories',
  'Locks': 'Accessories',
  'Lights': 'Accessories',
  'Pumps': 'Accessories',
  'Tires and Tubes': 'Accessories',
  'Bib-Shorts': 'Clothing',
  'Caps': 'Clothing',
  'Gloves': 'Clothing',
  'Jerseys': 'Clothing',
  'Socks': 'Clothing',
  'Tights': 'Clothing',
  'Vests': 'Clothing',
  'Bottom Brackets': 'Components',
  'Brakes': 'Components',
  'Chains': 'Components',
  'Cranksets': 'Components',
  'Derailleurs': 'Components',
  'Forks': 'Components',
  'Handlebars': 'Components',
  'Headsets': 'Components',
  'Mountain Frames': 'Components',
  'Road Frames': 'Components',
  'Touring Frames': 'Components',
  'Pedals': 'Components',
  'Saddles': 'Components',
  'Spokes': 'Components',
  'Wheels': 'Components'
};

const territoryToRegionMap = {
  'Northwest': 'N. America',
  'Northeast': 'N. America',
  'Southwest': 'N. America',
  'Southeast': 'N. America',
  'Canada': 'N. America',
  'Northwest Canada': 'N. America',
  'France': 'Europe',
  'Germany': 'Europe',
  'United Kingdom': 'Europe',
  'Australia': 'Pacific'
};



const DashboardCharts = ({
  monthlySales,
  salesByCategory,
  salesByTerritory,
  topProducts,
  topCustomers,
  salesChannels,
  salesPeople,
  subcategoryMargins,
  salesTrend,
  productPerformance,
  onCategoryClick,
  onTerritoryClick,
  onMonthClick,
  loading,
  granularity,
  setGranularity,
  trendLoading
}) => {
  const [timeSlice, setTimeSlice] = useState('All');
  const [subcategoryCategorySlice, setSubcategoryCategorySlice] = useState('All');
  const [productCategorySlice, setProductCategorySlice] = useState('All');
  const [territoryRegionSlice, setTerritoryRegionSlice] = useState('All');

  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const isDark = theme === 'dark';
  const textColor = isDark ? '#9ca3af' : '#4b5563';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // --- Filtered Data ---
  const filteredTrendData = useMemo(() => {
    const rawData = salesTrend && salesTrend.length > 0 ? salesTrend : monthlySales;
    if (!rawData || rawData.length === 0) return [];
    if (timeSlice === 'All') return rawData;
    const limit = timeSlice === '12M' ? 12 : (timeSlice === '6M' ? 6 : 3);
    return rawData.slice(-limit);
  }, [salesTrend, monthlySales, timeSlice]);

  const filteredSubcategoryData = useMemo(() => {
    if (!subcategoryMargins) return [];
    if (subcategoryCategorySlice === 'All') return subcategoryMargins;
    return subcategoryMargins.filter((item) => subcategoryToCategoryMap[item.subcategoryName] === subcategoryCategorySlice);
  }, [subcategoryMargins, subcategoryCategorySlice]);

  const productCategoriesList = useMemo(() => {
    const cats = new Set();
    if (productPerformance) {
      productPerformance.forEach((p) => { if (p.categoryName) cats.add(p.categoryName); });
    }
    return ['All', ...Array.from(cats)].sort();
  }, [productPerformance]);

  const filteredProductData = useMemo(() => {
    if (!productPerformance) return [];
    if (productCategorySlice === 'All') return productPerformance;
    return productPerformance.filter((p) => p.categoryName === productCategorySlice);
  }, [productPerformance, productCategorySlice]);

  const filteredTerritoryData = useMemo(() => {
    if (!salesByTerritory) return [];
    if (territoryRegionSlice === 'All') return salesByTerritory;
    return salesByTerritory.filter((item) => territoryToRegionMap[item.territoryName] === territoryRegionSlice);
  }, [salesByTerritory, territoryRegionSlice]);

  // --- ECharts Options ---
  const trendOption = {
    tooltip: { trigger: 'axis', formatter: (params) => `${params[0].name}<br/><b>${formatCurrency(params[0].value)}</b>` },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: filteredTrendData.map(d => d.period || d.month), axisLine: { lineStyle: { color: textColor } } },
    yAxis: { type: 'value', axisLabel: { formatter: (value) => `$${value / 1000}k` }, axisLine: { show: false }, splitLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } } },
    series: [{
      data: filteredTrendData.map(d => d.revenue),
      type: 'line',
      smooth: true,
      itemStyle: { color: '#6366f1' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(99, 102, 241, 0.5)' }, { offset: 1, color: 'rgba(99, 102, 241, 0)' }]
        }
      }
    }]
  };

  const channelsOption = {
    tooltip: { trigger: 'item', formatter: (params) => `${params.name}<br/><b>${formatCurrency(params.value)}</b>` },
    legend: { top: 'bottom', textStyle: { color: textColor } },
    color: CHART_COLORS,
    series: [{
      name: 'Channels',
      type: 'pie',
      radius: ['45%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', formatter: '{b}\n{d}%' } },
      labelLine: { show: false },
      data: salesChannels.map(c => ({ value: c.revenue, name: c.channel }))
    }]
  };

  const categoryOption = {
    tooltip: { trigger: 'item', formatter: (params) => `${params.name}<br/><b>${formatCurrency(params.value)}</b>` },
    legend: { top: 'bottom', textStyle: { color: textColor } },
    color: CHART_COLORS,
    series: [{
      name: 'Category',
      type: 'pie',
      selectedMode: 'single',
      radius: ['35%', '60%'],
      center: ['50%', '45%'],
      label: { formatter: '{b}\n{d}%', color: textColor },
      data: salesByCategory.map(c => ({ value: c.sales, name: c.categoryName })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }]
  };

  const territoryOption = {
    tooltip: { trigger: 'axis', formatter: (params) => `${params[0].name}<br/><b>${formatCurrency(params[0].value)}</b>` },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: filteredTerritoryData.map(d => d.territoryName), axisLine: { lineStyle: { color: textColor } }, axisLabel: { interval: 0, rotate: 30 } },
    yAxis: { type: 'value', axisLabel: { formatter: (value) => `$${value / 1000}k` }, splitLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } } },
    series: [{
      data: filteredTerritoryData.map(d => d.sales),
      type: 'bar',
      itemStyle: { color: '#06b6d4', borderRadius: [4, 4, 0, 0] },
      emphasis: { itemStyle: { color: '#6366f1' } }
    }]
  };

  const subcategoryOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: textColor }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '12%', containLabel: true },
    dataZoom: [{ type: 'slider', show: true, bottom: 0, height: 20, start: 0, end: 40, textStyle: { color: textColor } }],
    xAxis: { type: 'category', data: filteredSubcategoryData.map(d => d.subcategoryName), axisLine: { lineStyle: { color: textColor } }, axisLabel: { interval: 0, rotate: 45 } },
    yAxis: { type: 'value', axisLabel: { formatter: (value) => `$${value / 1000}k` }, splitLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } } },
    series: [
      { name: 'Revenue', type: 'bar', data: filteredSubcategoryData.map(d => d.revenue), itemStyle: { color: '#6366f1' } },
      { name: 'Cost', type: 'bar', data: filteredSubcategoryData.map(d => d.cost), itemStyle: { color: '#f43f5e' } },
      { name: 'Profit', type: 'bar', data: filteredSubcategoryData.map(d => d.profit), itemStyle: { color: '#10b981' } }
    ]
  };

  const scatterOption = {
    tooltip: {
      formatter: (params) => {
        const d = params.data;
        return `<b>${d[3]}</b><br/>Sales: ${formatCurrency(d[0])}<br/>Margin: ${formatCurrency(d[1])}<br/>Qty: ${d[2]}`;
      }
    },
    grid: { left: '5%', right: '5%', bottom: '5%', top: '10%', containLabel: true },
    xAxis: { name: 'Total Sales', type: 'value', axisLabel: { formatter: (value) => `$${value / 1000}k` }, splitLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } } },
    yAxis: { name: 'Net Margin', type: 'value', axisLabel: { formatter: (value) => `$${value / 1000}k` }, splitLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } } },
    series: [{
      type: 'scatter',
      symbolSize: function (data) {
        // dynamic sizing based on quantity
        return Math.max(10, Math.min(45, (data[2] || 1) / 100));
      },
      data: filteredProductData.map(d => [d.totalSales, d.margin, d.totalQuantity, d.productName]),
      itemStyle: { color: '#06b6d4', opacity: 0.7 }
    }]
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="dashboard-grid"><ChartSkeleton height={380} /><ChartSkeleton height={380} /></div>
        <ChartSkeleton height={400} />
      </div>
    );
  }

  return (
    <div id="dashboard-charts-wrapper">

      <div className="dashboard-grid">
        <div className="glass-card chart-card">
          <div className="chart-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: 'var(--accent-indigo)' }} />
              <span className="chart-title">Revenue Trend</span>
              {trendLoading && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>(Loading...)</span>}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRight: '1px solid var(--border-color)', paddingRight: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Granularity:</span>
                {['Year', 'Quarter', 'Month', 'Week', 'Day'].map((g) => {
                  const val = g.toLowerCase();
                  return (
                    <button
                      key={g}
                      onClick={() => setGranularity && setGranularity(val)}
                      style={{
                        padding: '4px 8px', fontSize: '11px', borderRadius: '4px',
                        backgroundColor: granularity === val ? 'var(--accent-indigo)' : 'transparent',
                        color: granularity === val ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)', cursor: 'pointer',
                      }}
                    >{g}</button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Range:</span>
                {['All', '12', '6', '3'].map((slice) => {
                  // If slice is 'All', label is 'All'. Otherwise, we just use the number and assume it's whatever the granularity is.
                  // E.g. '12' means 'Last 12 Years/Months/Weeks/Days' depending on granularity.
                  const label = slice === 'All' ? 'All' : `Last ${slice}`;
                  const val = slice === 'All' ? 'All' : slice + 'M'; // keeping 'M' as a hack to re-use timeSlice logic for now
                  return (
                    <button
                      key={slice}
                      onClick={() => setTimeSlice(val)}
                      style={{
                        padding: '4px 8px', fontSize: '11px', borderRadius: '4px',
                        backgroundColor: timeSlice === val ? 'var(--accent-indigo)' : 'transparent',
                        color: timeSlice === val ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)', cursor: 'pointer',
                      }}
                    >{label}</button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {filteredTrendData.length === 0 ? <EmptyState /> : (
              <ReactECharts 
                option={trendOption} 
                style={{ height: '300px' }} 
                theme={isDark ? 'dark' : ''} 
                onEvents={{ 'click': (params) => onMonthClick && onMonthClick(params.name) }}
              />
            )}
          </div>
        </div>

        <div className="glass-card chart-card">
          <div className="chart-header">
            <span className="chart-title">Sales Channels</span>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {salesChannels.length === 0 ? <EmptyState /> : <ReactECharts option={channelsOption} style={{ height: '300px' }} theme={isDark ? 'dark' : ''} />}
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="glass-card chart-card" style={{ height: 'auto', minHeight: '420px' }}>
          <div className="chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} style={{ color: '#f59e0b' }} />
              <span className="chart-title">Sales Rep Leaderboard</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '350px', paddingRight: '4px' }}>
            {salesPeople.length === 0 ? (
              <EmptyState message="No salespeople records found." />
            ) : (
              salesPeople.map((person, idx) => {
                const quotaAchieved = person.quota > 0 ? (person.totalSales / person.quota) * 100 : 100;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{person.salesPersonName}</span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Bonus Earned: {formatCurrency(person.bonus)}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-teal)', fontSize: '14px' }}>{formatCurrency(person.totalSales)}</span>
                      </div>
                    </div>
                    {person.quota > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(quotaAchieved, 100)}%`, height: '100%', background: 'linear-gradient(to right, var(--accent-indigo), var(--accent-teal))' }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-indigo)', width: '36px' }}>{Math.round(quotaAchieved)}%</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="glass-card chart-card">
          <div className="chart-header">
            <span className="chart-title">Sales by Category</span>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {salesByCategory.length === 0 ? <EmptyState /> : (
              <ReactECharts 
                option={categoryOption} 
                style={{ height: '300px' }} 
                theme={isDark ? 'dark' : ''} 
                onEvents={{ 'click': (params) => onCategoryClick && onCategoryClick(params.name) }} 
              />
            )}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div className="chart-header" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'var(--accent-indigo)' }} />
            <span className="chart-title">Subcategory Margin Analysis</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {['All', 'Bikes', 'Components', 'Clothing', 'Accessories'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSubcategoryCategorySlice(cat)}
                style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', backgroundColor: subcategoryCategorySlice === cat ? 'var(--accent-indigo)' : 'transparent', color: subcategoryCategorySlice === cat ? '#ffffff' : 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
              >{cat}</button>
            ))}
          </div>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          {filteredSubcategoryData.length === 0 ? <EmptyState /> : (
            <ReactECharts 
              option={subcategoryOption} 
              style={{ height: '350px' }} 
              theme={isDark ? 'dark' : ''} 
              onEvents={{ 'click': (params) => {
                const cat = subcategoryToCategoryMap[params.name];
                if (cat && onCategoryClick) {
                  onCategoryClick(cat);
                }
              }}}
            />
          )}
        </div>
      </div>

      {productPerformance && productPerformance.length > 0 && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div className="chart-header" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--accent-teal)' }} />
              <span className="chart-title">Product Profit Margin Breakdown</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {productCategoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setProductCategorySlice(cat)}
                  style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', backgroundColor: productCategorySlice === cat ? 'var(--accent-indigo)' : 'transparent', color: productCategorySlice === cat ? '#ffffff' : 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                >{cat}</button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            {filteredProductData.length === 0 ? <EmptyState /> : <ReactECharts option={scatterOption} style={{ height: '350px' }} theme={isDark ? 'dark' : ''} />}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="glass-card chart-card">
          <div className="chart-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="chart-title">Sales by Territory</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {['All', 'N. America', 'Europe', 'Pacific'].map((reg) => (
                <button
                  key={reg}
                  onClick={() => setTerritoryRegionSlice(reg)}
                  style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '6px', backgroundColor: territoryRegionSlice === reg ? 'var(--accent-indigo)' : 'transparent', color: territoryRegionSlice === reg ? '#ffffff' : 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                >{reg}</button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {filteredTerritoryData.length === 0 ? <EmptyState /> : (
              <ReactECharts 
                option={territoryOption} 
                style={{ height: '300px' }} 
                theme={isDark ? 'dark' : ''} 
                onEvents={{ 'click': (params) => onTerritoryClick && onTerritoryClick(params.name) }} 
              />
            )}
          </div>
        </div>

        <div className="glass-card chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div className="chart-header" style={{ marginBottom: '14px' }}><span className="chart-title" style={{ fontSize: '15px' }}>Top Performing Products</span></div>
            <div className="ranking-list">
              {topProducts.length === 0 ? <EmptyState message="No products found." /> : topProducts.slice(0, 3).map((prod, idx) => (
                <div key={idx} className="ranking-item">
                  <div className="item-info">
                    <span className="item-name">{prod.productName}</span>
                    <span className="item-subtext">No: {prod.productNumber}</span>
                  </div>
                  <div className="item-value">
                    <div>{formatCurrency(prod.totalSales)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 500 }}>Qty: {prod.totalQuantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="chart-header" style={{ marginBottom: '14px' }}><span className="chart-title" style={{ fontSize: '15px' }}>Top Customers</span></div>
            <div className="ranking-list">
              {topCustomers.length === 0 ? <EmptyState message="No customers found." /> : topCustomers.slice(0, 3).map((cust, idx) => (
                <div key={idx} className="ranking-item">
                  <div className="item-info">
                    <span className="item-name">{cust.customerName}</span>
                    <span className="item-subtext">ID: {cust.customerId}</span>
                  </div>
                  <div className="item-value">
                    <div>{formatCurrency(cust.totalSpend)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-indigo)', fontWeight: 500 }}>Orders: {cust.totalOrders}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;

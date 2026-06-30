import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  Sector,
} from 'recharts';
import { Trophy, Layers, Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  const name = payload.categoryName || payload.channel;
  
  return (
    <g>
      <text
        x={cx}
        y={cy - 12}
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="10"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.08em"
      >
        {name.length > 15 ? name.substring(0, 12) + '...' : name}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="var(--text-primary)"
        fontSize="16"
        fontWeight="800"
      >
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(value)}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 3}
        outerRadius={innerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

// Static subcategory mapping for clean, fast in-memory slicing
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
  activeFilters,
}) => {
  const [categoryActiveIndex, setCategoryActiveIndex] = useState(0);
  const [channelActiveIndex, setChannelActiveIndex] = useState(0);
  const [territoryHoverIndex, setTerritoryHoverIndex] = useState(null);

  // Chart Slicer states
  const [timeSlice, setTimeSlice] = useState('All');
  const [subcategoryCategorySlice, setSubcategoryCategorySlice] = useState('All');
  const [productCategorySlice, setProductCategorySlice] = useState('All');
  const [territoryRegionSlice, setTerritoryRegionSlice] = useState('All');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(15, 17, 24, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-color)',
          padding: '12px 16px',
          borderRadius: '10px',
          color: '#f3f4f6',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontSize: '13px'
        }}>
          <p style={{ fontWeight: 700, marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px' }}>{label}</p>
          {payload.map((item, idx) => (
            <p key={idx} style={{ color: item.color || '#6366f1', margin: '4px 0', display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
              <span>{item.name}:</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(item.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 1. Slicer filter: Monthly Trend Chart
  const filteredTrendData = useMemo(() => {
    const rawData = salesTrend && salesTrend.length > 0 ? salesTrend : monthlySales;
    if (!rawData || rawData.length === 0) return [];
    if (timeSlice === 'All') return rawData;
    
    const limit = timeSlice === '12M' ? 12 : (timeSlice === '6M' ? 6 : 3);
    return rawData.slice(-limit);
  }, [salesTrend, monthlySales, timeSlice]);

  // 2. Slicer filter: Subcategory Margins Chart
  const filteredSubcategoryData = useMemo(() => {
    if (!subcategoryMargins) return [];
    if (subcategoryCategorySlice === 'All') return subcategoryMargins;
    return subcategoryMargins.filter((item) => {
      const parentCat = subcategoryToCategoryMap[item.subcategoryName];
      return parentCat === subcategoryCategorySlice;
    });
  }, [subcategoryMargins, subcategoryCategorySlice]);

  // 3. Slicer filter: Dynamic Category labels on Products Margins
  const productCategoriesList = useMemo(() => {
    const cats = new Set();
    if (productPerformance) {
      productPerformance.forEach((p) => {
        if (p.categoryName) cats.add(p.categoryName);
      });
    }
    return ['All', ...Array.from(cats)].sort();
  }, [productPerformance]);

  const filteredProductData = useMemo(() => {
    if (!productPerformance) return [];
    if (productCategorySlice === 'All') return productPerformance;
    return productPerformance.filter((p) => p.categoryName === productCategorySlice);
  }, [productPerformance, productCategorySlice]);

  // 4. Slicer filter: Regions mapping on Territories
  const filteredTerritoryData = useMemo(() => {
    if (!salesByTerritory) return [];
    if (territoryRegionSlice === 'All') return salesByTerritory;
    return salesByTerritory.filter((item) => {
      const region = territoryToRegionMap[item.territoryName];
      return region === territoryRegionSlice;
    });
  }, [salesByTerritory, territoryRegionSlice]);

  return (
    <>
      {/* SECTION 1: Key Trends & Channels */}
      <div className="dashboard-grid">
        {/* Monthly Revenue Trend (Clean Area Chart with Time Slicers) */}
        <div className="glass-card chart-card">
          <div className="chart-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: 'var(--accent-indigo)' }} />
              <span className="chart-title">Revenue Trend</span>
            </div>
            
            {/* Time Slicers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {['All', '12M', '6M', '3M'].map((slice) => (
                <button
                  key={slice}
                  onClick={() => setTimeSlice(slice)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    backgroundColor: timeSlice === slice ? 'var(--accent-indigo)' : 'transparent',
                    color: timeSlice === slice ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {slice}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={filteredTrendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-indigo)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--accent-indigo)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey={salesTrend && salesTrend.length > 0 ? 'period' : 'month'} stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--accent-indigo)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Channels (Interactive Donut) */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <span className="chart-title">Sales Channels</span>
          </div>
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  activeIndex={channelActiveIndex}
                  activeShape={renderActiveShape}
                  data={salesChannels}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="revenue"
                  nameKey="channel"
                  onMouseEnter={(_, idx) => setChannelActiveIndex(idx)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {salesChannels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {salesChannels.map((item, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setChannelActiveIndex(idx)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: channelActiveIndex === idx ? 'rgba(255,255,255,0.04)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: COLORS[idx % COLORS.length]
                  }} />
                  <span style={{ color: '#9ca3af', fontWeight: channelActiveIndex === idx ? 600 : 500 }}>
                    {item.channel}
                  </span>
                </div>
                <span style={{ fontWeight: 700, color: '#f3f4f6' }}>{formatCurrency(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: Leaderboard & Category Share */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Sales Rep Leaderboard with Target progress bar */}
        <div className="glass-card chart-card" style={{ height: 'auto', minHeight: '420px' }}>
          <div className="chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} style={{ color: '#f59e0b' }} />
              <span className="chart-title">Sales Rep Leaderboard</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '350px', paddingRight: '4px' }}>
            {salesPeople.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>No salespeople records found.</div>
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
                        {person.quota > 0 && (
                          <span style={{ display: 'block', fontSize: '10px', color: '#9ca3af' }}>Quota: {formatCurrency(person.quota)}</span>
                        )}
                      </div>
                    </div>
                    {person.quota > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          flex: 1,
                          height: '6px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(quotaAchieved, 100)}%`,
                            height: '100%',
                            background: quotaAchieved >= 100 ? 
                              'linear-gradient(to right, #10b981, #059669)' : 
                              'linear-gradient(to right, var(--accent-indigo), var(--accent-teal))',
                            borderRadius: '3px'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: quotaAchieved >= 100 ? '#10b981' : 'var(--accent-indigo)', width: '36px', textAlign: 'right' }}>
                          {Math.round(quotaAchieved)}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Category breakdown (Interactive clicks) */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <span className="chart-title">Sales by Category</span>
            {activeFilters?.categoryName ? (
              <span 
                onClick={() => onCategoryClick && onCategoryClick(activeFilters.categoryName)}
                style={{ fontSize: '11px', color: 'var(--accent-indigo)', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600 }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-indigo)' }}></span>
                Filtered: {activeFilters.categoryName} (Clear)
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Click slice to filter</span>
            )}
          </div>
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  activeIndex={categoryActiveIndex}
                  activeShape={renderActiveShape}
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="sales"
                  nameKey="categoryName"
                  onMouseEnter={(_, idx) => setCategoryActiveIndex(idx)}
                  onClick={(data) => onCategoryClick && onCategoryClick(data.categoryName)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {salesByCategory.map((entry, index) => {
                    const isSelected = activeFilters?.categoryName === entry.categoryName;
                    const defaultColor = COLORS[index % COLORS.length];
                    let sliceColor = defaultColor;
                    if (isSelected) {
                      sliceColor = 'var(--accent-indigo)';
                    } else if (categoryActiveIndex === index) {
                      sliceColor = `color-mix(in srgb, ${defaultColor} 80%, white)`;
                    }
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={sliceColor}
                        style={{ cursor: 'pointer', outline: 'none', transition: 'fill 0.15s ease' }}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {salesByCategory.slice(0, 4).map((item, idx) => {
              const isSelected = activeFilters?.categoryName === item.categoryName;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setCategoryActiveIndex(idx)}
                  onClick={() => onCategoryClick && onCategoryClick(item.categoryName)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : (categoryActiveIndex === idx ? 'rgba(255,255,255,0.04)' : 'transparent'),
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: isSelected ? 'var(--accent-indigo)' : COLORS[idx % COLORS.length]
                    }} />
                    <span style={{ color: isSelected ? 'var(--accent-indigo)' : '#9ca3af', fontWeight: (categoryActiveIndex === idx || isSelected) ? 700 : 500 }}>
                      {item.categoryName}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: isSelected ? 'var(--accent-indigo)' : '#f3f4f6' }}>{formatCurrency(item.sales)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: Subcategory Margin Analysis (Slices by Parent Category) */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div className="chart-header" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'var(--accent-indigo)' }} />
            <span className="chart-title">Subcategory Margin Analysis</span>
          </div>

          {/* Subcategory Margin Slicer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {['All', 'Bikes', 'Components', 'Clothing', 'Accessories'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSubcategoryCategorySlice(cat)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  backgroundColor: subcategoryCategorySlice === cat ? 'var(--accent-indigo)' : 'transparent',
                  color: subcategoryCategorySlice === cat ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <BarChart data={filteredSubcategoryData}>
              <XAxis dataKey="subcategoryName" stroke="#6b7280" fontSize={10} tickLine={false} />
              <YAxis
                stroke="#6b7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="revenue" fill="var(--accent-indigo)" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="cost" fill="var(--accent-rose)" radius={[4, 4, 0, 0]} name="Cost of Goods" />
              <Bar dataKey="profit" fill="var(--accent-emerald)" radius={[4, 4, 0, 0]} name="Net Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 3B: Product Performance Margins Breakdown (Slices by Dynamic Category) */}
      {productPerformance && productPerformance.length > 0 && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div className="chart-header" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--accent-teal)' }} />
              <span className="chart-title">Product Profit Margin Breakdown</span>
            </div>

            {/* Dynamic Product Category Slicer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {productCategoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setProductCategorySlice(cat)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    backgroundColor: productCategorySlice === cat ? 'var(--accent-indigo)' : 'transparent',
                    color: productCategorySlice === cat ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={filteredProductData.slice(0, 10)}>
                <XAxis 
                  dataKey="productName" 
                  stroke="#6b7280" 
                  fontSize={10} 
                  tickLine={false} 
                  tickFormatter={(val) => val.length > 15 ? val.substring(0, 12) + '...' : val}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip formatter={(value, name) => [formatCurrency(value), name === 'totalSales' ? 'Total Sales' : 'Profit Margin']} cursor={false} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="totalSales" fill="var(--accent-indigo)" radius={[4, 4, 0, 0]} name="Total Sales" />
                <Bar dataKey="margin" fill="var(--accent-teal)" radius={[4, 4, 0, 0]} name="Net Profit Margin" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SECTION 4: Territory Performance & Rankings */}
      <div className="dashboard-grid">
        {/* Territory Bar Chart (Slices by Continent Region) */}
        <div className="glass-card chart-card">
          <div className="chart-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="chart-title">Sales by Territory</span>
              {activeFilters?.territoryId ? (
                <span 
                  onClick={() => {
                    const match = Object.keys(territoryToRegionMap).find((_, index) => index + 1 === activeFilters.territoryId);
                    if (match) onTerritoryClick && onTerritoryClick(match);
                  }}
                  style={{ fontSize: '11px', color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600 }}
                >
                  (Filtered)
                </span>
              ) : null}
            </div>

            {/* Territory Continent Slicer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {['All', 'N. America', 'Europe', 'Pacific'].map((reg) => (
                <button
                  key={reg}
                  onClick={() => setTerritoryRegionSlice(reg)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    borderRadius: '6px',
                    backgroundColor: territoryRegionSlice === reg ? 'var(--accent-indigo)' : 'transparent',
                    color: territoryRegionSlice === reg ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={filteredTerritoryData}>
                <XAxis dataKey="territoryName" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar
                  dataKey="sales"
                  radius={[4, 4, 0, 0]}
                  name="Sales Revenue"
                  onClick={(data) => onTerritoryClick && onTerritoryClick(data.territoryName)}
                >
                  {filteredTerritoryData.map((entry, index) => {
                    const matchedTerritoryIndex = salesByTerritory.findIndex(t => t.territoryName === entry.territoryName);
                    const isSelected = activeFilters?.territoryId === (matchedTerritoryIndex + 1);
                    let barColor = 'var(--accent-teal)';
                    if (isSelected) {
                      barColor = 'var(--accent-indigo)';
                    } else if (territoryHoverIndex === index) {
                      barColor = 'color-mix(in srgb, var(--accent-teal) 80%, white)';
                    }
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={barColor}
                        style={{ cursor: 'pointer', transition: 'fill 0.15s ease' }}
                        onMouseEnter={() => setTerritoryHoverIndex(index)}
                        onMouseLeave={() => setTerritoryHoverIndex(null)}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Rankings Panel */}
        <div className="glass-card chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div className="chart-header" style={{ marginBottom: '14px' }}>
              <span className="chart-title" style={{ fontSize: '15px' }}>Top Performing Products</span>
            </div>
            <div className="ranking-list">
              {topProducts.slice(0, 3).map((prod, idx) => (
                <div key={idx} className="ranking-item">
                  <div className="item-info">
                    <span className="item-name">{prod.productName}</span>
                    <span className="item-subtext">No: {prod.productNumber}</span>
                  </div>
                  <div className="item-value">
                    <div>{formatCurrency(prod.totalSales)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 500 }}>
                      Qty: {prod.totalQuantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="chart-header" style={{ marginBottom: '14px' }}>
              <span className="chart-title" style={{ fontSize: '15px' }}>Top Customers</span>
            </div>
            <div className="ranking-list">
              {topCustomers.slice(0, 3).map((cust, idx) => (
                <div key={idx} className="ranking-item">
                  <div className="item-info">
                    <span className="item-name">{cust.customerName}</span>
                    <span className="item-subtext">ID: {cust.customerId}</span>
                  </div>
                  <div className="item-value">
                    <div>{formatCurrency(cust.totalSpend)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-indigo)', fontWeight: 500 }}>
                      Orders: {cust.totalOrders}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardCharts;

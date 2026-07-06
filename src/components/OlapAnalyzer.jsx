import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Layers, RefreshCw, Filter } from 'lucide-react';

const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

const OlapAnalyzer = ({ facts, loading, onRefresh }) => {
  const [rowDim, setRowDim] = useState('categoryName');
  const [colDim, setColDim] = useState('channel');
  const [measure, setMeasure] = useState('revenue');
  const [chartType, setChartType] = useState('stacked'); // 'stacked', 'grouped', 'area'

  // Multi-select slicing filters
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTerritories, setSelectedTerritories] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);

  // Extract unique values for filter lists
  const filterOptions = useMemo(() => {
    const categories = new Set();
    const territories = new Set();
    const channels = new Set();

    const factsList = Array.isArray(facts) ? facts : [];
    factsList.forEach((item) => {
      if (item) {
        if (item.categoryName) categories.add(item.categoryName);
        if (item.territoryName) territories.add(item.territoryName);
        if (item.channel) channels.add(item.channel);
      }
    });

    return {
      categories: Array.from(categories).sort(),
      territories: Array.from(territories).sort(),
      channels: Array.from(channels).sort(),
    };
  }, [facts]);

  // Dimension labels
  const DIMENSION_LABELS = {
    categoryName: 'Product Category',
    subcategoryName: 'Product Subcategory',
    territoryName: 'Territory Region',
    channel: 'Sales Channel',
    month: 'Sales Month',
  };

  const handleFilterToggle = (list, setList, val) => {
    if (list.includes(val)) {
      setList(list.filter((x) => x !== val));
    } else {
      setList([...list, val]);
    }
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedTerritories([]);
    setSelectedChannels([]);
  };

  // Slice & Dice data based on filters
  const filteredFacts = useMemo(() => {
    const factsList = Array.isArray(facts) ? facts : [];
    return factsList.filter((item) => {
      if (!item) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(item.categoryName)) return false;
      if (selectedTerritories.length > 0 && !selectedTerritories.includes(item.territoryName)) return false;
      if (selectedChannels.length > 0 && !selectedChannels.includes(item.channel)) return false;
      return true;
    });
  }, [facts, selectedCategories, selectedTerritories, selectedChannels]);

  // Pivot and Aggregate
  const pivotData = useMemo(() => {
    if (rowDim === colDim) return { matrix: {}, rows: [], cols: [], colTotals: {}, rowTotals: {}, grandTotal: 0 };

    const matrix = {};
    const rowsSet = new Set();
    const colsSet = new Set();
    const colTotals = {};
    const rowTotals = {};
    let grandTotal = 0;

    filteredFacts.forEach((item) => {
      const rVal = item[rowDim] || 'N/A';
      const cVal = item[colDim] || 'N/A';
      const val = measure === 'revenue' ? Number(item.revenue || 0) : Number(item.orders || 0);

      rowsSet.add(rVal);
      colsSet.add(cVal);

      if (!matrix[rVal]) matrix[rVal] = {};
      matrix[rVal][cVal] = (matrix[rVal][cVal] || 0) + val;

      rowTotals[rVal] = (rowTotals[rVal] || 0) + val;
      colTotals[cVal] = (colTotals[cVal] || 0) + val;
      grandTotal += val;
    });

    const rows = Array.from(rowsSet).sort();
    const cols = Array.from(colsSet).sort();

    return { matrix, rows, cols, colTotals, rowTotals, grandTotal };
  }, [filteredFacts, rowDim, colDim, measure]);

  // Heatmap helper: find maximum cell value in matrix
  const maxCellValue = useMemo(() => {
    let max = 0;
    const { matrix, rows, cols } = pivotData;
    rows.forEach((r) => {
      cols.forEach((c) => {
        const val = matrix[r]?.[c] || 0;
        if (val > max) max = val;
      });
    });
    return max || 1;
  }, [pivotData]);



  const formatValue = useMemo(() => (val) => {
    if (measure === 'revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(val);
    }
    return new Intl.NumberFormat('en-US').format(val);
  }, [measure]);



  // ECharts Option
  const echartsOption = useMemo(() => {
    const { rows, cols, matrix } = pivotData;
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
    const textColor = isDark ? '#9ca3af' : '#4b5563';

    const series = cols.map((c, idx) => ({
      name: c,
      type: chartType === 'area' ? 'line' : 'bar',
      stack: chartType === 'stacked' || chartType === 'area' ? 'total' : null,
      areaStyle: chartType === 'area' ? {} : null,
      smooth: chartType === 'area',
      itemStyle: { color: CHART_COLORS[idx % CHART_COLORS.length], borderRadius: chartType === 'stacked' || chartType === 'area' ? 0 : [4, 4, 0, 0] },
      data: rows.map(r => matrix[r]?.[c] || 0)
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: chartType === 'area' ? 'line' : 'shadow' },
        formatter: (params) => {
          let html = `<b>${params[0].axisValue}</b><br/>`;
          params.forEach(p => {
            html += `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${p.color};"></span>`;
            html += `${p.seriesName}: ${formatValue(p.value)}<br/>`;
          });
          return html;
        }
      },
      legend: { textStyle: { color: textColor }, bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
      xAxis: { type: 'category', data: rows, axisLine: { lineStyle: { color: textColor } } },
      yAxis: { type: 'value', axisLabel: { formatter: (val) => measure === 'revenue' ? `$${val / 1000}k` : val }, splitLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } } },
      series
    };
  }, [pivotData, chartType, measure, formatValue]);

  return (
    <div id="olap-analyzer-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Loading overlay */}
      {loading && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px', minHeight: '160px' }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Fetching OLAP facts from Neon DB…</span>
        </div>
      )}
      {/* Dynamic Selector Controls */}
      <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '180px' }}>
          <span className="filter-label">Pivot Row Dimension</span>
          <select
            className="filter-input"
            value={rowDim}
            onChange={(e) => setRowDim(e.target.value)}
          >
            <option value="categoryName">{DIMENSION_LABELS.categoryName}</option>
            <option value="subcategoryName">{DIMENSION_LABELS.subcategoryName}</option>
            <option value="territoryName">{DIMENSION_LABELS.territoryName}</option>
            <option value="channel">{DIMENSION_LABELS.channel}</option>
            <option value="month">{DIMENSION_LABELS.month}</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '180px' }}>
          <span className="filter-label">Pivot Column Dimension</span>
          <select
            className="filter-input"
            value={colDim}
            disabled={rowDim === colDim}
            onChange={(e) => setColDim(e.target.value)}
          >
            <option value="channel">{DIMENSION_LABELS.channel}</option>
            <option value="categoryName">{DIMENSION_LABELS.categoryName}</option>
            <option value="territoryName">{DIMENSION_LABELS.territoryName}</option>
            <option value="month">{DIMENSION_LABELS.month}</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '180px' }}>
          <span className="filter-label">Measure Value</span>
          <select
            className="filter-input"
            value={measure}
            onChange={(e) => setMeasure(e.target.value)}
          >
            <option value="revenue">Sales Revenue ($)</option>
            <option value="orders">Total Orders Count</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>

          <button className="btn btn-secondary" onClick={resetFilters} style={{ height: '46px' }}>
            Clear Filters
          </button>
          <button className="btn btn-primary" onClick={onRefresh} disabled={loading} style={{ height: '46px' }}>
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            Fetch facts
          </button>
        </div>
      </div>

      {/* Slice and Dice Slicers Row */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* Category Slicer */}
        <div className="glass-card" style={{ padding: '16px', maxHeight: '180px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            <Filter size={14} style={{ color: 'var(--accent-indigo)' }} />
            <span className="filter-label" style={{ margin: 0 }}>Category Slicer</span>
          </div>
          {filterOptions.categories.map((cat) => (
            <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', margin: '6px 0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => handleFilterToggle(selectedCategories, setSelectedCategories, cat)}
                style={{ accentColor: 'var(--accent-indigo)' }}
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>

        {/* Territory Slicer */}
        <div className="glass-card" style={{ padding: '16px', maxHeight: '180px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            <Filter size={14} style={{ color: 'var(--accent-teal)' }} />
            <span className="filter-label" style={{ margin: 0 }}>Territory Slicer</span>
          </div>
          {filterOptions.territories.map((terr) => (
            <label key={terr} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', margin: '6px 0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedTerritories.includes(terr)}
                onChange={() => handleFilterToggle(selectedTerritories, setSelectedTerritories, terr)}
                style={{ accentColor: 'var(--accent-teal)' }}
              />
              <span>{terr}</span>
            </label>
          ))}
        </div>

        {/* Channel Slicer */}
        <div className="glass-card" style={{ padding: '16px', maxHeight: '180px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            <Filter size={14} style={{ color: 'var(--accent-emerald)' }} />
            <span className="filter-label" style={{ margin: 0 }}>Channel Slicer</span>
          </div>
          {filterOptions.channels.map((chan) => (
            <label key={chan} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', margin: '6px 0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedChannels.includes(chan)}
                onChange={() => handleFilterToggle(selectedChannels, setSelectedChannels, chan)}
                style={{ accentColor: 'var(--accent-emerald)' }}
              />
              <span>{chan}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Pivot Table Rendering */}
      {rowDim === colDim ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Please select different Row and Column dimensions to generate the OLAP Pivot Table.
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="chart-header" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--accent-indigo)' }} />
              <span className="chart-title">OLAP Multidimensional Pivot Matrix</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Values represented in <strong>{measure === 'revenue' ? 'Revenue USD' : 'Order Count'}</strong>
            </span>
          </div>

          <div className="table-container">
            <table className="custom-table" style={{ border: '1px solid var(--border-color)' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {DIMENSION_LABELS[rowDim]}
                  </th>
                  {pivotData.cols.map((colVal) => (
                    <th key={colVal} style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {colVal}
                    </th>
                  ))}
                  <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {pivotData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={pivotData.cols.length + 2} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px 0' }}>
                      No cells found matching filters.
                    </td>
                  </tr>
                ) : (
                  pivotData.rows.map((rowVal) => (
                    <tr key={rowVal}>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>{rowVal}</td>
                      {pivotData.cols.map((colVal) => {
                        const cellVal = pivotData.matrix[rowVal]?.[colVal] || 0;
                        const cellRatio = cellVal / maxCellValue;
                        return (
                          <td
                            key={colVal}
                            style={{
                              padding: '14px 18px',
                              textAlign: 'right',
                              backgroundColor: cellVal > 0 ? `rgba(99, 102, 241, ${0.03 + cellRatio * 0.18})` : 'transparent',
                              fontWeight: cellVal > 0 ? 500 : 400,
                              borderRight: '1px solid rgba(255, 255, 255, 0.02)',
                              transition: 'background-color 0.2s'
                            }}
                            title={`${rowVal} x ${colVal}`}
                          >
                            {formatValue(cellVal)}
                          </td>
                        );
                      })}
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-indigo)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        {formatValue(pivotData.rowTotals[rowVal] || 0)}
                      </td>
                    </tr>
                  ))
                )}
                {/* Column Totals Row */}
                <tr style={{ borderTop: '2px solid var(--border-color)', fontWeight: 800, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '14px 18px', color: 'var(--text-primary)' }}>Grand Total</td>
                  {pivotData.cols.map((colVal) => (
                    <td key={colVal} style={{ padding: '14px 18px', textAlign: 'right', color: 'var(--text-primary)' }}>
                      {formatValue(pivotData.colTotals[colVal] || 0)}
                    </td>
                  ))}
                  <td style={{ padding: '14px 18px', textAlign: 'right', color: 'var(--accent-teal)', fontSize: '15px' }}>
                    {formatValue(pivotData.grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visual Chart matching Pivot Structure */}
      {rowDim !== colDim && pivotData.rows.length > 0 && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="chart-header" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <span className="chart-title">Visual Pivot Breakdown ({DIMENSION_LABELS[rowDim]} Grouped)</span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {[
                { id: 'stacked', label: 'Stacked Bar' },
                { id: 'grouped', label: 'Grouped Bar' },
                { id: 'area', label: 'Area' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setChartType(type.id)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    backgroundColor: chartType === type.id ? 'var(--accent-indigo)' : 'transparent',
                    color: chartType === type.id ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            <ReactECharts 
              option={echartsOption} 
              style={{ height: '350px' }} 
              theme={(document.documentElement.getAttribute('data-theme') || 'dark') === 'dark' ? 'dark' : ''} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OlapAnalyzer;

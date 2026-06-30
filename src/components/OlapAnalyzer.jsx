import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Layers, RefreshCw, Filter, ArrowUpDown } from 'lucide-react';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

const OlapAnalyzer = ({ facts, loading, onRefresh }) => {
  const [rowDim, setRowDim] = useState('categoryName');
  const [colDim, setColDim] = useState('channel');
  const [measure, setMeasure] = useState('revenue');

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

  // Chart data matching Row aggregates
  const chartData = useMemo(() => {
    const { rows, matrix, cols } = pivotData;
    return rows.map((r) => {
      const dataPoint = { name: r };
      cols.forEach((c) => {
        dataPoint[c] = Math.round(matrix[r]?.[c] || 0);
      });
      return dataPoint;
    });
  }, [pivotData]);

  const formatValue = (val) => {
    if (measure === 'revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(val);
    }
    return new Intl.NumberFormat('en-US').format(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
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
          <div className="chart-header" style={{ marginBottom: '24px' }}>
            <span className="chart-title">Visual Pivot Breakdown ({DIMENSION_LABELS[rowDim]} Grouped)</span>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (measure === 'revenue' ? `$${val / 1000}k` : val)}
                />
                <Tooltip formatter={(value, name) => [formatValue(value), name]} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {pivotData.cols.map((colVal, idx) => (
                  <Bar
                    key={colVal}
                    dataKey={colVal}
                    fill={COLORS[idx % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default OlapAnalyzer;

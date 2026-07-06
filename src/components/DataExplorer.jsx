import React, { useState, useEffect, useMemo } from 'react';
import { ChevronUp, ChevronDown, RefreshCw, Search } from 'lucide-react';

const DataExplorer = ({ title, columns, fetchData, defaultSortBy }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [direction, setDirection] = useState('asc');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Advanced filters state
  const [filterColumn, setFilterColumn] = useState('all');
  const [categoricalFilter, setCategoricalFilter] = useState('all');
  const [minVal, setMinVal] = useState('');
  const [maxVal, setMaxVal] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      let sortField = sortBy;
      if (sortBy === 'id') {
        if (title.toLowerCase().includes('product')) sortField = 'productId';
        else if (title.toLowerCase().includes('customer')) sortField = 'customerId';
        else if (title.toLowerCase().includes('order')) sortField = 'salesOrderId';
      }

      const res = await fetchData(page, size, sortField, direction);
      setData(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Error fetching explorer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, size, sortBy, direction, fetchData]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(columnKey);
      setDirection('asc');
    }
    setPage(0);
  };

  const handleSizeChange = (newSize) => {
    setSize(newSize);
    setPage(0);
  };

  // Reset secondary filters when target column changes
  useEffect(() => {
    setCategoricalFilter('all');
    setMinVal('');
    setMaxVal('');
    setShowDrawer(false);
  }, [filterColumn]);

  // Extract unique categories for selected column if it contains text options
  const uniqueValues = useMemo(() => {
    if (filterColumn === 'all') return [];
    const values = new Set();
    data.forEach((row) => {
      const val = row[filterColumn];
      if (val !== null && val !== undefined && val !== '') {
        values.add(String(val));
      }
    });
    return Array.from(values).sort();
  }, [data, filterColumn]);

  // Check if chosen column is a price/numeric field
  const isNumericColumn = useMemo(() => {
    return (
      filterColumn === 'listPrice' ||
      filterColumn === 'totalDue' ||
      filterColumn === 'id' ||
      filterColumn === 'customerId' ||
      filterColumn === 'personId' ||
      filterColumn === 'storeId'
    );
  }, [filterColumn]);

  // Fully functioning advanced client-side search and filter matcher
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // 1. Column specific or global keyword search
      if (searchTerm) {
        if (filterColumn === 'all') {
          const match = Object.values(row).some((val) => {
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(searchTerm.toLowerCase());
          });
          if (!match) return false;
        } else {
          const val = row[filterColumn];
          if (val === null || val === undefined || !String(val).toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
          }
        }
      }

      // 2. Categorical dropdown filter
      if (categoricalFilter !== 'all') {
        const val = row[filterColumn];
        if (String(val) !== categoricalFilter) return false;
      }

      // 3. Range filters for numeric values
      if (isNumericColumn) {
        const val = Number(row[filterColumn]);
        if (minVal !== '') {
          if (isNaN(val) || val < Number(minVal)) return false;
        }
        if (maxVal !== '') {
          if (isNaN(val) || val > Number(maxVal)) return false;
        }
      }

      return true;
    });
  }, [data, searchTerm, filterColumn, categoricalFilter, minVal, maxVal, isNumericColumn]);

  return (
    <div className="glass-card" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <h2 className="view-title" style={{ fontSize: '20px' }}>{title}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={loadData} disabled={loading} style={{ padding: '8px 12px' }}>
              <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            </button>
          </div>
        </div>

        {/* Sleek inline search bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          alignItems: 'center'
        }}>
          {/* Target Column selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Search in:</span>
            <select
              className="filter-input"
              value={filterColumn}
              onChange={(e) => setFilterColumn(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
            >
              <option value="all">All Columns</option>
              {columns.map((col) => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>
          </div>

          {/* Keyword Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
              style={{
                paddingLeft: '32px',
                paddingTop: '6px',
                paddingBottom: '6px',
                fontSize: '12px',
                width: '100%',
                borderRadius: '6px'
              }}
            />
          </div>

          {/* Toggle Advanced Filters Drawer */}
          {filterColumn !== 'all' && (uniqueValues.length > 0 || isNumericColumn) && (
            <button
              onClick={() => setShowDrawer((prev) => !prev)}
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                backgroundColor: showDrawer ? 'var(--accent-indigo)' : 'transparent',
                color: showDrawer ? '#ffffff' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                outline: 'none'
              }}
            >
              <span>Filters</span>
              {(categoricalFilter !== 'all' || minVal !== '' || maxVal !== '') && (
                <span style={{
                  fontSize: '9px',
                  backgroundColor: showDrawer ? '#ffffff' : 'var(--accent-indigo)',
                  color: showDrawer ? 'var(--accent-indigo)' : '#ffffff',
                  padding: '1px 5px',
                  borderRadius: '10px'
                }}>Active</span>
              )}
            </button>
          )}

          {/* Clear button */}
          {(searchTerm || filterColumn !== 'all' || categoricalFilter !== 'all' || minVal !== '' || maxVal !== '') && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setFilterColumn('all');
                setShowDrawer(false);
              }}
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
            >
              Clear
            </button>
          )}

          {/* Page size dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Show:</span>
            <select
              className="filter-input"
              value={size}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {showDrawer && filterColumn !== 'all' && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '14px',
            background: 'rgba(255,255,255,0.01)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            {/* Categorical filter option */}
            {uniqueValues.length > 0 && uniqueValues.length <= 15 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Matching option:</span>
                <select
                  className="filter-input"
                  value={categoricalFilter}
                  onChange={(e) => setCategoricalFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <option value="all">All Values</option>
                  {uniqueValues.map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Price/Numeric Min-Max constraints */}
            {isNumericColumn && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Range bounds:</span>
                <input
                  type="number"
                  placeholder="Min value"
                  value={minVal}
                  onChange={(e) => setMinVal(e.target.value)}
                  className="filter-input"
                  style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', width: '90px' }}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>to</span>
                <input
                  type="number"
                  placeholder="Max value"
                  value={maxVal}
                  onChange={(e) => setMaxVal(e.target.value)}
                  className="filter-input"
                  style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', width: '90px' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <span>Loading data...</span>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} onClick={() => handleSort(col.key)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{col.label}</span>
                        {sortBy === col.key && (
                          direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
                      No items matching search found on this page.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {columns.map((col) => (
                        <td key={col.key}>
                          {col.format ? col.format(row[col.key], row) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span>
              Showing {page * size + 1} to {Math.min((page + 1) * size, totalElements)} of {totalElements} entries
            </span>
            <div className="pagination-buttons">
              <button
                className="pagination-btn"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="pagination-btn"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DataExplorer;

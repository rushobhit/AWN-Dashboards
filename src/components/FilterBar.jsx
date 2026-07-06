import React, { useState } from 'react';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format } from 'date-fns';

const FilterBar = ({ filters, setFilters, filterOptions }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSelectChange = (field, val) => {
    setFilters((prev) => ({
      ...prev,
      [field]: val === '' ? null : val,
    }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      territoryId: null,
      categoryName: null,
    });
  };

  const removeFilter = (field) => {
    setFilters((prev) => ({ ...prev, [field]: null }));
  };


  const categories = filterOptions?.categories || ['Accessories', 'Bikes', 'Clothing', 'Components'];
  const territories = filterOptions?.territories || [
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

  const hasActiveFilters = filters.startDate || filters.endDate || filters.territoryId || filters.categoryName;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
      <div className="filter-bar">
      <div className="filter-group" style={{ position: 'relative' }}>
        <label className="filter-label">Date Range</label>
        <div 
          className="filter-input" 
          onClick={() => setShowDatePicker(!showDatePicker)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', minHeight: '40px' }}
        >
          {filters.startDate || 'Start'} to {filters.endDate || 'End'}
        </div>
        {showDatePicker && (
          <div style={{ position: 'absolute', zIndex: 50, top: '100%', left: 0, marginTop: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <DateRangePicker
              ranges={[{
                startDate: filters.startDate ? new Date(filters.startDate) : new Date(),
                endDate: filters.endDate ? new Date(filters.endDate) : new Date(),
                key: 'selection'
              }]}
              onChange={(item) => {
                const s = format(item.selection.startDate, 'yyyy-MM-dd');
                const e = format(item.selection.endDate, 'yyyy-MM-dd');
                setFilters((prev) => ({
                  ...prev,
                  startDate: s,
                  endDate: e,
                }));
              }}
            />
          </div>
        )}
      </div>

      <div className="filter-group">
        <label className="filter-label">Territory</label>
        <select
          className="filter-input"
          value={filters.territoryId || ''}
          onChange={(e) => handleSelectChange('territoryId', e.target.value)}
        >
          <option value="">All Territories</option>
          {territories.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} (ID: {t.id})
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Product Category</label>
        <select
          className="filter-input"
          value={filters.categoryName || ''}
          onChange={(e) => handleSelectChange('categoryName', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>


    </div>
    
    {hasActiveFilters && (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {filters.startDate && (
          <span className="filter-chip" onClick={() => removeFilter('startDate')}>
            Start: {filters.startDate} ✕
          </span>
        )}
        {filters.endDate && (
          <span className="filter-chip" onClick={() => removeFilter('endDate')}>
            End: {filters.endDate} ✕
          </span>
        )}
        {filters.territoryId && (
          <span className="filter-chip" onClick={() => removeFilter('territoryId')}>
            Territory: {territories.find(t => t.id == filters.territoryId)?.name || filters.territoryId} ✕
          </span>
        )}
        {filters.categoryName && (
          <span className="filter-chip" onClick={() => removeFilter('categoryName')}>
            Category: {filters.categoryName} ✕
          </span>
        )}
      </div>
    )}
  </div>
  );
};

export default FilterBar;

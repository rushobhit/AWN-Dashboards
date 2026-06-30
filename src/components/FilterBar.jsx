import React from 'react';
import { Calendar, SlidersHorizontal, RefreshCw } from 'lucide-react';

const FilterBar = ({ filters, setFilters }) => {
  const handleDateChange = (field, val) => {
    setFilters((prev) => ({
      ...prev,
      [field]: val || null,
    }));
  };

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

  const categories = ['Accessories', 'Bikes', 'Clothing', 'Components'];
  const territories = [
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

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label className="filter-label">Start Date</label>
        <input
          type="date"
          className="filter-input"
          value={filters.startDate || ''}
          onChange={(e) => handleDateChange('startDate', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label className="filter-label">End Date</label>
        <input
          type="date"
          className="filter-input"
          value={filters.endDate || ''}
          onChange={(e) => handleDateChange('endDate', e.target.value)}
        />
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

      <div className="filter-actions">
        <button className="btn btn-secondary" onClick={resetFilters}>
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;

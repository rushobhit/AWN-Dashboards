import React from 'react';

// Per-card chart skeleton — used inside each chart card while loading
export const ChartSkeleton = ({ height = 300 }) => (
  <div className="skeleton" style={{ width: '100%', height, borderRadius: 8 }} />
);

// Full page dashboard skeleton — used for the initial page load
const DashboardSkeleton = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Grid Skeleton */}
      <div className="kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card kpi-card" style={{ height: '110px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div className="skeleton" style={{ width: '100px', height: '14px' }}></div>
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px' }}></div>
            </div>
            <div className="skeleton" style={{ width: '150px', height: '32px', marginTop: '12px' }}></div>
          </div>
        ))}
      </div>

      {/* Row 1 Grid Skeleton */}
      <div className="dashboard-grid">
        <div className="glass-card" style={{ height: '380px' }}>
          <div className="skeleton" style={{ width: '120px', height: '18px', marginBottom: '24px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '280px' }}></div>
        </div>
        <div className="glass-card" style={{ height: '380px' }}>
          <div className="skeleton" style={{ width: '120px', height: '18px', marginBottom: '24px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '180px' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
            <div className="skeleton" style={{ width: '100%', height: '12px' }}></div>
            <div className="skeleton" style={{ width: '90%', height: '12px' }}></div>
          </div>
        </div>
      </div>

      {/* Row 2 Margin Analysis Skeleton */}
      <div className="glass-card" style={{ height: '400px' }}>
        <div className="skeleton" style={{ width: '220px', height: '18px', marginBottom: '24px' }}></div>
        <div className="skeleton" style={{ width: '100%', height: '300px' }}></div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;

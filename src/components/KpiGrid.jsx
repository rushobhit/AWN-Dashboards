import React from 'react';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';

const KpiGrid = ({ kpis }) => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatNumber = (val) => {
    return new Intl.NumberFormat('en-US').format(val || 0);
  };

  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(kpis?.totalRevenue),
      icon: DollarSign,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Total Orders',
      value: formatNumber(kpis?.totalOrders),
      icon: ShoppingCart,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
    },
    {
      title: 'Active Customers',
      value: formatNumber(kpis?.totalCustomers),
      icon: Users,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
    },
    {
      title: 'Active Products',
      value: formatNumber(kpis?.totalProducts),
      icon: Package,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div key={idx} className="glass-card kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">{card.title}</span>
              <div
                className="kpi-icon-container"
                style={{ backgroundColor: card.bg, color: card.color }}
              >
                <IconComponent size={20} />
              </div>
            </div>
            <div className="kpi-value">{card.value}</div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiGrid;

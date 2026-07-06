import React from 'react';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import { useSpring, animated } from '@react-spring/web';
import ReactECharts from 'echarts-for-react';

const KpiGrid = ({ kpis, monthlySales, salesTrend }) => {
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
      value: kpis?.totalRevenue || 0,
      isCurrency: true,
      icon: DollarSign,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      data: monthlySales.slice(-6).map(m => m.totalSales)
    },
    {
      title: 'Total Orders',
      value: kpis?.totalOrders || 0,
      isCurrency: false,
      icon: ShoppingCart,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
      data: salesTrend.slice(-6).map(t => t.orderCount || t.sales)
    },
    {
      title: 'Active Customers',
      value: kpis?.totalCustomers || 0,
      isCurrency: false,
      icon: Users,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
      data: []
    },
    {
      title: 'Active Products',
      value: kpis?.totalProducts || 0,
      isCurrency: false,
      icon: Package,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      data: []
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { number } = useSpring({ 
          from: { number: 0 }, 
          number: card.value, 
          config: { duration: 1000 } 
        });

        const option = {
          xAxis: { type: 'category', show: false },
          yAxis: { type: 'value', show: false, min: 'dataMin' },
          series: [{
            data: card.data,
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: { color: card.color, width: 2 },
            areaStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [{ offset: 0, color: card.color }, { offset: 1, color: 'transparent' }]
              }
            }
          }],
          grid: { top: 5, bottom: 0, left: 0, right: 0 }
        };

        return (
          <div key={idx} className="glass-card kpi-card" style={{ position: 'relative', overflow: 'hidden', paddingBottom: (card.data && card.data.length > 0) ? '50px' : '24px' }}>
            <div className="kpi-header">
              <span className="kpi-title">{card.title}</span>
              <div className="kpi-icon-container" style={{ backgroundColor: card.bg, color: card.color }}>
                <IconComponent size={20} />
              </div>
            </div>
            <animated.div className="kpi-value">
              {number.to(n => card.isCurrency ? formatCurrency(n) : formatNumber(n))}
            </animated.div>
            
            {card.data && card.data.length > 0 && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.6 }}>
                <ReactECharts option={option} style={{ height: '40px', width: '100%' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KpiGrid;

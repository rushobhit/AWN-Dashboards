import React from 'react';
import { LayoutDashboard, ShoppingBag, Package, Users, BarChart3, Layers, X } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Sales Orders', icon: ShoppingBag },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'olap', label: 'OLAP Cube', icon: Layers },
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={24} />
          <span>AWN Analytics</span>
        </div>
        
        {/* Mobile close button */}
        <button className="sidebar-close-btn" onClick={() => setIsOpen(false)}>
          <X size={20} />
        </button>
      </div>
      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <li
              key={item.id}
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
            >
              <IconComponent size={20} />
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;

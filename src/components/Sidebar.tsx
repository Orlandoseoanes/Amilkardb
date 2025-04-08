import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Store, CreditCard, Package, LineChart, DollarSign, Users,Menu } from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, title: 'Dashboard' },
    { path: '/ventas', icon: <BarChart3 size={20} />, title: 'Ventas' },
    { path: '/bodegas', icon: <Store size={20} />, title: 'Bodegas' },
    { path: '/medios-pago', icon: <CreditCard size={20} />, title: 'Medios de Pago' },
    { path: '/productos', icon: <Package size={20} />, title: 'Productos' },
    { path: '/ganancias', icon: <DollarSign size={20} />, title: 'Ganancias' },
    { path: '/genero', icon: <Users size={20} />, title: 'Género' },
  ];

  return (
    <div className={`min-h-screen bg-gray-900 text-white transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {isOpen && <h2 className="text-xl font-bold">Dashboard</h2>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-gray-800 rounded-lg">
          <Menu size={20} />
        </button>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 hover:bg-gray-800 transition-colors ${
                isActive ? 'bg-gray-800 border-r-4 border-blue-500' : ''
              }`
            }
          >
            {item.icon}
            {isOpen && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
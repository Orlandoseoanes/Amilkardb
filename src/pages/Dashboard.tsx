import { useEffect, useState } from 'react';
import { getDashboardData } from '../apis/api';
import { Store, CreditCard, Package, Loader, AlertCircle, TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';

// Define TypeScript interfaces
interface DashboardData {
  bodegas: number;
  mediosPago: number;
  productos: number;
  categorias: number;
  ventasTotales: number;
  clientesActivos: number;
  ordenesHoy: number;
  ticketPromedio: number;
}

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  trend: string;
  trendType: 'up' | 'down' | 'neutral';
  description: string;
}

const StatCard = ({ icon: Icon, title, value, trend, trendType, description }: StatCardProps) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:border-blue-200 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="bg-blue-50 p-3 rounded-lg">
        <Icon className="text-blue-600" size={24} />
      </div>
      <span className={`text-sm font-medium ${
        trendType === 'up' ? 'text-green-600 bg-green-50' :
        trendType === 'down' ? 'text-red-600 bg-red-50' :
        'text-gray-600 bg-gray-50'
      } px-2.5 py-0.5 rounded-full`}>
        {trend}
      </span>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-1">
      {typeof value === 'number' && !title.includes('$') ? value.toLocaleString() : value}
    </h3>
    <p className="text-sm text-gray-500 font-medium">{title}</p>
    <p className="text-xs text-gray-400 mt-2">{description}</p>
  </div>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({
    bodegas: 0,
    mediosPago: 0,
    productos: 0,
    categorias: 0,
    ventasTotales: 0,
    clientesActivos: 0,
    ordenesHoy: 0,
    ticketPromedio: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bodegas, medioPago, productos, categoria] = await Promise.all([
          getDashboardData.resumenBodegas(),
          getDashboardData.resumenMedioPago(),
          getDashboardData.resumenProductos(),
          getDashboardData.ventasCategoriaPrincipal(),
        ]);

        // Process and aggregate the data
        setData({
          bodegas: bodegas.data.length,
          mediosPago: medioPago.data.length,
          productos: productos.data.length,
          categorias: categoria.data.length,
          ventasTotales: productos.data.reduce((acc: number, curr: any) => acc + curr.total_ventas, 0),
          clientesActivos: 1250, // Example static data
          ordenesHoy: 145, // Example static data
          ticketPromedio: 85.50 // Example static data
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Error loading dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-2" />
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-2">Real-time metrics and business insights</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={DollarSign}
            title="Total Sales"
            value={`$${data.ventasTotales.toLocaleString()}`}
            trend="+12.5% vs last month"
            trendType="up"
            description="Total sales across all stores and channels"
          />
          <StatCard
            icon={ShoppingCart}
            title="Today's Orders"
            value={data.ordenesHoy}
            trend="+5.2% vs yesterday"
            trendType="up"
            description="Number of orders processed today"
          />
          <StatCard
            icon={Users}
            title="Active Customers"
            value={data.clientesActivos}
            trend="-2.3% vs last week"
            trendType="down"
            description="Currently active customer base"
          />
          <StatCard
            icon={TrendingUp}
            title="Average Ticket"
            value={`$${data.ticketPromedio}`}
            trend="+0.8% vs last month"
            trendType="neutral"
            description="Average transaction value"
          />
          <StatCard
            icon={Store}
            title="Active Stores"
            value={data.bodegas}
            trend="No change"
            trendType="neutral"
            description="Total number of operating stores"
          />
          <StatCard
            icon={CreditCard}
            title="Payment Methods"
            value={data.mediosPago}
            trend="+1 new method"
            trendType="up"
            description="Available payment options"
          />
          <StatCard
            icon={Package}
            title="Products"
            value={data.productos}
            trend="+15 new items"
            trendType="up"
            description="Total products in catalog"
          />
          <StatCard
            icon={Store}
            title="Categories"
            value={data.categorias}
            trend="2 categories added"
            trendType="up"
            description="Product categories available"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
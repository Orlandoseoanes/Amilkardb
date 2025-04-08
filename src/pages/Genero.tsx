import { useEffect, useState } from 'react';
import { getDashboardData } from '../apis/api';
import { Filter, ArrowUpDown, Search, Loader, AlertCircle, UserRound, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface GenderSalesData {
  genero: string;
  total_ventas: string;
  total_articulos: string;
}

interface ProductGenderData {
  producto: string | null;
  hombres: number;
  mujeres: number;
}

interface DashboardTab {
  name: string;
  endpoint: keyof typeof getDashboardData;
  type: 'gender' | 'product';
}

const DASHBOARD_TABS: DashboardTab[] = [
  { name: 'Gender Overview', endpoint: 'genero', type: 'gender' },
  { name: 'Products by Gender', endpoint: 'generoProducto', type: 'product' },
];

const GENDER_LABELS: Record<string, string> = {
  'M': 'Men',
  'F': 'Women',
};

const GENDER_COLORS = {
  'M': '#3b82f6', // blue
  'F': '#ec4899', // pink
};

const CHART_COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#6366f1'];

const Genero = () => {
  const [genderData, setGenderData] = useState<GenderSalesData[]>([]);
  const [productData, setProductData] = useState<ProductGenderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>(DASHBOARD_TABS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: activeTab.type === 'gender' ? 'total_ventas' : 'hombres',
    direction: 'desc' as 'asc' | 'desc',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (activeTab.type === 'gender') {
          const response = await getDashboardData.genero();
          setGenderData(response.data || []);
        } else {
          const response = await getDashboardData.generoProducto();
          setProductData(response.data || []);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching gender data:', err);
        setError('Error loading data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  useEffect(() => {
    // Reset sorting when tab changes
    if (activeTab.type === 'gender') {
      setSortConfig({
        key: 'total_ventas',
        direction: 'desc',
      });
    } else {
      setSortConfig({
        key: 'hombres',
        direction: 'desc',
      });
    }
    setSearchTerm('');
  }, [activeTab]);

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  };

  const formatNumber = (value: string | number) => {
    return new Intl.NumberFormat('es-CO').format(typeof value === 'string' ? parseFloat(value) : value);
  };

  const filteredAndSortedGenderData = genderData
    .filter((item) => item.genero?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortConfig.key === 'genero') {
        return sortConfig.direction === 'asc' 
          ? a.genero.localeCompare(b.genero) 
          : b.genero.localeCompare(a.genero);
      } else {
        const aValue = parseFloat(a[sortConfig.key as keyof GenderSalesData] as string);
        const bValue = parseFloat(b[sortConfig.key as keyof GenderSalesData] as string);
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

  const filteredAndSortedProductData = productData
    .filter((item) => item.producto?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.producto === null && 'null'.includes(searchTerm.toLowerCase())))
    .sort((a, b) => {
      if (sortConfig.key === 'producto') {
        const aName = a.producto || '';
        const bName = b.producto || '';
        return sortConfig.direction === 'asc' 
          ? aName.localeCompare(bName) 
          : bName.localeCompare(aName);
      } else {
        const aValue = a[sortConfig.key as keyof ProductGenderData] as number;
        const bValue = b[sortConfig.key as keyof ProductGenderData] as number;
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

  // Transform gender data for pie chart
  const genderPieData = genderData.map(item => ({
    name: GENDER_LABELS[item.genero] || item.genero,
    value: parseFloat(item.total_ventas),
    articles: parseFloat(item.total_articulos),
    color: GENDER_COLORS[item.genero] || '#666',
  }));

  // Transform product data for chart
  const productChartData = filteredAndSortedProductData
    .filter(item => item.producto !== null)
    .slice(0, 10)
    .map(item => ({
      name: item.producto || 'Unknown',
      men: item.hombres,
      women: item.mujeres,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-2" />
          <p>{error}</p>
          <button
            onClick={() => setActiveTab(activeTab)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Gender Analysis</h2>
        <p className="text-gray-600">View and analyze sales data by gender demographics</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {DASHBOARD_TABS.map((tab) => (
          <button
            key={tab.endpoint}
            className={`py-3 px-6 font-medium text-sm focus:outline-none ${
              activeTab.endpoint === tab.endpoint
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={activeTab.type === 'gender' ? "Search by gender..." : "Search by product..."}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      {activeTab.type === 'gender' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pie Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Sales Distribution by Gender</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {genderPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Total Items by Gender</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderPieData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(value) => formatNumber(value as number)} />
                  <Bar dataKey="articles" fill="#6366f1">
                    <LabelList dataKey="articles" position="top" formatter={formatNumber} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-96 mb-6">
          <h3 className="text-lg font-medium mb-4">Products by Gender Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productChartData} margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={100} />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip formatter={(value) => formatNumber(value as number)} />
              <Legend />
              <Bar dataKey="men" name="Men" fill={GENDER_COLORS['M']} />
              <Bar dataKey="women" name="Women" fill={GENDER_COLORS['F']} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Tables */}
      <div className="overflow-x-auto">
        {activeTab.type === 'gender' ? (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('genero')}>
                  <div className="flex items-center gap-2">
                    Gender
                    <ArrowUpDown size={16} className="text-gray-500" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total_ventas')}>
                  <div className="flex items-center justify-end gap-2">
                    Total Sales
                    <ArrowUpDown size={16} className="text-gray-500" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total_articulos')}>
                  <div className="flex items-center justify-end gap-2">
                    Total Items
                    <ArrowUpDown size={16} className="text-gray-500" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedGenderData.map((item) => (
                <tr key={item.genero} className="border-t border-gray-200 hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    <div className="flex items-center gap-2">
                      {item.genero === 'M' ? (
                        <UserRound className="text-blue-600" size={20} />
                      ) : (
                        <UserRound className="text-pink-500" size={20} />
                      )}
                      {GENDER_LABELS[item.genero] || item.genero}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(item.total_ventas)}</td>
                  <td className="px-6 py-4 text-right">{formatNumber(item.total_articulos)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-6 py-4">Total</td>
                <td className="px-6 py-4 text-right text-green-600">
                  {formatCurrency(filteredAndSortedGenderData.reduce((sum, item) => sum + parseFloat(item.total_ventas), 0))}
                </td>
                <td className="px-6 py-4 text-right">
                  {formatNumber(filteredAndSortedGenderData.reduce((sum, item) => sum + parseFloat(item.total_articulos), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('producto')}>
                  <div className="flex items-center gap-2">
                    Product
                    <ArrowUpDown size={16} className="text-gray-500" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('hombres')}>
                  <div className="flex items-center justify-end gap-2">
                    <UserRound className="text-blue-600" size={16} />
                    Men
                    <ArrowUpDown size={16} className="text-gray-500" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('mujeres')}>
                  <div className="flex items-center justify-end gap-2">
                    <UserRound className="text-pink-500" size={16} />
                    Women
                    <ArrowUpDown size={16} className="text-gray-500" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Users size={16} className="text-gray-500" />
                    Total
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedProductData.map((item, index) => (
                <tr key={index} className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="px-6 py-4 font-medium">{item.producto || 'Unspecified'}</td>
                  <td className="px-6 py-4 text-right font-medium text-blue-600">{formatNumber(item.hombres)}</td>
                  <td className="px-6 py-4 text-right font-medium text-pink-500">{formatNumber(item.mujeres)}</td>
                  <td className="px-6 py-4 text-right">{formatNumber(item.hombres + item.mujeres)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-6 py-4">Total</td>
                <td className="px-6 py-4 text-right text-blue-600">
                  {formatNumber(filteredAndSortedProductData.reduce((sum, item) => sum + item.hombres, 0))}
                </td>
                <td className="px-6 py-4 text-right text-pink-500">
                  {formatNumber(filteredAndSortedProductData.reduce((sum, item) => sum + item.mujeres, 0))}
                </td>
                <td className="px-6 py-4 text-right">
                  {formatNumber(filteredAndSortedProductData.reduce((sum, item) => sum + item.hombres + item.mujeres, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        {activeTab.type === 'gender' ? 
          `Showing ${filteredAndSortedGenderData.length} gender categories` : 
          `Showing ${filteredAndSortedProductData.length} of ${productData.length} products`}
      </div>
    </div>
  );
};

export default Genero;
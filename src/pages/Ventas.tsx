import { useEffect, useState } from 'react';
import { getDashboardData } from '../apis/api';
import { Filter, ArrowUpDown, Search, Loader, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';

interface SalesData {
  categoria: string;
  total_ventas: string;
  total_articulos: string;
}

interface CategoryLevel {
  name: string;
  endpoint: keyof typeof getDashboardData;
}

const CATEGORY_LEVELS: CategoryLevel[] = [
  { name: 'Principal', endpoint: 'ventasCategoriaPrincipal' },
  { name: 'Línea', endpoint: 'ventasCategoriaLinea' },
  { name: 'Nivel 3', endpoint: 'ventasCategoriaNivel3' },
  { name: 'Nivel 4', endpoint: 'ventasCategoriaNivel4' },
];

const Ventas = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CategoryLevel>(CATEGORY_LEVELS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'total_ventas' as keyof SalesData,
    direction: 'desc' as 'asc' | 'desc',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardData[selectedLevel.endpoint]();
        setSalesData(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching sales data:', err);
        setError('Error loading sales data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedLevel]);

  const handleSort = (key: keyof SalesData) => {
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

  const filteredAndSortedData = salesData
    .filter((item) => item.categoria?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aValue = sortConfig.key === 'categoria' ? a[sortConfig.key] : parseFloat(a[sortConfig.key]);
      const bValue = sortConfig.key === 'categoria' ? b[sortConfig.key] : parseFloat(b[sortConfig.key]);
      return sortConfig.direction === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

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
            onClick={() => setSelectedLevel(selectedLevel)}
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
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sales Analysis</h2>
        <p className="text-gray-600">View and analyze sales data by category level</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={CATEGORY_LEVELS.findIndex((level) => level.endpoint === selectedLevel.endpoint)}
            onChange={(e) => setSelectedLevel(CATEGORY_LEVELS[parseInt(e.target.value)])}
          >
            {CATEGORY_LEVELS.map((level, index) => (
              <option key={level.endpoint} value={index}>
                {level.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-96 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredAndSortedData.slice(0, 10)} margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoria" angle={-45} textAnchor="end" interval={0} height={100} />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Bar dataKey={(entry) => parseFloat(entry.total_ventas)} fill="#3b82f6">
              <LabelList dataKey="total_ventas" position="top" formatter={formatCurrency} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('categoria')}>
                <div className="flex items-center gap-2">
                  Category
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
            {filteredAndSortedData.map((item, index) => (
              <tr key={item.categoria} className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                <td className="px-6 py-4 font-medium">{item.categoria}</td>
                <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(item.total_ventas)}</td>
                <td className="px-6 py-4 text-right">{formatNumber(item.total_articulos)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-6 py-4">Total</td>
              <td className="px-6 py-4 text-right text-green-600">
                {formatCurrency(filteredAndSortedData.reduce((sum, item) => sum + parseFloat(item.total_ventas), 0))}
              </td>
              <td className="px-6 py-4 text-right">
                {formatNumber(filteredAndSortedData.reduce((sum, item) => sum + parseFloat(item.total_articulos), 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredAndSortedData.length} of {salesData.length} categories
      </div>
    </div>
  );
};

export default Ventas;

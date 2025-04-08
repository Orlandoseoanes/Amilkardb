import { useEffect, useState } from 'react';
import { getDashboardData } from '../apis/api';
import { Store, Search, BarChart2, PieChart as PieChartIcon, Loader, AlertCircle } from 'lucide-react';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';

interface Bodega {
  codigo_bodega: string;
  nombre_bodega: string;
  total_ventas: number;
  total_articulos: number;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Bodegas = () => {
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [filteredBodegas, setFilteredBodegas] = useState<Bodega[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'nombre_bodega' | 'total_ventas' | 'total_articulos'>('total_ventas');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardData.resumenBodegas();
        const data = (Array.isArray(response.data) ? response.data : []).map((item: any) => ({
          ...item,
          total_ventas: parseFloat(item.total_ventas),
          total_articulos: parseFloat(item.total_articulos)
        }));
        setBodegas(data);
        setFilteredBodegas(data);
        setError(null);
      } catch (err) {
        setError('Error loading warehouse data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let data = [...bodegas];
    if (searchTerm) {
      data = data.filter((b) =>
        b.nombre_bodega.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.codigo_bodega.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    data.sort((a, b) => {
      const compareResult = sortDirection === 'asc' ? 
        (a[sortKey] > b[sortKey] ? 1 : -1) : 
        (a[sortKey] < b[sortKey] ? 1 : -1);
        
      return sortKey === 'nombre_bodega' ? 
        (sortDirection === 'asc' ? a.nombre_bodega.localeCompare(b.nombre_bodega) : b.nombre_bodega.localeCompare(a.nombre_bodega)) : 
        compareResult;
    });
    
    setFilteredBodegas(data);
  }, [searchTerm, bodegas, sortKey, sortDirection]);

  const totalVentas = bodegas.reduce((sum, b) => sum + b.total_ventas, 0);
  const totalArticulos = bodegas.reduce((sum, b) => sum + b.total_articulos, 0);
  const topBodega = bodegas.length > 0 ? 
    bodegas.reduce((top, b) => (b.total_ventas > top.total_ventas ? b : top), bodegas[0]) : 
    null;

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // For Pie Chart - limit to top 5 and group others
  const pieChartData = () => {
    if (filteredBodegas.length <= 6) return filteredBodegas;
    
    const topFive = [...filteredBodegas]
      .sort((a, b) => b.total_ventas - a.total_ventas)
      .slice(0, 5);
      
    const otherSum = filteredBodegas
      .slice(5)
      .reduce((sum, bodega) => sum + bodega.total_ventas, 0);
      
    return [
      ...topFive,
      {
        codigo_bodega: 'others',
        nombre_bodega: 'Others',
        total_ventas: otherSum,
        total_articulos: 0
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading warehouse data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertCircle className="w-10 h-10 mb-4" />
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header Section */}
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-3 text-blue-700">
          <Store className="text-blue-600" /> Warehouse Dashboard
        </h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-600 font-medium">Total Sales</p>
            <p className="text-2xl font-bold">${totalVentas.toLocaleString()}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <p className="text-sm text-green-600 font-medium">Total Items</p>
            <p className="text-2xl font-bold">{totalArticulos.toLocaleString()}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-sm text-purple-600 font-medium">Top Warehouse</p>
            <p className="text-xl font-bold truncate">{topBodega?.nombre_bodega || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search warehouses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="nombre_bodega">Name</option>
              <option value="total_ventas">Sales</option>
              <option value="total_articulos">Items</option>
            </select>
            
            <button 
              onClick={toggleSortDirection}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
          
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center px-3 py-2 ${
                chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <BarChart2 className="h-4 w-4 mr-1" /> Bar
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`flex items-center px-3 py-2 ${
                chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <PieChartIcon className="h-4 w-4 mr-1" /> Pie
            </button>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-8 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          {chartType === 'bar' ? 'Sales & Items by Warehouse' : 'Sales Distribution'}
        </h2>
        
        {filteredBodegas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>No warehouse data to display</p>
          </div>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredBodegas} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="nombre_bodega" 
                tick={{ fontSize: 12 }} 
                interval={0}
                height={60}
                tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'total_ventas' ? `$${Number(value).toLocaleString()}` : Number(value).toLocaleString(),
                  name === 'total_ventas' ? 'Sales' : 'Items'
                ]}
              />
              <Legend />
              <Bar dataKey="total_ventas" fill={COLORS[0]} name="Sales" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total_articulos" fill={COLORS[1]} name="Items" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Sales']} />
              <Legend layout="vertical" verticalAlign="middle" align="right" />
              <Pie 
                data={pieChartData()} 
                dataKey="total_ventas" 
                nameKey="nombre_bodega" 
                cx="50%" 
                cy="50%" 
                outerRadius={100}
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table Section */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
          <Store className="w-5 h-5 mr-2 text-blue-600" /> 
          Warehouse Details
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({filteredBodegas.length} warehouses)
          </span>
        </h2>
        
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBodegas.map((bodega, index) => (
                <tr 
                  key={bodega.codigo_bodega} 
                  className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{bodega.codigo_bodega}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{bodega.nombre_bodega}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700 font-medium">${bodega.total_ventas.toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700">{bodega.total_articulos.toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end">
                      <span className="text-gray-700 mr-2">
                        {totalVentas > 0 ? ((bodega.total_ventas / totalVentas) * 100).toFixed(1) : '0'}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${totalVentas > 0 ? ((bodega.total_ventas / totalVentas) * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-medium">
              <tr>
                <td className="px-4 py-3" colSpan={2}>Totals</td>
                <td className="px-4 py-3 text-right">${totalVentas.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{totalArticulos.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {filteredBodegas.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search className="mx-auto h-10 w-10 mb-3 text-gray-400" />
            <p>No warehouses found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bodegas;
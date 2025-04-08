import { useEffect, useState } from 'react';
import { getDashboardData } from '../apis/api';
import { CreditCard, Search, TrendingUp, Package, Loader, AlertCircle, Filter, SortDesc, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MedioPago {
  codigo_medio: string;
  descripcion_medio: string;
  total_ventas: number | null;
  total_articulos: number | null;
}

const MediosPago = () => {
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);
  const [filteredMedios, setFilteredMedios] = useState<MedioPago[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'descripcion_medio' | 'total_ventas' | 'total_articulos'>('total_ventas');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'chart'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardData.resumenMedioPago();
        
        const data = Array.isArray(response.data) ? response.data : [];
        // Convertir valores string a números y manejar valores nulos
        const processedData = data.map(item => ({
          ...item,
          total_ventas: item.total_ventas !== null ? parseFloat(String(item.total_ventas)) : null,
          total_articulos: item.total_articulos !== null ? parseFloat(String(item.total_articulos)) : null
        }));
        
        setMediosPago(processedData);
        setFilteredMedios(processedData);
        setError(null);
      } catch (error) {
        setError('Error al cargar los métodos de pago. Por favor, intente más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!Array.isArray(mediosPago)) return;

    let filtered = [...mediosPago];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter((medio) =>
        medio.descripcion_medio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medio.codigo_medio?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      // Manejar valores nulos
      if (sortKey === 'total_ventas' || sortKey === 'total_articulos') {
        const aValue = a[sortKey] === null ? -Infinity : a[sortKey];
        const bValue = b[sortKey] === null ? -Infinity : b[sortKey];
        
        return sortDirection === 'asc' ? 
          (aValue < bValue ? -1 : 1) : 
          (aValue > bValue ? -1 : 1);
      } else {
        // Ordenar por descripción (texto)
        return sortDirection === 'asc' ? 
          (a.descripcion_medio || '').localeCompare(b.descripcion_medio || '') : 
          (b.descripcion_medio || '').localeCompare(a.descripcion_medio || '');
      }
    });

    setFilteredMedios(filtered);
  }, [searchTerm, mediosPago, sortKey, sortDirection]);

  const getPaymentIcon = (description: string) => {
    const desc = description?.toUpperCase() || '';
    if (desc.includes('EFECTIVO')) return '💵';
    if (desc.includes('TARJETA')) return '💳';
    if (desc.includes('CREDITO')) return '💳';
    if (desc.includes('DEBITO')) return '💸';
    if (desc.includes('BONO')) return '🎟️';
    if (desc.includes('CONSIGNACION')) return '🏦';
    if (desc.includes('TRANSFERENCIA')) return '📲';
    if (desc.includes('CHEQUE')) return '🧾';
    return '💰';
  };

  const getStatusColor = (code: string) => {
    const codeNum = parseInt(code);
    if (codeNum <= 10) return 'bg-green-100 text-green-800 border-green-200';
    if (codeNum <= 20) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (codeNum <= 30) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (codeNum <= 40) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (codeNum <= 50) return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Calcular totales
  const totalVentas = mediosPago.reduce((sum, medio) => sum + (medio.total_ventas || 0), 0);
  const totalArticulos = mediosPago.reduce((sum, medio) => sum + (medio.total_articulos || 0), 0);
  const topMedioPago = mediosPago.length > 0 ? 
    mediosPago.reduce((top, medio) => 
      (medio.total_ventas || 0) > (top.total_ventas || 0) ? medio : top, mediosPago[0]) : null;

  // Preparar datos para la gráfica
  const chartData = filteredMedios
    .filter(medio => medio.total_ventas !== null)
    .sort((a, b) => (b.total_ventas || 0) - (a.total_ventas || 0))
    .slice(0, 10) // Limitar a los 10 primeros para mejor visualización
    .map(medio => ({
      name: medio.descripcion_medio,
      ventas: medio.total_ventas || 0,
      articulos: medio.total_articulos || 0,
      icon: getPaymentIcon(medio.descripcion_medio || '')
    }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Cargando datos de métodos de pago...</p>
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
          Reintentar
        </button>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-blue-600">Ventas: ${payload[0].value.toLocaleString()}</p>
          {payload[1] && <p className="text-green-600">Artículos: {payload[1].value.toLocaleString()}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Sección de encabezado */}
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-3 text-blue-700">
          <CreditCard className="text-blue-600" /> Panel de Métodos de Pago
        </h1>
        <p className="text-gray-600">
          Resumen de todos los métodos de pago disponibles y sus métricas de desempeño
        </p>
        
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-600 font-medium">Ventas Totales</p>
            <p className="text-2xl font-bold">${totalVentas.toLocaleString()}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <p className="text-sm text-green-600 font-medium">Artículos Totales</p>
            <p className="text-2xl font-bold">{totalArticulos.toLocaleString()}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-sm text-purple-600 font-medium">Método de Pago Principal</p>
            <p className="text-xl font-bold truncate">
              {topMedioPago?.descripcion_medio || 'N/A'} {topMedioPago && getPaymentIcon(topMedioPago.descripcion_medio)}
            </p>
          </div>
        </div>
      </div>

      {/* Panel de control */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar métodos de pago..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Ordenar por:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="descripcion_medio">Descripción</option>
              <option value="total_ventas">Ventas</option>
              <option value="total_articulos">Artículos</option>
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
              onClick={() => setViewMode('grid')}
              className={`flex items-center px-3 py-2 ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <Filter className="h-4 w-4 mr-1" /> Cuadrícula
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center px-3 py-2 ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <SortDesc className="h-4 w-4 mr-1" /> Tabla
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center px-3 py-2 ${
                viewMode === 'chart' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <BarChart2 className="h-4 w-4 mr-1" /> Gráfica
            </button>
          </div>
        </div>
      </div>

      {/* Sección de contenido */}
      {viewMode === 'chart' && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold mb-4">Gráfica de Métodos de Pago</h3>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  height={60} 
                  tick={props => {
                    const { x, y, payload } = props;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text 
                          x={0} 
                          y={0} 
                          dy={16} 
                          textAnchor="end" 
                          fill="#666" 
                          transform="rotate(-35)"
                          fontSize={12}
                        >
                          {(payload.value.length > 15) 
                            ? `${payload.value.substring(0, 15)}...` 
                            : payload.value}
                        </text>
                      </g>
                    );
                  }} 
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  stroke="#8884d8"
                  label={{ value: 'Ventas ($)', angle: -90, position: 'insideLeft' }} 
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#82ca9d"
                  label={{ value: 'Artículos', angle: 90, position: 'insideRight' }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Bar yAxisId="left" dataKey="ventas" name="Ventas ($)" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="articulos" name="Artículos" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedios.map((medio) => (
            <div
              key={medio.codigo_medio}
              className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(medio.codigo_medio)}`}>
                    Código: {medio.codigo_medio}
                  </span>
                  <span className="text-2xl" role="img" aria-label="icono método de pago">
                    {getPaymentIcon(medio.descripcion_medio || '')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {medio.descripcion_medio}
                </h3>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="text-blue-500" size={16} />
                      <p className="text-sm text-blue-600">Ventas Totales</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      ${medio.total_ventas?.toLocaleString() ?? '0'}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="text-green-500" size={16} />
                      <p className="text-sm text-green-600">Artículos Totales</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {medio.total_articulos?.toLocaleString() ?? '0'}
                    </p>
                  </div>
                </div>
                
                {/* Porcentaje de ventas totales */}
                {medio.total_ventas !== null && totalVentas > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">% de Ventas Totales</span>
                      <span className="text-sm font-medium text-gray-800">
                        {((medio.total_ventas / totalVentas) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(medio.total_ventas / totalVentas) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método de Pago</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas Totales</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Artículos Totales</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% del Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedios.map((medio, index) => (
                <tr 
                  key={medio.codigo_medio} 
                  className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(medio.codigo_medio)}`}>
                      {medio.codigo_medio}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                    <div className="flex items-center">
                      <span className="mr-2" role="img" aria-label="icono método de pago">
                        {getPaymentIcon(medio.descripcion_medio || '')}
                      </span>
                      {medio.descripcion_medio}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700 font-medium">
                    ${medio.total_ventas?.toLocaleString() ?? '0'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700">
                    {medio.total_articulos?.toLocaleString() ?? '0'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end">
                      <span className="text-gray-700 mr-2">
                        {totalVentas > 0 && medio.total_ventas !== null 
                          ? ((medio.total_ventas / totalVentas) * 100).toFixed(1) 
                          : '0'}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${totalVentas > 0 && medio.total_ventas !== null 
                            ? ((medio.total_ventas / totalVentas) * 100) 
                            : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-medium">
              <tr>
                <td className="px-4 py-3" colSpan={2}>Totales</td>
                <td className="px-4 py-3 text-right">${totalVentas.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{totalArticulos.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      
      {filteredMedios.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
          <Search className="mx-auto h-12 w-12 mb-4 text-gray-400" />
          <p className="text-gray-500 text-lg">No se encontraron métodos de pago que coincidan con su búsqueda</p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Limpiar Búsqueda
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MediosPago;
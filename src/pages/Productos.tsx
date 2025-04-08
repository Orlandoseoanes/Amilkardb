import { useEffect, useState } from 'react';
import { getDashboardData } from '../apis/api';
import { 
  PackageSearch, Search, TrendingUp, Package, 
  BarChart2, PieChart, List, Grid, Filter, 
  SortDesc, Loader, AlertCircle, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPlot, 
  Pie, Cell, LineChart, Line 
} from 'recharts';

interface Producto {
  codigo_producto: string | null;
  nombre_producto: string | null;
  total_ventas: number | null;
  total_articulos: number | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const Productos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'charts'>('grid');
  const [sortKey, setSortKey] = useState<'nombre_producto' | 'total_ventas' | 'total_articulos'>('total_ventas');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [topProductsCount, setTopProductsCount] = useState(10);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [paginatedProductos, setPaginatedProductos] = useState<Producto[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardData.resumenProductos();
        const data = Array.isArray(response.data) ? response.data.filter(item => item.codigo_producto && item.nombre_producto) : [];
        
        // Convertir strings a números
        const processedData = data.map(item => ({
          ...item,
          total_ventas: item.total_ventas !== null ? parseFloat(String(item.total_ventas)) : null,
          total_articulos: item.total_articulos !== null ? parseFloat(String(item.total_articulos)) : null
        }));
        
        setProductos(processedData);
        setFilteredProductos(processedData);
        setError(null);
      } catch (error) {
        console.error('Error fetching product data:', error);
        setError('Error al cargar datos de productos. Por favor intente más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!Array.isArray(productos)) return;

    let filtered = [...productos];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(producto =>
        producto.nombre_producto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.codigo_producto?.toLowerCase().includes(searchTerm.toLowerCase())
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
        // Ordenar por nombre (texto)
        return sortDirection === 'asc' ? 
          (a.nombre_producto || '').localeCompare(b.nombre_producto || '') : 
          (b.nombre_producto || '').localeCompare(a.nombre_producto || '');
      }
    });

    setFilteredProductos(filtered);
    // Reset a la primera página cuando cambia el filtrado o el ordenamiento
    setCurrentPage(1);
  }, [searchTerm, productos, sortKey, sortDirection]);

  // Efecto para actualizar la paginación cuando cambia la lista filtrada o la página actual
  useEffect(() => {
    const totalItems = filteredProductos.length;
    const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
    setTotalPages(calculatedTotalPages || 1);
    
    // Asegurar que la página actual nunca sea mayor que el total de páginas
    const safePage = Math.min(currentPage, calculatedTotalPages || 1);
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
    
    // Calcular los índices para el slicing
    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Aplicar la paginación
    setPaginatedProductos(filteredProductos.slice(startIndex, endIndex));
  }, [filteredProductos, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    const safePage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(safePage);
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Calcular totales y estadísticas
  const totalVentas = productos.reduce((sum, producto) => sum + (producto.total_ventas || 0), 0);
  const totalArticulos = productos.reduce((sum, producto) => sum + (producto.total_articulos || 0), 0);
  const promedioVentasPorProducto = productos.length > 0 ? totalVentas / productos.length : 0;
  const promedioArticulosPorProducto = productos.length > 0 ? totalArticulos / productos.length : 0;

  // Encontrar producto más vendido
  const topProducto = productos.length > 0 ? 
    productos.reduce((top, producto) => 
      (producto.total_ventas || 0) > (top.total_ventas || 0) ? producto : top, productos[0]) : null;

  // Preparar datos para gráficas
  const topProductosByVentas = [...productos]
    .sort((a, b) => (b.total_ventas || 0) - (a.total_ventas || 0))
    .slice(0, topProductsCount);

  const topProductosByArticulos = [...productos]
    .sort((a, b) => (b.total_articulos || 0) - (a.total_articulos || 0))
    .slice(0, topProductsCount);

  const pieChartData = topProductosByVentas.map(producto => ({
    name: producto.nombre_producto || 'Sin nombre',
    value: producto.total_ventas || 0
  }));

  // Función para truncar nombres largos
  const truncateName = (name: string, maxLength: number = 20) => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  };

  // Componente para tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
          <p className="font-medium">{payload[0]?.payload.name}</p>
          <p className="text-blue-600">Ventas: ${(payload[0]?.value || 0).toLocaleString()}</p>
          {payload[1] && <p className="text-green-600">Artículos: {(payload[1]?.value || 0).toLocaleString()}</p>}
        </div>
      );
    }
    return null;
  };

  // Componente de paginación
  const Pagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white py-3 mt-4">
        <div className="flex items-center text-sm text-gray-700">
          <span className="mr-2">Mostrando</span>
          <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredProductos.length)}</span>
          <span className="mx-1">-</span>
          <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredProductos.length)}</span>
          <span className="mx-1">de</span>
          <span className="font-medium">{filteredProductos.length}</span>
          <span className="ml-1">productos</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className={`p-2 border rounded-md ${
              currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-label="Primera página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 border rounded-md ${
              currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => goToPage(number)}
              className={`px-3 py-1 border rounded-md ${
                currentPage === number
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {number}
            </button>
          ))}
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 border rounded-md ${
              currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className={`p-2 border rounded-md ${
              currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-label="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Cargando datos de productos...</p>
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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-auto p-6">
      {/* Header Section */}
      <div className="mb-8 border-b border-gray-200 pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-700">
              <PackageSearch className="text-blue-600" />
              Dashboard de Productos
            </h1>
            <p className="text-gray-600 mt-1">
              Análisis detallado de todos los productos y su rendimiento
            </p>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-600 font-medium">Ventas Totales</p>
            <p className="text-2xl font-bold">${totalVentas.toLocaleString()}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <p className="text-sm text-green-600 font-medium">Artículos Totales</p>
            <p className="text-2xl font-bold">{totalArticulos.toLocaleString()}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-sm text-purple-600 font-medium">Producto Más Vendido</p>
            <p className="text-lg font-bold truncate">
              {topProducto?.nombre_producto || 'N/A'}
            </p>
            {topProducto && (
              <p className="text-sm text-purple-800">${topProducto.total_ventas?.toLocaleString()}</p>
            )}
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <p className="text-sm text-amber-600 font-medium">Total Productos</p>
            <p className="text-2xl font-bold">{productos.length}</p>
            <p className="text-xs text-amber-800">Venta promedio: ${promedioVentasPorProducto.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center px-3 py-2 ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <Grid className="h-4 w-4 mr-1" /> Tarjetas
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center px-3 py-2 ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <List className="h-4 w-4 mr-1" /> Tabla
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`flex items-center px-3 py-2 ${
                viewMode === 'charts' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <BarChart2 className="h-4 w-4 mr-1" /> Gráficas
            </button>
          </div>
          
          {viewMode === 'charts' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Top:</span>
              <select
                value={topProductsCount}
                onChange={(e) => setTopProductsCount(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Ordenar por:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="nombre_producto">Nombre</option>
            <option value="total_ventas">Ventas</option>
            <option value="total_articulos">Artículos</option>
          </select>
          
          <button 
            onClick={toggleSortDirection}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            {sortDirection === 'asc' ? (
              <><ArrowUp className="h-4 w-4 mr-1" /> Asc</>
            ) : (
              <><ArrowDown className="h-4 w-4 mr-1" /> Desc</>
            )}
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProductos.map((producto, index) => (
              <div 
                key={producto.codigo_producto ?? `producto-${index}`} 
                className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium truncate max-w-[70%]" title={producto.codigo_producto || ''}>
                    {producto.codigo_producto ?? 'N/A'}
                  </span>
                  <Package className="text-blue-600" size={22} />
                </div>

                <h3 className="text-lg font-semibold mb-4 text-gray-800 line-clamp-2 h-14" title={producto.nombre_producto || ''}>
                  {producto.nombre_producto ?? 'Producto sin nombre'}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="text-blue-500" size={14} />
                      <p className="text-xs text-blue-600">Ventas</p>
                    </div>
                    <p className="text-base font-semibold text-gray-800">
                      ${producto.total_ventas?.toLocaleString() ?? '0'}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-1 mb-1">
                      <Package className="text-green-500" size={14} />
                      <p className="text-xs text-green-600">Artículos</p>
                    </div>
                    <p className="text-base font-semibold text-gray-800">
                      {producto.total_articulos?.toLocaleString() ?? '0'}
                    </p>
                  </div>
                </div>
                
                {/* Percentage of total sales */}
                {producto.total_ventas !== null && totalVentas > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">% del Total de Ventas</span>
                      <span className="text-xs font-medium text-gray-800">
                        {((producto.total_ventas / totalVentas) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${(producto.total_ventas / totalVentas) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Paginación para vista de grid */}
          <Pagination />
        </>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ventas
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Artículos
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % del Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProductos.map((producto, index) => (
                  <tr 
                    key={producto.codigo_producto ?? `producto-${index}`}
                    className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {producto.codigo_producto ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {producto.nombre_producto ?? 'Sin nombre'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      ${producto.total_ventas?.toLocaleString() ?? '0'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {producto.total_articulos?.toLocaleString() ?? '0'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end">
                        <span className="text-gray-700 mr-2 text-sm">
                          {totalVentas > 0 && producto.total_ventas !== null 
                            ? ((producto.total_ventas / totalVentas) * 100).toFixed(1) 
                            : '0'}%
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${totalVentas > 0 && producto.total_ventas !== null 
                              ? ((producto.total_ventas / totalVentas) * 100) 
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
                  <td className="px-4 py-3 text-sm" colSpan={2}>Totales</td>
                  <td className="px-4 py-3 text-sm text-right">${totalVentas.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right">{totalArticulos.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Paginación para vista de tabla */}
          <Pagination />
        </>
      )}

      {/* Charts View */}
      {viewMode === 'charts' && (
        <div className="space-y-8">
          {/* Bar Chart - Top Products by Sales */}
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Top {topProductsCount} Productos por Ventas</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductosByVentas.map(p => ({
                    name: truncateName(p.nombre_producto || 'Sin nombre'),
                    ventas: p.total_ventas || 0,
                    articulos: p.total_articulos || 0
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
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
                            transform="rotate(-35)"
                            fill="#666" 
                            fontSize={12}
                          >
                            {payload.value}
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
                  <Legend />
                  <Bar yAxisId="left" dataKey="ventas" name="Ventas ($)" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="articulos" name="Artículos" fill="#82ca9d" />
                  <Bar yAxisId="left" dataKey="ventas" name="Ventas ($)" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="articulos" name="Artículos" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Pie Chart - Sales Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Distribución de Ventas</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPlot>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${(value as number).toLocaleString()}`} />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      formatter={(value) => truncateName(value as string, 15)}
                    />
                  </RechartsPlot>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Top Products by Items */}
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Top {topProductsCount} Productos por Artículos</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductosByArticulos.map(p => ({
                      name: truncateName(p.nombre_producto || 'Sin nombre'),
                      articulos: p.total_articulos || 0
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={150}
                      tick={props => {
                        const { x, y, payload } = props;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text 
                              x={-5} 
                              y={0} 
                              dy={4} 
                              textAnchor="end" 
                              fill="#666" 
                              fontSize={12}
                            >
                              {payload.value}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="articulos" name="Total Artículos" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {filteredProductos.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
          <PackageSearch className="mx-auto h-12 w-12 mb-4 text-gray-400" />
          <p className="text-gray-500 text-lg">No se encontraron productos que coincidan con su búsqueda</p>
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

export default Productos;
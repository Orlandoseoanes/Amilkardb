import { useEffect, useState } from 'react';
import { getDashboardData } from '../apis/api';
import { Filter, ArrowUpDown, Search, Loader, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend, PieChart, Pie, Cell
} from 'recharts';

interface GananciaData {
  fecha?: string;
  anio?: number;
  mes?: number;
  dia_semana?: string;
  grupo_2_anios?: number;
  grupo_5_anios?: number;
  total_ganancias: string;
}

interface PeriodoOption {
  name: string;
  endpoint: keyof typeof getDashboardData;
  label: string;
}

const PERIODO_OPTIONS: PeriodoOption[] = [
  { name: 'Diario', endpoint: 'gananciasDia', label: 'Ganancias por Día' },
  { name: 'Mensual', endpoint: 'gananciasMes', label: 'Ganancias por Mes' },
  { name: 'Anual', endpoint: 'gananciasAnio', label: 'Ganancias por Año' },
  { name: 'Día de Semana', endpoint: 'gananciasDiaSemana', label: 'Ganancias por Día de la Semana' },
  { name: 'Cada 2 Años', endpoint: 'gananciasCada2Anios', label: 'Ganancias por Bienio' },
  { name: 'Cada 5 Años', endpoint: 'gananciasCada5Anios', label: 'Ganancias por Lustro' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
const DAYS_OF_WEEK = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const Ganancias = () => {
  const [data, setData] = useState<GananciaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState<PeriodoOption>(PERIODO_OPTIONS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'total_ganancias' as keyof GananciaData | 'display_value',
    direction: 'desc' as 'asc' | 'desc',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardData[selectedPeriodo.endpoint]();
        setData(processData(response.data || []));
        setError(null);
      } catch (err) {
        console.error('Error fetching profit data:', err);
        setError('Error loading profit data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriodo]);

  const processData = (rawData: GananciaData[]) => {
    if (!rawData || rawData.length === 0) return [];

    switch (selectedPeriodo.endpoint) {
      case 'gananciasDia':
        return rawData.map((item) => ({
          ...item,
          fecha_formatada: new Date(item.fecha!).toLocaleDateString('es-CO', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }),
          display_value: new Date(item.fecha!).toLocaleDateString('es-CO', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })
        }));
      
      case 'gananciasMes':
        return rawData.map((item) => ({
          ...item,
          mes_nombre: MONTHS[item.mes! - 1],
          display_value: `${MONTHS[item.mes! - 1]} ${item.anio}`
        }));
      
      case 'gananciasAnio':
        return rawData.map((item) => ({
          ...item,
          display_value: `${item.anio}`
        }));
      
      case 'gananciasDiaSemana':
        return rawData.sort((a, b) => {
          return DAYS_OF_WEEK.indexOf(a.dia_semana!) - DAYS_OF_WEEK.indexOf(b.dia_semana!);
        }).map((item) => ({
          ...item,
          dia_semana_capitalizado: item.dia_semana!.charAt(0).toUpperCase() + item.dia_semana!.slice(1),
          display_value: item.dia_semana!.charAt(0).toUpperCase() + item.dia_semana!.slice(1)
        }));
      
      case 'gananciasCada2Anios':
        return rawData.map((item) => ({
          ...item,
          periodo: `${2000 + (item.grupo_2_anios! * 2)}-${2000 + (item.grupo_2_anios! * 2) + 1}`,
          display_value: `${2000 + (item.grupo_2_anios! * 2)}-${2000 + (item.grupo_2_anios! * 2) + 1}`
        }));
      
      case 'gananciasCada5Anios':
        return rawData.map((item) => ({
          ...item,
          periodo: `${2000 + (item.grupo_5_anios! * 5)}-${2000 + (item.grupo_5_anios! * 5) + 4}`,
          display_value: `${2000 + (item.grupo_5_anios! * 5)}-${2000 + (item.grupo_5_anios! * 5) + 4}`
        }));
      
      default:
        return rawData;
    }
  };

  const handleSort = (key: keyof GananciaData | 'display_value') => {
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

  const getDisplayName = (item: any) => {
    switch (selectedPeriodo.endpoint) {
      case 'gananciasDia':
        return item.fecha_formatada;
      case 'gananciasMes':
        return `${item.mes_nombre} ${item.anio}`;
      case 'gananciasAnio':
        return item.anio.toString();
      case 'gananciasDiaSemana':
        return item.dia_semana_capitalizado;
      case 'gananciasCada2Anios':
      case 'gananciasCada5Anios':
        return item.periodo;
      default:
        return '';
    }
  };

  const getTableLabel = () => {
    switch (selectedPeriodo.endpoint) {
      case 'gananciasDia': return 'Fecha';
      case 'gananciasMes': return 'Mes';
      case 'gananciasAnio': return 'Año';
      case 'gananciasDiaSemana': return 'Día de la Semana';
      case 'gananciasCada2Anios': return 'Bienio';
      case 'gananciasCada5Anios': return 'Lustro';
      default: return 'Período';
    }
  };

  const getSearchPlaceholder = () => {
    switch (selectedPeriodo.endpoint) {
      case 'gananciasDia': return 'Buscar por fecha...';
      case 'gananciasMes': return 'Buscar por mes o año...';
      case 'gananciasAnio': return 'Buscar por año...';
      case 'gananciasDiaSemana': return 'Buscar por día de semana...';
      case 'gananciasCada2Anios':
      case 'gananciasCada5Anios': return 'Buscar por período...';
      default: return 'Buscar...';
    }
  };

  const filteredAndSortedData = data
    .filter((item: any) => {
      const searchValue = getDisplayName(item).toLowerCase();
      return searchValue.includes(searchTerm.toLowerCase());
    })
    .sort((a: any, b: any) => {
      let aValue, bValue;
      
      if (sortConfig.key === 'display_value') {
        aValue = getDisplayName(a);
        bValue = getDisplayName(b);
      } else if (sortConfig.key === 'total_ganancias') {
        aValue = parseFloat(a.total_ganancias);
        bValue = parseFloat(b.total_ganancias);
      } else {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      }
      
      return sortConfig.direction === 'asc' 
        ? (aValue > bValue ? 1 : -1) 
        : (aValue < bValue ? 1 : -1);
    });

  const findHighestProfitPeriod = () => {
    if (data.length === 0) return null;
    
    const highest = [...data].sort((a, b) => parseFloat(b.total_ganancias) - parseFloat(a.total_ganancias))[0];
    
    return {
      period: getDisplayName(highest),
      value: highest.total_ganancias
    };
  };

  const calculateTotalProfits = () => {
    return data.reduce((sum, item) => sum + parseFloat(item.total_ganancias), 0);
  };

  const calculateAverageProfits = () => {
    if (data.length === 0) return 0;
    return calculateTotalProfits() / data.length;
  };

  const getChartComponent = () => {
    if (data.length === 0) return null;

    const chartTitle = selectedPeriodo.label;
    const dataKey = 'total_ganancias';
    const maxItems = 20; // Limit visible items for clarity
    const dataToShow = filteredAndSortedData.slice(0, maxItems);

    switch (selectedPeriodo.endpoint) {
      case 'gananciasDia':
      case 'gananciasMes':
      case 'gananciasAnio':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataToShow} margin={{ top: 20, right: 30, left: 30, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="display_value" 
                angle={-45} 
                textAnchor="end" 
                interval={0} 
                height={100} 
              />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} labelFormatter={(label) => `Período: ${label}`} />
              <Legend verticalAlign="top" height={36} />
              <Line 
                type="monotone" 
                dataKey={(entry) => parseFloat(entry.total_ganancias)} 
                name="Ganancias" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={{ r: 4 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'gananciasDiaSemana':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataToShow} margin={{ top: 20, right: 30, left: 30, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="display_value" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend verticalAlign="top" height={36} />
              <Bar 
                dataKey={(entry) => parseFloat(entry.total_ganancias)} 
                name="Ganancias" 
                fill="#3b82f6"
              >
                <LabelList dataKey="total_ganancias" position="top" formatter={formatCurrency} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'gananciasCada2Anios':
      case 'gananciasCada5Anios':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 30 }}>
              <Pie
                data={dataToShow}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={130}
                fill="#8884d8"
                dataKey={(entry) => parseFloat(entry.total_ganancias)}
                nameKey="display_value"
                label={({ display_value, total_ganancias }) => `${display_value}: ${formatCurrency(total_ganancias)}`}
              >
                {dataToShow.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

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
            onClick={() => setSelectedPeriodo(selectedPeriodo)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const highestProfitPeriod = findHighestProfitPeriod();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Análisis de Ganancias</h2>
        <p className="text-gray-600">Visualización y análisis de ganancias por períodos de tiempo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Ganancias Totales</p>
              <p className="text-2xl font-bold">{formatCurrency(calculateTotalProfits())}</p>
            </div>
            <TrendingUp size={40} className="text-white/80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Promedio de Ganancias</p>
              <p className="text-2xl font-bold">{formatCurrency(calculateAverageProfits())}</p>
            </div>
            <Calendar size={40} className="text-white/80" />
          </div>
        </div>
        
        {highestProfitPeriod && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Período Más Rentable</p>
                <p className="text-xl font-bold">{highestProfitPeriod.period}</p>
                <p className="text-lg">{formatCurrency(highestProfitPeriod.value)}</p>
              </div>
              <Filter size={40} className="text-white/80" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
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
            value={PERIODO_OPTIONS.findIndex((option) => option.endpoint === selectedPeriodo.endpoint)}
            onChange={(e) => setSelectedPeriodo(PERIODO_OPTIONS[parseInt(e.target.value)])}
          >
            {PERIODO_OPTIONS.map((option, index) => (
              <option key={option.endpoint} value={index}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-96 mb-6">
        {getChartComponent()}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('display_value')}>
                <div className="flex items-center gap-2">
                  {getTableLabel()}
                  <ArrowUpDown size={16} className="text-gray-500" />
                </div>
              </th>
              <th className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total_ganancias')}>
                <div className="flex items-center justify-end gap-2">
                  Ganancias Totales
                  <ArrowUpDown size={16} className="text-gray-500" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((item, index) => (
              <tr key={index} className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                <td className="px-6 py-4 font-medium">{getDisplayName(item)}</td>
                <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(item.total_ganancias)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-6 py-4">Total</td>
              <td className="px-6 py-4 text-right text-green-600">
                {formatCurrency(filteredAndSortedData.reduce((sum, item) => sum + parseFloat(item.total_ganancias), 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Mostrando {filteredAndSortedData.length} de {data.length} {selectedPeriodo.endpoint === 'gananciasDiaSemana' ? 'días' : 'períodos'}
      </div>
    </div>
  );
};

export default Ganancias;
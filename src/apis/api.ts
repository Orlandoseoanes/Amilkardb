import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/dashboard'
});

export const getDashboardData = {
  resumenBodegas: () => api.get('/resumen-bodegas'),
  resumenMedioPago: () => api.get('/resumen-mediopago'),
  resumenProductos: () => api.get('/resumen-productos'),
  ventasCategoriaPrincipal: () => api.get('/ventas-categoria-principal'),
  ventasCategoriaLinea: () => api.get('/ventas-categoria-linea'),
  ventasCategoriaNivel4: () => api.get('/ventas-categoria-nivel4'),
  ventasCategoriaNivel3: () => api.get('/ventas-categoria-nivel3'),
  gananciasDia: () => api.get('/ganancias/dia'),
  gananciasMes: () => api.get('/ganancias/mes'),
  gananciasAnio: () => api.get('/ganancias/anio'),
  gananciasDiaSemana: () => api.get('/ganancias/dia-semana'),
  gananciasCada2Anios: () => api.get('/ganancias/cada-2-anios'),
  gananciasCada5Anios: () => api.get('/ganancias/cada-5-anios'),
  gananciasProductoDia: () => api.get('/ganancias/producto/dia'),
  gananciasProductoMes: () => api.get('/ganancias/producto/mes'),
  gananciasProductoAnio: () => api.get('/ganancias/producto/anio'),
  ventasBodegaDia: () => api.get('/ventas/bodega/dia'),
  ventasBodegaMes: () => api.get('/ventas/bodega/mes'),
  ventasBodegaAnio: () => api.get('/ventas/bodega/anio'),
  generoProducto: () => api.get('/genero-producto'),
  genero: () => api.get('/genero'),
};

export default api;
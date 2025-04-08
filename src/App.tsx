import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Ventas from './pages/Ventas';
import Bodegas from './pages/Bodegas';
import MediosPago from './pages/MediosPago';
import Productos from './pages/Productos';
import Categorias from './pages/Categorias';
import Ganancias from './pages/Ganancias';
import Genero from './pages/Genero';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="bodegas" element={<Bodegas />} />
          <Route path="medios-pago" element={<MediosPago />} />
          <Route path="productos" element={<Productos />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="ganancias" element={<Ganancias />} />
          <Route path="genero" element={<Genero />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
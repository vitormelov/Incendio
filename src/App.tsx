import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SetorPage from './pages/SetorPage';
import Dashboard from './components/Dashboard';
import IncendioList from './components/IncendioList';
import IncendioForm from './components/IncendioForm';
import { useState, useEffect } from 'react';
import { Incendio } from './types';
import { getIncendios, updateIncendio } from './services/firestore';
import { Home, BarChart3, List } from 'lucide-react';

function App() {
  const [allIncendios, setAllIncendios] = useState<Incendio[]>([]);
  const [selectedIncendio, setSelectedIncendio] = useState<Incendio | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadAllIncendios();
  }, []);

  const loadAllIncendios = async () => {
    try {
      const data = await getIncendios();
      setAllIncendios(data);
    } catch (error) {
      console.error('Erro ao carregar incêndios:', error);
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="text-2xl font-bold text-gray-900">
                Incendio
              </Link>
              <div className="flex gap-4">
                <Link
                  to="/"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                >
                  <Home size={20} />
                  <span>Home</span>
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                >
                  <BarChart3 size={20} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/todos-incendios"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                >
                  <List size={20} />
                  <span>Todos os Incêndios</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setor/:setorId" element={<SetorPage />} />
          <Route 
            path="/dashboard" 
            element={<Dashboard incendios={allIncendios} />} 
          />
          <Route 
            path="/todos-incendios" 
            element={
              <div className="max-w-7xl mx-auto px-4 py-8">
                <IncendioList
                  incendios={allIncendios}
                  onEdit={(inc) => {
                    setSelectedIncendio(inc);
                    setShowForm(true);
                  }}
                  onDelete={async (id) => {
                    const { deleteIncendio } = await import('./services/firestore');
                    try {
                      await deleteIncendio(id);
                      await loadAllIncendios();
                    } catch (error) {
                      console.error('Erro ao excluir:', error);
                      alert('Erro ao excluir incêndio');
                    }
                  }}
                />
                {showForm && selectedIncendio && (
                  <IncendioForm
                    incendio={selectedIncendio}
                    coordenadas={null}
                    onSave={async (incendioData) => {
                      try {
                        await updateIncendio(selectedIncendio.id, incendioData);
                        await loadAllIncendios();
                        setShowForm(false);
                        setSelectedIncendio(null);
                      } catch (error) {
                        console.error('Erro ao salvar:', error);
                        alert('Erro ao salvar incêndio');
                      }
                    }}
                    onCancel={() => {
                      setShowForm(false);
                      setSelectedIncendio(null);
                    }}
                    setor={selectedIncendio.setor}
                  />
                )}
              </div>
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;


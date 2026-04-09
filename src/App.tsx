import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SetorPage from './pages/SetorPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import IncendiosApagadosPage from './pages/IncendiosApagadosPage';
import Dashboard from './components/Dashboard';
import IncendioList from './components/IncendioList';
import IncendioForm from './components/IncendioForm';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Logo from './components/Logo';
import { useState, useEffect } from 'react';
import { Incendio } from './types';
import { getIncendios, updateIncendio, formatLocalDate, getUserNameByEmail, deleteIncendio } from './services/firestore';
import { getCurrentUser, logout, onAuthChange, isAdmin } from './services/auth';
import { Home, BarChart3, List, LogOut, User, Shield, CheckCircle } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

function App() {
  const [allIncendios, setAllIncendios] = useState<Incendio[]>([]);
  const [selectedIncendio, setSelectedIncendio] = useState<Incendio | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(getCurrentUser());

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      loadAllIncendios();
    }
  }, [user]);

  const loadAllIncendios = async () => {
    try {
      const data = await getIncendios();
      setAllIncendios(data);
    } catch (error) {
      console.error('Erro ao carregar incêndios:', error);
    }
  };

  const handleResolveIncendio = async (id: string) => {
    try {
      const hoje = new Date();
      const dataFoiApagada = formatLocalDate(hoje);
      
      await updateIncendio(id, { dataFoiApagada });
      await loadAllIncendios();
    } catch (error) {
      console.error('Erro ao marcar incêndio como resolvido:', error);
      alert('Erro ao marcar incêndio como resolvido');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {user && (
          /* Navigation */
          <nav className="bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <Link to="/" className="flex items-center">
                  <Logo size="md" />
                </Link>
                <div className="flex items-center gap-4">
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
                    <Link
                      to="/incendios-apagados"
                      className="flex items-center gap-2 px-4 py-2 text-green-700 hover:bg-green-50 rounded"
                    >
                      <CheckCircle size={20} />
                      <span>Resolvidos</span>
                    </Link>
                    {isAdmin(user) && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-purple-700 hover:bg-purple-50 rounded border border-purple-200"
                      >
                        <Shield size={20} />
                        <span>Admin</span>
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-3 pl-4 border-l border-gray-300">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <User size={18} />
                      <span className="max-w-[200px] truncate">{getUserNameByEmail(user.email)}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Sair"
                    >
                      <LogOut size={18} />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* Routes */}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/setor/:setorId"
            element={
              <ProtectedRoute>
                <SetorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard incendios={allIncendios} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incendios-apagados"
            element={
              <ProtectedRoute>
                <IncendiosApagadosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/todos-incendios"
            element={
              <ProtectedRoute>
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <IncendioList
                    incendios={allIncendios.filter(inc => !inc.dataFoiApagada)}
                    onEdit={(inc) => {
                      setSelectedIncendio(inc);
                      setShowForm(true);
                    }}
                    onDelete={async (id) => {
                      try {
                        await deleteIncendio(id);
                        await loadAllIncendios();
                      } catch (error) {
                        console.error('Erro ao excluir:', error);
                        alert('Erro ao excluir incêndio');
                      }
                    }}
                    onResolve={handleResolveIncendio}
                    showResolveButton={true}
                    showStatusFilter={true}
                    showEditButton={false}
                    showDeleteButton={false}
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
                      onDelete={async (id) => {
                        try {
                          await deleteIncendio(id);
                          await loadAllIncendios();
                          setShowForm(false);
                          setSelectedIncendio(null);
                        } catch (error) {
                          console.error('Erro ao excluir:', error);
                          alert('Erro ao excluir incêndio');
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
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;


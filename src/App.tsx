import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ObraPage from './pages/ObraPage';
import ObraServicesPage from './pages/ObraServicesPage';
import ObraNotesPage from './pages/ObraNotesPage';
import ObraGastosPage from './pages/ObraGastosPage';
import SetorPage from './pages/SetorPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import AdminCollaboratorsPage from './pages/AdminCollaboratorsPage';
import AdminNewCollaboratorPage from './pages/AdminNewCollaboratorPage';
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
import { Home, BarChart3, List, LogOut, User, Shield, CheckCircle, Menu, X } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

function App() {
  const [allIncendios, setAllIncendios] = useState<Incendio[]>([]);
  const [selectedIncendio, setSelectedIncendio] = useState<Incendio | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(getCurrentUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navLinkBase =
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors';

  const getNavLinkClass = (isActive: boolean) =>
    `${navLinkBase} ${
      isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {user && (
          /* Navigation */
          <nav className="sticky top-0 z-40 bg-white/95 border-b shadow-sm backdrop-blur">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex h-16 items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((v) => !v)}
                    className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
                    aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                  >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>

                  <Link
                    to="/"
                    className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Logo size="md" showText />
                  </Link>
                </div>

                <div className="hidden md:flex md:flex-1 md:items-center md:justify-between md:gap-4">
                  <div className="flex items-center gap-2">
                    <NavLink to="/" end className={({ isActive }) => getNavLinkClass(isActive)}>
                      <Home size={18} />
                      <span>Home</span>
                    </NavLink>
                    <NavLink to="/dashboard" className={({ isActive }) => getNavLinkClass(isActive)}>
                      <BarChart3 size={18} />
                      <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/todos-incendios" className={({ isActive }) => getNavLinkClass(isActive)}>
                      <List size={18} />
                      <span>Todos</span>
                    </NavLink>
                    <NavLink to="/incendios-apagados" className={({ isActive }) => getNavLinkClass(isActive)}>
                      <CheckCircle size={18} />
                      <span>Resolvidos</span>
                    </NavLink>
                    {isAdmin(user) && (
                      <NavLink to="/admin" className={({ isActive }) => getNavLinkClass(isActive)}>
                        <Shield size={18} />
                        <span>Admin</span>
                      </NavLink>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <User size={16} />
                      <span className="max-w-[220px] truncate">{getUserNameByEmail(user.email)}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      title="Sair"
                    >
                      <LogOut size={16} />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>

                <div className="md:hidden flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
                    <User size={16} />
                    <span className="max-w-[140px] truncate">{getUserNameByEmail(user.email)}</span>
                  </div>
                </div>
              </div>

              {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 py-3">
                  <div className="grid gap-2">
                    <NavLink
                      to="/"
                      end
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => getNavLinkClass(isActive)}
                    >
                      <Home size={18} />
                      <span>Home</span>
                    </NavLink>
                    <NavLink
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => getNavLinkClass(isActive)}
                    >
                      <BarChart3 size={18} />
                      <span>Dashboard</span>
                    </NavLink>
                    <NavLink
                      to="/todos-incendios"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => getNavLinkClass(isActive)}
                    >
                      <List size={18} />
                      <span>Todos os Incêndios</span>
                    </NavLink>
                    <NavLink
                      to="/incendios-apagados"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => getNavLinkClass(isActive)}
                    >
                      <CheckCircle size={18} />
                      <span>Resolvidos</span>
                    </NavLink>
                    {isAdmin(user) && (
                      <NavLink
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) => getNavLinkClass(isActive)}
                      >
                        <Shield size={18} />
                        <span>Admin</span>
                      </NavLink>
                    )}

                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={handleLogout}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                        title="Sair"
                      >
                        <LogOut size={16} />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
            path="/admin/colaboradores"
            element={
              <ProtectedAdminRoute>
                <AdminCollaboratorsPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/novo-colaborador"
            element={
              <ProtectedAdminRoute>
                <AdminNewCollaboratorPage />
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
            path="/obra/:obraId"
            element={
              <ProtectedRoute>
                <ObraPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/obra/:obraId/servicos"
            element={
              <ProtectedRoute>
                <ObraServicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/obra/:obraId/notas"
            element={
              <ProtectedRoute>
                <ObraNotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/obra/:obraId/gastos"
            element={
              <ProtectedRoute>
                <ObraGastosPage />
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


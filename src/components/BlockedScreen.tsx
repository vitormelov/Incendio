import { Lock, LogOut } from 'lucide-react';
import type { UserBloqueio } from '../types';
import Logo from './Logo';

interface BlockedScreenProps {
  bloqueio: UserBloqueio;
  onLogout: () => void;
}

/** Tela exibida no lugar do site quando o admin bloqueia o usuário. */
export default function BlockedScreen({ bloqueio, onLogout }: BlockedScreenProps) {
  if (bloqueio === 'fora_do_ar') {
    // Imita uma página de erro genérica de servidor: sem logo, sem menu, sem botão de sair.
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-lg text-center font-sans">
          <h1 className="text-7xl font-light text-gray-300 mb-4">503</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Serviço temporariamente indisponível</h2>
          <p className="text-gray-500">
            O servidor não pode atender sua solicitação no momento devido a manutenção ou sobrecarga.
            Tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" showText />
        </div>
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <Lock className="text-red-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Usuário bloqueado</h1>
        <p className="text-gray-600 mb-6">Verifique seu acesso com o administrador.</p>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  );
}

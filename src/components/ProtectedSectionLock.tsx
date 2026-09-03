import React from 'react';
import { Lock, Shield, KeyRound, ArrowRight } from 'lucide-react';

interface ProtectedSectionLockProps {
  title: string;
  subtitle: string;
  onUnlockRequest: () => void;
}

export const ProtectedSectionLock: React.FC<ProtectedSectionLockProps> = ({
  title,
  subtitle,
  onUnlockRequest
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto p-8 text-center animate-in fade-in duration-300">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 shadow-xl flex items-center justify-center text-blue-400">
          <Lock className="w-10 h-10" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-white">
          <Shield className="w-4 h-4" />
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-3">
        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
        <span>Sección Comercial Protegida</span>
      </div>

      <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
        {title}
      </h2>

      <p className="text-sm text-slate-600 leading-relaxed max-w-md mb-8">
        {subtitle}
      </p>

      <button
        onClick={onUnlockRequest}
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
      >
        <KeyRound className="w-4 h-4" />
        <span>Ingresar PIN de Acceso</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-xs text-slate-400 mt-6">
        Acceso restringido para control de mayoreo, márgenes y directorio de clientes.
      </p>
    </div>
  );
};

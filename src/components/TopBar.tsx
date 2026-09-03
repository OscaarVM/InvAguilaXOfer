import React from 'react';
import { Menu, Search, Upload, Plus, User, FileUp, Sparkles, Building2, Lock, Unlock, KeyRound } from 'lucide-react';

interface TopBarProps {
  onOpenMyInventoryUpload: () => void;
  onOpenSupplierUpload: () => void;
  onOpenNewSale: () => void;
  searchGlobal: string;
  onSearchGlobalChange: (query: string) => void;
  onToggleMobileMenu: () => void;
  isPinAuthorized: boolean;
  onRequestPinUnlock: () => void;
  onLockPin: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMyInventoryUpload,
  onOpenSupplierUpload,
  onOpenNewSale,
  searchGlobal,
  onSearchGlobalChange,
  onToggleMobileMenu,
  isPinAuthorized,
  onRequestPinUnlock,
  onLockPin,
}) => {
  const handleNewSaleClick = () => {
    if (!isPinAuthorized) {
      onRequestPinUnlock();
      return;
    }
    onOpenNewSale();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30 shadow-xs">
      
      {/* Botones de Carga Rápida y Menú Móvil */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
          title="Abrir Menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5">
          <button
            onClick={onOpenMyInventoryUpload}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3.5 py-2 rounded-lg border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Ir a carga diaria de inventario propio"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Carga Diaria Mi Inventario</span>
          </button>

          <button
            onClick={onOpenSupplierUpload}
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3.5 py-2 rounded-lg border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Ir a carga diaria de catálogo de proveedor"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Carga Diaria Proveedor</span>
          </button>
        </div>

        <button
          onClick={handleNewSaleClick}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg shadow-sm transition cursor-pointer ${
            isPinAuthorized 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
          title={isPinAuthorized ? 'Registrar una nueva venta' : 'Se requiere PIN 141096 para registrar venta'}
        >
          {isPinAuthorized ? (
            <Plus className="w-3.5 h-3.5" />
          ) : (
            <Lock className="w-3.5 h-3.5" />
          )}
          <span className="hidden xs:inline">Registrar</span> Venta
        </button>
      </div>

      {/* Buscador Rápido, Estado PIN y Perfil */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Indicador y Botón de Estado PIN */}
        {isPinAuthorized ? (
          <button
            onClick={onLockPin}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition cursor-pointer"
            title="Haga clic para bloquear la sección comercial y cruce de datos"
          >
            <Unlock className="w-3 h-3 text-emerald-600" />
            <span>Comercial Activo</span>
            <span className="text-[10px] text-emerald-600 underline ml-0.5 font-normal">Bloquear</span>
          </button>
        ) : (
          <button
            onClick={onRequestPinUnlock}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition cursor-pointer animate-pulse"
            title="Haga clic para ingresar el PIN de acceso 141096"
          >
            <Lock className="w-3 h-3 text-amber-600" />
            <span>PIN Protegido</span>
            <span className="text-[10px] bg-amber-200/80 px-1 rounded font-mono font-bold">141096</span>
          </button>
        )}

        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchGlobal}
            onChange={(e) => onSearchGlobalChange(e.target.value)}
            placeholder="Buscar por medida o marca..."
            className="w-36 lg:w-60 bg-slate-100 border border-slate-200/80 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          {searchGlobal && (
            <button
              onClick={() => onSearchGlobalChange('')}
              className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 text-blue-800 flex items-center justify-center font-bold text-xs">
            AV
          </div>
          <div className="text-right hidden lg:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              Admin de Ventas
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              ID: #4059 • El Águila
            </p>
          </div>
        </div>
      </div>

    </header>
  );
};

import React from 'react';
import { 
  ArrowRightLeft, Package, Building2, TrendingUp, Users, 
  FileSpreadsheet, RotateCcw, X, Shield, ChevronRight,
  Lock, Unlock, KeyRound, Cloud, RefreshCw
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'cross' | 'inventory' | 'supplier' | 'sales' | 'customers';
  setActiveTab: (tab: 'cross' | 'inventory' | 'supplier' | 'sales' | 'customers') => void;
  matchesCount: number;
  productsCount: number;
  suppliersCount: number;
  salesCount: number;
  customersCount: number;
  isPinAuthorized: boolean;
  onRequestPinUnlock: (targetTab: 'cross' | 'sales' | 'customers') => void;
  onLockPin: () => void;
  onExportAll: () => void;
  onResetData: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  cloudSyncStatus?: 'connected' | 'syncing' | 'offline';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  matchesCount,
  productsCount,
  suppliersCount,
  salesCount,
  customersCount,
  isPinAuthorized,
  onRequestPinUnlock,
  onLockPin,
  onExportAll,
  onResetData,
  isOpenMobile,
  onCloseMobile,
  cloudSyncStatus = 'connected',
}) => {
  const handleNavClick = (tab: 'cross' | 'inventory' | 'supplier' | 'sales' | 'customers') => {
    const isProtected = tab === 'cross' || tab === 'sales' || tab === 'customers';
    if (isProtected && !isPinAuthorized) {
      onRequestPinUnlock(tab);
      onCloseMobile();
      return;
    }
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col text-white border-r border-slate-800 transition-transform duration-300 ease-in-out shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <h1 className="text-xl font-bold tracking-tight text-blue-400">
                INVENTRA PRO
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">
              Control de Mayoreo & Márgenes
            </p>
          </div>

          <button 
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de Sincronización en la Nube */}
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                cloudSyncStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                cloudSyncStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="text-[11px] font-medium text-slate-300">
              {cloudSyncStatus === 'syncing' ? 'Sincronizando...' : 'Nube Firebase'}
            </span>
          </div>
          <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
            PC ⇄ Móvil
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 overflow-y-auto space-y-6">
          
          {/* Categoría: Operaciones */}
          <div>
            <div className="px-6 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Operaciones
            </div>

            <div className="space-y-0.5">
              {/* Cruce de Datos (Protegido con PIN) */}
              <button
                onClick={() => handleNavClick('cross')}
                className={`w-full flex items-center justify-between px-6 py-3 transition ${
                  activeTab === 'cross'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'cross' ? (
                    <span className="w-2 h-2 rounded-full bg-white shadow-xs"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full border border-slate-500"></span>
                  )}
                  <span className="text-xs">Cruce de Datos</span>
                  {!isPinAuthorized && (
                    <span title="Protegido con PIN">
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    </span>
                  )}
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'cross' 
                    ? 'bg-blue-800 text-white' 
                    : 'bg-slate-800 text-blue-400 border border-slate-700'
                }`}>
                  {matchesCount}
                </span>
              </button>

              {/* Mi Inventario */}
              <button
                onClick={() => handleNavClick('inventory')}
                className={`w-full flex items-center justify-between px-6 py-3 transition ${
                  activeTab === 'inventory'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  {activeTab === 'inventory' ? (
                    <span className="w-2 h-2 rounded-full bg-white mr-3 shadow-xs"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full border border-slate-500 mr-3"></span>
                  )}
                  <span className="text-xs">Mi Inventario</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'inventory' 
                    ? 'bg-blue-800 text-white' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {productsCount}
                </span>
              </button>

              {/* Inv. Proveedor */}
              <button
                onClick={() => handleNavClick('supplier')}
                className={`w-full flex items-center justify-between px-6 py-3 transition ${
                  activeTab === 'supplier'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  {activeTab === 'supplier' ? (
                    <span className="w-2 h-2 rounded-full bg-white mr-3 shadow-xs"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full border border-slate-500 mr-3"></span>
                  )}
                  <span className="text-xs">Inv. Proveedor</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'supplier' 
                    ? 'bg-blue-800 text-white' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {suppliersCount}
                </span>
              </button>
            </div>
          </div>

          {/* Categoría: Comercial */}
          <div>
            <div className="px-6 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Comercial
              </span>
              {!isPinAuthorized ? (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> PIN
                </span>
              ) : (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono flex items-center gap-1">
                  <Unlock className="w-2.5 h-2.5" /> Activo
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              {/* Panel de Ventas (Protegido) */}
              <button
                onClick={() => handleNavClick('sales')}
                className={`w-full flex items-center justify-between px-6 py-3 transition ${
                  activeTab === 'sales'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'sales' ? (
                    <span className="w-2 h-2 rounded-full bg-white shadow-xs"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full border border-slate-500"></span>
                  )}
                  <span className="text-xs">Panel de Ventas</span>
                  {!isPinAuthorized && (
                    <span title="Protegido con PIN">
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    </span>
                  )}
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'sales' 
                    ? 'bg-blue-800 text-white' 
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                }`}>
                  {salesCount}
                </span>
              </button>

              {/* Directorio Clientes (Protegido) */}
              <button
                onClick={() => handleNavClick('customers')}
                className={`w-full flex items-center justify-between px-6 py-3 transition ${
                  activeTab === 'customers'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'customers' ? (
                    <span className="w-2 h-2 rounded-full bg-white shadow-xs"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full border border-slate-500"></span>
                  )}
                  <span className="text-xs">Directorio Clientes</span>
                  {!isPinAuthorized && (
                    <span title="Protegido con PIN">
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    </span>
                  )}
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'customers' 
                    ? 'bg-blue-800 text-white' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {customersCount}
                </span>
              </button>
            </div>

            {/* Tarjeta de Control de Seguridad PIN */}
            <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    isPinAuthorized 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isPinAuthorized ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-white leading-tight">
                      {isPinAuthorized ? 'Sesión Desbloqueada' : 'Área Comercial Bloqueada'}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {isPinAuthorized ? 'Cruce y ventas accesibles' : 'PIN requerido'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2.5">
                {isPinAuthorized ? (
                  <button
                    onClick={onLockPin}
                    className="w-full py-1.5 px-2 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Bloquear Acceso Ahora</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onRequestPinUnlock('cross')}
                    className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Ingresar PIN</span>
                  </button>
                )}
              </div>
            </div>
          </div>

        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={onExportAll}
            className="w-full bg-slate-800 py-2.5 px-3 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white flex items-center justify-center gap-2 border border-slate-700/60 transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar Reportes (XLSX)</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('¿Deseas restaurar los datos iniciales de demostración de llantas, proveedor y clientes?')) {
                onResetData();
              }
            }}
            className="w-full py-1.5 px-3 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Restablecer Datos Demo</span>
          </button>

          <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
            Rines & Llantas El Águila v2.4
          </div>
        </div>

      </aside>
    </>
  );
};

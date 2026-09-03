import React, { useState, useMemo } from 'react';
import { ProductItem, SupplierItem, CrossMatchItem, OpportunityType } from '../types';
import { computeCrossAnalysis, CrossMatchOptions, isChineseOrigin } from '../utils/crossAnalysis';
import { exportCrossAnalysisToExcel } from '../utils/excel';
import { 
  ArrowRightLeft, Search, Download, DollarSign, TrendingUp, 
  Sparkles, CheckCircle, AlertTriangle, HelpCircle, ArrowUpRight,
  Sliders, ShoppingCart, Info, Percent, Tag, ShieldCheck
} from 'lucide-react';

interface CrossAnalysisTabProps {
  products: ProductItem[];
  suppliers: SupplierItem[];
  onDirectSale: (item: {
    medida: string;
    marca: string;
    costo: number;
    precioSugerido: number;
    descripcion: string;
  }) => void;
  globalSearch?: string;
  onUpdateProducts?: (products: ProductItem[]) => void;
}

export const CrossAnalysisTab: React.FC<CrossAnalysisTabProps> = ({
  products,
  suppliers,
  onDirectSale,
  globalSearch = '',
  onUpdateProducts,
}) => {
  // Configuración de cruce: Por defecto "SOLO MEDIDA" tal como lo solicitó el usuario
  const [targetMargin, setTargetMargin] = useState<number>(20);
  const [matchMode, setMatchMode] = useState<'exact' | 'medida_only'>('medida_only');
  const [costBase, setCostBase] = useState<'menor' | 'proveedor' | 'propio'>('menor');
  const [onlyChineseOrigin, setOnlyChineseOrigin] = useState<boolean>(true);
  // Regla solicitada por el usuario: Comparar costos solo si existencia del proveedor es >= 4 piezas (evita costos viejos de saldos)
  const [minSupplierStock, setMinSupplierStock] = useState<number>(4);

  // Filtros
  const [searchMedida, setSearchMedida] = useState('');
  const [searchMarca, setSearchMarca] = useState('');
  const [filterOpportunity, setFilterOpportunity] = useState<
    'all' | 'matches' | 'matches_paired' | 'matches_exclusive' | 'better_own' | 'cheaper_supplier' | 'supplier_only' | 'discarded_low_stock'
  >('matches'); // Iniciar por defecto en "Coincidencias" para enfocar directo la comparativa de venta

  // Conteo de productos chinos vs otros en mi inventario
  const chineseProductsInInventory = useMemo(() => {
    return products.filter(p => isChineseOrigin(p.origen, p.marca, p.descripcion));
  }, [products]);

  // Función para marcar todo el inventario propio como origen CHINO
  const handleMarkAllAsChinese = () => {
    if (!onUpdateProducts) return;
    const updated = products.map(p => ({
      ...p,
      origen: 'CHINO'
    }));
    onUpdateProducts(updated);
  };

  // Ejecutar el cruce de inventarios
  const crossItems = useMemo(() => {
    return computeCrossAnalysis(products, suppliers, {
      targetMarginPercent: targetMargin,
      matchMode,
      costBase,
      onlyChineseOrigin,
      minSupplierStock,
    });
  }, [products, suppliers, targetMargin, matchMode, costBase, onlyChineseOrigin, minSupplierStock]);

  // Filtrado de la tabla (incluye búsqueda local o global si existe)
  const filteredItems = useMemo(() => {
    const activeSearch = globalSearch.trim().toLowerCase();

    return crossItems.filter(item => {
      const matchGlobal = activeSearch === '' ||
        item.medidaDisplay.toLowerCase().includes(activeSearch) ||
        item.marcaDisplay.toLowerCase().includes(activeSearch) ||
        item.medidaNormalizada.toLowerCase().includes(activeSearch);

      const matchMed = searchMedida.trim() === '' || 
        item.medidaDisplay.toLowerCase().includes(searchMedida.toLowerCase()) ||
        item.medidaNormalizada.toLowerCase().includes(searchMedida.toLowerCase());

      const matchMar = searchMarca.trim() === '' || 
        item.marcaDisplay.toLowerCase().includes(searchMarca.toLowerCase());

      let matchOpp = true;
      if (filterOpportunity === 'matches') {
        // Regla solicitada: Todas las coincidencias para vender con mi inventario chino
        // (incluye tanto cruce directo con proveedor como medidas que el proveedor no tiene en lista)
        matchOpp = !!item.esCoincidencia;
      } else if (filterOpportunity === 'matches_paired') {
        matchOpp = item.tipoCoincidencia === 'cruce_directo';
      } else if (filterOpportunity === 'matches_exclusive') {
        matchOpp = item.tipoCoincidencia === 'exclusivo_propio';
      } else if (filterOpportunity === 'better_own') {
        matchOpp = item.comparativaVenta === 'mi_inventario_mejor_precio' || 
                   item.comparativaVenta === 'mismo_precio' || 
                   item.comparativaVenta === 'exclusivo_sin_competencia';
      } else if (filterOpportunity === 'cheaper_supplier') {
        matchOpp = item.comparativaVenta === 'proveedor_mas_barato';
      } else if (filterOpportunity === 'supplier_only') {
        matchOpp = item.tipoCoincidencia === 'solo_proveedor';
      } else if (filterOpportunity === 'discarded_low_stock') {
        matchOpp = !!item.descartadoPorBajoStock;
      }

      return matchGlobal && matchMed && matchMar && matchOpp;
    });
  }, [crossItems, globalSearch, searchMedida, searchMarca, filterOpportunity]);

  // Métricas del Cruce
  // 1. Coincidencias totales para venta con mi inventario chino (con y sin proveedor en lista)
  const totalMatchesCount = useMemo(() => {
    return crossItems.filter(i => i.esCoincidencia).length;
  }, [crossItems]);

  // 2. Cruces directos con proveedor con stock >= 4 piezas
  const directMatchesCount = useMemo(() => {
    return crossItems.filter(i => i.tipoCoincidencia === 'cruce_directo').length;
  }, [crossItems]);

  // 3. Exclusivas de mi inventario (proveedor no tiene la medida en lista o < 4 pzas)
  const exclusiveOwnCount = useMemo(() => {
    return crossItems.filter(i => i.tipoCoincidencia === 'exclusivo_propio').length;
  }, [crossItems]);

  // 4. Casos donde con mi inventario vendo a igual o mejor precio que la lista del proveedor
  const betterOrEqualPriceCount = useMemo(() => {
    return crossItems.filter(i => 
      i.comparativaVenta === 'mi_inventario_mejor_precio' || 
      i.comparativaVenta === 'mismo_precio' || 
      i.comparativaVenta === 'exclusivo_sin_competencia'
    ).length;
  }, [crossItems]);

  // 5. Casos donde proveedor es más barato
  const supplierCheaperCount = useMemo(() => {
    return crossItems.filter(i => i.comparativaVenta === 'proveedor_mas_barato').length;
  }, [crossItems]);

  // 6. Solo en catálogo de proveedor
  const supplierOnlyCount = useMemo(() => {
    return crossItems.filter(i => i.tipoCoincidencia === 'solo_proveedor').length;
  }, [crossItems]);

  const discardedLowStockCount = useMemo(() => {
    return crossItems.filter(i => i.descartadoPorBajoStock).length;
  }, [crossItems]);

  const averageSavingAmount = useMemo(() => {
    const cheaper = crossItems.filter(i => i.comparativaVenta === 'proveedor_mas_barato');
    if (cheaper.length === 0) return 0;
    const totalDiff = cheaper.reduce((sum, i) => sum + i.diferenciaCosto, 0);
    return totalDiff / cheaper.length;
  }, [crossItems]);

  const averageProfitUnit = useMemo(() => {
    const valid = crossItems.filter(i => i.gananciaEstimadaPorUnidad > 0 && i.esCoincidencia);
    if (valid.length === 0) return 0;
    return valid.reduce((sum, i) => sum + i.gananciaEstimadaPorUnidad, 0) / valid.length;
  }, [crossItems]);

  return (
    <div className="space-y-6">
      
      {/* Panel de Control y Simulador de Mayoreo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Algoritmo de Cruce de Inventarios
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Cruce de Inventario Propio vs. Catálogo Proveedor
            </h2>
            <p className="text-sm text-slate-500">
              Identifica al instante qué medidas puedes vender a clientes de mayoreo aprovechando precios más baratos de proveedor o liquidando existencias propias.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => exportCrossAnalysisToExcel(filteredItems, targetMargin)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Exportar Cruce a Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Simulador Interactivo */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          
          {/* Margen Objetivo */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-blue-600" />
                Margen Objetivo de Mayoreo:
              </label>
              <span className="text-sm font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                {targetMargin}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              step="1"
              value={targetMargin}
              onChange={(e) => setTargetMargin(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
              <span>5% (Volumen)</span>
              <span>20% (Estándar)</span>
              <span>45% (Alto)</span>
            </div>
          </div>

          {/* Base de Costo */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Base para Calcular Precio Mayoreo:
            </label>
            <select
              value={costBase}
              onChange={(e: any) => setCostBase(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="menor">Costo más bajo (Recomendado)</option>
              <option value="proveedor">Costo Proveedor (Para cotizar pedidos)</option>
              <option value="propio">Mi Costo Histórico (Para inventario físico)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {costBase === 'menor' && 'Calcula el precio mayoreo sobre el costo más económico para dar mejor precio al cliente.'}
              {costBase === 'proveedor' && 'Usa el precio del proveedor como base para cotizar a mayoreo.'}
              {costBase === 'propio' && 'Usa tu costo de compra histórico para asegurar tu margen interno.'}
            </p>
          </div>

          {/* Modo de Coincidencia */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
              Criterio de Cruce:
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMatchMode('medida_only')}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center justify-center gap-1 ${
                  matchMode === 'medida_only'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>Solo Medida</span>
                {matchMode === 'medida_only' && <span className="text-[10px] bg-blue-500 text-white px-1 rounded">Activo</span>}
              </button>
              <button
                type="button"
                onClick={() => setMatchMode('exact')}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  matchMode === 'exact'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Medida + Marca
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {matchMode === 'medida_only' 
                ? '✓ Solo Medida: Cruza directamente la medida de tu inventario chino contra la del proveedor sin importar la marca.' 
                : 'Compara llantas que coincidan tanto en marca como en medida.'}
            </p>
          </div>

          {/* Condición de Stock Mínimo del Proveedor */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                Stock Mín. Proveedor:
              </label>
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                minSupplierStock >= 4 ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {minSupplierStock > 0 ? `≥ ${minSupplierStock} pzas` : 'Sin filtro'}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setMinSupplierStock(4)}
                className={`flex-1 py-1.5 px-1.5 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center justify-center gap-1 ${
                  minSupplierStock === 4
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title="Compara únicamente si el proveedor tiene 4 o más piezas en inventario. Descarta saldos y costos viejos de 1 pieza."
              >
                <span>≥ 4 pzas</span>
                {minSupplierStock === 4 && <span className="text-[9px] bg-purple-500 text-white px-1 rounded">Activo</span>}
              </button>
              <button
                type="button"
                onClick={() => setMinSupplierStock(8)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  minSupplierStock === 8
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title="Exige al menos 8 piezas (2 juegos completos para mayoristas)"
              >
                ≥ 8 pzas
              </button>
              <button
                type="button"
                onClick={() => setMinSupplierStock(1)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  minSupplierStock === 1
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title="Permite comparar incluso si solo queda 1 pieza (atención: puede incluir costos viejos)"
              >
                ≥ 1 pza
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {minSupplierStock >= 4
                ? '✓ Filtro activo: Descarta existencias de 1 a 3 pzas para evitar costos viejos o desactualizados.'
                : 'Permite todas las existencias, incluyendo saldos de 1 pieza.'}
            </p>
          </div>

          {/* Filtro de Origen Chino y Condición de Stock */}
          <div className="md:col-span-2 xl:col-span-4 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-amber-50/70 p-3 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm flex-shrink-0">
                🇨🇳
              </div>
              <div>
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5 flex-wrap">
                  <span>Cruce Exclusivo de Producto de Origen CHINO</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                    Proveedor 100% Chino
                  </span>
                  {minSupplierStock >= 4 && (
                    <span className="text-[10px] bg-purple-100 text-purple-900 border border-purple-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-purple-700" />
                      Stock Prov. ≥ {minSupplierStock} Pzas (Filtro Anti-Costos Viejos)
                    </span>
                  )}
                  <span className="text-[10px] bg-blue-100 text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded font-bold">
                    {totalMatchesCount} Coincidencias Activas
                  </span>
                </div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  <span>
                    Comparando <strong>{chineseProductsInInventory.length} productos chinos</strong> de tu inventario: 
                    <strong> {directMatchesCount} medidas</strong> coinciden en ambos con stock verificado y 
                    <strong> {exclusiveOwnCount} medidas</strong> exclusivas de tu almacén para vender al mismo o mejor precio sin competencia directa del proveedor.
                  </span>
                  {minSupplierStock >= 4 && (
                    <span className="ml-1 text-purple-950 font-medium">
                      (Costos de proveedor comparados únicamente si existencia es ≥ {minSupplierStock} piezas).
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onUpdateProducts && (products.length - chineseProductsInInventory.length > 0) && (
                <button
                  type="button"
                  onClick={handleMarkAllAsChinese}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white text-amber-800 border border-amber-300 hover:bg-amber-100 transition cursor-pointer flex items-center gap-1 whitespace-nowrap shadow-2xs"
                  title="Convierte todas las medidas de tu inventario propio a origen CHINO"
                >
                  <span>🇨🇳</span> Marcar todo mi inventario como CHINO
                </button>
              )}
              <button
                type="button"
                onClick={() => setOnlyChineseOrigin(!onlyChineseOrigin)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  onlyChineseOrigin 
                    ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700 shadow-xs' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {onlyChineseOrigin ? '✓ Cruce Solo Chino Activo' : 'Cruzar Todo el Inventario'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Tarjetas de Insights y KPIs de Cruce - Professional Polish Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Coincidencias de Venta</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600 mt-2">{totalMatchesCount}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5 flex-wrap">
            <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-bold">{directMatchesCount} con prov</span>
            <span>+</span>
            <span className="bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded font-bold">{exclusiveOwnCount} exclusivas</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Mismo o Mejor Precio</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-2">{betterOrEqualPriceCount}</div>
          <div className="text-xs text-emerald-700 mt-1 font-medium">
            Superas o igualas al proveedor con tu inventario
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Proveedor Más Barato</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600 mt-2">
            {supplierCheaperCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {supplierCheaperCount > 0 ? `Ahorro prom. $${averageSavingAmount.toFixed(2)} / llanta` : 'Costos propios más convenientes'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ganancia / Pza Est.</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600 mt-2">
            ${averageProfitUnit.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Utilidad proyectada al {targetMargin}% margen
          </div>
        </div>

      </div>

      {/* Buscador de Medida y Marca en el Cruce */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Buscar Medida en Cruce
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchMedida}
                onChange={(e) => setSearchMedida(e.target.value)}
                placeholder="Ej. 205/55R16, 265/70R17, 17X8, 185..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Buscar Marca en Cruce
            </label>
            <input
              type="text"
              value={searchMarca}
              onChange={(e) => setSearchMarca(e.target.value)}
              placeholder="Ej. Michelin, Goodyear, Bridgestone..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Filtro de Coincidencia
            </label>
            <select
              value={filterOpportunity}
              onChange={(e: any) => setFilterOpportunity(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            >
              <option value="matches">⭐ Coincidencias de Mi Inventario ({totalMatchesCount})</option>
              <option value="matches_paired">  ↳ Cruces Directos con Proveedor ({directMatchesCount})</option>
              <option value="matches_exclusive">  ↳ Exclusivas de Mi Almacén (Sin prov) ({exclusiveOwnCount})</option>
              <option value="better_own">🏆 Vender a Mejor o Igual Precio ({betterOrEqualPriceCount})</option>
              <option value="cheaper_supplier">🛒 Proveedor Más Barato ({supplierCheaperCount})</option>
              <option value="all">Ver Todas las Filas ({crossItems.length})</option>
              <option value="supplier_only">Solo en Catálogo Proveedor ({supplierOnlyCount})</option>
              {discardedLowStockCount > 0 && (
                <option value="discarded_low_stock">⚠️ Descartados por stock prov &lt; 4 pzas ({discardedLowStockCount})</option>
              )}
            </select>
          </div>

        </div>

        {(searchMedida || searchMarca || filterOpportunity !== 'all' || globalSearch) && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Mostrando <strong>{filteredItems.length}</strong> resultados de análisis
            </span>
            <button
              onClick={() => {
                setSearchMedida('');
                setSearchMarca('');
                setFilterOpportunity('all');
              }}
              className="text-blue-600 hover:text-blue-800 font-bold"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla Comparativa Detallada de Cruce de Datos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-sm font-bold text-slate-900">Análisis de Coincidencias de Medidas</span>
            <p className="text-xs text-slate-500">Comparativa directa de costos, existencias y margen sugerido de mayoreo</p>
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded font-bold border border-blue-200 w-fit">
            {filteredItems.length} COINCIDENCIAS DISPONIBLES
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
              <tr>
                <th className="p-3">Medida & Marca</th>
                <th className="p-3 text-right">Mi Costo</th>
                <th className="p-3 text-right">Costo Prov.</th>
                <th className="p-3 text-right">Diferencia</th>
                <th className="p-3 text-center">Stock (Mío / Prov)</th>
                <th className="p-3 text-right">Precio Público</th>
                <th className="p-3 text-right bg-blue-50/70 text-blue-900 font-black">
                  Sugerido Mayoreo ({targetMargin}%)
                </th>
                <th className="p-3 text-right text-emerald-700 font-bold">Margen Est.</th>
                <th className="p-3">Diagnóstico</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No se encontraron cruces con los criterios especificados.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const hasBoth = item.miProducto !== null && item.productoProveedor !== null;
                  const provCheaper = item.diferenciaCosto > 0;
                  const isExclusiveOwn = item.tipoCoincidencia === 'exclusivo_propio';

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/90 transition ${
                      item.comparativaVenta === 'mi_inventario_mejor_precio' 
                        ? 'bg-emerald-50/30' 
                        : isExclusiveOwn 
                          ? 'bg-amber-50/20' 
                          : provCheaper && hasBoth 
                            ? 'bg-purple-50/20' 
                            : ''
                    }`}>
                      {/* Medida y Marca */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 font-mono text-xs">
                            {item.medidaDisplay}
                          </span>
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                            🇨🇳 CHINO
                          </span>
                          {isExclusiveOwn && (
                            <span className="text-[9px] font-bold bg-blue-50 text-blue-800 px-1 py-0.2 rounded border border-blue-200">
                              Exclusiva Almacén
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                          {item.marcaDisplay}
                        </div>
                        {item.miProducto && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={item.miProducto.descripcion}>
                            {item.miProducto.descripcion}
                          </div>
                        )}
                      </td>

                      {/* Mi Costo */}
                      <td className="p-3 text-right font-medium text-slate-700">
                        {item.miCosto > 0 ? (
                          `$${item.miCosto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">-</span>
                        )}
                      </td>

                      {/* Costo Proveedor */}
                      <td className="p-3 text-right font-bold">
                        {item.costoProveedor > 0 ? (
                          <span className={provCheaper ? 'text-purple-800 font-black' : 'text-slate-900'}>
                            ${item.costoProveedor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        ) : isExclusiveOwn ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 whitespace-nowrap" title="El proveedor no maneja esta medida en su lista vigente">
                            No en lista prov.
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">-</span>
                        )}
                      </td>

                      {/* Diferencia / Comparativa de Venta */}
                      <td className="p-3 text-right whitespace-nowrap">
                        {item.comparativaVenta === 'mi_inventario_mejor_precio' ? (
                          <div>
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                              🏆 Inv. Mejor Precio
                            </span>
                            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                              Superas prov por +${Math.abs(item.diferenciaCosto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        ) : item.comparativaVenta === 'mismo_precio' ? (
                          <div>
                            <span className="inline-flex items-center text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                              ⚖️ Mismo Precio
                            </span>
                            <div className="text-[10px] text-blue-700 font-medium mt-0.5">
                              Costos a la par
                            </div>
                          </div>
                        ) : item.comparativaVenta === 'exclusivo_sin_competencia' ? (
                          <div>
                            <span className="inline-flex items-center text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                              ⭐ Exclusiva Propia
                            </span>
                            <div className="text-[9px] text-amber-800 font-medium mt-0.5">
                              Sin competencia prov.
                            </div>
                          </div>
                        ) : item.comparativaVenta === 'proveedor_mas_barato' ? (
                          <div>
                            <span className="inline-flex items-center text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                              🛒 Prov. Más Barato
                            </span>
                            <div className="text-[10px] text-purple-700 font-medium mt-0.5">
                              Ahorro +${item.diferenciaCosto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({item.ahorroPorcentaje.toFixed(1)}%)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Existencias */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                          <span className={`px-1.5 py-0.5 rounded ${
                            item.miExistencia > 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-400'
                          }`} title="Tu inventario físico disponible">
                            {item.miExistencia} mía
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            item.existenciaProveedor >= 4 
                              ? 'bg-purple-50 text-purple-700 border border-purple-200 font-bold' 
                              : item.existenciaProveedor > 0 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                : 'bg-slate-100 text-slate-400'
                          }`} title="Existencia mayorista del proveedor">
                            {item.existenciaProveedor} prov
                          </span>
                        </div>
                        {item.existenciaProveedor >= 4 && (
                          <div className="text-[9px] text-purple-700 font-semibold mt-0.5">
                            ✓ Stock verificado (≥4)
                          </div>
                        )}
                        {item.descartadoPorBajoStock && (
                          <div className="text-[9px] text-amber-800 font-semibold mt-0.5 bg-amber-50 px-1 py-0.5 rounded border border-amber-200" title="Saldo del proveedor descartado para evitar costos viejos">
                            ⚠️ Prov {item.existenciaProveedorBaja} pza (saldo)
                          </div>
                        )}
                      </td>

                      {/* Precio Público */}
                      <td className="p-3 text-right text-slate-600">
                        {item.precioPublico > 0 ? (
                          `$${item.precioPublico.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Precio Sugerido Mayoreo */}
                      <td className="p-3 text-right font-black text-slate-900 bg-blue-50/40 text-xs">
                        ${item.precioSugeridoMayoreo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Ganancia por Pieza */}
                      <td className="p-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block">
                          +${item.gananciaEstimadaPorUnidad.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="block text-[10px] text-emerald-600 font-medium mt-0.5">
                          ({item.margenEstimadoMayoreo.toFixed(1)}%)
                        </span>
                      </td>

                      {/* Diagnóstico / Comparativa de Venta */}
                      <td className="p-3 text-[11px] max-w-xs">
                        {item.descartadoPorBajoStock ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-0.5 bg-amber-100 text-amber-900 border border-amber-300">
                            ⚠️ Prov &lt; 4 pzas (Costo no confiable)
                          </span>
                        ) : item.comparativaVenta === 'mi_inventario_mejor_precio' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300">
                            🏆 Tu Inventario a Mejor Precio
                          </span>
                        ) : item.comparativaVenta === 'mismo_precio' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-0.5 bg-blue-100 text-blue-900 border border-blue-300">
                            ⚖️ Mismo Precio que Proveedor
                          </span>
                        ) : item.comparativaVenta === 'exclusivo_sin_competencia' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-0.5 bg-amber-100 text-amber-900 border border-amber-300">
                            ⭐ Coincidencia: Exclusiva en tu Almacén
                          </span>
                        ) : item.comparativaVenta === 'proveedor_mas_barato' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-0.5 bg-purple-100 text-purple-900 border border-purple-300">
                            🛒 Proveedor Más Barato (Compra)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-0.5 bg-slate-100 text-slate-700 border border-slate-200">
                            📦 Solo en Catálogo Proveedor
                          </span>
                        )}
                        <p className="text-[10px] text-slate-500 line-clamp-2" title={item.recomendacion}>
                          {item.recomendacion}
                        </p>
                      </td>

                      {/* Acción de Venta */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => onDirectSale({
                            medida: item.medidaDisplay,
                            marca: item.marcaDisplay,
                            costo: item.costoProveedor > 0 ? (costBase === 'proveedor' ? item.costoProveedor : Math.min(item.miCosto || item.costoProveedor, item.costoProveedor)) : item.miCosto,
                            precioSugerido: item.precioSugeridoMayoreo,
                            descripcion: item.miProducto?.descripcion || item.productoProveedor?.descripcion || `${item.marcaDisplay} ${item.medidaDisplay}`
                          })}
                          className="text-blue-600 font-bold hover:text-blue-800 text-xs px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 inline-flex items-center gap-1 transition cursor-pointer"
                          title="Crear venta con esta medida calculada"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Vender</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

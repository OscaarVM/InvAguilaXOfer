import React, { useState, useMemo, useRef } from 'react';
import { ProductItem } from '../types';
import { parseMyInventoryExcel, exportMyInventoryToExcel, downloadExcelTemplate } from '../utils/excel';
import { isChineseOrigin } from '../utils/crossAnalysis';
import { 
  Search, Upload, Download, FileSpreadsheet, Plus, Trash2, Edit3, 
  AlertCircle, CheckCircle2, DollarSign, Box, ShieldCheck, Filter, Globe, Cloud 
} from 'lucide-react';

interface MyInventoryTabProps {
  products: ProductItem[];
  onUpdateProducts: (products: ProductItem[]) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: ProductItem) => void;
}

export const MyInventoryTab: React.FC<MyInventoryTabProps> = ({
  products,
  onUpdateProducts,
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const [searchMedida, setSearchMedida] = useState('');
  const [searchMarca, setSearchMarca] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'chinese' | 'other'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [replaceMode, setReplaceMode] = useState<'replace' | 'merge'>('replace');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Marcas únicas disponibles para filtro rápido
  const uniqueMarcas = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.marca) set.add(p.marca.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchMedida = searchMedida.trim() === '' || 
        p.medida.toLowerCase().includes(searchMedida.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(searchMedida.toLowerCase()) ||
        (p.origen && p.origen.toLowerCase().includes(searchMedida.toLowerCase()));

      const matchMarca = searchMarca.trim() === '' || 
        p.marca.toLowerCase().includes(searchMarca.toLowerCase());

      let matchStock = true;
      if (stockFilter === 'in_stock') matchStock = p.existencia > 0;
      else if (stockFilter === 'low_stock') matchStock = p.existencia > 0 && p.existencia <= 4;
      else if (stockFilter === 'out_of_stock') matchStock = p.existencia === 0;

      let matchOrigin = true;
      const isChinese = isChineseOrigin(p.origen, p.marca, p.descripcion);
      if (originFilter === 'chinese') matchOrigin = isChinese;
      else if (originFilter === 'other') matchOrigin = !isChinese;

      return matchMedida && matchMarca && matchStock && matchOrigin;
    });
  }, [products, searchMedida, searchMarca, stockFilter, originFilter]);

  // Métricas de inventario
  const totalExistencia = useMemo(() => {
    return products.reduce((sum, p) => sum + p.existencia, 0);
  }, [products]);

  const chineseProducts = useMemo(() => {
    return products.filter(p => isChineseOrigin(p.origen, p.marca, p.descripcion));
  }, [products]);

  const chineseStock = useMemo(() => {
    return chineseProducts.reduce((sum, p) => sum + p.existencia, 0);
  }, [chineseProducts]);

  const valorInventarioCosto = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.costoCompra * p.existencia), 0);
  }, [products]);

  const valorInventarioPublico = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.precioPublico * p.existencia), 0);
  }, [products]);

  const handleToggleOrigin = (productId: string) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        const isChinese = isChineseOrigin(p.origen, p.marca, p.descripcion);
        return {
          ...p,
          origen: isChinese ? 'NACIONAL' : 'CHINO'
        };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  const handleMarkAllAsChinese = () => {
    const updated = products.map(p => ({
      ...p,
      origen: 'CHINO'
    }));
    onUpdateProducts(updated);
  };

  // Manejar carga de archivo Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadFeedback(null);
      const parsedItems = await parseMyInventoryExcel(file);

      if (parsedItems.length === 0) {
        setUploadFeedback({
          message: 'No se detectaron registros válidos. Verifica que el archivo contenga columnas de Medida, Marca, Costo y Existencia.',
          type: 'error'
        });
        setIsUploading(false);
        return;
      }

      if (replaceMode === 'replace') {
        onUpdateProducts(parsedItems);
        setUploadFeedback({
          message: `¡Inventario actualizado! Se reemplazaron ${parsedItems.length} productos cargados desde ${file.name}.`,
          type: 'success'
        });
      } else {
        // Combinar manteniendo existentes o actualizando por código/medida
        const existingMap = new Map(products.map(p => [`${p.medida}_${p.marca}`.toUpperCase(), p]));
        parsedItems.forEach(item => {
          existingMap.set(`${item.medida}_${item.marca}`.toUpperCase(), item);
        });
        const combined = Array.from(existingMap.values());
        onUpdateProducts(combined);
        setUploadFeedback({
          message: `¡Inventario combinado! Total de ${combined.length} productos después de importar.`,
          type: 'success'
        });
      }
    } catch (err: any) {
      console.error(err);
      setUploadFeedback({
        message: `Error al procesar el archivo Excel: ${err?.message || 'Formato no soportado'}`,
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto de tu inventario?')) {
      onUpdateProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner de Carga Diaria de Excel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Carga Diaria de Mi Inventario en Excel
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Sube tu archivo diario (.xlsx, .xls o .csv). Incluye columnas de Medida, Marca, Costo, Existencia, Precio Público y opcionalmente <strong>ORIGEN</strong> (ej. <em>CHINO</em> o <em>NACIONAL</em>) para el cruce con el proveedor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {products.length - chineseProducts.length > 0 && (
              <button
                onClick={handleMarkAllAsChinese}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition cursor-pointer shadow-2xs"
                title="Convierte todas las medidas de tu inventario propio a origen CHINO para cruzarlas con el proveedor"
              >
                <span>🇨🇳</span> Marcar Todas como CHINO
              </button>
            )}

            <button
              onClick={() => downloadExcelTemplate('propio')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-300/80 cursor-pointer"
              title="Descargar plantilla con encabezados recomendados"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Descargar Plantilla Excel
            </button>

            <button
              onClick={() => exportMyInventoryToExcel(products)}
              disabled={products.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Exportar Inventario (.xlsx)
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto Manual
            </button>
          </div>
        </div>

        {/* Zona de Drop/Upload */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/60 rounded-xl cursor-pointer transition">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="sr-only"
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {isUploading ? 'Procesando archivo...' : 'Haz clic para seleccionar o arrastra tu archivo Excel aquí'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Formatos soportados: .xlsx, .xls, .csv • Detección inteligente de columnas
                  </div>
                </div>
              </div>
            </label>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800">Modo de Carga Diaria:</div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="replaceMode"
                  checked={replaceMode === 'replace'}
                  onChange={() => setReplaceMode('replace')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Reemplazar inventario completo</span>
              </label>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="replaceMode"
                  checked={replaceMode === 'merge'}
                  onChange={() => setReplaceMode('merge')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Combinar / Actualizar existentes</span>
              </label>
            </div>
          </div>
        </div>

        {/* Nota de Sincronización Automática en la Nube */}
        <div className="mt-3.5 px-3.5 py-2.5 rounded-lg bg-blue-50/80 border border-blue-200/80 flex items-center gap-2 text-xs text-blue-900">
          <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Sincronización PC ⇄ Celular:</strong> Al cargar tu archivo Excel aquí en la PC, los datos se respaldan en la nube y podrás consultarlos en tiempo real desde tu móvil.
          </span>
        </div>

        {uploadFeedback && (
          <div className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
            uploadFeedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {uploadFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{uploadFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Productos / Líneas</div>
          <div className="text-2xl font-black text-slate-900 mt-2">{products.length}</div>
          <div className="text-xs text-slate-400 mt-1">Registradas en total</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
            <span>🇨🇳 Origen Chino</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Cruce Mayoreo</span>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">{chineseProducts.length} <span className="text-xs font-normal text-amber-700">líneas</span></div>
          <div className="text-xs text-amber-700 mt-1 font-medium">{chineseStock} pzas aptas para cruce</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Existencia</div>
          <div className="text-2xl font-black text-blue-600 mt-2">{totalExistencia} <span className="text-xs font-normal text-slate-400">pzas</span></div>
          <div className="text-xs text-slate-400 mt-1">En almacén físico</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Inventario (Costo)</div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ${valorInventarioCosto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Capital invertido</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Público</div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            ${valorInventarioPublico.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-700/80 mt-1 font-medium">
            Margen: {valorInventarioCosto > 0 ? (((valorInventarioPublico - valorInventarioCosto) / valorInventarioPublico) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Buscadores de Medida, Marca, Origen y Existencia */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Buscador por Medida */}
          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Buscador por Medida Específica
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchMedida}
                onChange={(e) => setSearchMedida(e.target.value)}
                placeholder="Ej. 205/55R16, 17X8, 225/45, 15..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Buscador por Nombre de Marca */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Buscador por Nombre de Marca
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchMarca}
                onChange={(e) => setSearchMarca(e.target.value)}
                placeholder="Ej. Sailun, Linglong, Tornel..."
                list="marcas-list"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
              />
              <datalist id="marcas-list">
                {uniqueMarcas.map(m => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Filtro por Origen (Chino para mayoreo vs Nacional) */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Filtro por Origen
            </label>
            <select
              value={originFilter}
              onChange={(e: any) => setOriginFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            >
              <option value="all">Todos los orígenes ({products.length})</option>
              <option value="chinese">🇨🇳 Solo Origen Chino (Aptos Cruce - {chineseProducts.length})</option>
              <option value="other">🇲🇽 Nacional / Otros ({products.length - chineseProducts.length})</option>
            </select>
          </div>

          {/* Filtro por Existencia */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Existencia
            </label>
            <select
              value={stockFilter}
              onChange={(e: any) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            >
              <option value="all">Todas ({products.length})</option>
              <option value="in_stock">Con Stock</option>
              <option value="low_stock">Stock Bajo (≤ 4)</option>
              <option value="out_of_stock">Agotado (0)</option>
            </select>
          </div>
        </div>

        {(searchMedida || searchMarca || stockFilter !== 'all' || originFilter !== 'all') && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Mostrando <strong>{filteredProducts.length}</strong> de <strong>{products.length}</strong> productos
            </span>
            <button
              onClick={() => {
                setSearchMedida('');
                setSearchMarca('');
                setStockFilter('all');
                setOriginFilter('all');
              }}
              className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Productos de Mi Inventario */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-900">Catálogo de Inventario Propio</span>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold border border-blue-200">
            {filteredProducts.length} PRODUCTOS FILTRADOS
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Medida</th>
                <th className="p-3">Marca</th>
                <th className="p-3">Origen</th>
                <th className="p-3">Descripción / Modelo</th>
                <th className="p-3 text-right">Costo Compra</th>
                <th className="p-3 text-center">Existencia</th>
                <th className="p-3 text-right">Precio Público</th>
                <th className="p-3 text-right">Margen Público</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Box className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No se encontraron productos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const margenPublico = p.precioPublico > 0 
                    ? (((p.precioPublico - p.costoCompra) / p.precioPublico) * 100) 
                    : 0;
                  const isChinese = (p.origen || '').toUpperCase().includes('CHIN');

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/90 transition">
                      <td className="p-3 font-mono text-xs text-slate-500">
                        {p.codigo}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs">
                          {p.medida}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {p.marca}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleOrigin(p.id)}
                          className="cursor-pointer transition-transform hover:scale-105 inline-block text-left"
                          title="Haz clic para alternar origen entre CHINO y NACIONAL"
                        >
                          {isChinese ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 shadow-2xs">
                              🇨🇳 CHINO <span className="text-[10px] text-amber-600 ml-0.5">⇄</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 shadow-2xs">
                              {p.origen || 'NACIONAL'} <span className="text-[10px] text-slate-500 ml-0.5">⇄</span>
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="p-3 text-slate-600 text-xs max-w-xs truncate" title={p.descripcion}>
                        {p.descripcion}
                      </td>
                      <td className="p-3 text-right font-medium text-slate-700">
                        ${p.costoCompra.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          p.existencia > 4 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : p.existencia > 0 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.existencia} pzas
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-900">
                        ${p.precioPublico.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {margenPublico.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Eliminar de inventario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

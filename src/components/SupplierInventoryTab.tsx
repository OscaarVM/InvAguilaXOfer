import React, { useState, useMemo, useRef } from 'react';
import { SupplierItem } from '../types';
import { parseSupplierInventoryExcel, exportSupplierInventoryToExcel, downloadExcelTemplate } from '../utils/excel';
import { 
  Search, Upload, Download, Building2, Plus, Trash2, Edit3, 
  AlertCircle, CheckCircle2, DollarSign, Box, Layers
} from 'lucide-react';

interface SupplierInventoryTabProps {
  suppliers: SupplierItem[];
  onUpdateSuppliers: (suppliers: SupplierItem[]) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: SupplierItem) => void;
}

export const SupplierInventoryTab: React.FC<SupplierInventoryTabProps> = ({
  suppliers,
  onUpdateSuppliers,
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const [searchMedida, setSearchMedida] = useState('');
  const [searchMarca, setSearchMarca] = useState('');
  const [supplierNameInput, setSupplierNameInput] = useState('Mayorista Nacional de Neumáticos');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [replaceMode, setReplaceMode] = useState<'replace' | 'merge'>('replace');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Marcas únicas del catálogo de proveedores
  const uniqueMarcas = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach(s => {
      if (s.marca) set.add(s.marca.trim());
    });
    return Array.from(set).sort();
  }, [suppliers]);

  // Proveedores únicos
  const uniqueProveedores = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach(s => {
      if (s.proveedorNombre) set.add(s.proveedorNombre.trim());
    });
    return Array.from(set).sort();
  }, [suppliers]);

  // Filtrar catálogo proveedor
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchMedida = searchMedida.trim() === '' || 
        s.medida.toLowerCase().includes(searchMedida.toLowerCase()) ||
        s.descripcion.toLowerCase().includes(searchMedida.toLowerCase());

      const matchMarca = searchMarca.trim() === '' || 
        s.marca.toLowerCase().includes(searchMarca.toLowerCase());

      return matchMedida && matchMarca;
    });
  }, [suppliers, searchMedida, searchMarca]);

  // Métricas
  const totalPiezasProveedor = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + s.existenciaProveedor, 0);
  }, [suppliers]);

  const costoPromedioProveedor = useMemo(() => {
    if (suppliers.length === 0) return 0;
    const sum = suppliers.reduce((acc, s) => acc + s.costoProveedor, 0);
    return sum / suppliers.length;
  }, [suppliers]);

  // Carga diaria de catálogo de proveedor
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadFeedback(null);
      const parsedItems = await parseSupplierInventoryExcel(file, supplierNameInput);

      if (parsedItems.length === 0) {
        setUploadFeedback({
          message: 'No se encontraron filas con datos de medida o costo del proveedor. Verifica el archivo.',
          type: 'error'
        });
        setIsUploading(false);
        return;
      }

      if (replaceMode === 'replace') {
        onUpdateSuppliers(parsedItems);
        setUploadFeedback({
          message: `¡Catálogo del proveedor actualizado! Se cargaron ${parsedItems.length} medidas desde ${file.name}.`,
          type: 'success'
        });
      } else {
        const existingMap = new Map(suppliers.map(s => [`${s.medida}_${s.marca}_${s.proveedorNombre}`.toUpperCase(), s]));
        parsedItems.forEach(item => {
          existingMap.set(`${item.medida}_${item.marca}_${item.proveedorNombre}`.toUpperCase(), item);
        });
        const combined = Array.from(existingMap.values());
        onUpdateSuppliers(combined);
        setUploadFeedback({
          message: `¡Catálogo de proveedor combinado! Total de ${combined.length} registros listos.`,
          type: 'success'
        });
      }
    } catch (err: any) {
      console.error(err);
      setUploadFeedback({
        message: `Error al leer archivo Excel de proveedor: ${err?.message || 'Formato no reconocido'}`,
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('¿Deseas eliminar este registro del catálogo de proveedor?')) {
      onUpdateSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Carga Diaria de Catálogo Proveedor */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Carga Diaria de Inventario de Proveedor (Productos 100% Chinos)
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Carga la lista diaria que te envía tu proveedor de llantas chinas para cruzar existencias y precios con las medidas chinas de tu propio inventario.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => downloadExcelTemplate('proveedor')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-300/80 cursor-pointer"
              title="Descargar formato Excel para proveedor"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Plantilla Proveedor
            </button>

            <button
              onClick={() => exportSupplierInventoryToExcel(suppliers)}
              disabled={suppliers.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" />
              Exportar Catálogo (.xlsx)
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Agregar Medida Proveedor
            </button>
          </div>
        </div>

        {/* Zona de Drop/Upload */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/30 hover:bg-purple-50/60 rounded-xl cursor-pointer transition">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="sr-only"
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {isUploading ? 'Procesando archivo del proveedor...' : 'Haz clic o arrastra el archivo Excel diario del proveedor'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Columnas requeridas: Medida, Marca, Costo Proveedor y Disponibilidad
                  </div>
                </div>
              </div>
            </label>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Nombre del Proveedor:</label>
              <input
                type="text"
                value={supplierNameInput}
                onChange={(e) => setSupplierNameInput(e.target.value)}
                placeholder="Ej. Distribuidor Nacional"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="suppReplaceMode"
                  checked={replaceMode === 'replace'}
                  onChange={() => setReplaceMode('replace')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Reemplazar catálogo</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="suppReplaceMode"
                  checked={replaceMode === 'merge'}
                  onChange={() => setReplaceMode('merge')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Combinar</span>
              </label>
            </div>
          </div>
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

      {/* Métricas Resumen Proveedor */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Medidas en Proveedor</div>
          <div className="text-3xl font-black text-slate-900 mt-2">{suppliers.length}</div>
          <div className="text-xs text-slate-400 mt-1">Líneas en catálogo</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Disponibilidad Mayorista</div>
          <div className="text-3xl font-black text-purple-600 mt-2">{totalPiezasProveedor} <span className="text-sm font-normal text-slate-400">pzas</span></div>
          <div className="text-xs text-slate-400 mt-1">Capacidad para mayoreo</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costo Promedio Proveedor</div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            ${costoPromedioProveedor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Precio base mayoreo</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proveedores Registrados</div>
          <div className="text-3xl font-black text-blue-600 mt-2">{uniqueProveedores.length}</div>
          <div className="text-xs text-slate-400 mt-1 truncate" title={uniqueProveedores.join(', ')}>
            {uniqueProveedores[0] || 'Ninguno'}
          </div>
        </div>
      </div>

      {/* Buscadores de Medida y Marca */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Buscador por Medida */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Buscador por Medida Específica (Proveedor)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchMedida}
                onChange={(e) => setSearchMedida(e.target.value)}
                placeholder="Ej. 205/55R16, 265/70R17, 17X8, 225/45..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Buscador por Nombre de Marca */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Buscador por Nombre de Marca (Proveedor)
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchMarca}
                onChange={(e) => setSearchMarca(e.target.value)}
                placeholder="Ej. Michelin, Goodyear, Pirelli, Hankook..."
                list="supp-marcas-list"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
              />
              <datalist id="supp-marcas-list">
                {uniqueMarcas.map(m => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {(searchMedida || searchMarca) && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Mostrando <strong>{filteredSuppliers.length}</strong> de <strong>{suppliers.length}</strong> productos del proveedor
            </span>
            <button
              onClick={() => {
                setSearchMedida('');
                setSearchMarca('');
              }}
              className="text-blue-600 hover:text-blue-800 font-bold"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla del Catálogo de Proveedor */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-900">Catálogo de Proveedores</span>
          <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold border border-purple-200">
            {filteredSuppliers.length} REGISTROS CARGADOS
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-3">Código Proveedor</th>
                <th className="p-3">Medida</th>
                <th className="p-3">Marca</th>
                <th className="p-3">Origen</th>
                <th className="p-3">Descripción / Modelo</th>
                <th className="p-3 text-right">Costo Proveedor</th>
                <th className="p-3 text-center">Disponibilidad</th>
                <th className="p-3">Proveedor</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Box className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No se encontraron registros del proveedor con los filtros indicados.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => {
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/90 transition">
                      <td className="p-3 font-mono text-xs text-slate-500">
                        {s.codigo}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-mono text-xs border border-purple-200">
                          {s.medida}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {s.marca}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                          🇨🇳 CHINO
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 text-xs max-w-xs truncate" title={s.descripcion}>
                        {s.descripcion}
                      </td>
                      <td className="p-3 text-right font-bold text-purple-900">
                        ${s.costoProveedor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {s.existenciaProveedor} pzas
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500">
                        {s.proveedorNombre}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenEditModal(s)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                            title="Editar medida de proveedor"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(s.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Eliminar de lista"
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

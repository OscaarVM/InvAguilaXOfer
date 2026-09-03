import React, { useState, useEffect } from 'react';
import { ProductItem, SupplierItem } from '../types';
import { Package, Building2, AlertCircle } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'propio' | 'proveedor';
  itemToEdit?: ProductItem | SupplierItem | null;
  onSaveProduct?: (item: ProductItem) => void;
  onSaveSupplierItem?: (item: SupplierItem) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  type,
  itemToEdit,
  onSaveProduct,
  onSaveSupplierItem,
}) => {
  const [codigo, setCodigo] = useState('');
  const [medida, setMedida] = useState('');
  const [marca, setMarca] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [origen, setOrigen] = useState('CHINO');
  const [costo, setCosto] = useState<number>(0);
  const [existencia, setExistencia] = useState<number>(0);
  const [precioPublico, setPrecioPublico] = useState<number>(0);
  const [proveedorNombre, setProveedorNombre] = useState('Mayorista de Llantas Chinas Directas');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    if (itemToEdit) {
      setCodigo(itemToEdit.codigo || '');
      setMedida(itemToEdit.medida || '');
      setMarca(itemToEdit.marca || '');
      setDescripcion(itemToEdit.descripcion || '');
      setOrigen(itemToEdit.origen || (type === 'proveedor' ? 'CHINO' : 'CHINO'));

      if (type === 'propio') {
        const p = itemToEdit as ProductItem;
        setCosto(p.costoCompra);
        setExistencia(p.existencia);
        setPrecioPublico(p.precioPublico);
      } else {
        const s = itemToEdit as SupplierItem;
        setCosto(s.costoProveedor);
        setExistencia(s.existenciaProveedor);
        setProveedorNombre(s.proveedorNombre || 'Proveedor');
      }
    } else {
      setCodigo(type === 'propio' ? `LL-${Date.now().toString().slice(-6)}` : `PROV-${Date.now().toString().slice(-6)}`);
      setMedida('');
      setMarca('');
      setDescripcion('');
      setOrigen('CHINO');
      setCosto(0);
      setExistencia(4);
      setPrecioPublico(0);
      setProveedorNombre('Mayorista de Llantas Chinas Directas');
    }
  }, [isOpen, itemToEdit, type]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medida.trim()) {
      setError('La medida es obligatoria (ej. 205/55R16 o 17X8).');
      return;
    }
    if (!marca.trim()) {
      setError('La marca es obligatoria.');
      return;
    }

    if (type === 'propio' && onSaveProduct) {
      const prod: ProductItem = {
        id: itemToEdit ? itemToEdit.id : `p_${Date.now()}`,
        codigo: codigo.trim() || `PRD-${Date.now().toString().slice(-4)}`,
        medida: medida.trim().toUpperCase(),
        marca: marca.trim(),
        descripcion: descripcion.trim() || `${marca.trim()} ${medida.trim().toUpperCase()}`,
        origen: origen.trim().toUpperCase() || 'CHINO',
        costoCompra: Math.max(0, Number(costo) || 0),
        existencia: Math.max(0, Math.round(Number(existencia) || 0)),
        precioPublico: Math.max(0, Number(precioPublico) || (Number(costo) * 1.35)),
        fechaActualizacion: new Date().toISOString().split('T')[0]
      };
      onSaveProduct(prod);
    } else if (type === 'proveedor' && onSaveSupplierItem) {
      const supp: SupplierItem = {
        id: itemToEdit ? itemToEdit.id : `s_${Date.now()}`,
        codigo: codigo.trim() || `PROV-${Date.now().toString().slice(-4)}`,
        medida: medida.trim().toUpperCase(),
        marca: marca.trim(),
        descripcion: descripcion.trim() || `${marca.trim()} ${medida.trim().toUpperCase()}`,
        origen: 'CHINO', // Proveedor es 100% chino
        costoProveedor: Math.max(0, Number(costo) || 0),
        existenciaProveedor: Math.max(0, Math.round(Number(existencia) || 0)),
        proveedorNombre: proveedorNombre.trim() || 'Proveedor',
        fechaCarga: new Date().toISOString().split('T')[0]
      };
      onSaveSupplierItem(supp);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        
        <div className="flex justify-between items-start pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {type === 'propio' ? (
                <>
                  <Package className="w-5 h-5 text-blue-600" />
                  {itemToEdit ? 'Editar Producto (Mi Inventario)' : 'Nuevo Producto (Mi Inventario)'}
                </>
              ) : (
                <>
                  <Building2 className="w-5 h-5 text-purple-600" />
                  {itemToEdit ? 'Editar Medida Proveedor' : 'Nueva Medida Proveedor'}
                </>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingresa los datos para registrar la pieza y facilitar el cruce automático.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer">
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código / SKU
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej. LL-2055516-MIC"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Medida Exacta *
              </label>
              <input
                type="text"
                value={medida}
                onChange={(e) => setMedida(e.target.value)}
                placeholder="Ej. 205/55R16, 17X8"
                required
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Marca *
              </label>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ej. Sailun, Linglong, Westlake..."
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {type === 'propio' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Origen del Producto *</span>
                  <span className="text-[10px] text-blue-600 font-semibold">Para Cruce Mayoreo</span>
                </label>
                <select
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-amber-50/50 text-slate-900"
                >
                  <option value="CHINO">🇨🇳 CHINO (Apto para Cruce con Proveedor)</option>
                  <option value="NACIONAL">🇲🇽 NACIONAL (No se cruza con proveedor)</option>
                  <option value="AMERICANO">🇺🇸 AMERICANO / OTRO</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Proveedor
                </label>
                <input
                  type="text"
                  value={proveedorNombre}
                  onChange={(e) => setProveedorNombre(e.target.value)}
                  placeholder="Ej. Mayorista Directo"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Descripción / Modelo
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Atrezzo Elite 91V, Sport SA-37"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {type === 'propio' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Precio Público Sugerido ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={precioPublico}
                  onChange={(e) => setPrecioPublico(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-full p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  <span className="font-bold">🇨🇳 Origen: CHINO</span> (Catálogo 100% de importación)
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {type === 'propio' ? 'Costo de Compra ($)' : 'Costo Proveedor ($)'} *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={costo}
                onChange={(e) => setCosto(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {type === 'propio' ? 'Existencia en Almacén (Pzas)' : 'Disponibilidad Proveedor (Pzas)'} *
              </label>
              <input
                type="number"
                min="0"
                value={existencia}
                onChange={(e) => setExistencia(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-300/80 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white rounded-lg shadow-xs transition bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              {itemToEdit ? 'Guardar Cambios' : 'Registrar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

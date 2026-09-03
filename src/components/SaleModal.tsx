import React, { useState, useEffect } from 'react';
import { Customer, ProductItem, SaleRecord, SaleItem } from '../types';
import { ShoppingCart, Plus, Trash2, UserPlus, DollarSign, Percent, AlertCircle } from 'lucide-react';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  products: ProductItem[];
  onSaveSale: (sale: SaleRecord) => void;
  onQuickAddCustomer: (customer: Customer) => void;
  initialPreloadedItem?: {
    medida: string;
    marca: string;
    costo: number;
    precioSugerido: number;
    descripcion: string;
  } | null;
}

export const SaleModal: React.FC<SaleModalProps> = ({
  isOpen,
  onClose,
  customers,
  products,
  onSaveSale,
  onQuickAddCustomer,
  initialPreloadedItem,
}) => {
  // Estado del cliente
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState<boolean>(false);
  const [newClientNum, setNewClientNum] = useState<string>('');
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientCompany, setNewClientCompany] = useState<string>('');
  const [newClientPhone, setNewClientPhone] = useState<string>('');
  const [newClientType, setNewClientType] = useState<'mayoreo' | 'taller' | 'subdistribuidor' | 'menudeo'>('mayoreo');

  // Estado de los items de la venta
  const [items, setItems] = useState<SaleItem[]>([]);
  const [folio, setFolio] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'efectivo' | 'credito' | 'tarjeta'>('transferencia');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inicializar formulario al abrir
  useEffect(() => {
    if (!isOpen) return;

    // Generar folio automático
    setFolio(`MAY-${Math.floor(1000 + Math.random() * 9000)}`);
    setErrorMessage(null);

    // Si hay clientes, seleccionar el primero por defecto
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }

    // Sugerir nuevo número de cliente secuencial
    setNewClientNum(`CLI-00${customers.length + 1}`);

    // Si viene pre-cargado desde el Cruce de Datos
    if (initialPreloadedItem) {
      const cantidad = 4; // Juego estándar de 4 llantas
      const costoUnit = initialPreloadedItem.costo;
      const precioUnit = initialPreloadedItem.precioSugerido;
      const subtotal = precioUnit * cantidad;
      const costoTotal = costoUnit * cantidad;
      const ganancia = subtotal - costoTotal;
      const margen = subtotal > 0 ? (ganancia / subtotal) * 100 : 0;

      setItems([
        {
          id: `item_${Date.now()}`,
          medida: initialPreloadedItem.medida,
          marca: initialPreloadedItem.marca,
          descripcion: initialPreloadedItem.descripcion,
          cantidad,
          costoUnitario: costoUnit,
          precioVentaUnitario: precioUnit,
          subtotal,
          costoTotal,
          gananciaNeta: ganancia,
          margenPorcentaje: margen,
        }
      ]);
    } else {
      // Item vacío inicial
      const defaultProd = products[0];
      if (defaultProd) {
        const cant = 4;
        const sub = defaultProd.precioPublico * cant;
        const cost = defaultProd.costoCompra * cant;
        const gan = sub - cost;
        setItems([
          {
            id: `item_${Date.now()}`,
            productoId: defaultProd.id,
            medida: defaultProd.medida,
            marca: defaultProd.marca,
            descripcion: defaultProd.descripcion,
            cantidad: cant,
            costoUnitario: defaultProd.costoCompra,
            precioVentaUnitario: Math.round(defaultProd.costoCompra * 1.25), // 20% margen mayoreo
            subtotal: Math.round(defaultProd.costoCompra * 1.25) * cant,
            costoTotal: cost,
            gananciaNeta: (Math.round(defaultProd.costoCompra * 1.25) * cant) - cost,
            margenPorcentaje: 20,
          }
        ]);
      }
    }
  }, [isOpen, initialPreloadedItem]);

  if (!isOpen) return null;

  // Manejar creación rápida de cliente
  const handleCreateCustomer = () => {
    if (!newClientNum.trim() || (!newClientName.trim() && !newClientCompany.trim())) {
      setErrorMessage('Por favor ingresa al menos el número de cliente y el nombre o empresa.');
      return;
    }

    const newCust: Customer = {
      id: `c_${Date.now()}`,
      numeroCliente: newClientNum.trim().toUpperCase(),
      nombre: newClientName.trim() || newClientCompany.trim(),
      empresa: newClientCompany.trim() || newClientName.trim(),
      telefono: newClientPhone.trim(),
      tipoCliente: newClientType,
      fechaRegistro: new Date().toISOString().split('T')[0]
    };

    onQuickAddCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setIsCreatingCustomer(false);
    setNewClientName('');
    setNewClientCompany('');
    setNewClientPhone('');
    setErrorMessage(null);
  };

  // Agregar nueva línea de producto
  const handleAddItem = () => {
    const defaultProd = products[0];
    const newItem: SaleItem = {
      id: `item_${Date.now()}`,
      productoId: defaultProd?.id,
      medida: defaultProd?.medida || '',
      marca: defaultProd?.marca || '',
      descripcion: defaultProd?.descripcion || '',
      cantidad: 4,
      costoUnitario: defaultProd?.costoCompra || 1000,
      precioVentaUnitario: defaultProd ? Math.round(defaultProd.costoCompra * 1.25) : 1250,
      subtotal: (defaultProd ? Math.round(defaultProd.costoCompra * 1.25) : 1250) * 4,
      costoTotal: (defaultProd?.costoCompra || 1000) * 4,
      gananciaNeta: ((defaultProd ? Math.round(defaultProd.costoCompra * 1.25) : 1250) * 4) - ((defaultProd?.costoCompra || 1000) * 4),
      margenPorcentaje: 20,
    };
    setItems([...items, newItem]);
  };

  // Actualizar línea de producto
  const handleUpdateItem = (index: number, field: keyof SaleItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    // Si cambió el producto seleccionado desde inventario
    if (field === 'productoId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        current.medida = prod.medida;
        current.marca = prod.marca;
        current.descripcion = prod.descripcion;
        current.costoUnitario = prod.costoCompra;
        current.precioVentaUnitario = Math.round(prod.costoCompra * 1.25);
      }
    }

    // Recalcular métricas de la fila
    const cant = Math.max(1, Number(current.cantidad) || 1);
    const costoUnit = Math.max(0, Number(current.costoUnitario) || 0);
    const precioUnit = Math.max(0, Number(current.precioVentaUnitario) || 0);

    current.cantidad = cant;
    current.costoUnitario = costoUnit;
    current.precioVentaUnitario = precioUnit;
    current.subtotal = cant * precioUnit;
    current.costoTotal = cant * costoUnit;
    current.gananciaNeta = current.subtotal - current.costoTotal;
    current.margenPorcentaje = current.subtotal > 0 ? (current.gananciaNeta / current.subtotal) * 100 : 0;

    updated[index] = current;
    setItems(updated);
  };

  // Eliminar línea
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Totales de la venta
  const totalVenta = items.reduce((sum, i) => sum + i.subtotal, 0);
  const costoTotal = items.reduce((sum, i) => sum + i.costoTotal, 0);
  const gananciaTotal = totalVenta - costoTotal;
  const margenPromedio = totalVenta > 0 ? (gananciaTotal / totalVenta) * 100 : 0;

  // Guardar Venta
  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setErrorMessage('Por favor selecciona o crea un cliente para registrar la venta.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('La venta debe tener al menos una medida de llanta o rin.');
      return;
    }

    const client = customers.find(c => c.id === selectedCustomerId);
    if (!client) {
      setErrorMessage('Cliente no encontrado.');
      return;
    }

    const newSale: SaleRecord = {
      id: `v_${Date.now()}`,
      folio: folio.trim() || `MAY-${Date.now().toString().slice(-4)}`,
      fecha: new Date().toISOString().split('T')[0],
      clienteId: client.id,
      clienteNumero: client.numeroCliente,
      clienteNombre: client.empresa || client.nombre,
      items,
      totalVenta,
      costoTotal,
      gananciaTotal,
      margenPromedio,
      metodoPago: paymentMethod,
      notas: notes.trim() || undefined
    };

    onSaveSale(newSale);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        
        {/* Header Modal */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4" />
              Registro de Venta Mayoreo
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              Nueva Remisión / Cotización Cerrada
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitSale} className="mt-4 space-y-5">
          
          {/* Fila 1: Folio y Selección / Reutilización de Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            
            {/* Folio */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Folio de Remisión:
              </label>
              <input
                type="text"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Selector de Cliente */}
            <div className="md:col-span-9">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Número de Cliente (Reutilizar o Crear):
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingCustomer(!isCreatingCustomer)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {isCreatingCustomer ? 'Seleccionar de existentes' : '+ Nuevo Número de Cliente'}
                </button>
              </div>

              {!isCreatingCustomer ? (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      [{c.numeroCliente}] {c.empresa ? `${c.empresa} (${c.nombre})` : c.nombre} • Tel: {c.telefono}
                    </option>
                  ))}
                </select>
              ) : (
                /* Formulario Rápido de Nuevo Cliente */
                <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-200 space-y-2 mt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-indigo-900 block">Número Cliente:</label>
                      <input
                        type="text"
                        value={newClientNum}
                        onChange={(e) => setNewClientNum(e.target.value)}
                        placeholder="Ej. CLI-005"
                        className="w-full px-2 py-1 text-xs border border-indigo-300 rounded bg-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-indigo-900 block">Empresa / Taller:</label>
                      <input
                        type="text"
                        value={newClientCompany}
                        onChange={(e) => setNewClientCompany(e.target.value)}
                        placeholder="Ej. Llantera San Juan"
                        className="w-full px-2 py-1 text-xs border border-indigo-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-indigo-900 block">Contacto / Nombre:</label>
                      <input
                        type="text"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full px-2 py-1 text-xs border border-indigo-300 rounded bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="Teléfono / Celular"
                        className="px-2 py-1 text-xs border border-indigo-300 rounded bg-white"
                      />
                      <select
                        value={newClientType}
                        onChange={(e: any) => setNewClientType(e.target.value)}
                        className="px-2 py-1 text-xs border border-indigo-300 rounded bg-white"
                      >
                        <option value="mayoreo">Mayoreo</option>
                        <option value="taller">Taller Mecánico</option>
                        <option value="subdistribuidor">Subdistribuidor</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateCustomer}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                    >
                      Guardar y Usar Cliente
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Fila 2: Líneas de Llantas y Rines Vendidos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Productos / Medidas en esta Venta
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Otra Medida
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  
                  {/* Selector rápido o Medida & Marca */}
                  <div className="sm:col-span-4">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Medida y Marca:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={item.medida}
                        onChange={(e) => handleUpdateItem(idx, 'medida', e.target.value)}
                        placeholder="Ej. 205/55R16"
                        required
                        className="w-1/2 px-2 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded bg-white"
                      />
                      <input
                        type="text"
                        value={item.marca}
                        onChange={(e) => handleUpdateItem(idx, 'marca', e.target.value)}
                        placeholder="Marca"
                        required
                        className="w-1/2 px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>

                  {/* Cantidad */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Cantidad:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => handleUpdateItem(idx, 'cantidad', e.target.value)}
                      required
                      className="w-full px-2 py-1.5 text-xs font-bold border border-slate-300 rounded bg-white text-center"
                    />
                  </div>

                  {/* Costo Unitario */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Costo Unit ($):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.costoUnitario}
                      onChange={(e) => handleUpdateItem(idx, 'costoUnitario', e.target.value)}
                      required
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white text-right"
                    />
                  </div>

                  {/* Precio Venta Unitario */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-emerald-800 block mb-1">
                      Precio Mayoreo ($):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.precioVentaUnitario}
                      onChange={(e) => handleUpdateItem(idx, 'precioVentaUnitario', e.target.value)}
                      required
                      className="w-full px-2 py-1.5 text-xs font-bold border border-emerald-300 rounded bg-emerald-50/50 text-right text-emerald-900"
                    />
                  </div>

                  {/* Ganancia y Margen Fila */}
                  <div className="sm:col-span-2 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500">Utilidad fila:</div>
                      <div className="text-xs font-bold text-emerald-600">
                        +${item.gananciaNeta.toLocaleString('es-MX')} ({item.margenPorcentaje.toFixed(0)}%)
                      </div>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Eliminar fila"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Fila 3: Método de Pago y Notas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Método de Pago:
              </label>
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="transferencia">Transferencia Bancaria SPEI</option>
                <option value="efectivo">Efectivo contra entrega</option>
                <option value="credito">Crédito Mayoreo (15/30 días)</option>
                <option value="tarjeta">Tarjeta de Crédito / Débito</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Notas / Observaciones de la Venta:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Entrega en sucursal centro, paquete de 4 rines..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Resumen Final de Rentabilidad */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs text-slate-400">Total a Cobrar al Cliente</span>
              <div className="text-2xl font-black text-white">
                ${totalVenta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-400">
                Costo mercancía: ${costoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-emerald-400">Ganancia Neta Calculada</span>
              <div className="text-2xl font-black text-emerald-400">
                +${gananciaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs font-bold text-emerald-300">
                Margen de Ganancia: {margenPromedio.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
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
              className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              Registrar Venta de Mayoreo
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

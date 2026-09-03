import React, { useState, useMemo } from 'react';
import { SaleRecord, Customer } from '../types';
import { exportSalesToExcel } from '../utils/excel';
import { 
  TrendingUp, DollarSign, Plus, Download, Search, Filter, 
  Users, Calendar, PackageCheck, Eye, Trash2, ShieldAlert, Award
} from 'lucide-react';

interface SalesDashboardTabProps {
  sales: SaleRecord[];
  customers: Customer[];
  onOpenNewSaleModal: () => void;
  onDeleteSale: (id: string) => void;
  onSelectCustomerFilter?: (customerId: string) => void;
}

export const SalesDashboardTab: React.FC<SalesDashboardTabProps> = ({
  sales,
  customers,
  onOpenNewSaleModal,
  onDeleteSale,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<SaleRecord | null>(null);

  // Filtrado de ventas
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchCustomer = selectedCustomerId === 'all' || s.clienteId === selectedCustomerId;
      const matchQuery = searchQuery.trim() === '' ||
        s.folio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.clienteNumero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.items.some(item => 
          item.medida.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.marca.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchCustomer && matchQuery;
    });
  }, [sales, selectedCustomerId, searchQuery]);

  // Métricas Totales
  const totalVentas = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.totalVenta, 0);
  }, [filteredSales]);

  const totalCosto = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.costoTotal, 0);
  }, [filteredSales]);

  const totalGanancia = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.gananciaTotal, 0);
  }, [filteredSales]);

  const margenPromedio = useMemo(() => {
    if (totalVentas === 0) return 0;
    return (totalGanancia / totalVentas) * 100;
  }, [totalVentas, totalGanancia]);

  const totalPiezas = useMemo(() => {
    return filteredSales.reduce((sum, s) => 
      sum + s.items.reduce((iSum, item) => iSum + item.cantidad, 0)
    , 0);
  }, [filteredSales]);

  return (
    <div className="space-y-6">
      
      {/* Header y Acciones de Ventas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Panel de Ventas Mayoreo & Medición de Márgenes
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Registra operaciones, reutiliza clientes por número y analiza la rentabilidad neta de cada venta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => exportSalesToExcel(filteredSales)}
              disabled={filteredSales.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Exportar Ventas (.xlsx)
            </button>

            <button
              onClick={onOpenNewSaleModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Registrar Venta Mayoreo
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas de Rentabilidad */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Facturado</div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            ${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Ingresos brutos</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costo Mercancía</div>
          <div className="text-3xl font-black text-slate-700 mt-2">
            ${totalCosto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Costo de reposición</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-500">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Ganancia Neta</div>
          <div className="text-3xl font-black text-emerald-600 mt-2">
            ${totalGanancia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-700 mt-1 font-semibold">Utilidad de mayoreo</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margen Promedio</div>
          <div className={`text-3xl font-black mt-2 ${
            margenPromedio >= 20 ? 'text-emerald-600' : margenPromedio >= 15 ? 'text-blue-600' : 'text-slate-900'
          }`}>
            {margenPromedio.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Margen sobre ventas</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Volumen Vendido</div>
          <div className="text-3xl font-black text-blue-600 mt-2">
            {totalPiezas} <span className="text-sm font-normal text-slate-400">pzas</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">{filteredSales.length} transacciones</div>
        </div>

      </div>

      {/* Filtros de Ventas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          <div className="sm:col-span-6">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Buscar Venta (Folio, Cliente, Medida o Marca)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ej. MAY-1001, CLI-001, 205/55R16, Morales..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="sm:col-span-6">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Filtrar por Cliente de Mayoreo
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            >
              <option value="all">Todos los clientes ({customers.length})</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.numeroCliente}] {c.empresa || c.nombre}
                </option>
              ))}
            </select>
          </div>

        </div>

        {(searchQuery || selectedCustomerId !== 'all') && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Mostrando {filteredSales.length} ventas</span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCustomerId('all');
              }}
              className="text-blue-600 hover:text-blue-800 font-bold"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla del Historial de Ventas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-900">Historial de Ventas Registradas</span>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold border border-blue-200">
            {filteredSales.length} OPERACIONES
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-3">Folio / Fecha</th>
                <th className="p-3">Cliente (Núm & Nombre)</th>
                <th className="p-3">Medidas y Cantidades</th>
                <th className="p-3 text-right">Total Venta</th>
                <th className="p-3 text-right">Costo</th>
                <th className="p-3 text-right">Ganancia</th>
                <th className="p-3 text-right">Margen Real</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se han registrado ventas o ninguna coincide con los filtros.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/90 transition">
                      
                      {/* Folio y Fecha */}
                      <td className="p-3">
                        <div className="font-mono text-xs font-bold text-slate-900">
                          {sale.folio}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {sale.fecha}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                            {sale.clienteNumero}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900 text-xs mt-0.5">
                          {sale.clienteNombre}
                        </div>
                      </td>

                      {/* Medidas y Cantidades */}
                      <td className="p-3 text-xs">
                        <div className="space-y-1 max-w-xs">
                          {sale.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 font-mono bg-slate-100 px-1 rounded text-[11px]">
                                {item.cantidad}x
                              </span>
                              <span className="text-slate-700 font-medium">
                                {item.medida} ({item.marca})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total Venta */}
                      <td className="p-3 text-right font-bold text-slate-900">
                        ${sale.totalVenta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Costo */}
                      <td className="p-3 text-right text-xs text-slate-500 font-medium">
                        ${sale.costoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Ganancia */}
                      <td className="p-3 text-right font-bold text-emerald-700">
                        +${sale.gananciaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Margen */}
                      <td className="p-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          sale.margenPromedio >= 20 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : sale.margenPromedio >= 15 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {sale.margenPromedio.toFixed(1)}%
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSaleDetail(sale)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                            title="Ver desglose detallado"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Deseas eliminar el registro de venta ${sale.folio}?`)) {
                                onDeleteSale(sale.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Eliminar venta"
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

      {/* Modal de Detalle de Venta */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Remisión de Venta Mayoreo
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  {selectedSaleDetail.folio}
                </h3>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>Fecha: {selectedSaleDetail.fecha}</span>
                  <span>•</span>
                  <span>Cliente: [{selectedSaleDetail.clienteNumero}] {selectedSaleDetail.clienteNombre}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Llantas / Rines Surtidos
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Medida & Marca</th>
                      <th className="py-2.5 px-3 text-center">Cant</th>
                      <th className="py-2.5 px-3 text-right">Costo Unit</th>
                      <th className="py-2.5 px-3 text-right">Precio Unit</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-3 text-right">Ganancia</th>
                      <th className="py-2.5 px-3 text-right">Margen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSaleDetail.items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-800 font-mono">{item.medida}</span>
                          <span className="text-slate-500 block">{item.marca}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">{item.cantidad}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          ${item.costoUnitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          ${item.precioVentaUnitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                          +${item.gananciaNeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                            {item.margenPorcentaje.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedSaleDetail.notas && (
                <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 border border-slate-200">
                  <strong>Notas:</strong> {selectedSaleDetail.notas}
                </div>
              )}

              {/* Totales */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center mt-3">
                <div>
                  <div className="text-xs text-slate-400">Total Venta</div>
                  <div className="text-xl font-black">
                    ${selectedSaleDetail.totalVenta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-400">Ganancia Neta ({selectedSaleDetail.margenPromedio.toFixed(1)}% margen)</div>
                  <div className="text-xl font-black text-emerald-400">
                    +${selectedSaleDetail.gananciaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Customer, SaleRecord } from '../types';
import { Users, Plus, Search, Phone, Mail, Building, Trash2, Edit3, ShoppingBag } from 'lucide-react';

interface CustomersTabProps {
  customers: Customer[];
  sales: SaleRecord[];
  onOpenAddCustomerModal: () => void;
  onOpenEditCustomerModal: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onViewCustomerSales: (customerId: string) => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  customers,
  sales,
  onOpenAddCustomerModal,
  onOpenEditCustomerModal,
  onDeleteCustomer,
  onViewCustomerSales,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Enriquecer clientes con estadísticas de ventas
  const enrichedCustomers = useMemo(() => {
    return customers.map(c => {
      const clientSales = sales.filter(s => s.clienteId === c.id);
      const totalComprado = clientSales.reduce((sum, s) => sum + s.totalVenta, 0);
      const ventasCount = clientSales.length;
      return {
        ...c,
        totalComprado,
        ventasCount
      };
    });
  }, [customers, sales]);

  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter(c => {
      const q = searchQuery.toLowerCase();
      return (
        c.numeroCliente.toLowerCase().includes(q) ||
        c.nombre.toLowerCase().includes(q) ||
        c.empresa.toLowerCase().includes(q) ||
        c.telefono.toLowerCase().includes(q)
      );
    });
  }, [enrichedCustomers, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Header Clientes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Directorio de Clientes de Mayoreo & Talleres
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Crea y administra números de cliente para reutilizarlos rápidamente al registrar ventas y calcular tus márgenes.
            </p>
          </div>

          <button
            onClick={onOpenAddCustomerModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Número de Cliente
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por número de cliente (ej. CLI-001), nombre, empresa o teléfono..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-900">Directorio de Clientes</span>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold border border-blue-200">
            {filteredCustomers.length} CLIENTES ACTIVOS
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-3">Número de Cliente</th>
                <th className="p-3">Empresa / Razón Social</th>
                <th className="p-3">Contacto Principal</th>
                <th className="p-3">Teléfono & Correo</th>
                <th className="p-3">Tipo</th>
                <th className="p-3 text-center">Ventas Realizadas</th>
                <th className="p-3 text-right">Total Comprado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se encontraron clientes con el término buscado.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/90 transition">
                      
                      {/* Número de cliente */}
                      <td className="p-3">
                        <span className="font-mono text-xs font-black px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                          {c.numeroCliente}
                        </span>
                      </td>

                      {/* Empresa */}
                      <td className="p-3 font-bold text-slate-900">
                        {c.empresa || c.nombre}
                        {c.notas && (
                          <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5" title={c.notas}>
                            {c.notas}
                          </div>
                        )}
                      </td>

                      {/* Contacto */}
                      <td className="p-3 text-slate-700 text-xs font-medium">
                        {c.nombre}
                      </td>

                      {/* Teléfono */}
                      <td className="p-3 text-xs">
                        <div className="flex items-center gap-1 text-slate-700 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.telefono || 'Sin teléfono'}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-0.5">
                            <Mail className="w-3 h-3" />
                            {c.email}
                          </div>
                        )}
                      </td>

                      {/* Tipo */}
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          c.tipoCliente === 'mayoreo'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : c.tipoCliente === 'taller'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : c.tipoCliente === 'subdistribuidor'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {c.tipoCliente.toUpperCase()}
                        </span>
                      </td>

                      {/* Ventas */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onViewCustomerSales(c.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded transition cursor-pointer"
                          title="Ver ventas de este cliente"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {c.ventasCount || 0}
                        </button>
                      </td>

                      {/* Total Comprado */}
                      <td className="p-3 text-right font-black text-slate-900">
                        ${(c.totalComprado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Acciones */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenEditCustomerModal(c)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                            title="Editar cliente"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Eliminar al cliente ${c.numeroCliente} - ${c.nombre}?`)) {
                                onDeleteCustomer(c.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Eliminar cliente"
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

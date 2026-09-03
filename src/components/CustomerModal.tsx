import React, { useState, useEffect } from 'react';
import { Customer, CustomerType } from '../types';
import { Users, AlertCircle } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  onSaveCustomer: (customer: Customer) => void;
  existingCustomersCount: number;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
  onSaveCustomer,
  existingCustomersCount,
}) => {
  const [numeroCliente, setNumeroCliente] = useState('');
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [tipoCliente, setTipoCliente] = useState<CustomerType>('mayoreo');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (customerToEdit) {
      setNumeroCliente(customerToEdit.numeroCliente);
      setNombre(customerToEdit.nombre);
      setEmpresa(customerToEdit.empresa);
      setTelefono(customerToEdit.telefono);
      setEmail(customerToEdit.email || '');
      setTipoCliente(customerToEdit.tipoCliente);
      setNotas(customerToEdit.notas || '');
    } else {
      setNumeroCliente(`CLI-00${existingCustomersCount + 1}`);
      setNombre('');
      setEmpresa('');
      setTelefono('');
      setEmail('');
      setTipoCliente('mayoreo');
      setNotas('');
    }
  }, [isOpen, customerToEdit, existingCustomersCount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroCliente.trim()) {
      setError('El número de cliente es obligatorio.');
      return;
    }
    if (!nombre.trim() && !empresa.trim()) {
      setError('Debes especificar al menos el nombre del contacto o el nombre de la empresa.');
      return;
    }

    const customerData: Customer = {
      id: customerToEdit ? customerToEdit.id : `c_${Date.now()}`,
      numeroCliente: numeroCliente.trim().toUpperCase(),
      nombre: nombre.trim() || empresa.trim(),
      empresa: empresa.trim() || nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim() || undefined,
      tipoCliente,
      notas: notas.trim() || undefined,
      totalComprado: customerToEdit?.totalComprado || 0,
      ventasCount: customerToEdit?.ventasCount || 0,
      fechaRegistro: customerToEdit?.fechaRegistro || new Date().toISOString().split('T')[0]
    };

    onSaveCustomer(customerData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-start pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {customerToEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Asigna un número identificador para reutilizarlo en tus ventas y cotizaciones.
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
                Número de Cliente *
              </label>
              <input
                type="text"
                value={numeroCliente}
                onChange={(e) => setNumeroCliente(e.target.value)}
                placeholder="Ej. CLI-001"
                required
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipo de Cliente
              </label>
              <select
                value={tipoCliente}
                onChange={(e: any) => setTipoCliente(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="mayoreo">Mayoreo General</option>
                <option value="taller">Taller Mecánico / Vulcanizadora</option>
                <option value="subdistribuidor">Subdistribuidor Regional</option>
                <option value="menudeo">Menudeo Frecuente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Empresa / Taller / Llantera
            </label>
            <input
              type="text"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Ej. Llantas y Servicios San José"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre de Contacto / Encargado
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Ing. Martín González"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. 442-123-4567"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico (Opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notas / Preferencias Comerciales
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Paga en transferencia contra entrega, compra medidas de camioneta..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              {customerToEdit ? 'Guardar Cambios' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

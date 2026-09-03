import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, X, AlertCircle, CheckCircle2, Shield, Eye, EyeOff } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetSectionName?: string;
}

const CORRECT_PIN = '141096';

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetSectionName = 'Cruce de Datos y Área Comercial'
}) => {
  const [pin, setPin] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showDigits, setShowDigits] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '', '', '']);
      setError(null);
      setIsSuccess(false);
      // Auto-focus primer input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    // Si pegan el PIN completo de 6 dígitos
    if (value.length > 1) {
      const sanitized = value.replace(/\D/g, '').slice(0, 6);
      if (sanitized.length > 0) {
        const newPin = ['', '', '', '', '', ''];
        for (let i = 0; i < sanitized.length; i++) {
          newPin[i] = sanitized[i];
        }
        setPin(newPin);
        setError(null);

        if (sanitized.length === 6) {
          validatePin(sanitized);
        } else {
          const nextIndex = Math.min(sanitized.length, 5);
          inputRefs.current[nextIndex]?.focus();
        }
      }
      return;
    }

    // Un solo dígito
    const cleanDigit = value.replace(/\D/g, '');
    const newPin = [...pin];
    newPin[index] = cleanDigit;
    setPin(newPin);
    setError(null);

    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Si completó los 6 dígitos
    if (cleanDigit && index === 5) {
      const fullPin = newPin.join('');
      validatePin(fullPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const validatePin = (code: string) => {
    if (code === CORRECT_PIN) {
      setIsSuccess(true);
      setError(null);
      setTimeout(() => {
        onSuccess();
      }, 400);
    } else {
      setError('PIN incorrecto. Verifica el código de acceso e intenta nuevamente.');
      setIsSuccess(false);
      // Vibrar / feedback
      setPin(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    }
  };

  const handleKeypadClick = (num: string) => {
    const firstEmptyIndex = pin.findIndex(d => d === '');
    if (firstEmptyIndex !== -1) {
      handleDigitChange(firstEmptyIndex, num);
    }
  };

  const handleKeypadBackspace = () => {
    const lastFilledIndex = [...pin].reverse().findIndex(d => d !== '');
    if (lastFilledIndex !== -1) {
      const actualIndex = 5 - lastFilledIndex;
      const newPin = [...pin];
      newPin[actualIndex] = '';
      setPin(newPin);
      setError(null);
      inputRefs.current[actualIndex]?.focus();
    }
  };

  const handleKeypadClear = () => {
    setPin(['', '', '', '', '', '']);
    setError(null);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con estilo de seguridad */}
        <div className="bg-slate-900 text-white p-6 pb-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                  Seguridad Comercial
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Verificación de PIN
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Esta sección contiene márgenes, costos confidenciales y operaciones comerciales. Introduce el PIN de 6 dígitos para acceder a <strong className="text-white">{targetSectionName}</strong>.
          </p>
        </div>

        {/* Cuerpo con Inputs del PIN */}
        <div className="p-6">
          
          {/* Mensaje de error o éxito */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-xs font-semibold animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>¡PIN correcto! Desbloqueando acceso...</span>
            </div>
          )}

          {/* 6 Celdas de entrada */}
          <div className="flex justify-center items-center gap-2 sm:gap-3 my-4">
            {pin.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type={showDigits ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isSuccess}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl border-2 transition-all outline-none ${
                  isSuccess 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : error 
                      ? 'border-red-400 bg-red-50/50 text-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : digit 
                        ? 'border-blue-600 bg-blue-50/30 text-slate-900 shadow-xs'
                        : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100'
                }`}
              />
            ))}
          </div>

          {/* Opción de mostrar dígitos */}
          <div className="flex items-center justify-between mt-2 px-1">
            <button
              type="button"
              onClick={() => setShowDigits(!showDigits)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition cursor-pointer"
            >
              {showDigits ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Ocultar dígitos</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Mostrar dígitos</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-400 font-mono">
              6 dígitos requeridos
            </span>
          </div>

          {/* Teclado numérico táctil / rápido */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadClick(num)}
                  disabled={isSuccess}
                  className="py-2.5 text-base font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-blue-50 active:text-blue-600 rounded-xl border border-slate-200 transition select-none cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadClear}
                disabled={isSuccess}
                className="py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => handleKeypadClick('0')}
                disabled={isSuccess}
                className="py-2.5 text-base font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-blue-50 active:text-blue-600 rounded-xl border border-slate-200 transition select-none cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                disabled={isSuccess}
                className="py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Borrar ⌫
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => validatePin(pin.join(''))}
              disabled={pin.join('').length !== 6 || isSuccess}
              className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                pin.join('').length === 6 && !isSuccess
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Verificar PIN</span>
            </button>
          </div>

        </div>

        {/* Footer con nota de confidencialidad */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-500 font-medium">
            🔒 El PIN protege la información de márgenes, precios de compra y directorio de clientes.
          </p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Play, Trash2, CheckCircle, XCircle, Clock, AlertCircle, Camera } from 'lucide-react';
import { formatFechaParaInput } from '../utils/helpers';

function EstadoIcon({ estado }) {
  switch (estado) {
    case 'completado':
      return <CheckCircle className="text-green-500" size={20} />;
    case 'procesando':
      return <Clock className="text-blue-500 animate-spin" size={20} />;
    case 'fallido':
      return <XCircle className="text-red-500" size={20} />;
    case 'pendiente':
      return <AlertCircle className="text-yellow-500" size={20} />;
    default:
      return <Clock className="text-gray-400" size={20} />;
  }
}

export default function TicketCard({
  ticket,
  comercios,
  isActive,
  onProcesar,
  onEliminar,
  onActualizar,
  onVerImagen,
  onVerEvidencia
}) {
  return (
    <div
      className={`group border-2 rounded-xl p-3 sm:p-5 transition-all duration-300 ${
        isActive
          ? 'border-orange-500 bg-orange-50 shadow-md ring-4 ring-orange-500/10'
          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex flex-col lg:flex-row items-stretch gap-6">
        {/* Preview de imagen */}
        <div className="lg:w-1/3 shrink-0 group/img relative">
          <div
            className="h-full min-h-[150px] lg:h-[280px] bg-gray-100 rounded-2xl border-2 border-gray-100 overflow-hidden shadow-inner flex items-center justify-center cursor-zoom-in"
            onClick={() => ticket.archivo && onVerImagen(URL.createObjectURL(ticket.archivo))}
          >
            {ticket.archivo ? (
              <img
                src={URL.createObjectURL(ticket.archivo)}
                alt="Ticket"
                className="w-full h-full object-contain hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <Camera size={40} className="text-gray-300" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
              CLIC PARA AMPLIAR
            </div>
          </div>
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm">
              <EstadoIcon estado={ticket.estado} />
            </div>
          </div>
        </div>

        {/* Formulario de datos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="font-bold text-gray-900 text-base lg:text-lg truncate flex items-center gap-2">
              <div className="w-1.5 h-4 bg-orange-400 rounded-full"></div>
              {ticket.nombre}
            </h3>
            {ticket.datos?.total && (
              <span className="shrink-0 font-black text-white bg-orange-600 px-3 py-1 rounded-xl text-sm shadow-md">
                ${ticket.datos.total}
              </span>
            )}
          </div>

          {ticket.usarCredenciales && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                Emision Automatica Activa
              </span>
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comercio:</span>
              <select
                value={ticket.comercio || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : null;
                  onActualizar(ticket.id, { comercio: val, deteccionComercioStatus: 'manual' });
                }}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all ${
                  !ticket.comercio ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                <option value="">-- Seleccionar Comercio --</option>
                {comercios.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4 bg-gray-50/80 rounded-2xl border border-gray-100 w-full">
              <CampoInput
                label="Monto ($)"
                value={ticket.datos?.total || ''}
                placeholder="0.00"
                onChange={(v) => onActualizar(ticket.id, { datos: { ...ticket.datos, total: v } })}
              />
              <CampoInput
                label="Folio / Ticket"
                value={ticket.datos?.folio || ''}
                placeholder="Folio"
                labelClass="text-gray-700"
                onChange={(v) => onActualizar(ticket.id, { datos: { ...ticket.datos, folio: v } })}
              />
              <CampoInput
                label="WebID / Referencia"
                value={ticket.datos?.webid || ''}
                placeholder="Codigo"
                labelClass="text-orange-400"
                inputClass="border-orange-100 text-orange-700 font-mono"
                onChange={(v) => onActualizar(ticket.id, { datos: { ...ticket.datos, webid: v } })}
              />
              <CampoInput
                label="Estacion (ES)"
                value={ticket.datos?.estacion || ''}
                placeholder="E12345"
                labelClass="text-blue-400"
                inputClass="border-blue-100 text-blue-700"
                onChange={(v) => onActualizar(ticket.id, { datos: { ...ticket.datos, estacion: v } })}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-1">Fecha</label>
                <input
                  type="date"
                  value={formatFechaParaInput(ticket.datos?.fecha)}
                  onClick={(e) => e.target.showPicker?.()}
                  onChange={(e) => onActualizar(ticket.id, { datos: { ...ticket.datos, fecha: e.target.value } })}
                  className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          {ticket.mensaje && (
            <div className={`mt-4 text-xs md:text-sm font-bold flex items-start gap-2.5 p-3 rounded-xl border ${
              ticket.estado === 'completado' ? 'text-green-800 bg-green-50 border-green-100' :
              ticket.estado === 'fallido' ? 'text-red-800 bg-red-50 border-red-100' :
              'text-blue-800 bg-blue-50 border-blue-100'
            }`}>
              <span className="mt-0.5 shrink-0">
                {ticket.estado === 'procesando' && <Clock size={16} className="animate-spin" />}
                {ticket.estado === 'completado' && <CheckCircle size={16} />}
                {ticket.estado === 'fallido' && <XCircle size={16} />}
              </span>
              <span className="leading-relaxed">{ticket.mensaje}</span>
            </div>
          )}

          {ticket.evidencia && (
            <button
              onClick={() => onVerEvidencia(ticket.evidencia)}
              className="mt-2 text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 transition-all active:scale-95"
            >
              <Camera size={14} />
              Ver Evidencia del Robot
            </button>
          )}
        </div>

        {/* Botones de accion */}
        <div className="flex flex-row lg:flex-col items-center justify-center gap-4 lg:border-l lg:pl-6 border-gray-100">
          {ticket.estado !== 'procesando' && (
            <button
              onClick={() => onProcesar(ticket)}
              className="w-full lg:w-16 h-12 lg:h-16 bg-orange-100 text-orange-700 rounded-2xl hover:bg-orange-600 hover:text-white transition-all shadow-sm active:scale-90 flex items-center justify-center gap-2 lg:gap-0 font-bold lg:font-normal"
              title="Facturar este ticket"
            >
              <Play size={28} fill="currentColor" />
              <span className="lg:hidden">FACTURAR</span>
            </button>
          )}
          <button
            onClick={() => onEliminar(ticket.id)}
            className="w-full lg:w-16 h-12 lg:h-16 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-colors flex items-center justify-center gap-2 lg:gap-0 font-bold lg:font-normal"
            title="Eliminar"
          >
            <Trash2 size={24} />
            <span className="lg:hidden">ELIMINAR</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function CampoInput({ label, value, placeholder, onChange, labelClass = 'text-gray-400', inputClass = '' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${labelClass}`}>{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all ${inputClass}`}
      />
    </div>
  );
}

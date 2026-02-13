import React, { useState } from 'react';
import { Upload, Play, Pause, Settings, BarChart2, Trash2 } from 'lucide-react';

import DashboardEstadisticas from './components/DashboardEstadisticas';
import SettingsPanel from './components/SettingsPanel';
import TicketCard from './components/TicketCard';
import EvidenciaModal from './components/EvidenciaModal';

import { useTickets } from './hooks/useTickets';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useServerStatus } from './hooks/useServerStatus';

import { COMERCIOS_DEFAULT } from './data/comercios';

function FacturacionAutomatica() {
  const logoRotulate = "logo_rotulate.png";

  const [vista, setVista] = useState('facturacion');
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [evidenciaModal, setEvidenciaModal] = useState(null);

  const comercios = COMERCIOS_DEFAULT;

  const [credenciales, setCredenciales] = useLocalStorage('credenciales', {});
  const [datosFacturacion, setDatosFacturacion] = useLocalStorage('datosFacturacion', {
    rfc: '',
    razonSocial: '',
    email: '',
    codigoPostal: '',
    regimenFiscal: '626'
  });

  const [serverStatus, setServerStatus] = useServerStatus();

  const {
    tickets,
    procesando,
    ticketActual,
    estadisticas,
    agregarTicket,
    eliminarTicket,
    limpiarTickets,
    actualizarTicket,
    procesarTicket,
    procesarTodos
  } = useTickets();

  const handleFileUpload = (e) => {
    const archivos = Array.from(e.target.files);
    archivos.forEach(archivo => agregarTicket(archivo));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6 overflow-x-hidden" style={{ backgroundColor: '#f5f5f5' }}>
      <EvidenciaModal imageSrc={evidenciaModal} onClose={() => setEvidenciaModal(null)} />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabecera */}
        <div className="rounded-2xl shadow-xl p-4 md:p-6" style={{ backgroundColor: '#000052' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-4 w-full md:w-auto">
              <img src={logoRotulate} alt="Rotulate" className="h-12 md:h-14 object-contain" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
                    Sistema de Facturacion
                  </h1>
                  <button
                    onClick={() => setServerStatus('checking')}
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      serverStatus === 'online' ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' :
                      serverStatus === 'offline' ? 'bg-red-500' : 'bg-gray-400'
                    } animate-pulse`}
                    title="Refrescar conexion"
                  ></button>
                </div>
                <p className="text-white/60 text-xs md:text-sm">
                  Robot Mexico {serverStatus === 'online' ? '• Conexion Activa' : '• Sin conexion'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setVista(vista === 'facturacion' ? 'estadisticas' : 'facturacion')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 border ${
                  vista === 'estadisticas'
                    ? 'bg-orange-500 border-orange-400 text-white shadow-lg'
                    : 'hover:bg-white/10 text-white border-white/20'
                }`}
              >
                <BarChart2 size={18} />
                <span className="font-bold text-sm">Dashboard</span>
              </button>
              <button
                onClick={() => setMostrarConfig(!mostrarConfig)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors border border-white/20 text-white"
              >
                <Settings size={22} />
              </button>
            </div>
          </div>
        </div>

        {vista === 'estadisticas' ? (
          <DashboardEstadisticas tickets={tickets} comercios={comercios} />
        ) : (
          <>
            {/* Estadisticas y controles */}
            <div className="rounded-2xl shadow-xl p-4 md:p-6" style={{ backgroundColor: '#000052' }}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <StatCard label="Cargados" value={estadisticas.total} color="blue" />
                  <StatCard label="Exito" value={estadisticas.completados} color="green" />
                  <StatCard label="Pendientes" value={estadisticas.pendientes} color="orange" />
                  <StatCard label="Fallos" value={estadisticas.fallidos} color="red" />
                </div>

                {mostrarConfig && (
                  <SettingsPanel
                    datosFacturacion={datosFacturacion}
                    setDatosFacturacion={setDatosFacturacion}
                  />
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex-1 cursor-pointer group">
                    <div className="h-full border-2 border-dashed border-white/20 rounded-xl p-6 text-center group-hover:bg-white/5 group-hover:border-orange-500 transition-all flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="text-white/70 group-hover:text-orange-500" size={24} />
                      </div>
                      <span className="text-white font-medium">Subir tickets</span>
                      <p className="text-white/40 text-[10px] mt-1">PDF, JPG o PNG</p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </label>

                  <button
                    onClick={() => procesarTodos(datosFacturacion, credenciales)}
                    disabled={procesando || tickets.length === 0}
                    className="w-full sm:w-auto sm:px-10 py-6 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95 disabled:grayscale disabled:opacity-50 ring-4 ring-transparent hover:ring-green-400/30"
                    style={{
                      backgroundColor: procesando || tickets.length === 0 ? '#374151' : '#00ff00',
                      color: '#000052'
                    }}
                  >
                    {procesando ? (
                      <><Pause size={24} className="animate-pulse" /> Procesando...</>
                    ) : (
                      <><Play size={24} fill="#000052" /> FACTURAR TODO</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de tickets */}
            <div className="bg-white rounded-2xl shadow-xl p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                  Tickets Cargados ({tickets.length})
                </h2>
                {tickets.length > 0 && (
                  <button
                    onClick={limpiarTickets}
                    className="text-[10px] sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center justify-center gap-1 bg-orange-50 px-2 py-1.5 rounded-lg transition-colors w-max"
                  >
                    <Trash2 size={14} />
                    Limpiar lista
                  </button>
                )}
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                    <Upload size={32} className="text-gray-300" />
                  </div>
                  <p className="text-gray-900 font-medium">No hay tickets pendientes</p>
                  <p className="text-gray-500 text-sm">Arrastra tus archivos aqui o usa el boton superior</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map(ticket => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      comercios={comercios}
                      isActive={ticketActual === ticket.id}
                      onProcesar={(t) => procesarTicket(t, datosFacturacion, credenciales)}
                      onEliminar={eliminarTicket}
                      onActualizar={actualizarTicket}
                      onVerImagen={setEvidenciaModal}
                      onVerEvidencia={setEvidenciaModal}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Lector QR oculto */}
      <div id="qr-reader-hidden" style={{ display: 'none' }}></div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colorMap = {
    blue: { bg: 'bg-white/10', border: 'border-blue-400', text: 'text-white' },
    green: { bg: 'bg-green-500/10', border: 'border-green-400', text: 'text-green-400' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-400', text: 'text-orange-400' },
    red: { bg: 'bg-red-500/10', border: 'border-red-400', text: 'text-red-400' },
  };
  const c = colorMap[color];

  return (
    <div className={`${c.bg} backdrop-blur-sm p-4 rounded-xl border-l-4 ${c.border}`}>
      <div className={`text-2xl font-bold ${c.text} leading-none`}>{value}</div>
      <div className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-white/50 mt-1">{label}</div>
    </div>
  );
}

export default FacturacionAutomatica;

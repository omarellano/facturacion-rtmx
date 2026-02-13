import React from 'react';
import { validarRFC } from '../utils/rfc';

export default function SettingsPanel({ datosFacturacion, setDatosFacturacion }) {
  const rfcValidation = validarRFC(datosFacturacion.rfc);

  return (
    <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 animate-in fade-in zoom-in duration-300">
      <h2 className="text-xl font-semibold text-white mb-4">Configuracion de Emisor</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-white/50 uppercase mb-1">RFC</label>
          <input
            type="text"
            value={datosFacturacion.rfc}
            onChange={(e) => setDatosFacturacion({ ...datosFacturacion, rfc: e.target.value.toUpperCase() })}
            className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none ${
              datosFacturacion.rfc && !rfcValidation.valido ? 'border-red-400' : 'border-white/20'
            }`}
            maxLength={13}
          />
          {datosFacturacion.rfc && !rfcValidation.valido && (
            <p className="text-red-300 text-[10px] mt-1">{rfcValidation.errores[0]}</p>
          )}
          {datosFacturacion.rfc && rfcValidation.valido && (
            <p className="text-green-300 text-[10px] mt-1">RFC valido ({rfcValidation.tipo === 'fisica' ? 'Persona Fisica' : 'Persona Moral'})</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 uppercase mb-1">Razon Social</label>
          <input
            type="text"
            value={datosFacturacion.razonSocial}
            onChange={(e) => setDatosFacturacion({ ...datosFacturacion, razonSocial: e.target.value })}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 uppercase mb-1">Email</label>
          <input
            type="email"
            value={datosFacturacion.email}
            onChange={(e) => setDatosFacturacion({ ...datosFacturacion, email: e.target.value })}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 uppercase mb-1">CP</label>
          <input
            type="text"
            value={datosFacturacion.codigoPostal}
            onChange={(e) => setDatosFacturacion({ ...datosFacturacion, codigoPostal: e.target.value })}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none"
            maxLength={5}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 uppercase mb-1">API Key (Backend)</label>
          <input
            type="password"
            value={localStorage.getItem('apiKey') || ''}
            onChange={(e) => localStorage.setItem('apiKey', e.target.value)}
            placeholder="Para autenticacion con el robot"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none placeholder-white/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 uppercase mb-1">URL Backend</label>
          <input
            type="text"
            value={localStorage.getItem('backendUrl') || ''}
            onChange={(e) => localStorage.setItem('backendUrl', e.target.value)}
            placeholder="https://tu-ngrok-url.app"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none placeholder-white/30"
          />
        </div>
      </div>
    </div>
  );
}

import React from 'react';

export default function EvidenciaModal({ imageSrc, onClose }) {
  if (!imageSrc) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 lg:p-20">
      <div className="relative bg-white rounded-3xl overflow-hidden max-w-5xl w-full max-h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Evidencia del Proceso</h3>
            <p className="text-sm text-gray-500">Captura de pantalla real generada por el robot en el portal oficial.</p>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm transition-all text-2xl"
          >
            &#10005;
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-gray-200 flex items-center justify-center">
          <img
            src={imageSrc}
            alt="Evidencia del Robot"
            className="max-w-full shadow-2xl rounded-lg"
          />
        </div>
        <div className="p-6 bg-gray-50 border-t text-center">
          <button
            onClick={onClose}
            className="px-10 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

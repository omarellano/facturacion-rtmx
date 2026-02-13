import React from 'react';

export default function DashboardEstadisticas({ tickets, comercios }) {
  const ticketsCompletados = tickets.filter(t => t.estado === 'completado');

  const totalGastado = ticketsCompletados.reduce((acc, t) => {
    const total = parseFloat(t.qrData?.total || t.datos?.total || 0);
    return acc + (isNaN(total) ? 0 : total);
  }, 0);

  const gastosPorComercio = ticketsCompletados.reduce((acc, t) => {
    const comercio = comercios.find(c => c.id === t.comercio)?.nombre || 'Desconocido';
    if (!acc[comercio]) acc[comercio] = 0;
    const total = parseFloat(t.qrData?.total || t.datos?.total || 0);
    acc[comercio] += (isNaN(total) ? 0 : total);
    return acc;
  }, {});

  const topComercios = Object.entries(gastosPorComercio)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxGasto = Math.max(...Object.values(gastosPorComercio), 1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Gasto Total (Mes)</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            ${totalGastado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Tickets Facturados</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{ticketsCompletados.length}</p>
          <div className="mt-2 flex items-center text-sm text-gray-600">
            <span>De {tickets.length} tickets escaneados</span>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Promedio por Ticket</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            ${ticketsCompletados.length ? (totalGastado / ticketsCompletados.length).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-6">Gastos por Comercio</h3>
          <div className="space-y-4">
            {topComercios.map(([nombre, monto], index) => (
              <div key={nombre}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{nombre}</span>
                  <span className="text-gray-900 font-bold">${monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-1000"
                    style={{
                      width: `${(monto / maxGasto) * 100}%`,
                      backgroundColor: index === 0 ? '#000052' : index === 1 ? '#ff6400' : '#4b5563'
                    }}
                  ></div>
                </div>
              </div>
            ))}
            {topComercios.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay datos suficientes</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Ultimos Movimientos</h3>
          <div className="overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Comercio</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ticketsCompletados.slice(-5).reverse().map(t => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {t.qrData?.fecha || new Date().toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {comercios.find(c => c.id === t.comercio)?.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ${(t.qrData?.total || t.datos?.total || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ticketsCompletados.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay movimientos recientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

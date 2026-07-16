
'use client';

import React, { useState, useMemo } from 'react';
import { Sale, Product, Client, ReportZRecord } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';

interface ReportsModuleProps {
  active: boolean;
  sales: Sale[];
  products: Product[];
  clients: Client[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
  reportsZ: ReportZRecord[];
  setReportsZ: React.Dispatch<React.SetStateAction<ReportZRecord[]>>;
}

type ReportType = 'ventas' | 'inventario' | 'clientes' | 'vendedor' | 'categoria' | 'cierre' | 'reporteX' | 'reporteZ' | null;

export function ReportsModule({ active, sales, products, clients, config, setConfig, reportsZ, setReportsZ }: ReportsModuleProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  if (!active) return null;

  // Lógica común para cálculos de X y Z
  const calculateDailyStats = (date: string) => {
    const daySales = sales.filter(s => s.fecha && s.fecha.startsWith(date));
    const completions = daySales.filter(s => s.estado === 'Completada');
    const anulls = daySales.filter(s => s.estado === 'Anulada');

    const ventaBruta = completions.reduce((acc, s) => acc + (s.subtotal || 0), 0);
    const ivaTotal = completions.reduce((acc, s) => acc + (s.iva || 0), 0);
    const ventaNeta = ventaBruta + ivaTotal;

    const methodTotals: Record<string, { usd: number, bs: number }> = {};
    completions.forEach(s => {
      if (s.detallesPago) {
        s.detallesPago.forEach(dp => {
          if (!methodTotals[dp.method]) methodTotals[dp.method] = { usd: 0, bs: 0 };
          methodTotals[dp.method].usd += dp.usd;
          methodTotals[dp.method].bs += dp.bs;
        });
      }
    });

    const exentoTotal = completions.reduce((acc, s) => {
      const itemsExentos = s.items.filter(it => it.iva === 0).reduce((is, it) => is + (it.precioUsd * it.cantidad), 0);
      return acc + itemsExentos;
    }, 0);

    const facturasOrdenadas = completions.sort((a,b) => a.numero.localeCompare(b.numero));
    const facturaInicio = facturasOrdenadas.length > 0 ? facturasOrdenadas[0].numero : '--';
    const facturaFin = facturasOrdenadas.length > 0 ? facturasOrdenadas[facturasOrdenadas.length - 1].numero : '--';

    return {
      ventaBruta, ivaTotal, ventaNeta, methodTotals, exentoTotal, 
      anulaciones: anulls.length, facturaInicio, facturaFin, count: completions.length
    };
  };

  const handleProcessZ = () => {
    const stats = calculateDailyStats(filterDate);
    if (stats.count === 0 && stats.anulaciones === 0) {
      alert("No hay operaciones registradas para realizar el cierre Z en esta fecha.");
      return;
    }

    if (confirm(`¿Está seguro de emitir el REPORTE Z N° ${config.reportZCounter.toString().padStart(6, '0')}? Esta acción cerrará la jornada fiscal.`)) {
      const newZ: ReportZRecord = {
        id: uuidv4(),
        numero: config.reportZCounter,
        fecha: filterDate,
        vendedor: config.vendedor,
        facturaInicio: stats.facturaInicio,
        facturaFin: stats.facturaFin,
        ventaBruta: stats.ventaBruta,
        ventaNeta: stats.ventaNeta,
        ivaTotal: stats.ivaTotal,
        igtfTotal: stats.ventaNeta * 0.03, // Ejemplo IGTF
        exentoTotal: stats.exentoTotal,
        anulaciones: stats.anulaciones,
        grandTotalAcumulado: config.grandTotalHistory + stats.ventaNeta,
        desglosePagos: Object.entries(stats.methodTotals).map(([method, val]) => ({ method, ...val }))
      };

      setReportsZ([...reportsZ, newZ]);
      setConfig({
        ...config,
        reportZCounter: config.reportZCounter + 1,
        grandTotalHistory: config.grandTotalHistory + stats.ventaNeta,
        lastZDate: filterDate
      });

      setSelectedReport('reporteZ');
      alert(`Reporte Z ${newZ.numero} generado exitosamente.`);
    }
  };

  const renderReportContent = () => {
    if (selectedReport === 'reporteX' || selectedReport === 'reporteZ') {
      const stats = calculateDailyStats(filterDate);
      const isZ = selectedReport === 'reporteZ';
      const lastZ = reportsZ.find(z => z.fecha === filterDate) || (isZ ? reportsZ[reportsZ.length-1] : null);

      return (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="toolbar no-print">
            <button onClick={() => setSelectedReport('cierre')}>⬅️ Volver</button>
            <button style={{ marginLeft: 'auto' }} onClick={() => window.print()}>🖨️ Imprimir Documento</button>
          </div>
          
          <div className="win-window p-8 bg-white text-black font-mono text-sm max-w-2xl mx-auto shadow-xl">
            <div className="text-center border-b-2 border-black pb-4 mb-4">
              <h1 className="text-xl font-bold uppercase">{config.nombreEmpresa}</h1>
              <p>RIF: {config.rifEmpresa}</p>
              <p>{config.direccion}</p>
              <p>TEL: {config.telefono}</p>
              <p className="mt-2 font-black text-lg border-y-2 border-black py-1">
                {isZ ? `REPORTE Z - CIERRE DIARIO N° ${lastZ?.numero.toString().padStart(6, '0')}` : 'REPORTE X - LECTURA PARCIAL'}
              </p>
              <div className="flex justify-between mt-2 text-xs">
                <span>FECHA: {filterDate}</span>
                <span>HORA: {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>TERMINAL: {config.terminalId}</span>
                <span>CAJERO: {config.vendedor}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between font-bold"><span>VENTA BRUTA:</span> <span>${stats.ventaBruta.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>DESCUENTOS:</span> <span>$0.00</span></div>
              <div className="flex justify-between"><span>DEVOLUCIONES:</span> <span>$0.00</span></div>
              <div className="flex justify-between font-black border-t border-black pt-1"><span>VENTA NETA:</span> <span>${stats.ventaNeta.toFixed(2)}</span></div>
            </div>

            <div className="mt-4 border-t-2 border-dashed border-black pt-2">
              <p className="font-bold border-b border-black mb-1">DESGLOSE FISCAL</p>
              <div className="flex justify-between"><span>VENTA EXENTA:</span> <span>${stats.exentoTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>BASE IMPONIBLE (16%):</span> <span>${(stats.ventaBruta - stats.exentoTotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>IVA RECAUDADO:</span> <span>${stats.ivaTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>RECAUDACIÓN IGTF (3%):</span> <span>${(stats.ventaNeta * 0.03).toFixed(2)}</span></div>
            </div>

            <div className="mt-4 border-t-2 border-dashed border-black pt-2">
              <p className="font-bold border-b border-black mb-1">FORMAS DE PAGO</p>
              {Object.entries(stats.methodTotals).map(([method, val]) => (
                <div key={method} className="flex justify-between text-xs">
                  <span>{method.toUpperCase()}:</span>
                  <span>USD ${(val.usd).toFixed(2)} | BS ${(val.bs).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t-2 border-dashed border-black pt-2">
              <p className="font-bold border-b border-black mb-1">ESTADÍSTICAS</p>
              <div className="flex justify-between"><span>CANT. FACTURAS:</span> <span>{stats.count}</span></div>
              <div className="flex justify-between text-red-600"><span>FACTURAS ANULADAS:</span> <span>{stats.anulaciones}</span></div>
              <div className="flex justify-between"><span>TICKET PROMEDIO:</span> <span>${stats.count > 0 ? (stats.ventaNeta / stats.count).toFixed(2) : '0.00'}</span></div>
            </div>

            {isZ && (
              <div className="mt-4 border-t-2 border-black pt-2 bg-gray-50 p-2">
                <p className="font-bold text-center mb-1">CONTROL DE AUDITORÍA</p>
                <div className="flex justify-between text-[10px]"><span>RANGO FACTURAS:</span> <span>{stats.facturaInicio} - {stats.facturaFin}</span></div>
                <div className="flex justify-between text-[10px] font-black mt-2"><span>GRAN TOTAL HISTÓRICO:</span> <span>${(lastZ?.grandTotalAcumulado || 0).toFixed(2)}</span></div>
              </div>
            )}

            <div className="mt-8 text-center text-[10px] border-t border-black pt-4">
              *** FIN DEL DOCUMENTO ***
            </div>
          </div>
        </div>
      );
    }

    switch (selectedReport) {
      case 'ventas':
        const filteredSales = sales.filter(s => s.fecha && s.fecha.startsWith(filterDate) && s.estado === 'Completada');
        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="toolbar">
              <label>Fecha:</label>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="win-input" />
              <button style={{ marginLeft: 'auto' }} onClick={() => window.print()}>🖨️ Imprimir</button>
            </div>
            <div className="table-responsive" style={{ maxHeight: '400px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Factura</th>
                    <th>Cliente</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                    <th style={{ textAlign: 'right' }}>IVA</th>
                    <th style={{ textAlign: 'right' }}>Total USD</th>
                    <th style={{ textAlign: 'right' }}>Total Bs</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(s => (
                    <tr key={s.numero}>
                      <td>{s.numero}</td>
                      <td>{s.cliente}</td>
                      <td style={{ textAlign: 'right' }}>${(s.subtotal || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>${(s.iva || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${(s.totalUsd || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{(s.totalBs || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No hay ventas en esta fecha</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bottom-totals" style={{ justifyContent: 'flex-end', background: '#eee', padding: '10px' }}>
              <div className="total-box">
                <span className="total-label">Total del Día:</span>
                <div className="total-value">${filteredSales.reduce((acc, s) => acc + (s.totalUsd || 0), 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        );

      case 'inventario':
        const totalValor = products.reduce((acc, p) => acc + (p.stock * p.costoPromedio), 0);
        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="toolbar">
              <h3 style={{ fontSize: '12px' }}>Valor Total del Almacén (CPP): ${totalValor.toFixed(2)}</h3>
              <button style={{ marginLeft: 'auto' }} onClick={() => window.print()}>🖨️ Exportar Inventario</button>
            </div>
            <div className="table-responsive" style={{ maxHeight: '400px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th style={{ textAlign: 'center' }}>Stock</th>
                    <th style={{ textAlign: 'right' }}>Costo Prom..</th>
                    <th style={{ textAlign: 'right' }}>Valor Total</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.codigo}>
                      <td>{p.codigo}</td>
                      <td>{p.nombre}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{p.stock}</td>
                      <td style={{ textAlign: 'right' }}>${(p.costoPromedio || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>${(p.stock * p.costoPromedio).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>
                        {p.stock <= p.stockMin ? (p.stock === 0 ? '🔴 AGOTADO' : '🟡 BAJO') : '🟢 OK'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'clientes':
        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>RIF/CI</th>
                    <th>Teléfono</th>
                    <th style={{ textAlign: 'right' }}>Límite Crédito</th>
                    <th style={{ textAlign: 'right' }}>Saldo Deudor</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'bold' }}>{c.nombre}</td>
                      <td>{c.tipoRif}-{c.rifNum}</td>
                      <td>{c.telefono}</td>
                      <td style={{ textAlign: 'right' }}>${(c.credito || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: c.saldo > 0 ? 'red' : 'green', fontWeight: 'bold' }}>
                        ${(c.saldo || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'cierre':
        return (
          <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in zoom-in-95">
            <div className="text-center">
              <h3 className="text-2xl font-black text-blue-900 uppercase">Cierre de Jornada y Auditoría</h3>
              <p className="text-gray-600 mt-2">Seleccione el tipo de documento fiscal que desea emitir para la fecha: <strong>{filterDate}</strong></p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
              <div className="win-window p-6 flex flex-col items-center hover:scale-105 transition-transform cursor-pointer" onClick={() => setSelectedReport('reporteX')}>
                <div className="text-4xl mb-4">📄</div>
                <h4 className="font-black text-lg">Reporte X</h4>
                <p className="text-[10px] text-center mt-2 text-gray-500 uppercase font-bold">Lectura Parcial de Control<br/>(No cierra la caja)</p>
                <button className="btn btn-primary mt-6 w-full">GENERAR LECTURA</button>
              </div>

              <div className="win-window p-6 flex flex-col items-center border-red-400 border-2 hover:scale-105 transition-transform cursor-pointer" onClick={handleProcessZ}>
                <div className="text-4xl mb-4">💰</div>
                <h4 className="font-black text-lg text-red-700">Reporte Z</h4>
                <p className="text-[10px] text-center mt-2 text-red-500 uppercase font-bold">Cierre Diario Definitivo<br/>(Reinicia contadores del día)</p>
                <button className="btn btn-success mt-6 w-full" style={{background: '#f0a0a0'}}>EMITIR CIERRE Z</button>
              </div>
            </div>

            <div className="win-window p-4 w-full max-w-2xl bg-gray-100">
               <h5 className="font-bold text-[10px] uppercase border-b border-gray-400 mb-2">Historial de Reportes Z</h5>
               <div className="table-responsive h-40">
                 <table className="data-table">
                   <thead>
                     <tr><th>N° Reporte</th><th>Fecha</th><th>Venta Neta</th><th>Acumulado</th><th>Acción</th></tr>
                   </thead>
                   <tbody>
                     {reportsZ.map(z => (
                       <tr key={z.id}>
                         <td>Z-{z.numero.toString().padStart(6, '0')}</td>
                         <td>{z.fecha}</td>
                         <td className="text-right font-bold">${z.ventaNeta.toFixed(2)}</td>
                         <td className="text-right">${z.grandTotalAcumulado.toFixed(2)}</td>
                         <td className="text-center"><button className="btn p-1 text-[10px]" onClick={() => { setSelectedReport('reporteZ'); setFilterDate(z.fecha); }}>👁️</button></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <h3 style={{ color: '#000080' }}>Seleccione un reporte para generar</h3>
            <p style={{ color: '#666', marginTop: '8px' }}>Haga clic en una de las tarjetas superiores para generar el reporte correspondiente.</p>
          </div>
        );
    }
  };

  return (
    <div id="module-reportes" className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }} className="no-print">📈 Centro de Reportes y Auditoría</h2>
      <div className="dashboard-grid no-print">
        <div className={`dash-card cursor-pointer transition-all ${selectedReport === 'ventas' ? 'bg-blue-100 border-blue-800' : ''}`} onClick={() => setSelectedReport('ventas')}>
          <div className="dash-value" style={{ fontSize: '20px' }}>🧾</div>
          <div className="dash-label">Reporte de Ventas</div>
        </div>
        <div className={`dash-card cursor-pointer transition-all ${selectedReport === 'inventario' ? 'bg-blue-100 border-blue-800' : ''}`} onClick={() => setSelectedReport('inventario')}>
          <div className="dash-value" style={{ fontSize: '20px' }}>📦</div>
          <div className="dash-label">Reporte de Inventario</div>
        </div>
        <div className={`dash-card cursor-pointer transition-all ${selectedReport === 'clientes' ? 'bg-blue-100 border-blue-800' : ''}`} onClick={() => setSelectedReport('clientes')}>
          <div className="dash-value" style={{ fontSize: '20px' }}>👥</div>
          <div className="dash-label">Reporte de Clientes</div>
        </div>
        <div className={`dash-card cursor-pointer transition-all ${selectedReport === 'cierre' ? 'bg-blue-100 border-blue-800' : ''}`} onClick={() => setSelectedReport('cierre')}>
          <div className="dash-value" style={{ fontSize: '20px' }}>💰</div>
          <div className="dash-label">Cierre de Caja (X/Z)</div>
        </div>
      </div>
      <div className="chart-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderReportContent()}
      </div>
    </div>
  );
}

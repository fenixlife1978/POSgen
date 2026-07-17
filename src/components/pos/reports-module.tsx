
'use client';

import React, { useState } from 'react';
import { Sale, Product, Client, ReportZRecord } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { TrendingUp, DollarSign, ArrowRightLeft, History, FileText } from 'lucide-react';

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

export function ReportsModule({ active, sales, products, clients, config, setConfig, reportsZ }: ReportsModuleProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  if (!active) return null;

  const calculateDailyStats = async (date: string) => {
    const daySales = sales.filter(s => s.fecha && s.fecha.startsWith(date));
    const completions = daySales.filter(s => s.estado === 'Completada');
    
    const ventaBruta = completions.reduce((acc, s) => acc + (s.subtotal || 0), 0);
    const ivaTotal = completions.reduce((acc, s) => acc + (s.iva || 0), 0);
    const ventaNeta = ventaBruta + ivaTotal;

    // Obtener gastos y traslados de Firestore para el cierre
    const cashQuery = query(collection(db, 'accounting/audit/cash_movements'), where('fecha', '>=', date), where('fecha', '<=', date + 'T23:59:59'));
    const cashSnapshot = await getDocs(cashQuery);
    const cashLogs = cashSnapshot.docs.map(d => d.data());
    
    const gastos = cashLogs.filter(l => l.concepto.includes('GASTO')).reduce((s, l) => s + l.montoUsd, 0);
    const traslados = cashLogs.filter(l => l.concepto.includes('TRASLADO')).reduce((s, l) => s + l.montoUsd, 0);

    const facturas = completions.sort((a,b) => a.numero.localeCompare(b.numero));

    return {
      ventaBruta, ivaTotal, ventaNeta, gastos, traslados,
      count: completions.length,
      facturaInicio: facturas[0]?.numero || '--',
      facturaFin: facturas[facturas.length-1]?.numero || '--'
    };
  };

  const handleProcessZ = async () => {
    const stats = await calculateDailyStats(filterDate);
    if (stats.count === 0 && stats.gastos === 0) return alert("No hay operaciones para cerrar hoy.");

    if (confirm(`¿Emitir REPORTE Z N° ${config.reportZCounter}?\nEste cierre consolidará Ventas, Gastos y Traslados.`)) {
      const zId = uuidv4();
      const newZ: ReportZRecord = {
        id: zId,
        numero: config.reportZCounter,
        fecha: filterDate,
        vendedor: config.vendedor,
        facturaInicio: stats.facturaInicio,
        facturaFin: stats.facturaFin,
        ventaBruta: stats.ventaBruta,
        ventaNeta: stats.ventaNeta,
        ivaTotal: stats.ivaTotal,
        igtfTotal: stats.ventaNeta * 0.03,
        exentoTotal: 0,
        anulaciones: sales.filter(s => s.estado === 'Anulada' && s.fecha.startsWith(filterDate)).length,
        gastosTotal: stats.gastos,
        trasladosTotal: stats.traslados,
        grandTotalAcumulado: config.grandTotalHistory + stats.ventaNeta,
        desglosePagos: []
      };

      try {
        await setDoc(doc(db, 'accounting/audit/reportsZ', zId), newZ);
        await setDoc(doc(db, 'system', 'config'), {
          ...config,
          reportZCounter: config.reportZCounter + 1,
          grandTotalHistory: config.grandTotalHistory + stats.ventaNeta,
          lastZDate: filterDate
        });
        alert("Cierre Z procesado exitosamente.");
      } catch (error) {
        alert("Error al guardar el reporte Z.");
      }
    }
  };

  return (
    <div className="module-panel active">
      <h2 style={{ color: '#000080' }}>📈 Centro de Auditoría & Contabilidad</h2>
      
      <div className="toolbar mt-4">
        <button className={`btn ${selectedReport === 'ventas' ? 'btn-primary' : ''}`} onClick={() => setSelectedReport('ventas')}>📋 Libro Ventas</button>
        <button className={`btn ${selectedReport === 'gastos' ? 'btn-primary' : ''}`} onClick={() => setSelectedReport('gastos')}>💸 Gastos/Traslados</button>
        <button className={`btn ${selectedReport === 'cierre' ? 'btn-primary' : ''}`} onClick={() => setSelectedReport('cierre')}>💰 Cierre Z (Fiscal)</button>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="win-input ml-auto" />
      </div>

      <div className="chart-container mt-4" style={{ flex: 1, overflowY: 'auto' }}>
        {selectedReport === 'cierre' && (
          <div className="p-4 space-y-6">
            <div className="win-window p-8 text-center bg-gray-200 border-2 border-blue-800">
               <h3 className="text-2xl font-black text-blue-900 mb-4 uppercase">Corte de Caja Diario (Z)</h3>
               <p className="text-sm font-bold text-gray-600 mb-6">Emisión de reporte fiscal consolidado para: {filterDate}</p>
               <button className="btn btn-success p-10 text-xl font-black shadow-lg" onClick={handleProcessZ}>🚀 EMITIR REPORTE Z N° {config.reportZCounter}</button>
            </div>

            <div className="table-responsive w-full mt-8">
               <h4 className="font-bold uppercase text-[10px] p-2 bg-blue-900 text-white">Historial de Reportes Z Emitidos</h4>
               <table className="data-table">
                 <thead>
                   <tr>
                     <th>N° Z</th>
                     <th>Fecha</th>
                     <th style={{ textAlign: 'right' }}>Venta Neta</th>
                     <th style={{ textAlign: 'right' }}>Gastos</th>
                     <th style={{ textAlign: 'right' }}>Traslados</th>
                     <th style={{ textAlign: 'right' }}>Acumulado</th>
                     <th style={{ textAlign: 'center' }}>Vendedor</th>
                   </tr>
                 </thead>
                 <tbody>
                   {reportsZ.sort((a,b) => b.numero - a.numero).map(z => (
                     <tr key={z.id}>
                       <td className="font-bold">Z-{z.numero.toString().padStart(4, '0')}</td>
                       <td>{z.fecha}</td>
                       <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${z.ventaNeta.toFixed(2)}</td>
                       <td style={{ textAlign: 'right', color: 'red' }}>${z.gastosTotal?.toFixed(2) || '0.00'}</td>
                       <td style={{ textAlign: 'right', color: 'blue' }}>${z.trasladosTotal?.toFixed(2) || '0.00'}</td>
                       <td style={{ textAlign: 'right' }}>${z.grandTotalAcumulado.toFixed(2)}</td>
                       <td style={{ textAlign: 'center' }}>{z.vendedor}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {selectedReport === 'ventas' && (
           <div className="p-4">
              <div className="dashboard-grid mb-6">
                 <div className="dash-card"><div className="dash-value">${sales.filter(s => s.fecha.startsWith(filterDate) && s.estado === 'Completada').reduce((acc, s) => acc + s.totalUsd, 0).toFixed(2)}</div><div className="dash-label">Venta Total (USD)</div></div>
                 <div className="dash-card"><div className="dash-value">{sales.filter(s => s.fecha.startsWith(filterDate) && s.estado === 'Completada').length}</div><div className="dash-label">Documentos</div></div>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>N° Factura</th><th>Hora</th><th>Cliente</th><th style={{ textAlign: 'right' }}>Base USD</th><th style={{ textAlign: 'right' }}>IVA</th><th style={{ textAlign: 'right' }}>Total USD</th></tr>
                  </thead>
                  <tbody>
                    {sales.filter(s => s.fecha.startsWith(filterDate) && s.estado === 'Completada').map(s => (
                      <tr key={s.numero}><td>{s.numero}</td><td>{new Date(s.fecha).toLocaleTimeString()}</td><td>{s.cliente}</td><td style={{ textAlign: 'right' }}>${s.subtotal.toFixed(2)}</td><td style={{ textAlign: 'right' }}>${s.iva.toFixed(2)}</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>${s.totalUsd.toFixed(2)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}

        {selectedReport === 'gastos' && (
          <div className="p-4 flex flex-col gap-6">
            <div className="toolbar bg-gray-100">
               <button className="btn btn-primary" onClick={() => window.dispatchEvent(new CustomEvent('openModal', { detail: 'modalGasto' }))}><DollarSign size={14}/> Nuevo Gasto</button>
               <button className="btn btn-primary" onClick={() => window.dispatchEvent(new CustomEvent('openModal', { detail: 'modalTraslado' }))}><ArrowRightLeft size={14}/> Traslado Banco</button>
            </div>
            <div className="win-window p-4 bg-white border border-gray-400">
              <h4 className="font-bold mb-4 uppercase text-blue-900">Movimientos de Egreso (Caja)</h4>
              <p className="text-xs text-gray-500 italic mb-4">Módulo de tesorería para control de gastos operativos y retiros bancarios.</p>
            </div>
          </div>
        )}

        {!selectedReport && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
             <TrendingUp size={64} className="mb-4 opacity-20"/>
             <p className="text-lg font-bold">Seleccione un área contable para auditar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

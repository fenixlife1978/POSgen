
'use client';

import React, { useState } from 'react';
import { Sale, Product, Client, ReportZRecord } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';

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

  const calculateDailyStats = (date: string) => {
    const daySales = sales.filter(s => s.fecha && s.fecha.startsWith(date));
    const completions = daySales.filter(s => s.estado === 'Completada');
    
    const ventaBruta = completions.reduce((acc, s) => acc + (s.subtotal || 0), 0);
    const ivaTotal = completions.reduce((acc, s) => acc + (s.iva || 0), 0);
    const ventaNeta = ventaBruta + ivaTotal;

    const methodTotals: Record<string, { usd: number, bs: number }> = {};
    completions.forEach(s => {
      s.detallesPago?.forEach(dp => {
        if (!methodTotals[dp.method]) methodTotals[dp.method] = { usd: 0, bs: 0 };
        methodTotals[dp.method].usd += dp.usd;
        methodTotals[dp.method].bs += dp.bs;
      });
    });

    const facturas = completions.sort((a,b) => a.numero.localeCompare(b.numero));

    return {
      ventaBruta, ivaTotal, ventaNeta, methodTotals, 
      count: completions.length,
      facturaInicio: facturas[0]?.numero || '--',
      facturaFin: facturas[facturas.length-1]?.numero || '--'
    };
  };

  const handleProcessZ = async () => {
    const stats = calculateDailyStats(filterDate);
    if (stats.count === 0) return alert("No hay ventas para cerrar hoy.");

    if (confirm(`¿Emitir REPORTE Z N° ${config.reportZCounter}?`)) {
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
        grandTotalAcumulado: config.grandTotalHistory + stats.ventaNeta,
        desglosePagos: Object.entries(stats.methodTotals).map(([method, val]) => ({ method, ...val }))
      };

      // Guardar en sub-colección de auditoría
      await setDoc(doc(db, 'accounting/audit/reportsZ', zId), newZ);
      
      // Actualizar config global consolidada
      await setDoc(doc(db, 'system', 'config'), {
        ...config,
        reportZCounter: config.reportZCounter + 1,
        grandTotalHistory: config.grandTotalHistory + stats.ventaNeta,
        lastZDate: filterDate
      });

      alert("Cierre Z procesado exitosamente.");
    }
  };

  return (
    <div className="module-panel active">
      <h2 style={{ color: '#000080' }}>📈 Centro de Auditoría Nube</h2>
      <div className="dashboard-grid mt-4">
        <div className="dash-card cursor-pointer" onClick={() => setSelectedReport('ventas')}>
          <div className="dash-value">🧾</div><div className="dash-label">Ventas</div>
        </div>
        <div className="dash-card cursor-pointer" onClick={() => setSelectedReport('cierre')}>
          <div className="dash-value">💰</div><div className="dash-label">Cierre Z</div>
        </div>
      </div>
      
      <div className="chart-container mt-4">
        {selectedReport === 'cierre' && (
          <div className="flex flex-col items-center py-10">
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="win-input mb-4" />
            <button className="btn btn-success p-8 text-lg font-black" onClick={handleProcessZ}>EMITIR REPORTE Z</button>
            <div className="table-responsive w-full mt-8">
               <h4 className="font-bold uppercase text-[10px] mb-2 border-b">Historial de Reportes Z</h4>
               <table className="data-table">
                 <thead><tr><th>N° Z</th><th>Fecha</th><th>Venta Neta</th><th>Acumulado</th></tr></thead>
                 <tbody>
                   {reportsZ.map(z => (
                     <tr key={z.id}><td>Z-{z.numero}</td><td>{z.fecha}</td><td>${z.ventaNeta.toFixed(2)}</td><td>${z.grandTotalAcumulado.toFixed(2)}</td></tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

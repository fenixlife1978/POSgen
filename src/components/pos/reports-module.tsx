
'use client';

import React, { useState } from 'react';
import { Sale, Product, Client, ReportZRecord, CashMovement } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { TrendingUp, DollarSign, ArrowRightLeft, History, FileText, Activity } from 'lucide-react';

interface ReportsModuleProps {
  active: boolean;
  sales: Sale[];
  products: Product[];
  clients: Client[];
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
  reportsZ: ReportZRecord[];
  setReportsZ: React.Dispatch<React.SetStateAction<ReportZRecord[]>>;
  onOpenModal: (id: string, dataId?: any) => void;
}

export function ReportsModule({ active, sales, products, clients, config, setConfig, reportsZ, onOpenModal }: ReportsModuleProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTerminal, setSelectedTerminal] = useState<string>(config.terminalId || 'all');

  if (!active) return null;

  const calculateDailyStats = async (date: string, termId: string) => {
    let daySales = sales.filter(s => s.fecha && s.fecha.startsWith(date));
    if (termId !== 'all') {
      daySales = daySales.filter(s => s.terminalId === termId);
    }
    
    const completions = daySales.filter(s => s.estado === 'Completada');
    
    const ventaBruta = completions.reduce((acc, s) => acc + (s.subtotal || 0), 0);
    const ivaTotal = completions.reduce((acc, s) => acc + (s.iva || 0), 0);
    const ventaNeta = ventaBruta + ivaTotal;

    const cashQuery = termId === 'all' 
      ? query(collection(db, 'accounting/audit/cash_movements'), where('fecha', '>=', date), where('fecha', '<=', date + 'T23:59:59'))
      : query(collection(db, 'accounting/audit/cash_movements'), where('fecha', '>=', date), where('fecha', '<=', date + 'T23:59:59'), where('terminalId', '==', termId));
    
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

  const handleProcessX = async () => {
    if (selectedTerminal === 'all') return alert("Seleccione una terminal específica para el corte X.");
    
    const date = filterDate;
    const termId = selectedTerminal;

    // Filter sales for this terminal and date
    const terminalSales = sales.filter(s => s.fecha.startsWith(date) && s.terminalId === termId);
    const completions = terminalSales.filter(s => s.estado === 'Completada');

    // Filter cash movements
    const cashQuery = query(
      collection(db, 'accounting/audit/cash_movements'), 
      where('terminalId', '==', termId),
      where('fecha', '>=', date), 
      where('fecha', '<=', date + 'T23:59:59')
    );
    const cashSnapshot = await getDocs(cashQuery);
    const cashLogs = cashSnapshot.docs.map(d => d.data() as CashMovement);

    // Calculations
    const fondoInicial = cashLogs.find(l => l.referencia === 'APERTURA')?.montoUsd || 0;
    const ventasBrutas = completions.reduce((acc, s) => acc + s.totalUsd, 0);
    const impuestos = completions.reduce((acc, s) => acc + s.iva, 0);

    const breakdown = {
      efectivo: 0,
      tarjetas: 0,
      transferencias: 0,
      creditos: completions.filter(s => s.credito).reduce((acc, s) => acc + (s.totalUsd - (s.recibidoUsd || 0)), 0)
    };

    completions.forEach(s => {
      if (s.detallesPago && s.detallesPago.length > 0) {
        s.detallesPago.forEach(p => {
          const method = p.method.toLowerCase();
          if (method.includes('efectivo')) breakdown.efectivo += p.usd;
          else if (method.includes('tarjeta') || method.includes('debito')) breakdown.tarjetas += p.usd;
          else breakdown.transferencias += p.usd;
        });
      } else {
        // Fallback
        if (s.pago.toLowerCase().includes('efectivo')) breakdown.efectivo += s.recibidoUsd;
        else if (s.pago.toLowerCase().includes('tarjeta')) breakdown.tarjetas += s.recibidoUsd;
        else breakdown.transferencias += s.recibidoUsd;
      }
    });

    const entradas = cashLogs.filter(l => l.tipo === 'INGRESO' && l.referencia !== 'APERTURA' && !l.concepto.includes('VENTA')).reduce((acc, l) => acc + l.montoUsd, 0);
    const salidas = cashLogs.filter(l => l.tipo === 'EGRESO' && !l.concepto.includes('REEMBOLSO') && !l.concepto.includes('DEVOLUCION')).reduce((acc, l) => acc + l.montoUsd, 0);
    const devoluciones = cashLogs.filter(l => l.concepto.includes('REEMBOLSO') || l.concepto.includes('DEVOLUCION')).reduce((acc, l) => acc + l.montoUsd, 0);

    const efectivoTeorico = fondoInicial + breakdown.efectivo + entradas - salidas - devoluciones;

    const statsX = {
      businessName: config.nombreEmpresa,
      terminalId: termId,
      date,
      time: new Date().toLocaleTimeString(),
      cashier: config.vendedor,
      fondoInicial,
      ventasBrutas,
      breakdown,
      impuestos,
      entradas,
      salidas,
      devoluciones,
      efectivoTeorico
    };

    onOpenModal('modalCorteX', statsX);
  };

  const handleProcessZ = async () => {
    if (selectedTerminal === 'all') return alert("Seleccione una terminal específica para emitir el reporte Z.");
    
    const stats = await calculateDailyStats(filterDate, selectedTerminal);
    if (stats.count === 0 && stats.gastos === 0) return alert("No hay operaciones para cerrar hoy en esta terminal.");

    if (confirm(`¿Emitir REPORTE Z N° ${config.reportZCounter} para Terminal ${selectedTerminal}?\nEste cierre consolidará Ventas, Gastos y Traslados de esta caja.`)) {
      const zId = uuidv4();
      const newZ: ReportZRecord = {
        id: zId,
        numero: config.reportZCounter,
        fecha: filterDate,
        vendedor: config.vendedor,
        terminalId: selectedTerminal,
        facturaInicio: stats.facturaInicio,
        facturaFin: stats.facturaFin,
        ventaBruta: stats.ventaBruta,
        ventaNeta: stats.ventaNeta,
        ivaTotal: stats.ivaTotal,
        igtfTotal: stats.ventaNeta * 0.03,
        exentoTotal: 0,
        anulaciones: sales.filter(s => s.estado === 'Anulada' && s.fecha.startsWith(filterDate) && s.terminalId === selectedTerminal).length,
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
        alert(`Cierre Z procesado para terminal ${selectedTerminal}.`);
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
        <button className={`btn ${selectedReport === 'cierre' ? 'btn-primary' : ''}`} onClick={() => setSelectedReport('cierre')}>💰 Cierre de Caja</button>
        
        <div className="flex gap-2 items-center ml-auto">
           <label className="text-[10px] font-bold">TERMINAL:</label>
           <select className="win-input text-[10px]" value={selectedTerminal} onChange={e => setSelectedTerminal(e.target.value)}>
              <option value="all">TODAS LAS CAJAS</option>
              <option value="CAJA-01">CAJA 01 (PRINCIPAL)</option>
              <option value="CAJA-02">CAJA 02</option>
           </select>
           <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="win-input" />
        </div>
      </div>

      <div className="chart-container mt-4" style={{ flex: 1, overflowY: 'auto' }}>
        {selectedReport === 'cierre' && (
          <div className="p-4 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="win-window p-8 text-center bg-gray-200 border-2 border-primary">
                 <h3 className="text-xl font-black text-primary mb-4 uppercase">Corte de Caja Parcial (X)</h3>
                 <p className="text-xs font-bold text-gray-600 mb-6 italic">Consulta informativa de la jornada actual sin cierre fiscal.</p>
                 <button className="btn btn-primary p-6 text-lg font-black shadow-lg flex items-center gap-3 mx-auto" disabled={selectedTerminal === 'all'} onClick={handleProcessX}>
                    <Activity size={24}/> EMITIR CORTE X
                 </button>
              </div>

              <div className="win-window p-8 text-center bg-gray-200 border-2 border-blue-800">
                 <h3 className="text-xl font-black text-blue-900 mb-4 uppercase">Corte de Caja Diario (Z)</h3>
                 <p className="text-xs font-bold text-gray-600 mb-6 italic">Emisión de reporte fiscal consolidado y cierre de terminal.</p>
                 <button className="btn btn-success p-6 text-lg font-black shadow-lg flex items-center gap-3 mx-auto" disabled={selectedTerminal === 'all'} onClick={handleProcessZ}>
                    <FileText size={24}/> EMITIR REPORTE Z
                 </button>
              </div>
            </div>

            <div className="table-responsive w-full mt-8">
               <h4 className="font-bold uppercase text-[10px] p-2 bg-blue-900 text-white">Historial de Reportes Z Emitidos</h4>
               <table className="data-table">
                 <thead>
                   <tr>
                     <th>N° Z</th>
                     <th>Terminal</th>
                     <th>Fecha</th>
                     <th style={{ textAlign: 'right' }}>Venta Neta</th>
                     <th style={{ textAlign: 'right' }}>Gastos</th>
                     <th style={{ textAlign: 'right' }}>Acumulado</th>
                     <th style={{ textAlign: 'center' }}>Vendedor</th>
                   </tr>
                 </thead>
                 <tbody>
                   {reportsZ.filter(z => selectedTerminal === 'all' || z.terminalId === selectedTerminal).sort((a,b) => b.numero - a.numero).map(z => (
                     <tr key={z.id}>
                       <td className="font-bold">Z-{z.numero.toString().padStart(4, '0')}</td>
                       <td className="font-bold text-blue-700">{z.terminalId || 'CAJA-01'}</td>
                       <td>{z.fecha}</td>
                       <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${z.ventaNeta.toFixed(2)}</td>
                       <td style={{ textAlign: 'right', color: 'red' }}>${z.gastosTotal?.toFixed(2) || '0.00'}</td>
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
                 <div className="dash-card"><div className="dash-value">${sales.filter(s => s.fecha.startsWith(filterDate) && s.estado === 'Completada' && (selectedTerminal === 'all' || s.terminalId === selectedTerminal)).reduce((acc, s) => acc + s.totalUsd, 0).toFixed(2)}</div><div className="dash-label">Venta Total (USD)</div></div>
                 <div className="dash-card"><div className="dash-value">{sales.filter(s => s.fecha.startsWith(filterDate) && s.estado === 'Completada' && (selectedTerminal === 'all' || s.terminalId === selectedTerminal)).length}</div><div className="dash-label">Documentos</div></div>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>N° Factura</th><th>Caja</th><th>Cliente</th><th style={{ textAlign: 'right' }}>Base USD</th><th style={{ textAlign: 'right' }}>IVA</th><th style={{ textAlign: 'right' }}>Total USD</th></tr>
                  </thead>
                  <tbody>
                    {sales.filter(s => s.fecha.startsWith(filterDate) && s.estado === 'Completada' && (selectedTerminal === 'all' || s.terminalId === selectedTerminal)).map(s => (
                      <tr key={s.numero}><td>{s.numero}</td><td>{s.terminalId || 'CAJA-01'}</td><td>{s.cliente}</td><td style={{ textAlign: 'right' }}>${s.subtotal.toFixed(2)}</td><td style={{ textAlign: 'right' }}>${s.iva.toFixed(2)}</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>${s.totalUsd.toFixed(2)}</td></tr>
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
              <h4 className="font-bold mb-4 uppercase text-blue-900">Movimientos de Egreso (Caja) - {selectedTerminal === 'all' ? 'Global' : selectedTerminal}</h4>
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

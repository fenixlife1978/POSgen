
'use client';

import React, { useState } from 'react';
import { Sale, Product, Client } from '@/types/pos';

interface ReportsModuleProps {
  active: boolean;
  sales: Sale[];
  products: Product[];
  clients: Client[];
  config: any;
}

type ReportType = 'ventas' | 'inventario' | 'clientes' | 'vendedor' | 'categoria' | 'cierre' | null;

export function ReportsModule({ active, sales, products, clients, config }: ReportsModuleProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  if (!active) return null;

  const renderReportContent = () => {
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

      case 'vendedor':
        const sellerStats: Record<string, number> = {};
        sales.filter(s => s.estado === 'Completada').forEach(s => {
          if (s.vendedor) {
            sellerStats[s.vendedor] = (sellerStats[s.vendedor] || 0) + (s.totalUsd || 0);
          }
        });
        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>Nombre del Vendedor</th><th style={{ textAlign: 'right' }}>Total Vendido (USD)</th></tr>
                </thead>
                <tbody>
                  {Object.entries(sellerStats).map(([name, total]) => (
                    <tr key={name}><td>{name}</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>${total.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'categoria':
        const catStats: Record<string, number> = {};
        sales.filter(s => s.estado === 'Completada').forEach(s => {
          if (s.items) {
            s.items.forEach(item => {
              const cat = item.categoria || 'Sin Categoría';
              catStats[cat] = (catStats[cat] || 0) + (item.precioUsd * item.cantidad);
            });
          }
        });
        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>Categoría</th><th style={{ textAlign: 'right' }}>Monto Vendido (USD)</th></tr>
                </thead>
                <tbody>
                  {Object.entries(catStats).map(([cat, total]) => (
                    <tr key={cat}><td>{cat}</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>${total.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'cierre':
        const todaySales = sales.filter(s => s.fecha && s.fecha.startsWith(filterDate) && s.estado === 'Completada');
        const paymentMethods = ["Efectivo Bs.", "Efectivo USD", "Tarjeta/Punto", "Biopago", "Pagomovil", "Zelle", "Transferencia"];
        const methodTotals: Record<string, { usd: number, bs: number }> = {};
        
        todaySales.forEach(s => {
            if (s.detallesPago && s.detallesPago.length > 0) {
              s.detallesPago.forEach(dp => {
                if (!methodTotals[dp.method]) methodTotals[dp.method] = { usd: 0, bs: 0 };
                methodTotals[dp.method].usd += (dp.usd || 0);
                methodTotals[dp.method].bs += (dp.bs || 0);
              });
            } else if (s.pago) {
              paymentMethods.forEach(m => {
                if (s.pago.includes(m)) {
                  if (!methodTotals[m]) methodTotals[m] = { usd: 0, bs: 0 };
                  methodTotals[m].usd += (s.totalUsd || 0);
                }
              });
            }
        });

        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="toolbar">
              <label>Fecha Cierre:</label>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="win-input" />
              <button style={{ marginLeft: 'auto' }} onClick={() => window.print()}>🖨️ Imprimir Cierre Z</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="settings-section">
                    <h3>Resumen Detallado por Moneda y Método</h3>
                    <div className="table-responsive h-64">
                      <table className="data-table">
                          <thead>
                            <tr>
                              <th>Método de Pago</th>
                              <th style={{textAlign:'right'}}>Total USD</th>
                              <th style={{textAlign:'right'}}>Total Bs.</th>
                            </tr>
                          </thead>
                          <tbody>
                              {paymentMethods.map(m => (
                                  <tr key={m}>
                                      <td className="font-bold">{m}</td>
                                      <td style={{textAlign:'right', color: '#000080'}}>${(methodTotals[m]?.usd || 0).toFixed(2)}</td>
                                      <td style={{textAlign:'right', color: '#c04040'}}>Bs. {(methodTotals[m]?.bs || 0).toFixed(2)}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                    </div>
                </div>
                <div className="settings-section flex flex-col justify-center items-center bg-gray-200">
                    <div className="dash-label">TOTAL GENERAL DEL CIERRE</div>
                    <div className="text-4xl font-black text-blue-900">
                        ${todaySales.reduce((acc, s) => acc + (s.totalUsd || 0), 0).toFixed(2)}
                    </div>
                    <div className="text-xl font-bold text-gray-600 mt-2">
                        Bs. {(todaySales.reduce((acc, s) => acc + (s.totalUsd || 0), 0) * config.tasa).toFixed(2)}
                    </div>
                    <div className="mt-4 text-[10px] font-bold uppercase text-gray-500">
                        Documentos Procesados: {todaySales.length}
                    </div>
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
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>📈 Centro de Reportes y Auditoría</h2>
      <div className="dashboard-grid">
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
        <div className={`dash-card cursor-pointer transition-all ${selectedReport === 'vendedor' ? 'bg-blue-100 border-blue-800' : ''}`} onClick={() => setSelectedReport('vendedor')}>
          <div className="dash-value" style={{ fontSize: '20px' }}>👤</div>
          <div className="dash-label">Reporte por Vendedor</div>
        </div>
        <div className={`dash-card cursor-pointer transition-all ${selectedReport === 'categoria' ? 'bg-blue-100 border-blue-800' : ''}`} onClick={() => setSelectedReport('categoria')}>
          <div className="dash-value" style={{ fontSize: '20px' }}>🏷️</div>
          <div className="dash-label">Reporte por Categoría</div>
        </div>
        <div className={`dash-card cursor-pointer transition-all ${selectedReport === 'cierre' ? 'bg-blue-100 border-blue-800' : ''}`} onClick={() => setSelectedReport('cierre')}>
          <div className="dash-value" style={{ fontSize: '20px' }}>💰</div>
          <div className="dash-label">Cierre de Caja</div>
        </div>
      </div>
      <div className="chart-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderReportContent()}
      </div>
    </div>
  );
}

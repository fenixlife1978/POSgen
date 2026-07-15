
'use client';

import React from 'react';
import { Sale, Product } from '@/types/pos';

interface DashboardModuleProps {
  active: boolean;
  sales: Sale[];
  products: Product[];
  config: any;
}

export function DashboardModule({ active, sales, products, config }: DashboardModuleProps) {
  if (!active) return null;

  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.fecha).toDateString() === today && s.estado === 'Completada');
  const totalHoy = todaySales.reduce((sum, s) => sum + s.totalUsd, 0);
  const itemsHoy = todaySales.reduce((sum, s) => sum + s.items.reduce((is, item) => is + item.cantidad, 0), 0);
  const uniqueClients = new Set(todaySales.map(s => s.cliente)).size;
  const stockBajo = products.filter(p => p.stock <= p.stockMin && p.stock > 0).length;

  return (
    <div id="module-dashboard" className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}> Dashboard - Resumen General</h2>
      <div className="dashboard-grid">
        <div className="dash-card"><div className="dash-value">{todaySales.length}</div><div className="dash-label">Ventas Hoy</div></div>
        <div className="dash-card"><div className="dash-value">${totalHoy.toFixed(2)}</div><div className="dash-label">Monto Hoy (USD)</div></div>
        <div className="dash-card"><div className="dash-value">{itemsHoy}</div><div className="dash-label">Items Vendidos</div></div>
        <div className="dash-card"><div className="dash-value">{uniqueClients}</div><div className="dash-label">Clientes Atendidos</div></div>
        <div className="dash-card"><div className="dash-value">{stockBajo}</div><div className="dash-label">Stock Bajo</div></div>
        <div className="dash-card"><div className="dash-value">{config.tasa.toFixed(2)}</div><div className="dash-label">Tasa USD/BS</div></div>
      </div>

      <div className="chart-container">
        <h3 style={{ color: '#000080', marginBottom: '12px' }}>Resumen Semanal</h3>
        <div className="bar-chart">
           {/* Weekly bars placeholder based on original script logic */}
           {[6,5,4,3,2,1,0].map(i => {
             const d = new Date(); d.setDate(d.getDate() - i);
             const dayVal = sales.filter(s => new Date(s.fecha).toDateString() === d.toDateString()).reduce((acc, s) => acc + s.totalUsd, 0);
             return (
               <div key={i} className="bar" style={{ height: `${Math.min(100, (dayVal/500)*100)}%` }}>
                  <span className="bar-value">${dayVal.toFixed(0)}</span>
                  <span className="bar-label">{d.toLocaleDateString('es', {weekday: 'short'})}</span>
               </div>
             )
           })}
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';

interface DashboardModuleProps {
  active: boolean;
}

export function DashboardModule({ active }: DashboardModuleProps) {
  if (!active) return null;

  return (
    <div id="module-dashboard" className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}> Dashboard - Resumen General</h2>
      <div className="dashboard-grid">
        <div className="dash-card">
          <div className="dash-value" id="dashVentasHoy">0</div>
          <div className="dash-label">Ventas Hoy</div>
        </div>
        <div className="dash-card">
          <div className="dash-value" id="dashMontoHoy">$0.00</div>
          <div className="dash-label">Monto Hoy (USD)</div>
        </div>
        <div className="dash-card">
          <div className="dash-value" id="dashItemsHoy">0</div>
          <div className="dash-label">Items Vendidos</div>
        </div>
        <div className="dash-card">
          <div className="dash-value" id="dashClientesHoy">0</div>
          <div className="dash-label">Clientes Atendidos</div>
        </div>
        <div className="dash-card">
          <div className="dash-value" id="dashStockBajo">0</div>
          <div className="dash-label">Stock Bajo</div>
        </div>
        <div className="dash-card">
          <div className="dash-value" id="dashTasaCambio">724.00</div>
          <div className="dash-label">Tasa USD/BS</div>
        </div>
      </div>

      <div className="chart-container">
        <h3 style={{ color: '#000080', marginBottom: '12px' }}>Ventas de la Semana (USD)</h3>
        <div className="bar-chart" id="weeklyChart"></div>
      </div>

      <div className="chart-container">
        <h3 style={{ color: '#000080', marginBottom: '12px' }}>Top Productos Más Vendidos</h3>
        <div className="table-responsive">
          <table className="data-table" id="topProductsTable">
            <thead><tr><th>#</th><th>Producto</th><th>Categoría</th><th>Unid. Vendidas</th><th>Total USD</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

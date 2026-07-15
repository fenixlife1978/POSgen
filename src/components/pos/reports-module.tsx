'use client';

import React from 'react';

interface ReportsModuleProps {
  active: boolean;
}

export function ReportsModule({ active }: ReportsModuleProps) {
  if (!active) return null;

  return (
    <div id="module-reportes" className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>📈 Reportes</h2>
      <div className="dashboard-grid">
        <div className="dash-card" style={{ cursor: 'pointer' }}>
          <div className="dash-value" style={{ fontSize: '20px' }}>🧾</div>
          <div className="dash-label">Reporte de Ventas</div>
        </div>
        <div className="dash-card" style={{ cursor: 'pointer' }}>
          <div className="dash-value" style={{ fontSize: '20px' }}>📦</div>
          <div className="dash-label">Reporte de Inventario</div>
        </div>
        <div className="dash-card" style={{ cursor: 'pointer' }}>
          <div className="dash-value" style={{ fontSize: '20px' }}>👥</div>
          <div className="dash-label">Reporte de Clientes</div>
        </div>
        <div className="dash-card" style={{ cursor: 'pointer' }}>
          <div className="dash-value" style={{ fontSize: '20px' }}>👤</div>
          <div className="dash-label">Reporte por Vendedor</div>
        </div>
        <div className="dash-card" style={{ cursor: 'pointer' }}>
          <div className="dash-value" style={{ fontSize: '20px' }}>🏷️</div>
          <div className="dash-label">Reporte por Categoría</div>
        </div>
        <div className="dash-card" style={{ cursor: 'pointer' }}>
          <div className="dash-value" style={{ fontSize: '20px' }}>💰</div>
          <div className="dash-label">Cierre de Caja</div>
        </div>
      </div>
      <div className="chart-container" id="reportContainer">
        <h3 style={{ color: '#000080' }}>Seleccione un reporte para generar</h3>
        <p style={{ color: '#666', marginTop: '8px' }}>Haga clic en una de las tarjetas superiores para generar el reporte correspondiente.</p>
      </div>
    </div>
  );
}

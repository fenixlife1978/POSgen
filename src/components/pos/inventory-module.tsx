'use client';

import React from 'react';

interface InventoryModuleProps {
  active: boolean;
  onOpenModal: (id: string) => void;
}

export function InventoryModule({ active, onOpenModal }: InventoryModuleProps) {
  if (!active) return null;

  return (
    <div id="module-inventario" className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}> Control de Inventario</h2>
      <div className="toolbar">
        <button onClick={() => onOpenModal('modalEntrada')}>📥 Entrada</button>
        <button onClick={() => onOpenModal('modalSalida')}>📤 Salida</button>
        <button onClick={() => onOpenModal('modalAjuste')}>🔧 Ajuste</button>
        <button>📊 Reporte</button>
      </div>
      <div className="dashboard-grid" style={{ marginBottom: '12px' }}>
        <div className="dash-card">
          <div className="dash-value" id="invTotal">0</div>
          <div className="dash-label">Total Productos</div>
        </div>
        <div className="dash-card">
          <div className="dash-value" id="invValor">$0</div>
          <div className="dash-label">Valor Inventario</div>
        </div>
        <div className="dash-card">
          <div className="dash-value" id="invBajo">0</div>
          <div className="dash-label">Stock Bajo</div>
        </div>
        <div className="dash-card">
          <div className="dash-value" id="invAgotado">0</div>
          <div className="dash-label">Agotados</div>
        </div>
      </div>
      <div className="table-responsive">
        <table className="data-table" id="inventoryTable">
          <thead>
            <tr>
              <th>Código</th><th>Descripción</th><th>Categoría</th><th>Stock Actual</th><th>Stock Mín</th><th>Última Entrada</th><th>Estado</th>
            </tr>
          </thead>
          <tbody id="inventoryTableBody"></tbody>
        </table>
      </div>
    </div>
  );
}

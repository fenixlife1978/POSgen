'use client';

import React from 'react';

interface SalesModuleProps {
  active: boolean;
}

export function SalesModule({ active }: SalesModuleProps) {
  if (!active) return null;

  return (
    <div id="module-ventas" className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>🧾 Historial de Ventas</h2>
      <div className="toolbar">
        <button>🔍 Filtrar</button>
        <button>👁️ Ver Detalle</button>
        <button>🖨️ Imprimir</button>
        <button>❌ Anular</button>
        <input type="date" id="ventaDateFrom" style={{ border: '2px solid', borderColor: '#808080 #fff #fff #808080', padding: '4px' }} />
        <input type="date" id="ventaDateTo" style={{ border: '2px solid', borderColor: '#808080 #fff #fff #808080', padding: '4px' }} />
      </div>
      <div className="table-responsive">
        <table className="data-table" id="salesTable">
          <thead>
            <tr>
              <th>N° Factura</th><th>Fecha</th><th>Cliente</th><th>RIF</th><th>Items</th><th>Total USD</th><th>Total BS</th><th>Pago</th><th>Estado</th><th>Vendedor</th>
            </tr>
          </thead>
          <tbody id="salesTableBody"></tbody>
        </table>
      </div>
    </div>
  );
}

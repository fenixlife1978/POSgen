
'use client';

import React from 'react';
import { Account } from '@/types/pos';

interface AccountsModuleProps {
  active: boolean;
  accounts: Account[];
}

export function AccountsModule({ active, accounts }: AccountsModuleProps) {
  if (!active) return null;

  return (
    <div className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>💰 Cuentas por Cobrar y Pagar</h2>
      <div className="dashboard-grid">
        <div className="dash-card">
          <div className="dash-value" style={{ color: '#40a040' }}>
            ${accounts.filter(a => a.tipo === 'CXC').reduce((s, a) => s + (a.montoTotal - a.montoPagado), 0).toFixed(2)}
          </div>
          <div className="dash-label">Total CXC (Por Cobrar)</div>
        </div>
        <div className="dash-card">
          <div className="dash-value" style={{ color: '#e04040' }}>
            ${accounts.filter(a => a.tipo === 'CXP').reduce((s, a) => s + (a.montoTotal - a.montoPagado), 0).toFixed(2)}
          </div>
          <div className="dash-label">Total CXP (Por Pagar)</div>
        </div>
      </div>
      
      <div className="table-responsive" style={{ marginTop: '12px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Entidad</th>
              <th>Monto Total</th>
              <th>Saldo Pendiente</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc.id}>
                <td>{acc.tipo}</td>
                <td>{acc.entidad}</td>
                <td>${acc.montoTotal.toFixed(2)}</td>
                <td>${(acc.montoTotal - acc.montoPagado).toFixed(2)}</td>
                <td>{acc.estado}</td>
                <td>{acc.fechaEmision}</td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No hay cuentas pendientes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

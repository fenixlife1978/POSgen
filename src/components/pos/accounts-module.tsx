
'use client';

import React, { useState } from 'react';
import { Account, InventoryMovement } from '@/types/pos';

interface AccountsModuleProps {
  active: boolean;
  accounts: Account[];
  movements: InventoryMovement[];
}

export function AccountsModule({ active, accounts, movements }: AccountsModuleProps) {
  const [filterType, setFilterType] = useState<'CXC' | 'CXP'>('CXP');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [entitySearch, setEntitySearch] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  if (!active) return null;

  const filteredAccounts = accounts.filter(acc => {
    const matchesType = acc.tipo === filterType;
    const matchesStatus = statusFilter === 'all' || acc.estado.toUpperCase() === statusFilter.toUpperCase();
    const matchesEntity = acc.entidad.toLowerCase().includes(entitySearch.toLowerCase());
    return matchesType && matchesStatus && matchesEntity;
  });

  // Filtrar movimientos que son de tipo "ABONO" o pagos (Simulado vía movimientos si no hay tabla de pagos)
  const abonos = movements.filter(m => m.tipo === 'ANULACION' || m.referencia.includes('ABONO'));

  return (
    <div className="module-panel active">
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ color: '#000080' }}>💰 {showHistory ? 'Historial de Abonos / Pagos' : 'Consulta de Deudas y Créditos'}</h2>
        <div className="flex gap-2">
          <button className={`btn ${!showHistory ? 'btn-primary' : ''}`} onClick={() => setShowHistory(false)}>📋 Cuentas</button>
          <button className={`btn ${showHistory ? 'btn-primary' : ''}`} onClick={() => setShowHistory(true)}>📜 Historial Abonos</button>
        </div>
      </div>

      {!showHistory ? (
        <>
          <div className="toolbar">
            <div className="flex gap-4 items-center">
              <div className="flex bg-gray-300 p-1 border border-gray-500">
                <button 
                  className={`btn ${filterType === 'CXP' ? 'btn-primary' : ''}`} 
                  onClick={() => setFilterType('CXP')}
                  style={{fontSize: '10px', padding: '2px 8px'}}
                >COMPRAS (CXP)</button>
                <button 
                  className={`btn ${filterType === 'CXC' ? 'btn-primary' : ''}`} 
                  onClick={() => setFilterType('CXC')}
                  style={{fontSize: '10px', padding: '2px 8px'}}
                >VENTAS (CXC)</button>
              </div>

              <select 
                className="win-input" 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">-- Todos los Estados --</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Parcial">Pago Parcial</option>
                <option value="Pagada">Pagada</option>
              </select>

              <input 
                type="text" 
                placeholder="🔍 Filtrar por entidad..." 
                className="win-input" 
                style={{ width: '200px' }}
                value={entitySearch}
                onChange={e => setEntitySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="dash-card">
              <div className="dash-value" style={{ color: filterType === 'CXC' ? '#40a040' : '#e04040' }}>
                ${filteredAccounts.reduce((s, a) => s + (a.montoTotal - a.montoPagado), 0).toFixed(2)}
              </div>
              <div className="dash-label">Saldo Total {filterType}</div>
            </div>
            <div className="dash-card">
              <div className="dash-value">{filteredAccounts.length}</div>
              <div className="dash-label">Documentos</div>
            </div>
          </div>
          
          <div className="table-responsive" style={{ marginTop: '12px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Referencia</th>
                  <th>Entidad / Proveedor</th>
                  <th style={{ textAlign: 'right' }}>Monto Original</th>
                  <th style={{ textAlign: 'right' }}>Pagado</th>
                  <th style={{ textAlign: 'right' }}>Saldo Deudor</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(acc => (
                  <tr key={acc.id}>
                    <td>{acc.fechaEmision}</td>
                    <td>{acc.referencia}</td>
                    <td style={{ fontWeight: 'bold' }}>{acc.entidad}</td>
                    <td style={{ textAlign: 'right' }}>${acc.montoTotal.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#40a040' }}>${acc.montoPagado.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#e04040' }}>
                      ${(acc.montoTotal - acc.montoPagado).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        acc.estado === 'Pagada' ? 'bg-green-200 text-green-800' : 
                        acc.estado === 'Parcial' ? 'bg-orange-200 text-orange-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {acc.estado.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredAccounts.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No hay cuentas que coincidan con los filtros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="animate-in fade-in duration-300">
          <div className="toolbar">
            <input 
              type="text" 
              placeholder="🔍 Buscar en historial por proveedor/cliente..." 
              className="win-input" 
              style={{ width: '300px' }}
              value={entitySearch}
              onChange={e => setEntitySearch(e.target.value)}
            />
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Referencia Documento</th>
                  <th>Entidad</th>
                  <th>Motivo / Concepto</th>
                  <th style={{ textAlign: 'right' }}>Monto Abono</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {abonos.filter(a => a.referencia.toLowerCase().includes(entitySearch.toLowerCase())).map(a => (
                  <tr key={a.id}>
                    <td>{new Date(a.fecha).toLocaleString()}</td>
                    <td style={{ fontWeight: 'bold' }}>{a.referencia}</td>
                    <td>{a.referencia.split('-')[0]}</td>
                    <td>{a.comentario}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#40a040' }}>${Math.abs(a.cantidad).toFixed(2)}</td>
                    <td>{a.usuario}</td>
                  </tr>
                ))}
                {abonos.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No se han registrado abonos recientemente</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

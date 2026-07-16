
'use client';

import React, { useState } from 'react';
import { Provider } from '@/types/pos';

interface ProvidersModuleProps {
  active: boolean;
  onOpenModal: (id: string, dataId?: any) => void;
  providers: Provider[];
}

export function ProvidersModule({ active, onOpenModal, providers }: ProvidersModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!active) return null;

  const filtered = providers.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.rif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>🏢 Gestión de Proveedores</h2>
      <div className="toolbar">
        <button onClick={() => onOpenModal('modalProveedor')}>➕ Nuevo Proveedor</button>
        <div style={{ marginLeft: 'auto' }}>
          <input 
            type="text" 
            placeholder="🔍 Buscar por nombre o RIF..." 
            className="win-input" 
            style={{ width: '250px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>RIF</th>
              <th>Nombre / Razón Social</th>
              <th>Persona de Contacto</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 'bold' }}>{p.rif}</td>
                <td>{p.nombre}</td>
                <td>{p.contacto}</td>
                <td>{p.telefono}</td>
                <td>{p.direccion}</td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={() => onOpenModal('modalProveedor', p.id)}>✏️ Editar</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No se encontraron proveedores</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

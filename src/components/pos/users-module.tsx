'use client';

import React from 'react';
import { User } from '@/types/pos';

interface UsersModuleProps {
  active: boolean;
  users: User[];
  onOpenModal: (id: string) => void;
}

export function UsersModule({ active, users, onOpenModal }: UsersModuleProps) {
  if (!active) return null;

  return (
    <div className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>👤 Gestión de Usuarios y Personal</h2>
      <div className="toolbar" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button className="btn" onClick={() => onOpenModal('modalNuevoUsuario')}>➕ Nuevo Usuario</button>
        <button className="btn">✏️ Editar Permisos</button>
        <button className="btn">️ Cambiar Clave</button>
      </div>
      
      <div className="table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre Completo</th>
              <th>Rol / Nivel</th>
              <th>Estado</th>
              <th>Último Acceso</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.name}</td>
                <td><strong>{u.role}</strong></td>
                <td>{u.active ? '🟢 Activo' : '🔴 Inactivo'}</td>
                <td>--/--/--</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

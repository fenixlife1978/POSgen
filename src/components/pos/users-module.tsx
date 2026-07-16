
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

  // Si no hay usuarios en Firestore, mostramos el Admin de Arranque virtualmente
  const displayUsers = users.length > 0 ? users : [{
    id: 'BOOTSTRAP',
    name: 'Admin de Arranque (Cloud)',
    email: 'Sincronizado vía Auth',
    role: 'Administrador' as const,
    active: true,
    username: 'admin'
  }];

  return (
    <div className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>👤 Gestión de Usuarios</h2>
      <div className="toolbar" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button className="btn" onClick={() => onOpenModal('modalNuevoUsuario')}>➕ Nuevo Usuario</button>
      </div>
      
      {users.length === 0 && (
        <div className="bg-amber-100 border border-amber-300 p-3 mb-4 text-[11px] text-amber-800">
          ⚠️ <strong>MODO BOOTSTRAP:</strong> No hay usuarios registrados en la base de datos de Firestore. 
          Estás viendo el acceso de rescate de Cloud. Crea un nuevo usuario para activar la gestión permanente.
        </div>
      )}

      <div className="table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo / Email</th>
              <th>Rol / Nivel</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {displayUsers.map(u => (
              <tr key={u.id}>
                <td className="font-bold">{u.name}</td>
                <td>{u.email}</td>
                <td><strong>{u.role}</strong></td>
                <td>{u.active ? '🟢 Activo' : '🔴 Inactivo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

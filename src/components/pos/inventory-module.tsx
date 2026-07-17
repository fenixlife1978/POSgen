
'use client';

import React, { useState, useEffect } from 'react';
import { Product, InventoryMovement } from '@/types/pos';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

interface InventoryModuleProps {
  active: boolean;
  onOpenModal: (id: string, dataId?: string | number) => void;
  products: Product[];
  movements: InventoryMovement[];
}

export function InventoryModule({ active, onOpenModal, products, movements }: InventoryModuleProps) {
  const [activeReport, setActiveReport] = useState<'table' | 'kardex' | 'adjustments'>('table');
  const [selectedProductKardex, setSelectedProductKardex] = useState<string | null>(null);
  const [prodLogs, setProdLogs] = useState<InventoryMovement[]>([]);

  // Efecto para cargar logs específicos de un producto desde la colección global plana
  useEffect(() => {
    if (activeReport === 'kardex' && selectedProductKardex) {
      // Usamos una consulta simple sin orderBy para evitar requerir índices compuestos inmediatos.
      // El ordenamiento se hace en memoria (React-side) para asegurar funcionamiento inmediato.
      const unsub = onSnapshot(
        query(
          collection(db, 'inventory_movements'), 
          where('codigoProducto', '==', selectedProductKardex)
        ), 
        (snapshot) => {
          const data = snapshot.docs.map(doc => doc.data() as InventoryMovement);
          // Ordenar por fecha descendente en memoria
          data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          setProdLogs(data);
        }
      );
      return () => unsub();
    }
  }, [activeReport, selectedProductKardex]);

  if (!active) return null;

  const totalValor = products.reduce((s, p) => s + (p.stock * p.costoPromedio), 0);

  const renderKardex = () => {
    const prod = products.find(p => p.codigo === selectedProductKardex);

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="toolbar">
          <button onClick={() => setActiveReport('table')}>⬅️ Volver</button>
          <div style={{ marginLeft: 'auto', fontWeight: 'bold' }}>
            Kardex: {prod?.nombre} ({prod?.codigo}) | Stock: {prod?.stock}
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Ref</th>
                <th style={{ textAlign: 'center' }}>Entrada</th>
                <th style={{ textAlign: 'center' }}>Salida</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th>Costo</th>
              </tr>
            </thead>
            <tbody>
              {prodLogs.map(m => (
                <tr key={m.id}>
                  <td>{new Date(m.fecha).toLocaleString()}</td>
                  <td style={{ fontWeight: 'bold' }}>{m.tipo}</td>
                  <td>{m.referencia}</td>
                  <td style={{ textAlign: 'center', color: 'green' }}>{m.cantidad > 0 ? m.cantidad : '-'}</td>
                  <td style={{ textAlign: 'center', color: 'red' }}>{m.cantidad < 0 ? Math.abs(m.cantidad) : '-'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{m.stockNuevo}</td>
                  <td>${m.costo.toFixed(2)}</td>
                </tr>
              ))}
              {prodLogs.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No hay movimientos registrados para este producto</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>📊 Control de Inventario & Kardex (Nube)</h2>
      {activeReport === 'table' ? (
        <>
          <div className="toolbar">
            <button onClick={() => onOpenModal('modalEntrada')}>📥 Recepción</button>
            <button onClick={() => onOpenModal('modalAjuste')}>🔧 Ajuste</button>
            <div style={{ marginLeft: 'auto' }}>
               <span className="font-bold mr-4">Valor Total: ${totalValor.toFixed(2)}</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th style={{ textAlign: 'right' }}>Costo Prom.</th>
                  <th style={{ textAlign: 'center' }}>Stock</th>
                  <th style={{ textAlign: 'center' }}>Mín</th>
                  <th>Categoría</th>
                  <th style={{ textAlign: 'center' }}>Kardex</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.codigo}>
                    <td>{p.codigo}</td>
                    <td>{p.nombre}</td>
                    <td style={{ textAlign: 'right' }}>${p.costoPromedio.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{p.stock}</td>
                    <td style={{ textAlign: 'center' }}>{p.stockMin}</td>
                    <td>{p.categoria}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn" onClick={() => { setSelectedProductKardex(p.codigo); setActiveReport('kardex'); }}>📖 Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : renderKardex()}
    </div>
  );
}

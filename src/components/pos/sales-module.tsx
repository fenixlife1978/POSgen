
'use client';

import React, { useState } from 'react';
import { Sale, Product, InventoryMovement } from '@/types/pos';
import { v4 as uuidv4 } from 'uuid';

interface SalesModuleProps {
  active: boolean;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  movements: InventoryMovement[];
  setMovements: React.Dispatch<React.SetStateAction<InventoryMovement[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'warning') => void;
  onOpenModal: (id: string, dataId?: any) => void;
  config: any;
}

export function SalesModule({ 
  active, sales, setSales, products, setProducts, 
  movements, setMovements, notify, onOpenModal, config 
}: SalesModuleProps) {
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!active) return null;

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    const saleDate = new Date(s.fecha);
    const matchesFrom = filterFrom ? saleDate >= new Date(filterFrom) : true;
    const matchesTo = filterTo ? saleDate <= new Date(filterTo + 'T23:59:59') : true;
    return matchesSearch && matchesFrom && matchesTo;
  }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const handleAnnul = () => {
    if (selectedIdx === null) {
      notify('Seleccione una venta para anular', 'warning');
      return;
    }
    const sale = filteredSales[selectedIdx];
    if (sale.estado === 'Anulada') {
      notify('Esta venta ya ha sido anulada', 'warning');
      return;
    }

    if (confirm(`¿Está seguro de ANULAR la factura ${sale.numero}? El inventario será devuelto.`)) {
      const updatedProducts = [...products];
      const newMovements: InventoryMovement[] = [];

      sale.items.forEach(item => {
        const product = updatedProducts[item.productIndex];
        if (product) {
          const stockPrev = product.stock;
          product.stock += item.cantidad;
          newMovements.push({
            id: uuidv4(),
            fecha: new Date().toISOString(),
            codigoProducto: product.codigo,
            tipo: 'ANULACION',
            cantidad: item.cantidad,
            stockPrevio: stockPrev,
            stockNuevo: product.stock,
            costo: product.costoPromedio,
            referencia: sale.numero,
            comentario: `Devolución por anulación de factura`,
            usuario: config.vendedor
          });
        }
      });

      setSales(prev => prev.map(s => s.numero === sale.numero ? { ...s, estado: 'Anulada' } : s));
      setProducts(updatedProducts);
      setMovements(prev => [...prev, ...newMovements]);
      notify(`✅ Factura ${sale.numero} ANULADA correctamente`);
    }
  };

  const handleViewDetail = () => {
    if (selectedIdx !== null) {
      onOpenModal('modalDetalleVenta', filteredSales[selectedIdx].numero);
    } else {
      notify('Seleccione una venta para ver detalles', 'warning');
    }
  };

  return (
    <div id="module-ventas" className="module-panel active">
      <h2 style={{ color: '#000080', marginBottom: '12px' }}>🧾 Historial y Gestión de Ventas</h2>
      <div className="toolbar">
        <div className="flex gap-2 items-center">
          <label>Desde:</label>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="win-input" />
          <label>Hasta:</label>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="win-input" />
        </div>
        <div className="flex gap-2 ml-4">
          <button onClick={handleViewDetail}>👁️ Ver Detalle</button>
          <button onClick={() => selectedIdx !== null && window.print()}>🖨️ Imprimir</button>
          <button onClick={handleAnnul} style={{ background: '#f0a0a0' }}>❌ Anular Factura</button>
        </div>
        <input 
          type="text" 
          placeholder="🔍 Buscar por N° o Cliente..." 
          style={{ border: '2px solid', borderColor: '#808080 #fff #fff #808080', padding: '4px 8px', marginLeft: 'auto', width: '250px' }} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Factura</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>RIF/CI</th>
              <th style={{ textAlign: 'center' }}>Items</th>
              <th style={{ textAlign: 'right' }}>Total USD</th>
              <th style={{ textAlign: 'right' }}>Total BS</th>
              <th>Pago</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th>Vendedor</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((s, idx) => (
              <tr 
                key={s.numero} 
                className={selectedIdx === idx ? 'selected' : ''} 
                onClick={() => setSelectedIdx(idx)}
                onDoubleClick={handleViewDetail}
              >
                <td style={{ fontWeight: 'bold' }}>{s.numero}</td>
                <td>{new Date(s.fecha).toLocaleString()}</td>
                <td>{s.cliente}</td>
                <td>{s.rif}</td>
                <td style={{ textAlign: 'center' }}>{s.items.length}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${s.totalUsd.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>{s.totalBs.toFixed(2)}</td>
                <td>{s.pago}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.estado === 'Completada' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {s.estado?.toUpperCase()}
                  </span>
                </td>
                <td>{s.vendedor}</td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No se encontraron registros de ventas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import { Product, Client, CartItem } from '@/types/pos';

interface PosModuleProps {
  active: boolean;
  onOpenModal: (id: string) => void;
  products: Product[];
  clients: Client[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  config: any;
  notify: any;
  selectedRow: number;
  setSelectedRow: (idx: number) => void;
}

export function PosModule({ active, onOpenModal, products, clients, cart, setCart, config, notify, selectedRow, setSelectedRow }: PosModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDropdown, setSearchDropdown] = useState<Product[]>([]);
  const [clientInfo, setClientInfo] = useState({ name: '', rif: '', saldo: 0 });

  if (!active) return null;

  const formatUSD = (n: number) => '$' + n.toFixed(2);
  const formatBS = (n: number) => 'Bs. ' + n.toFixed(2);

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    if (query.length < 1) {
      setSearchDropdown([]);
      return;
    }
    const filtered = products.filter(p => 
      p.activo && (p.codigo.toLowerCase().includes(query.toLowerCase()) || p.descripcion.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 10);
    setSearchDropdown(filtered);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.codigo === product.codigo);
    if (existing) {
      setCart(cart.map(item => item.codigo === product.codigo ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCart([...cart, {
        productIndex: products.indexOf(product),
        codigo: product.codigo,
        descripcion: product.descripcion,
        precioUsd: product.precioUsd,
        iva: product.iva,
        cantidad: 1,
        categoria: product.categoria
      }]);
    }
    setSearchTerm('');
    setSearchDropdown([]);
    notify(`✅ ${product.codigo} agregado`);
  };

  const getTotals = () => {
    let subtotal = 0;
    let totalIva = 0;
    cart.forEach(item => {
      const s = item.precioUsd * item.cantidad;
      subtotal += s;
      totalIva += s * (item.iva / 100);
    });
    const totalUsd = subtotal + totalIva;
    return { subtotal, totalIva, totalUsd, totalBs: totalUsd * config.tasa };
  };

  const totals = getTotals();

  return (
    <div id="module-pos" className="module-panel active" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
      <div className="header-section">
        <div className="header-row">
          <label>Rif:</label>
          <input type="text" id="posRif" value={clientInfo.rif} onChange={(e) => setClientInfo({...clientInfo, rif: e.target.value})} placeholder="V-00000000-0" style={{ width: '160px' }} />
          <label className="checkbox-label"><input type="checkbox" id="posCredito" /> Crédito</label>
          <label>N/Vendedor:</label>
          <span className="vendedor-name" id="posVendedor">{config.vendedor}</span>
          <div className="header-buttons">
            <button onClick={() => onOpenModal('modalRecuperar')}>📄 Recuperar Documento</button>
            <button onClick={() => onOpenModal('modalDescuento')}>🏷️ Aplicar Dscto</button>
          </div>
          <div className="datetime-display" id="datetimeDisplay">15/07/2026 16:39:59</div>
        </div>
        <div className="header-row">
          <label>Cliente:</label>
          <input type="text" id="posCliente" value={clientInfo.name} onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})} placeholder="Nombre del cliente..." style={{ flex: 1, minWidth: '200px' }} />
          <label>Saldo:</label>
          <span className="saldo-val" id="posSaldo">{clientInfo.saldo.toFixed(2)}</span>
        </div>
      </div>

      <div className="search-section" style={{ position: 'relative' }}>
        <label>Busqueda:</label>
        <input 
          type="text" 
          id="posBusqueda" 
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Código, nombre o descripción..." 
        />
        <label className="equiv-label">Equivalente:</label>
        <input type="text" className="equiv-input" id="posEquivalente" value={formatBS(totals.totalBs)} readOnly />
        <button className="copy-btn">📋 Copiar</button>
        
        {searchDropdown.length > 0 && (
          <div className="search-dropdown active">
            {searchDropdown.map(p => (
              <div key={p.codigo} className="search-dropdown-item" onClick={() => addToCart(p)}>
                <strong>{p.codigo}</strong> - {p.descripcion} | <span style={{ color: '#000080' }}>{formatUSD(p.precioUsd)}</span> | Stock: {p.stock}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="main-content">
        <div className="table-container">
          <table className="product-table" id="posTable">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Descripcion</th>
                <th style={{ width: '90px' }}>Oferta USD</th>
                <th style={{ width: '60px' }}>Cant</th>
                <th style={{ width: '110px' }}>Precio</th>
                <th style={{ width: '110px' }}>Total+Iva</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, i) => (
                <tr key={i} className={selectedRow === i ? 'selected' : ''} onClick={() => setSelectedRow(i)}>
                  <td>{i + 1}</td>
                  <td>{item.codigo} - {item.descripcion}</td>
                  <td className="col-oferta">{item.precioUsd.toFixed(2)}</td>
                  <td className="col-cant">{item.cantidad}</td>
                  <td className="col-precio">{(item.precioUsd * item.cantidad).toFixed(2)}</td>
                  <td className="col-total">{(item.precioUsd * item.cantidad * (1 + item.iva / 100)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="right-sidebar">
          <button className="sidebar-btn" onClick={() => onOpenModal('modalRecuperar')}>Recuperar Documento</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalDescuento')}>Aplicar Dscto</button>
          <button className="sidebar-btn" onClick={() => setCart(cart.filter((_, idx) => idx !== selectedRow))}>Delete F4</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalItem')}>Item</button>
          <button className="sidebar-btn">P. Activo</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalLocalizar')}>Localizar</button>
          <button className="sidebar-btn btn-procesar" onClick={() => onOpenModal('modalProcesar')}>Procesar F12</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalCompras')}>Compras</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalDatos')}>Datos</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalRif')}>Rif</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalBuscarCliente')}>Buscar cliente</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalPresupuesto')}>Presupuesto</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalCantidad')}>Cantidad</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalAvanzada')}>Avanzada F6</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalConsultar')}>Consultar F2</button>
          <button className="sidebar-btn">Facturar Reverso</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalVPOS')}>Opciones VPOS</button>
          <button className="sidebar-btn" onClick={() => onOpenModal('modalPagoMovil')}>Cambio Pago Movil</button>
          <button className="sidebar-btn">Salir</button>
        </div>
      </div>

      <div className="bottom-totals">
        <div className="total-box stotal">
          <span className="total-label">S/total:</span>
          <div className="total-value">{totals.subtotal.toFixed(2)}</div>
        </div>
        <div className="total-box iva">
          <span className="total-label">Iva:</span>
          <div className="total-value">{totals.totalIva.toFixed(2)}</div>
        </div>
        <div className="total-box total-bs">
          <span className="total-label">Total Bs:</span>
          <div className="total-value">{totals.totalBs.toFixed(2)}</div>
          <span className="total-label-sub">CAMBIO ULTIMA FACTURA</span>
        </div>
        <div className="total-box dolar-igtf">
          <span className="total-label">DOLAR+IGTF:</span>
          <div className="total-value">{(totals.totalUsd * (1 + config.igtf / 100)).toFixed(2)}</div>
        </div>
        <div className="total-box divisas">
          <span className="total-label">DIVISAS:</span>
          <div className="total-value">{totals.totalUsd.toFixed(2)}</div>
        </div>
        <div className="items-count">
          <span>Item(s): <strong>{cart.length}</strong></span>
          <span>Unidad(es): <strong>{cart.reduce((s, i) => s + i.cantidad, 0)}</strong></span>
        </div>
      </div>
    </div>
  );
}

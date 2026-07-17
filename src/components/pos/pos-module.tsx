
'use client';

import React, { useState, useEffect } from 'react';
import { Product, Client, CartItem } from '@/types/pos';
import { Wallet, UserCheck, Plus, History } from 'lucide-react';

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
  onLogout: () => void;
  clientInfo: { name: string, rif: string, saldo: number, isCredit: boolean };
  setClientInfo: React.Dispatch<React.SetStateAction<{ name: string, rif: string, saldo: number, isCredit: boolean }>>;
}

export function PosModule({ 
  active, onOpenModal, products, clients, cart, setCart, config, notify, 
  selectedRow, setSelectedRow, onLogout, clientInfo, setClientInfo 
}: PosModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDropdown, setSearchDropdown] = useState<Product[]>([]);
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setDateTime(now.toLocaleString('es-VE'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!active) return null;

  const formatUSD = (n: number) => '$' + n.toFixed(2);
  const formatBS = (n: number) => 'Bs. ' + (n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    if (query.length < 1) {
      setSearchDropdown([]);
      return;
    }
    const filtered = products.filter(p => 
      p.activo && (
        p.codigo.toLowerCase().startsWith(query.toLowerCase()) || 
        p.nombre.toLowerCase().includes(query.toLowerCase())
      )
    ).slice(0, 15);
    setSearchDropdown(filtered);
  };

  const addToCart = (product: Product) => {
    const isService = product.isService === true;
    const isVirtualKit = product.isKit && !product.stockPropio;
    
    if (isVirtualKit) {
      const missingComponents = product.kitComponents.filter(comp => {
        const compProd = products.find(p => p.codigo === comp.codigo);
        return !compProd || compProd.stock < comp.cantidad;
      });
      if (missingComponents.length > 0) {
        notify(`❌ Stock insuficiente en: ${missingComponents.map(c => c.codigo).join(', ')}`, 'error');
        return;
      }
    } else if (!isService && product.stock <= 0) {
      notify(`❌ Producto sin existencia: ${product.codigo}`, 'error');
      return;
    }

    const existing = cart.find(item => item.codigo === product.codigo);
    if (existing) {
      setCart(cart.map(item => item.codigo === product.codigo ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCart([...cart, {
        productIndex: products.indexOf(product),
        codigo: product.codigo,
        descripcion: product.nombre,
        precioUsd: product.precio1,
        iva: product.iva,
        cantidad: 1,
        categoria: product.categoria,
        isKit: product.isKit,
        stockPropio: product.stockPropio
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
      const s = Math.round(item.precioUsd * item.cantidad * 100) / 100;
      subtotal += s;
      totalIva += Math.round(s * (item.iva / 100) * 100) / 100;
    });
    const totalUsd = Math.round((subtotal + totalIva) * 100) / 100;
    return { subtotal, totalIva, totalUsd, totalBs: Math.round(totalUsd * config.tasa * 100) / 100 };
  };

  const totals = getTotals();

  return (
    <div id="module-pos" className="module-panel active">
      <div className="header-section">
        <div className="header-row">
          <label style={{fontWeight:'bold'}}>Rif:</label>
          <input type="text" value={clientInfo.rif} onChange={(e) => setClientInfo({...clientInfo, rif: e.target.value})} placeholder="V-00000000-0" style={{ width: '120px' }} />
          <label style={{display:'flex', alignItems:'center', gap:'4px'}} className="cursor-pointer">
            <input type="checkbox" checked={clientInfo.isCredit} onChange={e => {
              if (clientInfo.name === 'Consumidor Final') {
                notify('❌ Venta a crédito solo permitida para clientes registrados', 'warning');
                return;
              }
              setClientInfo({...clientInfo, isCredit: e.target.checked});
            }} /> Crédito
          </label>
          <label style={{fontWeight:'bold', marginLeft:'10px'}}>Operador:</label>
          <span className="vendedor-name">{config.vendedor}</span>
          <div style={{color:'#008000', fontWeight:'bold', marginLeft:'auto'}}>{dateTime}</div>
        </div>
        <div className="header-row">
          <label style={{fontWeight:'bold'}}>Cliente:</label>
          <div className="relative flex-1 flex gap-2">
            <input type="text" value={clientInfo.name} onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})} placeholder="Nombre del cliente..." className="flex-1" />
            <button className="btn px-2" onClick={() => onOpenModal('modalCliente')}><Plus size={14}/></button>
          </div>
          <label style={{fontWeight:'bold'}}>Saldo CXC:</label>
          <span style={{background:'#eee', padding:'2px 8px', border:'1px solid #808080', minWidth:'80px', textAlign:'right', color: clientInfo.saldo > 0 ? 'red' : 'green'}}>${clientInfo.saldo.toFixed(2)}</span>
        </div>
      </div>

      <div className="search-section" style={{ position: 'relative' }}>
        <label style={{fontWeight:'bold'}}>Busqueda:</label>
        <input 
          type="text" 
          style={{flex: 1}}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Escanee código o escriba nombre..." 
        />
        <label style={{fontWeight:'bold', marginLeft:'10px'}}>Equivalente:</label>
        <input type="text" style={{width:'150px', background:'#eee', fontWeight:'bold', textAlign: 'right'}} value={formatBS(totals.totalBs)} readOnly />
        
        {searchDropdown.length > 0 && (
          <div className="search-dropdown active">
            {searchDropdown.map(p => {
              const isService = p.isService === true;
              const isVirtualKit = p.isKit && !p.stockPropio;
              const hasStock = isService || isVirtualKit || p.stock > 0;
              return (
                <div key={p.codigo} className={`search-dropdown-item ${!hasStock ? 'opacity-50' : ''}`} onClick={() => hasStock ? addToCart(p) : notify('❌ Sin stock', 'error')}>
                  <strong>{p.codigo}</strong> - {p.nombre} | {formatUSD(p.precio1)} | Stock: {isVirtualKit ? 'VIRTUAL' : (isService ? 'S/C' : p.stock)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="main-content">
        <div className="table-container">
          <table className="product-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}>#</th>
                <th>Item / Servicio</th>
                <th style={{ width: '80px', textAlign:'right' }}>Precio USD</th>
                <th style={{ width: '50px', textAlign:'center' }}>Cant</th>
                <th style={{ width: '100px', textAlign:'right' }}>Subtotal</th>
                <th style={{ width: '100px', textAlign:'right' }}>Total+Iva</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, i) => (
                <tr key={i} className={selectedRow === i ? 'selected' : ''} onClick={() => setSelectedRow(i)}>
                  <td>{i + 1}</td>
                  <td>{item.codigo} - {item.descripcion}</td>
                  <td style={{textAlign:'right'}}>{item.precioUsd.toFixed(2)}</td>
                  <td style={{textAlign:'center'}}>{item.cantidad}</td>
                  <td style={{textAlign:'right'}}>{(item.precioUsd * item.cantidad).toFixed(2)}</td>
                  <td style={{textAlign:'right'}}>{(item.precioUsd * item.cantidad * (1 + item.iva / 100)).toFixed(2)}</td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Sin productos en cola...</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="right-sidebar">
          <button className="sidebar-btn" style={{ background: '#d0d0f0' }} onClick={() => onOpenModal('modalAperturaCaja')}>Apertura Caja</button>
          <button className="sidebar-btn" style={{ background: '#f0f0d0' }} onClick={() => onOpenModal('modalCobroDeuda')}>Cobro Deuda</button>
          <button className="sidebar-btn" onClick={() => setSelectedRow(-1)}>Limpiar Selección</button>
          <button className="sidebar-btn" onClick={() => setCart(cart.filter((_, idx) => idx !== selectedRow))}>Quitar Item</button>
          <button className="sidebar-btn" style={{ marginTop: 'auto', background: '#f0a0a0' }} onClick={onLogout}>SALIR (ESC)</button>
        </div>
      </div>

      <div className="bottom-totals">
        <div className="total-box stotal"><span className="total-label">Subtotal:</span><div className="total-value">${totals.subtotal.toFixed(2)}</div></div>
        <div className="total-box iva"><span className="total-label">IVA:</span><div className="total-value">${totals.totalIva.toFixed(2)}</div></div>
        <div className="total-box total-bs" style={{ background: '#ff6b6b' }}><span className="total-label">Total Bs:</span><div className="total-value">{totals.totalBs.toFixed(2)}</div></div>
        <div className="total-box divisas" style={{ background: '#87ceeb' }}><span className="total-label">TOTAL USD:</span><div className="total-value">${totals.totalUsd.toFixed(2)}</div></div>
        
        <button className="btn btn-success" style={{ height: '50px', padding: '0 30px', fontWeight: 'black', fontSize: '16px', background: '#d0f0d0', boxShadow: '2px 2px 0 #000' }} disabled={cart.length === 0} onClick={() => onOpenModal('modalProcesar')}>
          <div className="flex items-center gap-2 uppercase">
            <CreditCard size={20}/> FINALIZAR VENTA
          </div>
        </button>
      </div>
    </div>
  );
}

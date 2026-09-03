import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProductItem, SupplierItem, Customer, SaleRecord } from './types';
import { 
  loadStoredProducts, saveStoredProducts, 
  loadStoredSuppliers, saveStoredSuppliers,
  loadStoredCustomers, saveStoredCustomers,
  loadStoredSales, saveStoredSales,
  resetAllToDefaults
} from './utils/storage';
import { 
  saveProductsToCloud, subscribeToProducts,
  saveSuppliersToCloud, subscribeToSuppliers,
  saveCustomersToCloud, subscribeToCustomers,
  saveSalesToCloud, subscribeToSales,
  getDeviceType
} from './firebase';
import { computeCrossAnalysis, isChineseOrigin } from './utils/crossAnalysis';
import { exportFullMasterReportToExcel, normalizeMedida } from './utils/excel';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CrossAnalysisTab } from './components/CrossAnalysisTab';
import { MyInventoryTab } from './components/MyInventoryTab';
import { SupplierInventoryTab } from './components/SupplierInventoryTab';
import { SalesDashboardTab } from './components/SalesDashboardTab';
import { CustomersTab } from './components/CustomersTab';
import { SaleModal } from './components/SaleModal';
import { CustomerModal } from './components/CustomerModal';
import { ProductModal } from './components/ProductModal';
import { PinModal } from './components/PinModal';
import { ProtectedSectionLock } from './components/ProtectedSectionLock';

export default function App() {
  // Estados de datos principales (con persistencia local inicial para carga instantánea)
  const [products, setProducts] = useState<ProductItem[]>(() => loadStoredProducts());
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(() => loadStoredSuppliers());
  const [customers, setCustomers] = useState<Customer[]>(() => loadStoredCustomers());
  const [sales, setSales] = useState<SaleRecord[]>(() => loadStoredSales());

  // Estado de Sincronización en la Nube (PC ⇄ Móvil)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  const [lastCloudDevice, setLastCloudDevice] = useState<string | null>(null);
  const isInitialSyncDone = useRef(false);

  // Seguridad por PIN (141096) para Cruce de Datos y Sección Comercial
  const [isPinAuthorized, setIsPinAuthorized] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('inventra_commercial_pin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingProtectedTarget, setPendingProtectedTarget] = useState<'cross' | 'sales' | 'customers' | 'sale_modal' | null>(null);

  // Navegación (si no está autenticado, inicia seguro en 'inventory', de lo contrario en 'cross')
  const [activeTab, setActiveTab] = useState<'cross' | 'inventory' | 'supplier' | 'sales' | 'customers'>(() => {
    try {
      const isAuth = sessionStorage.getItem('inventra_commercial_pin_auth') === 'true';
      return isAuth ? 'cross' : 'inventory';
    } catch {
      return 'inventory';
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchGlobal, setSearchGlobal] = useState('');

  // Handlers de seguridad PIN
  const handleRequestPinUnlock = (target: 'cross' | 'sales' | 'customers' | 'sale_modal') => {
    setPendingProtectedTarget(target);
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = () => {
    setIsPinAuthorized(true);
    try {
      sessionStorage.setItem('inventra_commercial_pin_auth', 'true');
    } catch {}
    setIsPinModalOpen(false);
    showToast('¡Acceso comercial autorizado con éxito!');

    if (pendingProtectedTarget === 'sale_modal') {
      setPreloadedSaleItem(null);
      setIsSaleModalOpen(true);
    } else if (pendingProtectedTarget) {
      setActiveTab(pendingProtectedTarget);
    }
    setPendingProtectedTarget(null);
  };

  const handleLockPin = () => {
    setIsPinAuthorized(false);
    try {
      sessionStorage.removeItem('inventra_commercial_pin_auth');
    } catch {}
    showToast('Sección comercial y cruce de datos bloqueados con éxito.');
    if (activeTab === 'cross' || activeTab === 'sales' || activeTab === 'customers') {
      setActiveTab('inventory');
    }
  };

  // Modales
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [preloadedSaleItem, setPreloadedSaleItem] = useState<{
    medida: string;
    marca: string;
    costo: number;
    precioSugerido: number;
    descripcion: string;
  } | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalType, setProductModalType] = useState<'propio' | 'proveedor'>('propio');
  const [itemToEdit, setItemToEdit] = useState<ProductItem | SupplierItem | null>(null);

  // Notificación flotante rápida
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sincronización en tiempo real con Firebase Firestore (PC ⇄ Móvil)
  useEffect(() => {
    let isMounted = true;
    setCloudSyncStatus('syncing');

    // 1. Suscripción en tiempo real a Mi Inventario
    const unsubProducts = subscribeToProducts(
      (cloudProducts, meta) => {
        if (!isMounted) return;
        setCloudSyncStatus('connected');
        if (meta?.device) setLastCloudDevice(meta.device);

        if (cloudProducts && cloudProducts.length > 0) {
          setProducts(cloudProducts);
          saveStoredProducts(cloudProducts);
        } else if (!isInitialSyncDone.current) {
          // Si la base en la nube está vacía en el primer arranque, sembrar con los datos locales
          const localProds = loadStoredProducts();
          if (localProds && localProds.length > 0) {
            saveProductsToCloud(localProds);
          }
        }
      },
      (err) => {
        console.warn('Firestore products listener error:', err);
        if (isMounted) setCloudSyncStatus('offline');
      }
    );

    // 2. Suscripción a Catálogo de Proveedores
    const unsubSuppliers = subscribeToSuppliers(
      (cloudSuppliers) => {
        if (!isMounted) return;
        if (cloudSuppliers && cloudSuppliers.length > 0) {
          setSuppliers(cloudSuppliers);
          saveStoredSuppliers(cloudSuppliers);
        } else if (!isInitialSyncDone.current) {
          const localSupp = loadStoredSuppliers();
          if (localSupp && localSupp.length > 0) {
            saveSuppliersToCloud(localSupp);
          }
        }
      },
      (err) => console.warn('Firestore suppliers listener error:', err)
    );

    // 3. Suscripción a Clientes
    const unsubCustomers = subscribeToCustomers(
      (cloudCustomers) => {
        if (!isMounted) return;
        if (cloudCustomers && cloudCustomers.length > 0) {
          setCustomers(cloudCustomers);
          saveStoredCustomers(cloudCustomers);
        } else if (!isInitialSyncDone.current) {
          const localCust = loadStoredCustomers();
          if (localCust && localCust.length > 0) {
            saveCustomersToCloud(localCust);
          }
        }
      },
      (err) => console.warn('Firestore customers listener error:', err)
    );

    // 4. Suscripción a Historial de Ventas
    const unsubSales = subscribeToSales(
      (cloudSales) => {
        if (!isMounted) return;
        if (cloudSales && cloudSales.length > 0) {
          setSales(cloudSales);
          saveStoredSales(cloudSales);
        } else if (!isInitialSyncDone.current) {
          const localSales = loadStoredSales();
          if (localSales && localSales.length > 0) {
            saveSalesToCloud(localSales);
          }
        }
      },
      (err) => console.warn('Firestore sales listener error:', err)
    );

    isInitialSyncDone.current = true;

    return () => {
      isMounted = false;
      unsubProducts();
      unsubSuppliers();
      unsubCustomers();
      unsubSales();
    };
  }, []);

  // Guardar en persistencia local y sincronizar a la nube Firebase
  const handleUpdateProducts = async (updated: ProductItem[]) => {
    setProducts(updated);
    saveStoredProducts(updated);
    setCloudSyncStatus('syncing');
    const success = await saveProductsToCloud(updated);
    setCloudSyncStatus(success ? 'connected' : 'offline');
    if (success) {
      showToast('¡Inventario guardado en la nube! Visible al instante en tu celular.');
    }
  };

  const handleUpdateSuppliers = async (updated: SupplierItem[]) => {
    setSuppliers(updated);
    saveStoredSuppliers(updated);
    setCloudSyncStatus('syncing');
    const success = await saveSuppliersToCloud(updated);
    setCloudSyncStatus(success ? 'connected' : 'offline');
    if (success) {
      showToast('¡Catálogo de proveedor sincronizado en la nube!');
    }
  };

  const handleSaveSale = async (sale: SaleRecord) => {
    const updatedSales = [sale, ...sales];
    setSales(updatedSales);
    saveStoredSales(updatedSales);
    saveSalesToCloud(updatedSales);

    // Descontar de inventario propio si existe la medida
    let stockDeducted = false;
    const updatedProducts = products.map(p => {
      const soldItem = sale.items.find(i => 
        i.medida.toUpperCase().trim() === p.medida.toUpperCase().trim() &&
        (i.marca.toUpperCase().trim() === p.marca.toUpperCase().trim() || !i.marca)
      );
      if (soldItem) {
        stockDeducted = true;
        return {
          ...p,
          existencia: Math.max(0, p.existencia - soldItem.cantidad)
        };
      }
      return p;
    });

    if (stockDeducted) {
      setProducts(updatedProducts);
      saveStoredProducts(updatedProducts);
      saveProductsToCloud(updatedProducts);
    }

    showToast(`¡Venta ${sale.folio} registrada con éxito! Ganancia neta: $${sale.gananciaTotal.toLocaleString('es-MX')} (${sale.margenPromedio.toFixed(1)}% margen)`);
  };

  const handleDeleteSale = async (saleId: string) => {
    const updated = sales.filter(s => s.id !== saleId);
    setSales(updated);
    saveStoredSales(updated);
    saveSalesToCloud(updated);
    showToast('Registro de venta eliminado de la nube y de este dispositivo.');
  };

  const handleSaveCustomer = async (cust: Customer) => {
    const exists = customers.some(c => c.id === cust.id);
    let updated: Customer[];
    if (exists) {
      updated = customers.map(c => c.id === cust.id ? cust : c);
      showToast(`Cliente ${cust.numeroCliente} actualizado en la nube.`);
    } else {
      updated = [...customers, cust];
      showToast(`Cliente ${cust.numeroCliente} registrado en la nube.`);
    }
    setCustomers(updated);
    saveStoredCustomers(updated);
    saveCustomersToCloud(updated);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const updated = customers.filter(c => c.id !== customerId);
    setCustomers(updated);
    saveStoredCustomers(updated);
    saveCustomersToCloud(updated);
    showToast('Cliente eliminado del directorio en la nube.');
  };

  const handleResetData = async () => {
    const defaults = resetAllToDefaults();
    setProducts(defaults.products);
    setSuppliers(defaults.suppliers);
    setCustomers(defaults.customers);
    setSales(defaults.sales);
    setCloudSyncStatus('syncing');
    await Promise.all([
      saveProductsToCloud(defaults.products),
      saveSuppliersToCloud(defaults.suppliers),
      saveCustomersToCloud(defaults.customers),
      saveSalesToCloud(defaults.sales)
    ]);
    setCloudSyncStatus('connected');
    showToast('Se restablecieron los datos de demostración en local y en la nube.');
  };

  // Exportar reporte maestro con todas las pestañas
  const handleExportMasterExcel = () => {
    if (!isPinAuthorized) {
      showToast('Se requiere autorización con PIN para exportar reportes de costos y ventas comerciales.');
      handleRequestPinUnlock('cross');
      return;
    }
    try {
      const crossMatches = computeCrossAnalysis(products, suppliers);
      exportFullMasterReportToExcel(products, suppliers, crossMatches, sales);
      showToast('¡Reporte maestro Excel generado y descargado!');
    } catch (e) {
      showToast('Error al generar el reporte maestro.');
    }
  };

  // Vender directo desde el Cruce
  const handleDirectSaleFromCross = (item: {
    medida: string;
    marca: string;
    costo: number;
    precioSugerido: number;
    descripcion: string;
  }) => {
    if (!isPinAuthorized) {
      handleRequestPinUnlock('sale_modal');
      return;
    }
    setPreloadedSaleItem(item);
    setIsSaleModalOpen(true);
  };

  // Conteo de coincidencias activas de producto chino para comparativa de venta
  const matchesCount = useMemo(() => {
    const myChineseProducts = products.filter(p => isChineseOrigin(p.origen, p.marca, p.descripcion));
    const targetProducts = myChineseProducts.length > 0 ? myChineseProducts : products;
    // Regla del usuario: Todas las medidas chinas de mi inventario (con o sin proveedor) entran en coincidencias
    return targetProducts.length;
  }, [products]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Barra Lateral de Navegación Profesional */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        matchesCount={matchesCount}
        productsCount={products.length}
        suppliersCount={suppliers.length}
        salesCount={sales.length}
        customersCount={customers.length}
        isPinAuthorized={isPinAuthorized}
        onRequestPinUnlock={handleRequestPinUnlock}
        onLockPin={handleLockPin}
        onExportAll={handleExportMasterExcel}
        onResetData={handleResetData}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        cloudSyncStatus={cloudSyncStatus}
      />

      {/* Columna Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Barra Superior con Buscador Global y Accesos Rápidos */}
        <TopBar
          onOpenMyInventoryUpload={() => setActiveTab('inventory')}
          onOpenSupplierUpload={() => setActiveTab('supplier')}
          onOpenNewSale={() => {
            if (!isPinAuthorized) {
              handleRequestPinUnlock('sale_modal');
              return;
            }
            setPreloadedSaleItem(null);
            setIsSaleModalOpen(true);
          }}
          searchGlobal={searchGlobal}
          onSearchGlobalChange={setSearchGlobal}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
          isPinAuthorized={isPinAuthorized}
          onRequestPinUnlock={() => handleRequestPinUnlock('cross')}
          onLockPin={handleLockPin}
          cloudSyncStatus={cloudSyncStatus}
          lastCloudDevice={lastCloudDevice}
        />

        {/* Notificación Toast Flotante */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in duration-200">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
            <span>{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-2 text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Contenedor Principal con Scroll */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          
          {/* Pestaña 1: Cruce de Datos e Inteligencia de Precios Mayoreo */}
          {activeTab === 'cross' && (
            isPinAuthorized ? (
              <CrossAnalysisTab
                products={products}
                suppliers={suppliers}
                onDirectSale={handleDirectSaleFromCross}
                globalSearch={searchGlobal}
                onUpdateProducts={handleUpdateProducts}
              />
            ) : (
              <ProtectedSectionLock
                title="Cruce de Datos e Inteligencia de Precios"
                subtitle="Esta sección contiene el análisis comparativo confidencial de tus costos contra el proveedor, cálculo de márgenes y oportunidades de mayoreo para llantas chinas. Introduce el PIN de seguridad para ingresar."
                onUnlockRequest={() => handleRequestPinUnlock('cross')}
              />
            )
          )}

          {/* Pestaña 2: Mi Inventario (Carga diaria Excel) */}
          {activeTab === 'inventory' && (
            <MyInventoryTab
              products={products}
              onUpdateProducts={handleUpdateProducts}
              onOpenAddModal={() => {
                setProductModalType('propio');
                setItemToEdit(null);
                setIsProductModalOpen(true);
              }}
              onOpenEditModal={(prod) => {
                setProductModalType('propio');
                setItemToEdit(prod);
                setIsProductModalOpen(true);
              }}
            />
          )}

          {/* Pestaña 3: Inventario Proveedor (Carga diaria Excel) */}
          {activeTab === 'supplier' && (
            <SupplierInventoryTab
              suppliers={suppliers}
              onUpdateSuppliers={handleUpdateSuppliers}
              onOpenAddModal={() => {
                setProductModalType('proveedor');
                setItemToEdit(null);
                setIsProductModalOpen(true);
              }}
              onOpenEditModal={(supp) => {
                setProductModalType('proveedor');
                setItemToEdit(supp);
                setIsProductModalOpen(true);
              }}
            />
          )}

          {/* Pestaña 4: Panel de Ventas & Medición de Márgenes */}
          {activeTab === 'sales' && (
            isPinAuthorized ? (
              <SalesDashboardTab
                sales={sales}
                customers={customers}
                onOpenNewSaleModal={() => {
                  setPreloadedSaleItem(null);
                  setIsSaleModalOpen(true);
                }}
                onDeleteSale={handleDeleteSale}
              />
            ) : (
              <ProtectedSectionLock
                title="Panel Comercial & Registro de Ventas"
                subtitle="Esta sección contiene el historial confidencial de ventas, cálculo de utilidades netas, márgenes comerciales y comisiones. Introduce el PIN de seguridad para ingresar."
                onUnlockRequest={() => handleRequestPinUnlock('sales')}
              />
            )
          )}

          {/* Pestaña 5: Directorio de Clientes Reutilizables */}
          {activeTab === 'customers' && (
            isPinAuthorized ? (
              <CustomersTab
                customers={customers}
                sales={sales}
                onOpenAddCustomerModal={() => {
                  setCustomerToEdit(null);
                  setIsCustomerModalOpen(true);
                }}
                onOpenEditCustomerModal={(cust) => {
                  setCustomerToEdit(cust);
                  setIsCustomerModalOpen(true);
                }}
                onDeleteCustomer={handleDeleteCustomer}
                onViewCustomerSales={() => {
                  setActiveTab('sales');
                }}
              />
            ) : (
              <ProtectedSectionLock
                title="Directorio de Clientes Mayoristas"
                subtitle="Esta sección contiene la base de datos confidencial de clientes, teléfonos, direcciones y cartera de ventas. Introduce el PIN de seguridad para ingresar."
                onUnlockRequest={() => handleRequestPinUnlock('customers')}
              />
            )
          )}

        </main>

        {/* Footer Sutil */}
        <footer className="bg-white border-t border-slate-200 py-2.5 px-4 sm:px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div>
            Sistema de Cruce de Inventarios y Precios Mayoreo • <span className="text-slate-700 font-semibold">Rines y Llantas El Águila</span>
          </div>
          <div className="text-slate-400">
            Archivos Excel (.xlsx, .xls) • Cálculo automático de márgenes y exportación
          </div>
        </footer>

      </div>

      {/* Modal para Registrar Venta Mayoreo */}
      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => {
          setIsSaleModalOpen(false);
          setPreloadedSaleItem(null);
        }}
        customers={customers}
        products={products}
        onSaveSale={handleSaveSale}
        onQuickAddCustomer={(newCust) => {
          handleSaveCustomer(newCust);
        }}
        initialPreloadedItem={preloadedSaleItem}
      />

      {/* Modal para Crear/Editar Cliente */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
        onSaveCustomer={handleSaveCustomer}
        existingCustomersCount={customers.length}
      />

      {/* Modal para Crear/Editar Producto propio o de proveedor */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setItemToEdit(null);
        }}
        type={productModalType}
        itemToEdit={itemToEdit}
        onSaveProduct={(prod) => {
          const exists = products.some(p => p.id === prod.id);
          const updated = exists 
            ? products.map(p => p.id === prod.id ? prod : p)
            : [...products, prod];
          handleUpdateProducts(updated);
          showToast(`Producto ${prod.medida} guardado.`);
        }}
        onSaveSupplierItem={(supp) => {
          const exists = suppliers.some(s => s.id === supp.id);
          const updated = exists 
            ? suppliers.map(s => s.id === supp.id ? supp : s)
            : [...suppliers, supp];
          handleUpdateSuppliers(updated);
          showToast(`Medida ${supp.medida} de proveedor guardada.`);
        }}
      />

      {/* Modal de Verificación de PIN (141096) para Cruce y Sección Comercial */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingProtectedTarget(null);
        }}
        onSuccess={handlePinSuccess}
        targetSectionName={
          pendingProtectedTarget === 'cross'
            ? 'Cruce de Datos e Inteligencia de Precios'
            : pendingProtectedTarget === 'sales'
              ? 'Panel Comercial & Registro de Ventas'
              : pendingProtectedTarget === 'customers'
                ? 'Directorio de Clientes Mayoristas'
                : 'Área Comercial'
        }
      />

    </div>
  );
}

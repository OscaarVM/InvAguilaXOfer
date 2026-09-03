import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { ProductItem, SupplierItem, Customer, SaleRecord } from './types';

// Inicialización de la aplicación Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Inicializar Firestore con la base de datos específica del proyecto
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Iniciar sesión anónima en segundo plano para seguridad
signInAnonymously(auth).catch((err) => {
  console.warn('Advertencia en autenticación anónima Firebase:', err);
});

// Nombres de colecciones y documentos
const INVENTORIES_COLLECTION = 'inventories';
const MY_INVENTORY_DOC = 'my_inventory';
const SUPPLIER_INVENTORY_DOC = 'supplier_inventory';

const COMMERCIAL_COLLECTION = 'commercial';
const CUSTOMERS_DOC = 'customers';
const SALES_DOC = 'sales';

// Helper para detectar tipo de dispositivo
export function getDeviceType(): string {
  if (typeof window === 'undefined') return 'PC / Navegador';
  const ua = navigator.userAgent;
  if (/android|iphone|ipad|ipod|mobile/i.test(ua)) {
    return 'Teléfono Móvil';
  }
  return 'PC / Computadora';
}

// -------------------------------------------------------------
// PRODUCTOS (MI INVENTARIO)
// -------------------------------------------------------------

export async function saveProductsToCloud(products: ProductItem[]): Promise<boolean> {
  try {
    const docRef = doc(db, INVENTORIES_COLLECTION, MY_INVENTORY_DOC);
    await setDoc(docRef, {
      items: products,
      totalCount: products.length,
      updatedAt: new Date().toISOString(),
      device: getDeviceType()
    });
    return true;
  } catch (error) {
    console.error('Error al guardar productos en la nube:', error);
    return false;
  }
}

export function subscribeToProducts(
  onData: (products: ProductItem[], metadata: { updatedAt: string; device: string } | null) => void,
  onError?: (err: Error) => void
): () => void {
  const docRef = doc(db, INVENTORIES_COLLECTION, MY_INVENTORY_DOC);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.items)) {
          onData(data.items, {
            updatedAt: data.updatedAt || new Date().toISOString(),
            device: data.device || 'Nube'
          });
          return;
        }
      }
      onData([], null);
    },
    (error) => {
      console.error('Error en suscripción en tiempo real de productos:', error);
      if (onError) onError(error);
    }
  );
}

// -------------------------------------------------------------
// INVENTARIO DEL PROVEEDOR
// -------------------------------------------------------------

export async function saveSuppliersToCloud(suppliers: SupplierItem[]): Promise<boolean> {
  try {
    const docRef = doc(db, INVENTORIES_COLLECTION, SUPPLIER_INVENTORY_DOC);
    await setDoc(docRef, {
      items: suppliers,
      totalCount: suppliers.length,
      updatedAt: new Date().toISOString(),
      device: getDeviceType()
    });
    return true;
  } catch (error) {
    console.error('Error al guardar proveedor en la nube:', error);
    return false;
  }
}

export function subscribeToSuppliers(
  onData: (suppliers: SupplierItem[], metadata: { updatedAt: string; device: string } | null) => void,
  onError?: (err: Error) => void
): () => void {
  const docRef = doc(db, INVENTORIES_COLLECTION, SUPPLIER_INVENTORY_DOC);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.items)) {
          onData(data.items, {
            updatedAt: data.updatedAt || new Date().toISOString(),
            device: data.device || 'Nube'
          });
          return;
        }
      }
      onData([], null);
    },
    (error) => {
      console.error('Error en suscripción en tiempo real de proveedores:', error);
      if (onError) onError(error);
    }
  );
}

// -------------------------------------------------------------
// CLIENTES
// -------------------------------------------------------------

export async function saveCustomersToCloud(customers: Customer[]): Promise<boolean> {
  try {
    const docRef = doc(db, COMMERCIAL_COLLECTION, CUSTOMERS_DOC);
    await setDoc(docRef, {
      items: customers,
      totalCount: customers.length,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error al guardar clientes en la nube:', error);
    return false;
  }
}

export function subscribeToCustomers(
  onData: (customers: Customer[]) => void,
  onError?: (err: Error) => void
): () => void {
  const docRef = doc(db, COMMERCIAL_COLLECTION, CUSTOMERS_DOC);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.items)) {
          onData(data.items);
          return;
        }
      }
    },
    (error) => {
      console.error('Error en suscripción de clientes:', error);
      if (onError) onError(error);
    }
  );
}

// -------------------------------------------------------------
// VENTAS
// -------------------------------------------------------------

export async function saveSalesToCloud(sales: SaleRecord[]): Promise<boolean> {
  try {
    const docRef = doc(db, COMMERCIAL_COLLECTION, SALES_DOC);
    await setDoc(docRef, {
      items: sales,
      totalCount: sales.length,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error al guardar ventas en la nube:', error);
    return false;
  }
}

export function subscribeToSales(
  onData: (sales: SaleRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const docRef = doc(db, COMMERCIAL_COLLECTION, SALES_DOC);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.items)) {
          onData(data.items);
          return;
        }
      }
    },
    (error) => {
      console.error('Error en suscripción de ventas:', error);
      if (onError) onError(error);
    }
  );
}

// Helper para resetear o inicializar datos si la nube está vacía
export async function seedCloudIfEmpty(
  initialProducts: ProductItem[],
  initialSuppliers: SupplierItem[],
  initialCustomers: Customer[],
  initialSales: SaleRecord[]
): Promise<void> {
  try {
    const myInvDoc = await getDoc(doc(db, INVENTORIES_COLLECTION, MY_INVENTORY_DOC));
    if (!myInvDoc.exists()) {
      await saveProductsToCloud(initialProducts);
    }

    const suppDoc = await getDoc(doc(db, INVENTORIES_COLLECTION, SUPPLIER_INVENTORY_DOC));
    if (!suppDoc.exists()) {
      await saveSuppliersToCloud(initialSuppliers);
    }

    const custDoc = await getDoc(doc(db, COMMERCIAL_COLLECTION, CUSTOMERS_DOC));
    if (!custDoc.exists()) {
      await saveCustomersToCloud(initialCustomers);
    }

    const salesDoc = await getDoc(doc(db, COMMERCIAL_COLLECTION, SALES_DOC));
    if (!salesDoc.exists()) {
      await saveSalesToCloud(initialSales);
    }
  } catch (e) {
    console.warn('Nota al inicializar datos en la nube:', e);
  }
}

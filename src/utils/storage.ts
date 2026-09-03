import { ProductItem, SupplierItem, Customer, SaleRecord } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SUPPLIER_ITEMS, INITIAL_CUSTOMERS, INITIAL_SALES } from '../data/initialData';

const STORAGE_KEYS = {
  MY_INVENTORY: 'app_my_inventory_v1',
  SUPPLIER_INVENTORY: 'app_supplier_inventory_v1',
  CUSTOMERS: 'app_customers_v1',
  SALES: 'app_sales_v1',
  TARGET_MARGIN: 'app_target_margin_v1',
  SUPPLIER_NAME: 'app_supplier_name_v1'
};

export function loadStoredProducts(): ProductItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MY_INVENTORY);
    if (!raw) return INITIAL_PRODUCTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
  } catch (e) {
    console.error('Error loading products from localStorage', e);
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredProducts(products: ProductItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MY_INVENTORY, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products to localStorage', e);
  }
}

export function loadStoredSuppliers(): SupplierItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLIER_INVENTORY);
    if (!raw) return INITIAL_SUPPLIER_ITEMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SUPPLIER_ITEMS;
  } catch (e) {
    console.error('Error loading suppliers from localStorage', e);
    return INITIAL_SUPPLIER_ITEMS;
  }
}

export function saveStoredSuppliers(suppliers: SupplierItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPPLIER_INVENTORY, JSON.stringify(suppliers));
  } catch (e) {
    console.error('Error saving suppliers to localStorage', e);
  }
}

export function loadStoredCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) return INITIAL_CUSTOMERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CUSTOMERS;
  } catch (e) {
    console.error('Error loading customers from localStorage', e);
    return INITIAL_CUSTOMERS;
  }
}

export function saveStoredCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (e) {
    console.error('Error saving customers to localStorage', e);
  }
}

export function loadStoredSales(): SaleRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    if (!raw) return INITIAL_SALES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SALES;
  } catch (e) {
    console.error('Error loading sales from localStorage', e);
    return INITIAL_SALES;
  }
}

export function saveStoredSales(sales: SaleRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  } catch (e) {
    console.error('Error saving sales to localStorage', e);
  }
}

export function resetAllToDefaults(): {
  products: ProductItem[];
  suppliers: SupplierItem[];
  customers: Customer[];
  sales: SaleRecord[];
} {
  try {
    localStorage.removeItem(STORAGE_KEYS.MY_INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIER_INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
  } catch (e) {
    console.error('Error clearing localStorage', e);
  }
  return {
    products: INITIAL_PRODUCTS,
    suppliers: INITIAL_SUPPLIER_ITEMS,
    customers: INITIAL_CUSTOMERS,
    sales: INITIAL_SALES
  };
}

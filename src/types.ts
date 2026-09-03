export type CustomerType = 'mayoreo' | 'taller' | 'subdistribuidor' | 'menudeo';

export interface ProductItem {
  id: string;
  codigo: string;
  medida: string;
  marca: string;
  descripcion: string;
  origen?: string; // 'CHINO', 'NACIONAL', etc.
  costoCompra: number;
  existencia: number;
  precioPublico: number;
  fechaActualizacion: string;
}

export interface SupplierItem {
  id: string;
  codigo: string;
  medida: string;
  marca: string;
  descripcion: string;
  origen?: string; // Por defecto 'CHINO'
  costoProveedor: number;
  existenciaProveedor: number;
  proveedorNombre: string;
  fechaCarga: string;
}

export type OpportunityType = 
  | 'muy_favorable' 
  | 'favorable' 
  | 'neutro' 
  | 'desfavorable' 
  | 'solo_propio' 
  | 'solo_proveedor';

export interface CrossMatchItem {
  id: string;
  medidaNormalizada: string;
  medidaDisplay: string;
  marcaDisplay: string;
  origenDisplay?: string;
  miProducto: ProductItem | null;
  productoProveedor: SupplierItem | null;
  miCosto: number;
  costoProveedor: number;
  diferenciaCosto: number; // miCosto - costoProveedor (si > 0, proveedor es más barato)
  ahorroPorcentaje: number;
  miExistencia: number;
  existenciaProveedor: number;
  precioPublico: number;
  precioSugeridoMayoreo: number;
  margenEstimadoMayoreo: number; // Porcentaje de ganancia vendiendo a precio mayoreo
  gananciaEstimadaPorUnidad: number;
  oportunidad: OpportunityType;
  recomendacion: string;
  descartadoPorBajoStock?: boolean;
  existenciaProveedorBaja?: number;
  esCoincidencia?: boolean; // Verdadero para productos chinos de mi inventario (con o sin proveedor) y cruces
  tipoCoincidencia?: 'cruce_directo' | 'exclusivo_propio' | 'solo_proveedor';
  comparativaVenta?: 'mi_inventario_mejor_precio' | 'mismo_precio' | 'proveedor_mas_barato' | 'exclusivo_sin_competencia' | 'solo_proveedor';
}

export interface Customer {
  id: string;
  numeroCliente: string; // ej. CLI-001
  nombre: string;
  empresa: string;
  telefono: string;
  email?: string;
  tipoCliente: CustomerType;
  notas?: string;
  totalComprado?: number;
  ventasCount?: number;
  fechaRegistro: string;
}

export interface SaleItem {
  id: string;
  productoId?: string;
  medida: string;
  marca: string;
  origen?: string;
  descripcion: string;
  cantidad: number;
  costoUnitario: number;
  precioVentaUnitario: number;
  subtotal: number;
  costoTotal: number;
  gananciaNeta: number;
  margenPorcentaje: number;
}

export interface SaleRecord {
  id: string;
  folio: string;
  fecha: string;
  clienteId: string;
  clienteNumero: string;
  clienteNombre: string;
  items: SaleItem[];
  totalVenta: number;
  costoTotal: number;
  gananciaTotal: number;
  margenPromedio: number;
  metodoPago: 'transferencia' | 'efectivo' | 'credito' | 'tarjeta';
  notas?: string;
}

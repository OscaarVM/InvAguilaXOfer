import { ProductItem, SupplierItem, Customer, SaleRecord } from '../types';

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'p_1',
    codigo: 'LL-2055516-SAI',
    medida: '205/55R16',
    marca: 'Sailun',
    descripcion: 'Sailun Atrezzo Elite 91V',
    origen: 'CHINO',
    costoCompra: 1210,
    existencia: 18,
    precioPublico: 1790,
    fechaActualizacion: '2026-09-02'
  },
  {
    id: 'p_2',
    codigo: 'LL-1856515-LIN',
    medida: '185/65R15',
    marca: 'Linglong',
    descripcion: 'Linglong Green-Max EcoTour 88H',
    origen: 'CHINO',
    costoCompra: 960,
    existencia: 24,
    precioPublico: 1420,
    fechaActualizacion: '2026-09-02'
  },
  {
    id: 'p_3',
    codigo: 'LL-2254517-WES',
    medida: '225/45R17',
    marca: 'Westlake',
    descripcion: 'Westlake Sport SA-37 94W',
    origen: 'CHINO',
    costoCompra: 1380,
    existencia: 12,
    precioPublico: 1980,
    fechaActualizacion: '2026-09-02'
  },
  {
    id: 'p_4',
    codigo: 'LL-2657017-HAI',
    medida: '265/70R17',
    marca: 'Haida',
    descripcion: 'Haida HD878 R/T 115T Todo Terreno',
    origen: 'CHINO',
    costoCompra: 2450,
    existencia: 8,
    precioPublico: 3550,
    fechaActualizacion: '2026-09-02'
  },
  {
    id: 'p_5',
    codigo: 'LL-2156016-TRI',
    medida: '215/60R16',
    marca: 'Triangle',
    descripcion: 'Triangle AdvanteX TC101 95V',
    origen: 'CHINO',
    costoCompra: 1190,
    existencia: 16,
    precioPublico: 1720,
    fechaActualizacion: '2026-09-02'
  },
  {
    id: 'p_6',
    codigo: 'LL-2256517-ARI',
    medida: '225/65R17',
    marca: 'Arivo',
    descripcion: 'Arivo Premio ARZERO 102H',
    origen: 'CHINO',
    costoCompra: 1420,
    existencia: 14,
    precioPublico: 2050,
    fechaActualizacion: '2026-09-02'
  },
  {
    id: 'p_7',
    codigo: 'LL-1956515-HIF',
    medida: '195/65R15',
    marca: 'Hifly',
    descripcion: 'Hifly HF201 91H',
    origen: 'CHINO',
    costoCompra: 890,
    existencia: 28,
    precioPublico: 1310,
    fechaActualizacion: '2026-09-02'
  },
  // Productos de origen NACIONAL en mi inventario (NO deben cruzarse con el proveedor Chino)
  {
    id: 'p_8',
    codigo: 'LL-2055516-MIC',
    medida: '205/55R16',
    marca: 'Michelin',
    descripcion: 'Michelin Primacy 4 91V Nacional',
    origen: 'NACIONAL',
    costoCompra: 1850,
    existencia: 10,
    precioPublico: 2690,
    fechaActualizacion: '2026-09-02'
  },
  {
    id: 'p_9',
    codigo: 'LL-1956515-TOR',
    medida: '195/65R15',
    marca: 'Tornel',
    descripcion: 'Tornel Real 91H Nacional',
    origen: 'NACIONAL',
    costoCompra: 980,
    existencia: 20,
    precioPublico: 1420,
    fechaActualizacion: '2026-09-02'
  },
  {
    id: 'p_10',
    codigo: 'RIN-1780-SPORT',
    medida: '17X8',
    marca: 'Ronal',
    descripcion: 'Rin Deportivo Aluminio Barrenación 5/114',
    origen: 'NACIONAL',
    costoCompra: 2350,
    existencia: 8,
    precioPublico: 3390,
    fechaActualizacion: '2026-09-02'
  }
];

export const INITIAL_SUPPLIER_ITEMS: SupplierItem[] = [
  {
    id: 's_1',
    codigo: 'PROV-SAI-2055516',
    medida: '205/55R16',
    marca: 'Sailun',
    descripcion: 'Sailun Atrezzo Elite 91V (Importación Directa)',
    origen: 'CHINO',
    costoProveedor: 1040, // ¡Más barato que mi costo de 1210! Ahorro de $170
    existenciaProveedor: 80,
    proveedorNombre: 'Mayorista de Llantas Chinas Directas',
    fechaCarga: '2026-09-02'
  },
  {
    id: 's_2',
    codigo: 'PROV-LIN-1856515',
    medida: '185/65R15',
    marca: 'Linglong',
    descripcion: 'Linglong Green-Max EcoTour 88H',
    origen: 'CHINO',
    costoProveedor: 830, // Más barato que mi costo de 960! Ahorro de $130
    existenciaProveedor: 120,
    proveedorNombre: 'Mayorista de Llantas Chinas Directas',
    fechaCarga: '2026-09-02'
  },
  {
    id: 's_3',
    codigo: 'PROV-WES-2254517',
    medida: '225/45R17',
    marca: 'Westlake',
    descripcion: 'Westlake Sport SA-37 94W',
    origen: 'CHINO',
    costoProveedor: 1190, // Más barato que mi costo de 1380! Ahorro de $190
    existenciaProveedor: 60,
    proveedorNombre: 'Mayorista de Llantas Chinas Directas',
    fechaCarga: '2026-09-02'
  },
  {
    id: 's_4',
    codigo: 'PROV-HAI-2657017',
    medida: '265/70R17',
    marca: 'Haida',
    descripcion: 'Haida HD878 R/T 115T Todo Terreno',
    origen: 'CHINO',
    costoProveedor: 2090, // Mucho más barato que mi costo de 2450! Ahorro de $360
    existenciaProveedor: 40,
    proveedorNombre: 'Mayorista de Llantas Chinas Directas',
    fechaCarga: '2026-09-02'
  },
  {
    id: 's_5',
    codigo: 'PROV-TRI-2156016',
    medida: '215/60R16',
    marca: 'Triangle',
    descripcion: 'Triangle AdvanteX TC101 95V',
    origen: 'CHINO',
    costoProveedor: 1020, // Más barato que mi costo de 1190
    existenciaProveedor: 50,
    proveedorNombre: 'Mayorista de Llantas Chinas Directas',
    fechaCarga: '2026-09-02'
  },
  {
    id: 's_6',
    codigo: 'PROV-ARI-2256517',
    medida: '225/65R17',
    marca: 'Arivo',
    descripcion: 'Arivo Premio ARZERO 102H',
    origen: 'CHINO',
    costoProveedor: 1240, // Más barato que mi costo de 1420
    existenciaProveedor: 75,
    proveedorNombre: 'Mayorista de Llantas Chinas Directas',
    fechaCarga: '2026-09-02'
  },
  {
    id: 's_7',
    codigo: 'PROV-HIF-1956515',
    medida: '195/65R15',
    marca: 'Hifly',
    descripcion: 'Hifly HF201 91H',
    origen: 'CHINO',
    costoProveedor: 760, // Más barato que mi costo de 890! Ahorro de $130
    existenciaProveedor: 100,
    proveedorNombre: 'Mayorista de Llantas Chinas Directas',
    fechaCarga: '2026-09-02'
  },
  // Medidas chinas disponibles SOLO en proveedor (para venta sin stock propio)
  {
    id: 's_8',
    codigo: 'PROV-DOU-2056016',
    medida: '205/60R16',
    marca: 'Doublestar',
    descripcion: 'Doublestar DH05 92V (Solo proveedor chino)',
    origen: 'CHINO',
    costoProveedor: 980,
    existenciaProveedor: 45,
    proveedorNombre: 'Mayorista de Llantas Chinas Directas',
    fechaCarga: '2026-09-02'
  },
  {
    id: 's_9',
    codigo: 'PROV-APT-2355518',
    medida: '235/55R18',
    marca: 'Aptany',
    descripcion: 'Aptany RA301 100V SUV (Solo proveedor chino)',
    origen: 'CHINO',
    costoProveedor: 1480,
    existenciaProveedor: 35,
    proveedorNombre: 'Mayorista de Llantas Chinas Directas',
    fechaCarga: '2026-09-02'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c_1',
    numeroCliente: 'CLI-001',
    nombre: 'Roberto Morales V.',
    empresa: 'Taller y Vulcanizadora Morales',
    telefono: '442-182-9011',
    email: 'taller.morales@gmail.com',
    tipoCliente: 'taller',
    notas: 'Compra juegos de 4 llantas para sedán, pago transferencia inmediata.',
    totalComprado: 38400,
    ventasCount: 3,
    fechaRegistro: '2026-08-10'
  },
  {
    id: 'c_2',
    numeroCliente: 'CLI-002',
    nombre: 'Lic. Andrés Salgado',
    empresa: 'Flotillas y Transportes del Centro',
    telefono: '55-3920-1144',
    email: 'compras@flotillascentro.mx',
    tipoCliente: 'mayoreo',
    notas: 'Cliente mayoreo recurrente para pickups y camionetas de reparto.',
    totalComprado: 89600,
    ventasCount: 5,
    fechaRegistro: '2026-08-15'
  },
  {
    id: 'c_3',
    numeroCliente: 'CLI-003',
    nombre: 'Ing. Carlos Mendoza',
    empresa: 'Llantas y Rines de Oriente',
    telefono: '477-620-4499',
    email: 'mendoza.carlos@oriente.com',
    tipoCliente: 'subdistribuidor',
    notas: 'Subdistribuidor regional, busca precios competitivos con margen >15%.',
    totalComprado: 54200,
    ventasCount: 4,
    fechaRegistro: '2026-08-20'
  },
  {
    id: 'c_4',
    numeroCliente: 'CLI-004',
    nombre: 'Fernando Ortiz',
    empresa: 'Llantera El Triunfo',
    telefono: '33-1490-8822',
    email: 'triunfo.llantas@hotmail.com',
    tipoCliente: 'mayoreo',
    notas: 'Solicita cotizaciones cruzadas con inventario de proveedor.',
    totalComprado: 27800,
    ventasCount: 2,
    fechaRegistro: '2026-08-28'
  }
];

export const INITIAL_SALES: SaleRecord[] = [
  {
    id: 'v_1',
    folio: 'MAY-1001',
    fecha: '2026-09-01',
    clienteId: 'c_2',
    clienteNumero: 'CLI-002',
    clienteNombre: 'Flotillas y Transportes del Centro',
    items: [
      {
        id: 'vi_1',
        medida: '265/70R17',
        marca: 'Pirelli',
        descripcion: 'Pirelli Scorpion AT Plus',
        cantidad: 8,
        costoUnitario: 3100, // Tomado de precio proveedor de reposición
        precioVentaUnitario: 3850,
        subtotal: 30800,
        costoTotal: 24800,
        gananciaNeta: 6000,
        margenPorcentaje: 19.48
      },
      {
        id: 'vi_2',
        medida: '225/65R17',
        marca: 'Hankook',
        descripcion: 'Hankook Dynapro HP2',
        cantidad: 4,
        costoUnitario: 1790,
        precioVentaUnitario: 2280,
        subtotal: 9120,
        costoTotal: 7160,
        gananciaNeta: 1960,
        margenPorcentaje: 21.49
      }
    ],
    totalVenta: 39920,
    costoTotal: 31960,
    gananciaTotal: 7960,
    margenPromedio: 19.94,
    metodoPago: 'transferencia',
    notas: 'Venta a precio mayoreo cruzado con costo proveedor. Despacho directo.'
  },
  {
    id: 'v_2',
    folio: 'MAY-1002',
    fecha: '2026-09-02',
    clienteId: 'c_1',
    clienteNumero: 'CLI-001',
    clienteNombre: 'Taller y Vulcanizadora Morales',
    items: [
      {
        id: 'vi_3',
        medida: '205/55R16',
        marca: 'Michelin',
        descripcion: 'Michelin Primacy 4',
        cantidad: 8,
        costoUnitario: 1610,
        precioVentaUnitario: 2090, // Muy atractivo vs precio público 2690
        subtotal: 16720,
        costoTotal: 12880,
        gananciaNeta: 3840,
        margenPorcentaje: 22.97
      },
      {
        id: 'vi_4',
        medida: '185/65R15',
        marca: 'Goodyear',
        descripcion: 'Goodyear Assurance MaxLife',
        cantidad: 8,
        costoUnitario: 1120,
        precioVentaUnitario: 1450,
        subtotal: 11600,
        costoTotal: 8960,
        gananciaNeta: 2640,
        margenPorcentaje: 22.76
      }
    ],
    totalVenta: 28320,
    costoTotal: 21840,
    gananciaTotal: 6480,
    margenPromedio: 22.88,
    metodoPago: 'transferencia',
    notas: 'Juegos surtidos para flotilla de taxi y particulares.'
  }
];

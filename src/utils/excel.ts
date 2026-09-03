import * as XLSX from 'xlsx';
import { ProductItem, SupplierItem, CrossMatchItem, SaleRecord } from '../types';

/**
 * Normaliza cadenas de texto para comparar medidas y marcas
 */
export function normalizeString(str: string | number | undefined | null): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-');
}

/**
 * Extrae una medida de llanta o rin canónica a partir de cualquier texto (descripción, celda, código)
 * Ejemplos: "205/55R16 91V" -> "205/55R16", "205/55/16" -> "205/55R16", "205-55-16" -> "205/55R16",
 * "LT265/70R17" -> "265/70R17", "31X10.50R15" -> "31X10.5R15", "11R22.5" -> "11R22.5", "17X8" -> "17X8"
 */
export function extractMedidaFromText(text: string | number | undefined | null): string {
  if (text === null || text === undefined || text === '') return '';
  const str = String(text).toUpperCase().trim();

  // 1. Llanta estándar de auto / SUV / pickup: ej. 205/55R16, 205/55/16, 205-55-16, 205 55 16, LT265/70R17, P205/55R16, 205/55ZR16
  const stdMatch = str.match(/(?:(?:P|LT|ST|C)\s*)?(\d{3})\s*[\/\-\s]\s*(\d{2,3})\s*(?:(?:R|ZR|RF|RADIAL)\s*|[\/\-\s])\s*(\d{2}(?:\.5)?)/i);
  if (stdMatch) {
    const ancho = stdMatch[1];
    const perfil = stdMatch[2];
    const rin = stdMatch[3];
    return `${ancho}/${perfil}R${rin}`;
  }

  // 2. Llanta de flotación / todo terreno: ej. 31X10.50R15, 33X12.50R20, 35x12.5 R17, 31/10.50R15
  const flotMatch = str.match(/(\d{2})\s*[X\*\/\-\s]\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:(?:R|ZR)\s*|[\/\-\s])\s*(\d{2})/i);
  if (flotMatch) {
    const diam = flotMatch[1];
    let ancho = flotMatch[2];
    if (ancho.includes('.')) ancho = parseFloat(ancho).toString();
    const rin = flotMatch[3];
    return `${diam}X${ancho}R${rin}`;
  }

  // 3. Camión / comercial / agrícola: ej. 11R22.5, 12R22.5, 7.50R16, 7.00R15, 295/75R22.5
  const truckMatch = str.match(/(?:(?:LT|C)\s*)?(\d{1,2}(?:\.\d{1,2})?)\s*(?:R|ZR|\-)\s*(\d{2}(?:\.5)?)/i);
  if (truckMatch) {
    return `${truckMatch[1]}R${truckMatch[2]}`;
  }

  // 4. Rines: ej. 17X8, 15X6.5, 18X8.5, 17*8, 17 X 8
  const rinMatch = str.match(/(\d{2})\s*[X\*]\s*(\d{1,2}(?:\.\d{1,2})?)/i);
  if (rinMatch) {
    return `${rinMatch[1]}X${parseFloat(rinMatch[2])}`;
  }

  return '';
}

/**
 * Normaliza una medida de llanta o rin para facilitar el cruce automático 100% confiable
 * Ejemplo: "205/55 R16" -> "205/55R16", "205-55-16" -> "205/55R16", "205/55R16 91V" -> "205/55R16"
 */
export function normalizeMedida(medidaRaw: string | number | undefined | null): string {
  if (!medidaRaw) return '';
  const str = String(medidaRaw).toUpperCase().trim();
  
  // Extraer medida normalizada con regex especializada primero
  const extracted = extractMedidaFromText(str);
  if (extracted) return extracted;

  // Si no encajó en las expresiones regulares anteriores (ej. medidas especiales):
  let clean = str
    .replace(/[–—_]/g, '-')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s*[X*]\s*/g, 'X')
    .replace(/\s+R\s*/g, 'R')
    .replace(/\s+/g, '');

  clean = clean.replace(/(\d{2,3}[A-Z])$/, '');
  clean = clean.replace(/(XL|RF|LT|C)$/, '');

  return clean;
}

/**
 * Limpia y parsea valores numéricos desde celdas de Excel (remueve $, comas, espacios)
 */
export function parseNumber(val: any, defaultVal: number = 0): number {
  if (val === null || val === undefined || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const cleaned = String(val).replace(/[$€,\s]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? defaultVal : parsed;
}

/**
 * Lista de marcas reconocidas de llantas y rines en México e internacional
 */
export const KNOWN_BRANDS = [
  'BF GOODRICH', 'BFGOODRICH', 'GENERAL TIRE', 'AMERICAN RACING', 'BLACK RHINO', 
  'OZ RACING', 'XD SERIES', 'MOTO METAL', 'GT RADIAL', 'JK TYRE', 'JK TIRE',
  'MICHELIN', 'PIRELLI', 'GOODYEAR', 'CONTINENTAL', 'BRIDGESTONE', 'FIRESTONE', 
  'HANKOOK', 'YOKOHAMA', 'COOPER', 'TORNEL', 'KUMHO', 'TOYO', 'DUNLOP', 
  'NEXEN', 'MAXXIS', 'LINGLONG', 'LING LONG', 'WESTLAKE', 'TRIANGLE', 'SAILUN', 
  'JK', 'FALKEN', 'GENERAL', 'UNIROYAL', 'ROADSTONE', 'RADAR', 'STARFIRE', 
  'MASTERCRAFT', 'ROVELO', 'WANLI', 'ARIVO', 'DELINTE', 'LANDSAIL', 'HAIDA', 
  'HIFLY', 'APTANY', 'AUSTONE', 'DOUBLESTAR', 'GITI', 'KENDA', 'FEDERAL', 
  'ACHILLES', 'MIRAGE', 'SUNFULL', 'LANVIGATOR', 'BLACKLION', 'CONSTANCY', 
  'FARROAD', 'DURATURN', 'ANTARES', 'FORCEUM', 'ACCELERA', 'PRESA', 
  'OTANI', 'KAPSEN', 'HABILEAD', 'TRACMAX', 'RONAL', 'BBS', 'ENKEI', 'MOMO', 
  'OZ', 'VORSTEINER', 'TSW', 'MSW', 'METHOD', 'FUEL', 'XD', 'KMC', 'HELO', 
  'DUB', 'FOOSE', 'NICHE', 'ROTIFORM'
];

/**
 * Marcas destacadas de origen Chino reconocidas en el mercado de mayoreo
 */
export const CHINESE_BRANDS = [
  'LINGLONG', 'LING LONG', 'SAILUN', 'WESTLAKE', 'TRIANGLE', 'HAIDA', 'ARIVO', 
  'HIFLY', 'APTANY', 'AUSTONE', 'DOUBLESTAR', 'DOUBLE STAR', 'KAPSEN', 'HABILEAD', 
  'TRACMAX', 'WANLI', 'DELINTE', 'LANDSAIL', 'ROVELO', 'RADAR', 'CONSTANCY', 
  'FARROAD', 'DURATURN', 'ANTARES', 'OTANI', 'SUNFULL', 'LANVIGATOR', 'BLACKLION', 
  'MIRAGE', 'FORCEUM', 'ACCELERA', 'PRESA', 'GITI', 'DOUBLE KING', 'DOUBLEKING', 
  'ANNAITE', 'HILO', 'GOLDLINE', 'ROADWING', 'AMBERSTONE', 'GOODRIDE', 'CHAOYANG', 
  'PRINX', 'FORTUNE', 'JOYROAD', 'THREE-A', 'THREE A', 'ZETA', 'WATERFALL', 
  'OVATION', 'ROYAL BLACK', 'ROYALBLACK', 'COMPASAL', 'TOURADOR', 'FIREMAX', 
  'GRENLANDER', 'GREENLANDER', 'RAPID', 'RYDANZ', 'WINDFORCE', 'APLUS', 'MILEKING', 
  'MILESTONE', 'SUNNY', 'FULLRUN', 'HEADWAY', 'ROADCLAW', 'ROADCRUZA', 'LUXSAN', 
  'COMFORSER', 'ROADSHINE', 'LONGMARCH', 'BOTO', 'DERUIBO', 'JINYU', 'AGATE', 
  'LUISTONE', 'ROADBOSS', 'CROSSWIND', 'MAZZINI', 'LEAO', 'ATLAS', 'CENTARA', 
  'ROADMARCH', 'SPORTRAK', 'GREMAX', 'WINRUN', 'EVERGREEN', 'HORIZON', 'POWERTRAC', 
  'TERRAKING', 'LANDSPIDER', 'FRONWAY', 'INVITRO', 'ROADLUX', 'TAITONG', 'ROADONE', 
  'KETER', 'INTERTRAC', 'NEOLIN', 'DOUBLE COIN'
];

/**
 * Marcas occidentales o nacionales tradicionales (no chinas)
 */
export const WESTERN_NATIONAL_BRANDS = [
  'MICHELIN', 'GOODYEAR', 'BRIDGESTONE', 'CONTINENTAL', 'PIRELLI', 'FIRESTONE', 
  'TORNEL', 'BF GOODRICH', 'BFGOODRICH', 'GENERAL TIRE', 'COOPER', 'DUNLOP', 
  'YOKOHAMA', 'TOYO', 'HANKOOK', 'KUMHO', 'FALKEN', 'UNIROYAL', 'COOPER TIRES',
  'MAXXIS', 'NEXEN', 'BFG', 'GENERAL', 'ROADSTONE'
];

/**
 * Normaliza y detecta el origen de un producto
 */
export function detectProductOrigin(rawOrigen: string, marca: string = '', modelo: string = ''): string {
  if (rawOrigen && typeof rawOrigen === 'string') {
    const clean = rawOrigen.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (
      clean.includes('CHIN') || 
      clean === 'CN' || 
      clean.includes('PRC') || 
      clean.includes('P.R.C') || 
      clean.includes('IMP') || 
      clean.includes('ASIA') || 
      clean.includes('ORIENT')
    ) {
      return 'CHINO';
    }
    if (clean.includes('NACIONAL') || clean.includes('MEX') || clean.includes('HECHO EN MEXICO')) {
      return 'NACIONAL';
    }
    if (clean.includes('USA') || clean.includes('AMERICAN')) {
      return 'AMERICANO';
    }
    if (clean.includes('JAPON') || clean.includes('JP')) {
      return 'JAPONES';
    }
    if (clean.length > 0) {
      return clean;
    }
  }

  // Si no se especificó columna Origen en el archivo Excel:
  const combined = `${marca} ${modelo}`.toUpperCase();
  
  // 1. Si coincide con una marca china conocida
  for (const cb of CHINESE_BRANDS) {
    if (combined.includes(cb)) {
      return 'CHINO';
    }
  }

  // 2. Si coincide con una marca tradicional occidental/nacional
  for (const wb of WESTERN_NATIONAL_BRANDS) {
    if (combined.includes(wb)) {
      return 'NACIONAL';
    }
  }

  // 3. En caso de marcas no catalogadas o genéricas, por defecto se considera CHINO
  // para permitir el cruce inmediato con el proveedor de llantas chinas
  return 'CHINO';
}

/**
 * Intenta deducir la marca a partir del texto de descripción o modelo si no viene una columna de Marca explícita
 */
export function extractBrandFromText(text: string): string | null {
  if (!text) return null;
  const upper = text.toUpperCase();
  for (const brand of KNOWN_BRANDS) {
    // Buscar palabra completa de la marca
    const regex = new RegExp(`(^|[^A-Z0-9])${brand.replace(/\s+/g, '\\s+')}([^A-Z0-9]|$)`, 'i');
    if (regex.test(upper)) {
      return brand;
    }
  }
  return null;
}

/**
 * Parsea un archivo Excel de inventario propio detectando automáticamente la fila de encabezados
 */
export async function parseMyInventoryExcel(file: File): Promise<ProductItem[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Detección inteligente de la fila de encabezados (por si el Excel tiene 1-3 filas de títulos arriba)
  const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(rawMatrix.length, 12); r++) {
    const rowValues = (rawMatrix[r] || []).map(v => String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
    const hasKey = rowValues.some(v => 
      v.includes('medida') || v.includes('desc') || v.includes('codigo') || v.includes('clave') || 
      v.includes('costo') || v.includes('precio') || v.includes('existencia') || v.includes('marca') ||
      v.includes('articulo') || v.includes('producto') || v.includes('tamano') || v.includes('rin')
    );
    if (hasKey) {
      headerRowIndex = r;
      break;
    }
  }

  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });
  const products: ProductItem[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const keys = Object.keys(row);

    // Búsqueda inteligente de columnas con prioridad a coincidencias exactas
    const findKey = (candidates: string[]) => {
      // 1. Coincidencia exacta primero
      for (const candidate of candidates) {
        const foundExact = keys.find(k => {
          const clean = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          return clean === candidate;
        });
        if (foundExact) return foundExact;
      }
      // 2. Coincidencia por inclusión según orden de prioridad
      for (const candidate of candidates) {
        const found = keys.find(k => {
          const clean = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          return clean.includes(candidate);
        });
        if (found) return found;
      }
      return undefined;
    };

    // Detección de columnas
    const codigoKey = findKey(['clave', 'codigo', 'sku', 'ref', 'articulo', 'id', 'item', 'num']);
    const descKey = findKey(['descripcion', 'desc', 'producto', 'nombre', 'detalle', 'concepto', 'articulo']);
    const existenciaKey = findKey(['existencia', 'stock', 'cant', 'cantidad', 'piezas', 'unidades', 'qty', 'inventario']);
    const costoKey = findKey(['costo compra', 'precio compra', 'costo unitario', 'costo', 'compra', 'cost', 'c.compra', 'p.compra']);
    const precioKey = findKey(['precio publico', 'precio lista', 'precio vta', 'precio venta', 'p.publico', 'publico', 'precio', 'venta', 'p.vta']);
    const medidaKey = findKey(['medida', 'medidas', 'dimension', 'rin', 'size', 'tamano', 'especificacion', 'med']);
    const modeloKey = findKey(['modelo', 'model', 'linea', 'diseno', 'patron']);
    const marcaKey = findKey(['marca', 'brand', 'fabricante']);
    const origenKey = findKey(['origen', 'pais', 'procedencia', 'fabricacion', 'nacionalidad', 'origen producto', 'tipo', 'clasificacion', 'categoria', 'linea', 'origen (chino/nacional)', 'pais origen', 'proc']);

    const rawMedida = medidaKey ? row[medidaKey] : '';
    const rawMarca = marcaKey ? row[marcaKey] : '';
    const rawModelo = modeloKey ? row[modeloKey] : '';
    const rawDesc = descKey ? row[descKey] : '';
    const rawOrigen = origenKey ? String(row[origenKey]) : '';

    // Extraer medida limpia usando extractor inteligente
    let medida = String(rawMedida || '').trim();
    const cleanMedida = extractMedidaFromText(medida) || extractMedidaFromText(rawDesc) || extractMedidaFromText(rawModelo);
    if (cleanMedida) {
      medida = cleanMedida;
    } else if (!medida) {
      medida = String(rawDesc || '').trim();
    }

    if (!medida && !rawMarca && !rawDesc) continue; // Saltar filas vacías

    const codigo = String((codigoKey && row[codigoKey]) || `PRD-${i + 1}`).trim();
    
    // Si no hay columna de marca explícita, buscar en modelo o descripción
    let marca = String(rawMarca || '').trim();
    if (!marca) {
      const detectedFromDesc = extractBrandFromText(String(rawDesc));
      const detectedFromModelo = extractBrandFromText(String(rawModelo));
      marca = detectedFromDesc || detectedFromModelo || String(rawModelo || 'GENÉRICA').trim();
    }

    // Armar descripción completa
    let descripcion = String(rawDesc || '').trim();
    if (!descripcion) {
      descripcion = `${marca} ${rawModelo ? rawModelo + ' ' : ''}${medida}`.trim();
    } else if (rawModelo && !descripcion.toLowerCase().includes(String(rawModelo).toLowerCase())) {
      descripcion = `${descripcion} (${rawModelo})`;
    }

    const costoCompra = parseNumber(costoKey ? row[costoKey] : 0);
    const existencia = Math.max(0, Math.round(parseNumber(existenciaKey ? row[existenciaKey] : 0)));
    const precioPublico = parseNumber(precioKey ? row[precioKey] : (costoCompra > 0 ? costoCompra * 1.35 : 0));
    const origen = detectProductOrigin(rawOrigen, marca, rawModelo || descripcion);

    products.push({
      id: `p_${Date.now()}_${i}`,
      codigo,
      medida,
      marca,
      descripcion,
      origen,
      costoCompra,
      existencia,
      precioPublico,
      fechaActualizacion: new Date().toISOString().split('T')[0]
    });
  }

  return products;
}

/**
 * Parsea un archivo Excel de inventario de proveedor detectando encabezados y extrayendo medidas limpias
 */
export async function parseSupplierInventoryExcel(file: File, defaultSupplierName: string = 'Proveedor Principal'): Promise<SupplierItem[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Detección inteligente de encabezados
  const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(rawMatrix.length, 12); r++) {
    const rowValues = (rawMatrix[r] || []).map(v => String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
    const hasKey = rowValues.some(v => 
      v.includes('medida') || v.includes('desc') || v.includes('codigo') || v.includes('clave') || 
      v.includes('costo') || v.includes('precio') || v.includes('existencia') || v.includes('marca') ||
      v.includes('articulo') || v.includes('disponibilidad') || v.includes('stock') || v.includes('mayoreo')
    );
    if (hasKey) {
      headerRowIndex = r;
      break;
    }
  }

  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });
  const supplierItems: SupplierItem[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const keys = Object.keys(row);

    const findKey = (candidates: string[]) => {
      for (const candidate of candidates) {
        const foundExact = keys.find(k => {
          const clean = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          return clean === candidate;
        });
        if (foundExact) return foundExact;
      }
      for (const candidate of candidates) {
        const found = keys.find(k => {
          const clean = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          return clean.includes(candidate);
        });
        if (found) return found;
      }
      return undefined;
    };

    const codigoKey = findKey(['clave', 'codigo', 'sku', 'ref', 'articulo', 'id', 'item', 'num']);
    const descKey = findKey(['descripcion', 'desc', 'producto', 'nombre', 'detalle', 'concepto', 'articulo']);
    const existenciaKey = findKey(['existencia', 'stock', 'cant', 'cantidad', 'piezas', 'disponibilidad', 'qty', 'unidades']);
    const costoKey = findKey(['costo', 'precio', 'mayoreo', 'cost', 'distribuidor', 'p.compra', 'precio prov', 'costo prov', 'neto']);
    const medidaKey = findKey(['medida', 'medidas', 'dimension', 'rin', 'size', 'tamano', 'especificacion', 'med']);
    const modeloKey = findKey(['modelo', 'model', 'linea', 'diseno', 'patron']);
    const marcaKey = findKey(['marca', 'brand', 'fabricante']);
    const provKey = findKey(['proveedor', 'distribuidor', 'origen', 'empresa']);

    const rawMedida = medidaKey ? row[medidaKey] : '';
    const rawMarca = marcaKey ? row[marcaKey] : '';
    const rawModelo = modeloKey ? row[modeloKey] : '';
    const rawDesc = descKey ? row[descKey] : '';

    // Extraer medida limpia
    let medida = String(rawMedida || '').trim();
    const cleanMedida = extractMedidaFromText(medida) || extractMedidaFromText(rawDesc) || extractMedidaFromText(rawModelo);
    if (cleanMedida) {
      medida = cleanMedida;
    } else if (!medida) {
      medida = String(rawDesc || '').trim();
    }

    if (!medida && !rawMarca && !rawDesc) continue;

    const codigo = String((codigoKey && row[codigoKey]) || `PROV-${i + 1}`).trim();
    
    let marca = String(rawMarca || '').trim();
    if (!marca) {
      const detectedFromDesc = extractBrandFromText(String(rawDesc));
      const detectedFromModelo = extractBrandFromText(String(rawModelo));
      marca = detectedFromDesc || detectedFromModelo || String(rawModelo || 'GENÉRICA').trim();
    }

    let descripcion = String(rawDesc || `${marca} ${medida}`).trim();
    if (rawModelo && !descripcion.toLowerCase().includes(String(rawModelo).toLowerCase())) {
      descripcion = `${descripcion} (${rawModelo})`;
    }

    const costoProveedor = parseNumber(costoKey ? row[costoKey] : 0);
    const existenciaProveedor = Math.max(0, Math.round(parseNumber(existenciaKey ? row[existenciaKey] : 0)));
    const proveedorNombre = String((provKey && row[provKey]) || defaultSupplierName).trim();

    supplierItems.push({
      id: `s_${Date.now()}_${i}`,
      codigo,
      medida,
      marca,
      descripcion,
      origen: 'CHINO', // El catálogo del proveedor es 100% de origen chino
      costoProveedor,
      existenciaProveedor,
      proveedorNombre,
      fechaCarga: new Date().toISOString().split('T')[0]
    });
  }

  return supplierItems;
}

/**
 * Exporta el inventario propio a archivo Excel
 */
export function exportMyInventoryToExcel(products: ProductItem[]) {
  const rows = products.map(p => ({
    'Código / Clave': p.codigo,
    'Medida': p.medida,
    'Marca': p.marca,
    'Descripción': p.descripcion,
    'Origen': p.origen || 'N/D',
    'Costo de Compra ($)': p.costoCompra,
    'Existencia (Pzas)': p.existencia,
    'Precio Público ($)': p.precioPublico,
    'Valor en Inventario ($)': p.costoCompra * p.existencia,
    'Fecha Actualización': p.fechaActualizacion
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mi Inventario');
  XLSX.writeFile(workbook, `Mi_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exporta el inventario del proveedor a archivo Excel
 */
export function exportSupplierInventoryToExcel(suppliers: SupplierItem[]) {
  const rows = suppliers.map(s => ({
    'Código Proveedor': s.codigo,
    'Medida': s.medida,
    'Marca': s.marca,
    'Descripción': s.descripcion,
    'Origen': s.origen || 'CHINO',
    'Costo Proveedor ($)': s.costoProveedor,
    'Disponibilidad (Pzas)': s.existenciaProveedor,
    'Nombre del Proveedor': s.proveedorNombre,
    'Fecha Carga': s.fechaCarga
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Proveedor');
  XLSX.writeFile(workbook, `Inventario_Proveedor_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exporta el reporte detallado de Cruce de Inventarios y Oportunidades de Mayoreo
 */
export function exportCrossAnalysisToExcel(crossItems: CrossMatchItem[], targetMargin: number) {
  const rows = crossItems.map(item => {
    const oportunidadTexto = {
      muy_favorable: 'Oportunidad Excelente (Prov. mucho más barato)',
      favorable: 'Favorable (Ahorro en costo proveedor)',
      neutro: 'Costos Similares',
      desfavorable: 'Mi Inventario Más Barato',
      solo_propio: 'Exclusiva en Mi Almacén',
      solo_proveedor: 'Solo en Proveedor'
    }[item.oportunidad] || item.oportunidad;

    const tipoCoincidenciaTexto = item.tipoCoincidencia === 'cruce_directo'
      ? 'Cruce Directo con Proveedor'
      : item.tipoCoincidencia === 'exclusivo_propio'
        ? 'Exclusiva de Mi Almacén (No en lista prov.)'
        : 'Solo en Proveedor';

    const comparativaVentaTexto = item.comparativaVenta === 'mi_inventario_mejor_precio'
      ? 'Mi Inventario a Mejor Precio que Proveedor'
      : item.comparativaVenta === 'mismo_precio'
        ? 'Mismo Precio que Lista Proveedor'
        : item.comparativaVenta === 'exclusivo_sin_competencia'
          ? 'Exclusiva Sin Competencia de Proveedor'
          : item.comparativaVenta === 'proveedor_mas_barato'
            ? 'Proveedor Más Barato (Surtirse o Ajustar Margen)'
            : 'Solo Proveedor';

    return {
      'Medida': item.medidaDisplay,
      'Marca': item.marcaDisplay,
      'Origen': item.origenDisplay || 'CHINO',
      'Coincidencia Venta': item.esCoincidencia ? 'SÍ' : 'NO',
      'Tipo Coincidencia': tipoCoincidenciaTexto,
      'Comparativa de Venta': comparativaVentaTexto,
      'Mi Costo ($)': item.miCosto > 0 ? item.miCosto : 'N/D',
      'Costo Proveedor ($)': item.costoProveedor > 0 ? item.costoProveedor : 'No en lista',
      'Diferencia de Costo ($)': item.diferenciaCosto,
      'Ahorro en Costo (%)': item.ahorroPorcentaje ? `${item.ahorroPorcentaje.toFixed(1)}%` : '0%',
      'Mi Existencia (Pzas)': item.miExistencia,
      'Existencia Proveedor (Pzas)': item.existenciaProveedor,
      'Estatus Stock Proveedor': item.productoProveedor 
        ? (item.existenciaProveedor >= 4 ? 'Confiable (≥4 pzas)' : `Stock bajo (${item.existenciaProveedor} pzas)`) 
        : (item.descartadoPorBajoStock ? `Descartado (<4 pzas - saldo de ${item.existenciaProveedorBaja} pzas)` : 'No en lista de proveedor'),
      'Precio Público ($)': item.precioPublico > 0 ? item.precioPublico : 'N/D',
      [`Precio Sugerido Mayoreo (${targetMargin}%) ($)`]: item.precioSugeridoMayoreo,
      'Margen Proyectado Mayoreo (%)': `${item.margenEstimadoMayoreo.toFixed(1)}%`,
      'Ganancia Estimada por Pza ($)': item.gananciaEstimadaPorUnidad,
      'Diagnóstico Oportunidad': oportunidadTexto,
      'Recomendación': item.recomendacion
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cruce Mayoreo');
  XLSX.writeFile(workbook, `Reporte_Cruce_Mayoreo_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exporta el reporte detallado de Ventas con análisis de márgenes
 */
export function exportSalesToExcel(sales: SaleRecord[]) {
  const rows: any[] = [];

  sales.forEach(sale => {
    sale.items.forEach(item => {
      rows.push({
        'Folio Venta': sale.folio,
        'Fecha': sale.fecha,
        'Número de Cliente': sale.clienteNumero,
        'Nombre del Cliente': sale.clienteNombre,
        'Medida': item.medida,
        'Marca': item.marca,
        'Descripción': item.descripcion,
        'Cantidad': item.cantidad,
        'Costo Unitario ($)': item.costoUnitario,
        'Precio Venta Unitario ($)': item.precioVentaUnitario,
        'Subtotal Venta ($)': item.subtotal,
        'Costo Total Mercancía ($)': item.costoTotal,
        'Ganancia Neta ($)': item.gananciaNeta,
        'Margen de Ganancia (%)': `${item.margenPorcentaje.toFixed(1)}%`,
        'Método de Pago': sale.metodoPago,
        'Notas': sale.notas || ''
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalle de Ventas');
  XLSX.writeFile(workbook, `Reporte_Ventas_Mayoreo_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Genera plantillas de ejemplo en Excel para que el usuario pueda descargarlas y cargarlas
 */
export function downloadExcelTemplate(type: 'propio' | 'proveedor') {
  if (type === 'propio') {
    const sampleData = [
      {
        'Clave': 'LL-2055516-SAI',
        'Medida': '205/55R16',
        'Marca': 'Sailun',
        'Modelo': 'Atrezzo Elite',
        'Descripcion': 'Sailun Atrezzo Elite 91V',
        'Origen': 'CHINO', // <-- Indicador de origen chino para cruce
        'Costo': 1180,
        'Existencia': 24,
        'Precio Publico': 1750
      },
      {
        'Clave': 'LL-2254517-LIN',
        'Medida': '225/45R17',
        'Marca': 'Linglong',
        'Modelo': 'Sport Master',
        'Descripcion': 'Linglong Sport Master 94W',
        'Origen': 'CHINO', // <-- Indicador de origen chino para cruce
        'Costo': 1350,
        'Existencia': 16,
        'Precio Publico': 1990
      },
      {
        'Clave': 'LL-1856515-WES',
        'Medida': '185/65R15',
        'Marca': 'Westlake',
        'Modelo': 'ZuperEco Z-107',
        'Descripcion': 'Westlake ZuperEco Z-107 88H',
        'Origen': 'CHINO', // <-- Indicador de origen chino para cruce
        'Costo': 940,
        'Existencia': 32,
        'Precio Publico': 1390
      },
      {
        'Clave': 'LL-2055516-MIC',
        'Medida': '205/55R16',
        'Marca': 'Michelin',
        'Modelo': 'Primacy 4',
        'Descripcion': 'Michelin Primacy 4 91V',
        'Origen': 'NACIONAL', // <-- No se cruza con proveedor chino
        'Costo': 1850,
        'Existencia': 8,
        'Precio Publico': 2690
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Mi Inventario');
    XLSX.writeFile(wb, 'Plantilla_Mi_Inventario.xlsx');
  } else {
    const sampleData = [
      {
        'Codigo': 'PROV-SAI-2055516',
        'Medida': '205/55R16',
        'Marca': 'Sailun',
        'Modelo': 'Atrezzo Elite',
        'Descripcion': 'Sailun Atrezzo Elite 91V',
        'Origen': 'CHINO',
        'Costo Proveedor': 1050,
        'Existencia': 60,
        'Proveedor': 'Mayorista de Importación Directa'
      },
      {
        'Codigo': 'PROV-LIN-2254517',
        'Medida': '225/45R17',
        'Marca': 'Linglong',
        'Modelo': 'Sport Master',
        'Descripcion': 'Linglong Sport Master 94W',
        'Origen': 'CHINO',
        'Costo Proveedor': 1210,
        'Existencia': 40,
        'Proveedor': 'Mayorista de Importación Directa'
      },
      {
        'Codigo': 'PROV-WES-1856515',
        'Medida': '185/65R15',
        'Marca': 'Westlake',
        'Modelo': 'Z-107',
        'Descripcion': 'Westlake Z-107 88H',
        'Origen': 'CHINO',
        'Costo Proveedor': 840,
        'Existencia': 80,
        'Proveedor': 'Mayorista de Importación Directa'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Proveedor');
    XLSX.writeFile(wb, 'Plantilla_Inventario_Proveedor.xlsx');
  }
}

/**
 * Genera un archivo Excel maestro completo con múltiples hojas:
 * 1. Cruce y Oportunidades Mayoreo
 * 2. Mi Inventario
 * 3. Inventario Proveedor
 * 4. Registro de Ventas
 */
export function exportFullMasterReportToExcel(
  products: ProductItem[],
  suppliers: SupplierItem[],
  crossItems: CrossMatchItem[],
  sales: SaleRecord[]
) {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Cruce de Mayoreo
  if (crossItems.length > 0) {
    const crossRows = crossItems.map(item => {
      const tipoCoincidenciaTexto = item.tipoCoincidencia === 'cruce_directo'
        ? 'Cruce Directo'
        : item.tipoCoincidencia === 'exclusivo_propio'
          ? 'Exclusiva en Mi Almacén (No en lista prov.)'
          : 'Solo Proveedor';

      const comparativaVentaTexto = item.comparativaVenta === 'mi_inventario_mejor_precio'
        ? 'Mi Inventario a Mejor Precio'
        : item.comparativaVenta === 'mismo_precio'
          ? 'Mismo Precio que Proveedor'
          : item.comparativaVenta === 'exclusivo_sin_competencia'
            ? 'Exclusiva Sin Competencia'
            : item.comparativaVenta === 'proveedor_mas_barato'
              ? 'Proveedor Más Barato (Compra)'
              : 'Solo Proveedor';

      return {
        'Medida': item.medidaDisplay,
        'Marca': item.marcaDisplay,
        'Origen': item.origenDisplay || 'CHINO',
        'Coincidencia Venta': item.esCoincidencia ? 'SÍ' : 'NO',
        'Tipo Coincidencia': tipoCoincidenciaTexto,
        'Comparativa Venta': comparativaVentaTexto,
        'Mi Costo ($)': item.miCosto > 0 ? item.miCosto : 'N/D',
        'Costo Proveedor ($)': item.costoProveedor > 0 ? item.costoProveedor : 'No en lista',
        'Diferencia ($)': item.diferenciaCosto,
        'Ahorro (%)': item.ahorroPorcentaje ? `${item.ahorroPorcentaje.toFixed(1)}%` : '0%',
        'Mi Existencia': item.miExistencia,
        'Existencia Proveedor': item.existenciaProveedor,
        'Precio Público ($)': item.precioPublico > 0 ? item.precioPublico : 'N/D',
        'Precio Sugerido Mayoreo ($)': item.precioSugeridoMayoreo,
        'Margen Est. Mayoreo (%)': `${item.margenEstimadoMayoreo.toFixed(1)}%`,
        'Ganancia Est. por Pza ($)': item.gananciaEstimadaPorUnidad,
        'Diagnóstico': item.oportunidad,
        'Recomendación': item.recomendacion
      };
    });
    const wsCross = XLSX.utils.json_to_sheet(crossRows);
    XLSX.utils.book_append_sheet(workbook, wsCross, 'Cruce Mayoreo (Chino)');
  }

  // Hoja 2: Mi Inventario
  if (products.length > 0) {
    const prodRows = products.map(p => ({
      'Código': p.codigo,
      'Medida': p.medida,
      'Marca': p.marca,
      'Descripción': p.descripcion,
      'Origen': p.origen || 'N/D',
      'Costo Compra ($)': p.costoCompra,
      'Existencia': p.existencia,
      'Precio Público ($)': p.precioPublico,
      'Valor Inventario ($)': p.costoCompra * p.existencia
    }));
    const wsProd = XLSX.utils.json_to_sheet(prodRows);
    XLSX.utils.book_append_sheet(workbook, wsProd, 'Mi Inventario');
  }

  // Hoja 3: Inventario Proveedor
  if (suppliers.length > 0) {
    const suppRows = suppliers.map(s => ({
      'Código': s.codigo,
      'Medida': s.medida,
      'Marca': s.marca,
      'Descripción': s.descripcion,
      'Origen': s.origen || 'CHINO',
      'Costo Proveedor ($)': s.costoProveedor,
      'Existencia': s.existenciaProveedor,
      'Proveedor': s.proveedorNombre
    }));
    const wsSupp = XLSX.utils.json_to_sheet(suppRows);
    XLSX.utils.book_append_sheet(workbook, wsSupp, 'Inventario Proveedor (Chino)');
  }

  // Hoja 4: Ventas
  if (sales.length > 0) {
    const saleRows: any[] = [];
    sales.forEach(sale => {
      sale.items.forEach(item => {
        saleRows.push({
          'Folio': sale.folio,
          'Fecha': sale.fecha,
          'Cliente ID': sale.clienteNumero,
          'Cliente': sale.clienteNombre,
          'Medida': item.medida,
          'Marca': item.marca,
          'Cantidad': item.cantidad,
          'Costo Unitario ($)': item.costoUnitario,
          'Precio Venta Unitario ($)': item.precioVentaUnitario,
          'Subtotal ($)': item.subtotal,
          'Ganancia Neta ($)': item.gananciaNeta,
          'Margen (%)': `${item.margenPorcentaje.toFixed(1)}%`,
          'Método Pago': sale.metodoPago
        });
      });
    });
    const wsSales = XLSX.utils.json_to_sheet(saleRows);
    XLSX.utils.book_append_sheet(workbook, wsSales, 'Ventas Mayoreo');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Reporte_Maestro_Llantera_${dateStr}.xlsx`);
}


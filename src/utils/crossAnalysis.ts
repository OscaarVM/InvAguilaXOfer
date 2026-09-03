import { ProductItem, SupplierItem, CrossMatchItem, OpportunityType } from '../types';
import { normalizeMedida, normalizeString, detectProductOrigin } from './excel';

export interface CrossMatchOptions {
  targetMarginPercent: number; // e.g., 20%
  matchMode: 'exact' | 'medida_only'; // exact = medida + marca; medida_only = misma medida (predeterminado)
  costBase: 'proveedor' | 'propio' | 'menor'; // base cost for calculating wholesale price
  onlyChineseOrigin?: boolean; // Por defecto TRUE: Cruce exclusivo de producto de origen CHINO
  minSupplierStock?: number; // Por defecto 4: Solo compara si existencia del proveedor es >= 4 piezas (evita saldos/costos viejos)
}

/**
 * Determina si el origen indicado corresponde a producto Chino
 */
export function isChineseOrigin(origen?: string, marca: string = '', descripcion: string = ''): boolean {
  if (origen) {
    const clean = origen.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (
      clean.includes('CHIN') || 
      clean === 'CN' || 
      clean.includes('PRC') || 
      clean.includes('P.R.C') || 
      clean.includes('IMP') || 
      clean.includes('ASIA') || 
      clean.includes('ORIENT')
    ) {
      return true;
    }
    if (clean.includes('NACIONAL') || clean.includes('MEX') || clean.includes('USA') || clean.includes('AMERICAN')) {
      return false;
    }
  }
  // Si no tiene origen explícito o es ambiguo, revisar con el detector de marcas
  return detectProductOrigin(origen || '', marca, descripcion) === 'CHINO';
}

export function computeCrossAnalysis(
  myProducts: ProductItem[],
  supplierItems: SupplierItem[],
  options: CrossMatchOptions = { targetMarginPercent: 20, matchMode: 'medida_only', costBase: 'menor', onlyChineseOrigin: true, minSupplierStock: 4 }
): CrossMatchItem[] {
  const result: CrossMatchItem[] = [];
  const processedSupplierIds = new Set<string>();
  const minStock = options.minSupplierStock ?? 4;

  // REGLA FUNDAMENTAL SOLICITADA POR EL USUARIO:
  // "SOLO COMPARE LA MEDIDA DE MI INVENTARIO DE ORIGEN CHINO CONTRA LA MEDIDA DEL INVENTARIO DEL PROVEEDOR"
  const filterByChina = options.onlyChineseOrigin !== false;
  
  // Filtrar productos propios por origen CHINO
  let productsToAnalyze = filterByChina
    ? myProducts.filter(prod => isChineseOrigin(prod.origen, prod.marca, prod.descripcion))
    : myProducts;

  // Si no se encontraron productos chinos explícitos pero hay productos en inventario,
  // usar todos los productos para garantizar que el usuario no se quede sin cruce si su archivo no tenía columna ORIGEN
  if (filterByChina && productsToAnalyze.length === 0 && myProducts.length > 0) {
    productsToAnalyze = myProducts;
  }

  // Iterar sobre mis productos (de origen Chino)
  productsToAnalyze.forEach((prod) => {
    const normMedida = normalizeMedida(prod.medida);
    const normMarca = normalizeString(prod.marca);

    // Encontrar todas las opciones del proveedor que tengan EXACTAMENTE LA MISMA MEDIDA
    const allSuppliersWithMedida = supplierItems.filter(s => 
      normalizeMedida(s.medida) === normMedida
    );

    // CONDICIÓN ESPECÍFICA SOLICITADA:
    // "hacer la comparacion de costos siempre y cuando la existencia del proveedor sea igual o mayor a 4 piezas.
    // Muchas veces cuando marca 1 pieza en existencia, es un costo viejo, ya asi podemos ver un analisis mas certero"
    const eligibleSuppliers = allSuppliersWithMedida.filter(s => 
      minStock <= 0 || s.existenciaProveedor >= minStock
    );

    const lowStockSuppliers = allSuppliersWithMedida.filter(s => 
      minStock > 0 && s.existenciaProveedor < minStock
    );

    // Buscar coincidencia en el catálogo del proveedor (100% Chino) entre los que tienen existencia confiable
    let matchedSupplier: SupplierItem | undefined;

    if (options.matchMode === 'exact') {
      // Modo estricto: Misma Medida Y Misma Marca
      matchedSupplier = eligibleSuppliers.find(s => 
        !processedSupplierIds.has(s.id) &&
        (normalizeString(s.marca) === normMarca || normMarca.includes(normalizeString(s.marca)) || normalizeString(s.marca).includes(normMarca))
      );
      if (!matchedSupplier && eligibleSuppliers.length === 1 && !processedSupplierIds.has(eligibleSuppliers[0].id)) {
        matchedSupplier = eligibleSuppliers[0];
      }
    } else {
      // MODO PREDETERMINADO: "SOLO MEDIDA"
      // "RECUERDA QUE SOLO COMPARE LA MEDIDA DE MI INVENTARIO DE ORIGEN CHINO CONTRA LA MEDIDA DEL INVENTARIO DEL PROVEEDOR"
      const availableMatches = eligibleSuppliers.filter(s => !processedSupplierIds.has(s.id));
      const pool = availableMatches.length > 0 ? availableMatches : eligibleSuppliers;

      if (pool.length > 0) {
        // 1) Si alguna opción del proveedor coincide además en marca, preferirla:
        const sameBrand = pool.find(s => 
          normalizeString(s.marca) === normMarca || 
          normMarca.includes(normalizeString(s.marca)) || 
          normalizeString(s.marca).includes(normMarca)
        );

        if (sameBrand) {
          matchedSupplier = sameBrand;
        } else {
          // 2) Si no, seleccionar la opción con el mejor costo de compra (más barato del proveedor para esa medida)
          matchedSupplier = [...pool].sort((a, b) => a.costoProveedor - b.costoProveedor)[0];
        }
      }
    }

    if (matchedSupplier) {
      processedSupplierIds.add(matchedSupplier.id);
    }

    const miCosto = prod.costoCompra;
    const costoProveedor = matchedSupplier ? matchedSupplier.costoProveedor : 0;
    const diferenciaCosto = costoProveedor > 0 ? (miCosto - costoProveedor) : 0;
    const ahorroPorcentaje = (miCosto > 0 && costoProveedor > 0) ? ((miCosto - costoProveedor) / miCosto) * 100 : 0;

    // Determinar costo base para mayoreo
    let baseCost = miCosto;
    if (options.costBase === 'proveedor' && costoProveedor > 0) {
      baseCost = costoProveedor;
    } else if (options.costBase === 'menor' && costoProveedor > 0) {
      baseCost = Math.min(miCosto, costoProveedor);
    }

    // Precio sugerido de mayoreo con margen objetivo: Precio = Costo / (1 - margen%)
    const marginDec = Math.min(0.9, Math.max(0.01, options.targetMarginPercent / 100));
    const precioSugeridoMayoreo = Math.round(baseCost / (1 - marginDec));
    const gananciaEstimadaPorUnidad = precioSugeridoMayoreo - baseCost;
    const margenEstimadoMayoreo = precioSugeridoMayoreo > 0 
      ? ((gananciaEstimadaPorUnidad / precioSugeridoMayoreo) * 100) 
      : 0;

    // Clasificar oportunidad y comparativa de venta
    let oportunidad: OpportunityType = 'solo_propio';
    let tipoCoincidencia: 'cruce_directo' | 'exclusivo_propio' | 'solo_proveedor' = 'exclusivo_propio';
    let comparativaVenta: 'mi_inventario_mejor_precio' | 'mismo_precio' | 'proveedor_mas_barato' | 'exclusivo_sin_competencia' | 'solo_proveedor' = 'exclusivo_sin_competencia';
    let recomendacion = '';

    const hadLowStockDiscarded = !matchedSupplier && lowStockSuppliers.length > 0;
    const maxLowStockPzas = hadLowStockDiscarded 
      ? Math.max(...lowStockSuppliers.map(s => s.existenciaProveedor))
      : 0;

    if (matchedSupplier) {
      tipoCoincidencia = 'cruce_directo';
      if (diferenciaCosto < 0) {
        // Mi inventario propio es MÁS BARATO que el proveedor
        oportunidad = 'desfavorable';
        comparativaVenta = 'mi_inventario_mejor_precio';
        recomendacion = `¡Con tu inventario vendes a MEJOR precio que el proveedor! Tu costo ($${miCosto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}) es $${Math.abs(diferenciaCosto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} más bajo que el proveedor ($${costoProveedor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}). Vende a precio sugerido de $${precioSugeridoMayoreo.toLocaleString('es-MX', { minimumFractionDigits: 2 })} para ganar al cliente con ${margenEstimadoMayoreo.toFixed(1)}% de margen.`;
      } else if (Math.abs(diferenciaCosto) <= (miCosto * 0.03)) {
        // Costos muy similares
        oportunidad = 'neutro';
        comparativaVenta = 'mismo_precio';
        recomendacion = `¡Puedes vender al MISMO precio que la lista del proveedor! Costos a la par ($${miCosto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} vs $${costoProveedor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}). Tu ventaja competitiva es entrega inmediata desde tu almacén (${prod.existencia} pzas).`;
      } else if (diferenciaCosto > (miCosto * 0.10)) {
        // Proveedor significativamente más barato
        oportunidad = 'muy_favorable';
        comparativaVenta = 'proveedor_mas_barato';
        recomendacion = `Proveedor $${diferenciaCosto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} más barato (${ahorroPorcentaje.toFixed(1)}% ahorro con stock verificado de ${matchedSupplier.existenciaProveedor} pzas). Para vender al mismo o mejor precio que la lista del proveedor, surtirte con él o fijar mayoreo a $${precioSugeridoMayoreo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`;
      } else {
        // Proveedor ligeramente más barato
        oportunidad = 'favorable';
        comparativaVenta = 'proveedor_mas_barato';
        recomendacion = `Proveedor $${diferenciaCosto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} más económico con ${matchedSupplier.existenciaProveedor} pzas. Puedes vender al mismo o mejor precio con margen sugerido de $${precioSugeridoMayoreo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`;
      }
    } else if (hadLowStockDiscarded) {
      tipoCoincidencia = 'exclusivo_propio';
      comparativaVenta = 'exclusivo_sin_competencia';
      oportunidad = 'solo_propio';
      recomendacion = `Coincidencia de venta en tu inventario (${prod.existencia} pzas). El proveedor tiene solo saldo de ${maxLowStockPzas} pza(s) (< ${minStock} pzas, descartado por posible costo viejo). Vende con tu stock físico a precio mayoreo sugerido de $${precioSugeridoMayoreo.toLocaleString('es-MX', { minimumFractionDigits: 2 })} sin competencia directa.`;
    } else {
      tipoCoincidencia = 'exclusivo_propio';
      comparativaVenta = 'exclusivo_sin_competencia';
      oportunidad = 'solo_propio';
      recomendacion = `Coincidencia de venta en tu inventario (${prod.existencia} pzas). El proveedor NO tiene esta medida china en su lista. Tienes exclusividad en esta medida para vender al mejor precio mayoreo sugerido de $${precioSugeridoMayoreo.toLocaleString('es-MX', { minimumFractionDigits: 2 })} con ${margenEstimadoMayoreo.toFixed(1)}% de margen sin competencia del proveedor.`;
    }

    result.push({
      id: `cross_p_${prod.id}`,
      medidaNormalizada: normMedida,
      medidaDisplay: prod.medida,
      marcaDisplay: prod.marca,
      origenDisplay: 'CHINO',
      miProducto: prod,
      productoProveedor: matchedSupplier || null,
      miCosto,
      costoProveedor,
      diferenciaCosto,
      ahorroPorcentaje,
      miExistencia: prod.existencia,
      existenciaProveedor: matchedSupplier ? matchedSupplier.existenciaProveedor : 0,
      precioPublico: prod.precioPublico,
      precioSugeridoMayoreo,
      margenEstimadoMayoreo,
      gananciaEstimadaPorUnidad,
      oportunidad,
      recomendacion,
      descartadoPorBajoStock: hadLowStockDiscarded,
      existenciaProveedorBaja: maxLowStockPzas,
      esCoincidencia: true, // Se incluye dentro de las coincidencias como solicitó el usuario
      tipoCoincidencia,
      comparativaVenta
    });
  });

  // Agregar los productos del proveedor (100% Chinos) que no están en mi inventario de productos chinos
  // y que cumplan con la existencia mínima (>= 4 piezas) para garantizar precios vigentes
  supplierItems.forEach((supp) => {
    if (processedSupplierIds.has(supp.id)) return;

    // Si la existencia del proveedor es menor al mínimo (ej. 1, 2 o 3 pzas), no incluirlo en el catálogo de mayoreo
    // porque representa un saldo con costo viejo
    if (minStock > 0 && supp.existenciaProveedor < minStock) {
      return;
    }

    const normMedida = normalizeMedida(supp.medida);
    const costoProveedor = supp.costoProveedor;
    const marginDec = Math.min(0.9, Math.max(0.01, options.targetMarginPercent / 100));
    const precioSugeridoMayoreo = Math.round(costoProveedor / (1 - marginDec));
    const gananciaEstimadaPorUnidad = precioSugeridoMayoreo - costoProveedor;
    const margenEstimadoMayoreo = precioSugeridoMayoreo > 0 ? (gananciaEstimadaPorUnidad / precioSugeridoMayoreo) * 100 : 0;

    result.push({
      id: `cross_s_${supp.id}`,
      medidaNormalizada: normMedida,
      medidaDisplay: supp.medida,
      marcaDisplay: supp.marca,
      origenDisplay: 'CHINO',
      miProducto: null,
      productoProveedor: supp,
      miCosto: 0,
      costoProveedor,
      diferenciaCosto: 0,
      ahorroPorcentaje: 0,
      miExistencia: 0,
      existenciaProveedor: supp.existenciaProveedor,
      precioPublico: Math.round(costoProveedor * 1.40),
      precioSugeridoMayoreo,
      margenEstimadoMayoreo,
      gananciaEstimadaPorUnidad,
      oportunidad: 'solo_proveedor',
      recomendacion: `Medida china disponible solo con proveedor con stock vigente de ${supp.existenciaProveedor} pzas (≥ ${minStock}). Puedes ofrecerla a clientes mayoreo sin inventario previo.`,
      esCoincidencia: false,
      tipoCoincidencia: 'solo_proveedor',
      comparativaVenta: 'solo_proveedor'
    });
  });

  return result;
}

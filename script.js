// --- CONSTANTES GLOBALES Y DE COSTO DE MATERIAL ---
const materiales = {
    "GALV": { densidad: 0.00000785, precio: 8245 },
    "CR": { densidad: 0.00000785, precio: 5950 },
    "HR": { densidad: 0.00000785, precio: 5625 },
    "ALF_HR": { densidad: 0.00000825, precio: 5695 },
    "ALF_ALUM": { densidad: 0.00000312, precio: 34570 },
    "ALUM_LISO": { densidad: 0.00000276, precio: 34350 },
    "INOX_2B": { densidad: 0.00000796, precio: 20400 },
    "INOX_#1": { densidad: 0.00000796, precio: 19550 },
    "INOX_SAT": { densidad: 0.00000796, precio: 21450 },
    "INOX_430SAT": { densidad: 0.00000796, precio: 20400 },
    "ANTI": { densidad: 0.00000785, precio: 16800 }
};

const dxfVelocidades = {
    "ALUM1MM": 116.667, "ALUM2MM": 75.0, "ALUM3MM": 33.333, "ALUM4MM": 21.667, "ALUM6MM": 16.667,
    "BRONCE1.5MM": 150.0, "BRONCE6MM": 20.0, "COBREC20": 116.667,
    "CR1.2MM": 183.333, "CR1.5MM": 166.667, "CR1.9MM": 183.333,
    "GALV0.9MM": 250.0, "GALV1.2MM": 250.0, "GALV1.5MM": 200.0, "GALV1.9MM": 133.333,
    "HR12MM": 15.0, "HR15MM": 15.0, "HR2MM": 116.667, "HR2.5MM": 116.667, "HR3MM": 103.333,
    "HR4.5MM": 40.0, "HR6MM": 36.667, "HR8MM": 27.5, "HR9MM": 23.667, "HR19MM": 250.0, "HR25MM": 6.0,
    "INOX0.9MM": 416.667, "INOX1.2MM": 250.0, "INOX1.5MM": 183.333, "INOX1.9MM": 166.667, "INOX2.5MM": 116.667,
    "INOX3MM": 116.667, "INOX4.5MM": 33.333, "INOX6MM": 33.333, "INOX8MM": 16.667, "INOX9MM": 13.333, "INOX12MM": 25.0
};

// VALORES POR DEFECTO PARA EL LÁSER
const DEFAULT_COSTS = {
    disenoAlto: 4600,
    disenoBajo: 4100,
    platinaAlto: 2900,
    platinaBajo: 2600,
    minDiseno: 15000,
    minPlatina: 6000
};

// --- FUNCIONES DE REDONDEO OPTIMIZADAS ---
function redondearCOP(valor) {
    return Math.round(valor / 50) * 50;
}

function redondearDecimales(valor, decimales = 2) {
    return parseFloat(valor.toFixed(decimales));
}

function formatearNumero(valor, decimales = 0) {
    return valor.toLocaleString('es-CO', { 
        minimumFractionDigits: decimales, 
        maximumFractionDigits: decimales 
    });
}

// --- FUNCIONES DE CÁLCULO DE MATERIAL Y PLIEGUE ---
function calcularPrecioPliegue(peso) {
    const y0 = 4500;
    const y1 = 160000;
    const x0 = 4;
    const x1 = 720;
    const precio = peso <= x0 ? y0 : peso >= x1 ? y1 : y0 + ((peso - x0) / (x1 - x0)) * (y1 - y0);
    return redondearCOP(precio);
}

function calcularCostoLaser(cantidad, peso, proceso) {
    if (cantidad <= 0 || peso <= 0 || proceso === "Ninguna") return 0;
    
    // Obtener configuraciones una sola vez
    const config = {
        disenoAlto: parseFloat(document.getElementById('precioDisenoAlto').value) || DEFAULT_COSTS.disenoAlto,
        disenoBajo: parseFloat(document.getElementById('precioDisenoBajo').value) || DEFAULT_COSTS.disenoBajo,
        platinaAlto: parseFloat(document.getElementById('precioPlatinaAlto').value) || DEFAULT_COSTS.platinaAlto,
        platinaBajo: parseFloat(document.getElementById('precioPlatinaBajo').value) || DEFAULT_COSTS.platinaBajo,
        minDiseno: parseFloat(document.getElementById('minDiseno').value) || DEFAULT_COSTS.minDiseno,
        minPlatina: parseFloat(document.getElementById('minPlatina').value) || DEFAULT_COSTS.minPlatina
    };

    let costoPorKg, costoMinimo, baseCost;

    if (proceso === "Diseño") {
        costoPorKg = cantidad >= 10 ? config.disenoBajo : config.disenoAlto;
        costoMinimo = config.minDiseno;
        baseCost = peso * 1.5 * costoPorKg;
    } else if (proceso === "Platina") {
        costoPorKg = cantidad >= 10 ? config.platinaBajo : config.platinaAlto;
        costoMinimo = config.minPlatina;
        baseCost = peso * 0.8 * costoPorKg;
    } else {
        return 0;
    }

    const costoFinal = peso <= 10 ? Math.max(baseCost, costoMinimo) : baseCost;
    return redondearCOP(costoFinal);
}

// --- FUNCIÓN PARA CALCULAR FACTOR DE AJUSTE ---
function calcularFactorAjuste() {
    const aplicarAumento = document.getElementById('aplicarAumento').checked;
    const aplicarDescuento = document.getElementById('aplicarDescuento').checked;
    const porcentaje = parseFloat(document.getElementById('porcentaje').value) || 0;
    
    if ((aplicarAumento || aplicarDescuento) && porcentaje > 0) {
        return aplicarAumento ? (1 + porcentaje / 100) : (1 - porcentaje / 100);
    }
    return 1;
}

// --- FUNCIÓN AUXILIAR PARA OBTENER VALORES DE FILA ---
function obtenerValoresFila(fila) {
    const ancho = parseFloat(document.querySelector(`input[name="ancho${fila}"]`).value) || 0;
    const largo = parseFloat(document.querySelector(`input[name="largo${fila}"]`).value) || 0;
    const espesor = parseFloat(document.querySelector(`input[name="espesor${fila}"]`).value) || 0;
    const material = document.querySelector(`select[name="material${fila}"]`).value;
    const pliegues = parseInt(document.querySelector(`input[name="pliegues${fila}"]`).value) || 0;
    const cantidad = parseInt(document.querySelector(`input[name="cantidad${fila}"]`).value) || 0;
    const proceso = document.querySelector(`select[name="proceso${fila}"]`).value || "Ninguna";
    const materialProvisto = document.querySelector(`input[name="materialProvisto${fila}"]`).checked;
    const precioKiloManual = parseFloat(document.querySelector(`input[name="precioKilo${fila}"]`).value) || 0;
    const precioPliegueInput = document.querySelector(`input[name="precioPliegue${fila}"]`);
    const precioPliegueManual = precioPliegueInput.value.trim() === "" ? null : parseFloat(precioPliegueInput.value);

    // Validación temprana
    if (ancho <= 0 || largo <= 0 || espesor <= 0 || !material || !materiales[material]) {
        return null;
    }

    // Calcular valores derivados una sola vez
    const area_mm2 = ancho * largo;
    const densidad_kg_mm3 = materiales[material].densidad;
    const peso_pieza = area_mm2 * espesor * densidad_kg_mm3;

    return {
        ancho, largo, espesor, material, pliegues, cantidad, proceso, 
        materialProvisto, precioKiloManual, precioPliegueManual,
        area_mm2, densidad_kg_mm3, peso_pieza
    };
}

// --- FUNCIÓN PARA ACTUALIZAR PRECIO POR PLIEGUE Y PRECIO UNITARIO CORTE ---
function actualizarPrecioPliegue(fila) {
    const valores = obtenerValoresFila(fila);
    if (!valores) {
        const precioKiloInput = document.querySelector(`input[name="precioKilo${fila}"]`);
        const precioPliegueInput = document.querySelector(`input[name="precioPliegue${fila}"]`);
        const spanPrecioCorte = document.getElementById(`precioCorte${fila}`);
        
        precioKiloInput.value = '';
        precioPliegueInput.value = '';
        spanPrecioCorte.textContent = '-';
        return;
    }

    const { cantidad, proceso, materialProvisto } = valores;
    const precioKiloInput = document.querySelector(`input[name="precioKilo${fila}"]`);
    const precioPliegueInput = document.querySelector(`input[name="precioPliegue${fila}"]`);
    const spanPrecioCorte = document.getElementById(`precioCorte${fila}`);

    // Calcular factor de ajuste una sola vez
    const factor = calcularFactorAjuste();

    // Calcular precio por kilo
    const precioPorKilo = materialProvisto ? 0 : 
        (valores.precioKiloManual > 0 ? valores.precioKiloManual : materiales[valores.material].precio * factor);

    // Calcular precio por pliegue
    const precioPorPliegueCalculado = calcularPrecioPliegue(valores.peso_pieza);
    const precioPorPliegue = valores.precioPliegueManual > 0 ? 
        valores.precioPliegueManual : precioPorPliegueCalculado * factor;

    // Actualizar el campo de precio por pliegue si no hay entrada manual
    if (valores.precioPliegueManual === null || isNaN(valores.precioPliegueManual)) {
        precioPliegueInput.value = redondearDecimales(precioPorPliegue, 0);
    }

    const costoLaserPorPieza = calcularCostoLaser(cantidad, valores.peso_pieza, proceso);
    spanPrecioCorte.textContent = formatearNumero(costoLaserPorPieza, 0);
}

// --- FUNCIÓN PARA APLICAR AUMENTO O DESCUENTO ---
function aplicarPorcentaje() {
    const aplicarAumento = document.getElementById('aplicarAumento').checked;
    const aplicarDescuento = document.getElementById('aplicarDescuento').checked;
    const porcentaje = parseFloat(document.getElementById('porcentaje').value) || 0;

    if (!aplicarAumento && !aplicarDescuento) {
        document.getElementById('error').innerHTML = 'Precios de material restablecidos a los valores por defecto. Haga clic en Calcular para actualizar.';
        return;
    }

    if (aplicarAumento && aplicarDescuento) {
        document.getElementById('error').innerHTML = 'Error: No se puede aplicar aumento y descuento al mismo tiempo.';
        return;
    }

    if (porcentaje <= 0) {
        document.getElementById('error').innerHTML = 'Error: Ingrese un porcentaje válido mayor a 0.';
        return;
    }

    document.getElementById('error').innerHTML = 'Porcentaje configurado correctamente. Haga clic en Calcular para aplicar al precio del material.';
}

// --- FUNCIÓN DE CÁLCULO PRINCIPAL (Material y Pliegues) ---
function calcular() {
    const divError = document.getElementById('error');
    const divResultados = document.getElementById('resultados');
    divError.innerHTML = '';
    divResultados.innerHTML = '';

    // Validar configuración primero
    const aplicarAumento = document.getElementById('aplicarAumento').checked;
    const aplicarDescuento = document.getElementById('aplicarDescuento').checked;
    
    if (aplicarAumento && aplicarDescuento) {
        divError.innerHTML = 'Error: No se puede aplicar aumento y descuento al mismo tiempo.';
        return;
    }

    const factor = calcularFactorAjuste();
    const resultados = [];
    let totales = { peso: 0, material: 0, pliegues: 0, laser: 0, total: 0 };

    // Procesar cada fila
    for (let i = 1; i <= 10; i++) {
        const valores = obtenerValoresFila(i);
        if (!valores) continue;

        const { cantidad, ancho, largo, espesor, pliegues, material, proceso, materialProvisto } = valores;
        
        // Validar datos de entrada
        if (cantidad < 0 || pliegues < 0) {
            divError.innerHTML = `Error: Verifique que todos los campos de dimensiones y material sean positivos y válidos en la fila ${i} (Cantidad y Nº de pliegues pueden ser 0).`;
            return;
        }

        // Calcular precios
        const precioUnitario_cop_kg = materialProvisto ? 0 : 
            (valores.precioKiloManual > 0 ? valores.precioKiloManual : materiales[material].precio * factor);

        const precioPorPliegueCalculado = calcularPrecioPliegue(valores.peso_pieza);
        const precioPorPliegue = valores.precioPliegueManual > 0 ? 
            valores.precioPliegueManual : precioPorPliegueCalculado * factor;

        // Calcular costos
        const pesoTotalFila = valores.peso_pieza * cantidad;
        const costoMaterial = redondearCOP(pesoTotalFila * precioUnitario_cop_kg);
        const costoTotalPliegues = redondearCOP(precioPorPliegue * pliegues * cantidad);
        const costoLaserPorPieza = redondearCOP(calcularCostoLaser(cantidad, valores.peso_pieza, proceso) * factor);
        const costoLaserFila = redondearCOP(costoLaserPorPieza * cantidad);

        const precioUnitarioPorPieza = redondearCOP(
            (valores.peso_pieza * precioUnitario_cop_kg) + 
            (precioPorPliegue * pliegues) + 
            costoLaserPorPieza
        );
        
        const costoFila = redondearCOP(precioUnitarioPorPieza * cantidad);

        resultados.push({
            fila: i,
            material: material,
            cantidad: cantidad,
            largo: redondearDecimales(largo),
            ancho: redondearDecimales(ancho),
            espesor: redondearDecimales(espesor),
            peso: redondearDecimales(valores.peso_pieza, 3),
            pesoTotal: redondearDecimales(pesoTotalFila, 3),
            precioUnitario: precioUnitarioPorPieza,
            costoMaterial: costoMaterial,
            precioPorPliegue: redondearDecimales(precioPorPliegue, 0),
            costoTotalPliegues: costoTotalPliegues,
            costoLaser: costoLaserPorPieza,
            costoLaserFila: costoLaserFila,
            costoFila: costoFila,
            proceso: proceso,
            materialProvisto: materialProvisto,
            precioKilo: redondearDecimales(precioUnitario_cop_kg, 0)
        });

        // Acumular totales
        totales.peso += pesoTotalFila;
        totales.material += costoMaterial;
        totales.pliegues += costoTotalPliegues;
        totales.laser += costoLaserFila;
        totales.total += costoFila;
    }

    if (resultados.length === 0) {
        divError.innerHTML = 'Error: Complete al menos una fila con datos válidos para el cálculo de Material y Pliegues.';
        return;
    }

    // Calcular impuestos
    const iva = redondearCOP(totales.total * 0.19);
    const totalConIva = redondearCOP(totales.total + iva);

    // Mostrar resultados
    let htmlResultados = `
        <h2>Resultados (Material y Pliegues)</h2>
        <table id="tablaResultados">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Material</th>
                    <th>Cantidad (Unid)</th>
                    <th>Largo (mm)</th>
                    <th>Ancho (mm)</th>
                    <th>Espesor (mm)</th>
                    <th>Peso (kgs)</th>
                    <th>Precio unitario</th>
                    <th>Peso Total (kgs)</th>
                    <th>Precio kilo (COP)</th>
                    <th>Total Material</th>
                    <th>Valor Total</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    resultados.forEach(r => {
        htmlResultados += `
            <tr>
                <td>${r.fila}</td>
                <td>${r.material}${r.materialProvisto ? ' (Provisto por cliente)' : ''}</td>
                <td>${r.cantidad}</td>
                <td>${formatearNumero(r.largo, 2)}</td>
                <td>${formatearNumero(r.ancho, 2)}</td>
                <td>${formatearNumero(r.espesor, 2)}</td>
                <td>${formatearNumero(r.peso, 3)}</td>
                <td>${formatearNumero(r.precioUnitario, 0)}</td>
                <td>${formatearNumero(r.pesoTotal, 3)}</td>
                <td>${r.materialProvisto ? '-' : formatearNumero(r.precioKilo, 0)}</td>
                <td>${formatearNumero(r.costoMaterial, 0)}</td>
                <td>${formatearNumero(r.costoFila, 0)}</td>
            </tr>
        `;
    });

    htmlResultados += `
            </tbody>
            <tfoot>
                <tr class="total">
                    <td colspan="10" style="text-align: right;">Suma Total Material</td>
                    <td>${formatearNumero(totales.material, 0)}</td>
                    <td></td>
                </tr>
                <tr class="total">
                    <td colspan="10" style="text-align: right;">Suma Total Pliegue</td>
                    <td>${formatearNumero(totales.pliegues, 0)}</td>
                    <td></td>
                </tr>
                <tr class="total">
                    <td colspan="10" style="text-align: right;">Suma Total Corte</td>
                    <td>${formatearNumero(totales.laser, 0)}</td>
                    <td></td>
                </tr>
                <tr class="total" style="background-color: #f9f9f9;">
                    <td colspan="10" style="text-align: right;">Subtotal</td>
                    <td>${formatearNumero(totales.total, 0)}</td>
                    <td></td>
                </tr>
                <tr class="total">
                    <td colspan="10" style="text-align: right;">IVA (19%)</td>
                    <td>${formatearNumero(iva, 0)}</td>
                    <td></td>
                </tr>
                <tr class="total" style="background-color: #ffe0b2;">
                    <td colspan="10" style="text-align: right;">TOTAL general</td>
                    <td>${formatearNumero(totalConIva, 0)}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    `;
    
    divResultados.innerHTML = htmlResultados;
}

// --- FUNCIÓN DE CÁLCULO DXF MEJORADA (MÚLTIPLES ARCHIVOS) ---
function calculateDxfCost() {
    const fileInput = document.getElementById('dxfFileNew');
    const materialSelect = document.getElementById('dxfMaterial');
    const costoMinutoInput = document.getElementById('costoMinuto');
    const dxfError = document.getElementById('dxfError');
    const dxfResultsDiv = document.getElementById('dxfResults');
    const resultsTable = document.getElementById('dxfResultsTable');

    dxfError.innerHTML = '';
    dxfResultsDiv.style.display = 'none';
    resultsTable.innerHTML = '';

    const files = fileInput.files;
    if (files.length === 0) {
        dxfError.innerHTML = 'Error: Debe cargar al menos un archivo DXF.';
        return;
    }
    if (!materialSelect.value) {
        dxfError.innerHTML = 'Error: Debe seleccionar un material para determinar la velocidad de corte.';
        return;
    }
    const costoMinuto = parseFloat(costoMinutoInput.value);
    if (isNaN(costoMinuto) || costoMinuto <= 0) {
        dxfError.innerHTML = 'Error: El costo por minuto debe ser un número positivo.';
        return;
    }

    const velocidadCorte_mm_s = parseFloat(materialSelect.value);
    let totalMetrosCorte = 0;
    let totalLongitud_mm = 0;
    let totalTiempo_min = 0;
    let totalCosto = 0;
    let totalContornos = 0;
    let fileResults = [];
    let hasError = false;

    const TIME_PER_CONTOUR_S = 1.8; // Tiempo por contorno en segundos (piercing/G0)
    const TIME_PER_CONTOUR_MIN = TIME_PER_CONTOUR_S / 60;

    // Función auxiliar para calcular distancia
    function distance(p1, p2) {
        return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
    }

    // Función auxiliar para obtener los límites del DXF
    function getDxfBounds(dxf) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        dxf.entities.forEach(entity => {
            const vertices = [];
            
            // Lógica mejorada para obtener vértices
            if (entity.type === 'LINE') {
                if (entity.start) vertices.push(entity.start);
                if (entity.end) vertices.push(entity.end);
            } else if (entity.vertices) {
                vertices.push(...entity.vertices);
            } else if (entity.center && entity.radius) {
                const r = entity.radius;
                vertices.push(
                    { x: entity.center.x - r, y: entity.center.y },
                    { x: entity.center.x + r, y: entity.center.y },
                    { x: entity.center.x, y: entity.center.y - r },
                    { x: entity.center.x, y: entity.center.y + r }
                );
            } else if (entity.controlPoints) {
                vertices.push(...entity.controlPoints);
            }
            
            // Procesar vértices con protección
            vertices.forEach(v => {
                if (v && typeof v.x === 'number' && typeof v.y === 'number') {
                    minX = Math.min(minX, v.x);
                    minY = Math.min(minY, v.y);
                    maxX = Math.max(maxX, v.x);
                    maxY = Math.max(maxY, v.y);
                }
            });
        });

        const width = maxX - minX;
        const height = maxY - minY;

        return { minX, minY, maxX, maxY, width, height };
    }

    const processPromises = Array.from(files).map((file, index) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const parser = new DxfParser();
                    const dxf = parser.parseSync(e.target.result);
                    
                    let longitudTotal_mm_file = 0;
                    let contornos_file = 0;
                    
                    // Procesar cada entidad del DXF
                    dxf.entities.forEach(entity => {
                        let length = 0;
                        
                        switch(entity.type) {
                            case 'LINE':
                                // Protección añadida para líneas
                                if (entity.start && entity.end) {
                                    length = distance(
                                        [entity.start.x, entity.start.y], 
                                        [entity.end.x, entity.end.y]
                                    );
                                    contornos_file++;
                                }
                                break;
                                
                            case 'LWPOLYLINE':
                            case 'POLYLINE':
                                if (entity.vertices && entity.vertices.length > 1) {
                                    // Calcular longitud para polilíneas (abiertas o cerradas)
                                    for (let i = 1; i < entity.vertices.length; i++) {
                                        length += distance(
                                            [entity.vertices[i-1].x, entity.vertices[i-1].y],
                                            [entity.vertices[i].x, entity.vertices[i].y]
                                        );
                                    }
                                    // Si es cerrada, añadir segmento final
                                    if (entity.isClosed && entity.vertices.length > 1) {
                                        length += distance(
                                            [entity.vertices[entity.vertices.length-1].x, entity.vertices[entity.vertices.length-1].y],
                                            [entity.vertices[0].x, entity.vertices[0].y]
                                        );
                                    }
                                    contornos_file++;
                                }
                                break;
                                
                            case 'ARC':
                                if (entity.radius) {
                                    const radius = entity.radius;
                                    let startAngle = entity.startAngle;
                                    let endAngle = entity.endAngle;
                                    
                                    // Manejar ángulos que cruzan 360°
                                    if (startAngle > endAngle) {
                                        endAngle += 360;
                                    }
                                    const angleRad = (endAngle - startAngle) * (Math.PI / 180);
                                    length = radius * angleRad;
                                    contornos_file++;
                                }
                                break;
                                
                            case 'CIRCLE':
                                if (entity.radius) {
                                    length = 2 * Math.PI * entity.radius;
                                    contornos_file++;
                                }
                                break;
                                
                            case 'ELLIPSE':
                                if (entity.majorAxis && entity.axisRatio) {
                                    const a = entity.majorAxis;
                                    const b = a * entity.axisRatio;
                                    // Aproximación de Ramanujan para perímetro de elipse
                                    length = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
                                    contornos_file++;
                                }
                                break;
                                
                            case 'SPLINE':
                                if (entity.controlPoints && entity.controlPoints.length > 1) {
                                    for (let i = 1; i < entity.controlPoints.length; i++) {
                                        length += distance(
                                            [entity.controlPoints[i-1].x, entity.controlPoints[i-1].y],
                                            [entity.controlPoints[i].x, entity.controlPoints[i].y]
                                        );
                                    }
                                    contornos_file++;
                                }
                                break;
                                
                            default:
                                // Ignorar otras entidades (TEXT, DIMENSION, etc.)
                                break;
                        }
                        longitudTotal_mm_file += length;
                    });

                    // Obtener dimensiones del archivo
                    const bounds = getDxfBounds(dxf);
                    
                    if (longitudTotal_mm_file === 0) {
                        throw new Error('Longitud de corte calculada es 0. Verifique la geometría.');
                    }

                    // CÁLCULO DE TIEMPO MEJORADO (incluye contornos)
                    const metrosCorte = longitudTotal_mm_file / 1000;
                    
                    // Tiempo de corte puro
                    const cuttingTime = (longitudTotal_mm_file / velocidadCorte_mm_s) / 60;
                    
                    // Tiempo por contornos (piercing y movimientos)
                    const piercingTime = contornos_file * TIME_PER_CONTOUR_MIN;
                    
                    // Tiempo total (puedes añadir SETUP_TIME_MIN si lo necesitas)
                    const tiempoEstimado_min = cuttingTime + piercingTime;
                    
                    const costoFile = tiempoEstimado_min * costoMinuto;
                    const costoRedondeado = redondearCOP(costoFile);
                    const anchoMaximo = redondearDecimales(bounds.width, 2);
                    const largoMaximo = redondearDecimales(bounds.height, 2);

                    // Actualizar totales
                    totalMetrosCorte += metrosCorte;
                    totalLongitud_mm += longitudTotal_mm_file;
                    totalTiempo_min += tiempoEstimado_min;
                    totalCosto += costoRedondeado;
                    totalContornos += contornos_file;

                    fileResults.push({
                        name: file.name,
                        metrosCorte: redondearDecimales(metrosCorte, 3),
                        milimetrosCorte: redondearDecimales(longitudTotal_mm_file, 2),
                        anchoMaximo: anchoMaximo,
                        largoMaximo: largoMaximo,
                        tiempoEstimado: redondearDecimales(tiempoEstimado_min, 2),
                        costo: redondearDecimales(costoRedondeado, 0),
                        contornos: contornos_file
                    });

                    resolve();
                } catch (err) {
                    hasError = true;
                    dxfError.innerHTML += `<p>Error en ${file.name}: ${err.message}</p>`;
                    resolve();
                }
            };
            reader.readAsText(file);
        });
    });

    Promise.all(processPromises).then(() => {
        if (fileResults.length === 0) return;

        let tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Archivo</th>
                        <th>Metros de Corte</th>
                        <th>mm Total</th>
                        <th>Contornos</th>
                        <th>Ancho Max (mm)</th>
                        <th>Largo Max (mm)</th>
                        <th>Tiempo (min)</th>
                        <th>Costo ($)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        fileResults.forEach(result => {
            tableHtml += `
                <tr class="file-row">
                    <td>${result.name}</td>
                    <td>${formatearNumero(parseFloat(result.metrosCorte), 3)}</td>
                    <td>${formatearNumero(parseFloat(result.milimetrosCorte), 2)}</td>
                    <td>${result.contornos}</td>
                    <td>${result.anchoMaximo}</td>
                    <td>${result.largoMaximo}</td>
                    <td>${result.tiempoEstimado}</td>
                    <td>${formatearNumero(result.costo, 0)}</td>
                </tr>
            `;
        });

        const totalCostoRedondeado = redondearCOP(totalCosto);
        tableHtml += `
                </tbody>
                <tfoot>
                    <tr class="total">
                        <td><strong>Total (todos los archivos)</strong></td>
                        <td><strong>${formatearNumero(totalMetrosCorte, 3)} m</strong></td>
                        <td><strong>${formatearNumero(totalLongitud_mm, 2)} mm</strong></td>
                        <td><strong>${totalContornos}</strong></td>
                        <td colspan="2"></td>
                        <td><strong>${formatearNumero(totalTiempo_min, 2)} min</strong></td>
                        <td><strong>$${formatearNumero(totalCostoRedondeado, 0)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        resultsTable.innerHTML = tableHtml;
        dxfResultsDiv.style.display = 'block';

        if (hasError) {
            dxfError.innerHTML += '<p>Se procesaron los archivos válidos, pero algunos fallaron.</p>';
        }
    });
}

// --- CÓDIGO AUXILIAR PARA IMÁGENES ---
function fileToDataURL(file) {
    return new Promise((resolve) => {
        if (!file) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

// --- FUNCIÓN PARA EXPORTAR A PDF ---
async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        alert('Error: jsPDF no se cargó correctamente.');
        return;
    }

    const imageInput = document.getElementById('imagenProducto');
    const imageFiles = imageInput ? Array.from(imageInput.files) : [];
    let imageDataURLs = [];
    if (imageFiles.length > 0) {
        const promises = imageFiles.map(file => fileToDataURL(file));
        imageDataURLs = await Promise.all(promises);
        imageDataURLs = imageDataURLs.filter(url => url !== null);
    }

    const doc = new jsPDF();
    if (typeof doc.autoTable !== 'function') {
        alert('Error: autoTable no disponible. Verifica las librerías.');
        return;
    }

    const nit = document.getElementById('nit').value || 'N/A';
    const requester = document.getElementById('requester').value || 'N/A';
    const fecha = new Date().toLocaleString('es-ES');
    const consecutivo = document.getElementById('consecutivoCotizacion').value || 'N/A';
    const responsable = document.getElementById('responsableCotizacion').value;
    const validezOferta = document.getElementById('validezOferta').value;
    const plazoEntrega = document.getElementById('plazoEntrega').value;
    const formaPago = document.getElementById('formaPago').value;
    const nombreResponsable = responsable === 'SIN ESPECIFICAR' ? 'Herramienta de Cotización Metalcortes' : responsable;

    const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA... yo lo completo ';
    try {
        doc.addImage(logoBase64, 'PNG', 10, 17, 55, 11.15);
    } catch (error) {
        console.error('Error al agregar el logo al PDF:', error);
        doc.setFontSize(10);
        doc.setTextColor(255, 0, 0);
        doc.text('No se pudo cargar el logo', 10, 27);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('METAL CORTES RISARALDA S.A.S', 105, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('NIT: 900077031', 105, 24, { align: 'center' });
    doc.text('Calle 18 #16b-09, Barrio Mejía Robledo, Pereira', 105, 30, { align: 'center' });
    doc.text('BANCOLOMBIA S.A - Cta. Corriente: 85732406952', 105, 36, { align: 'center' });

    let y = 45;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Array of label-value pairs for header information
    const headerInfo = [
        { label: 'Cotización para:', value: requester },
        { label: 'NIT/Cédula del cliente:', value: nit },
        { label: 'Validez de la Oferta:', value: validezOferta },
        { label: 'Plazo de Entrega:', value: plazoEntrega },
        { label: 'Forma de Pago:', value: formaPago }
    ];

    // Render each label in bold and value in normal font
    headerInfo.forEach(info => {
        doc.setFont('helvetica', 'bold');
        const labelWidth = doc.getTextWidth(info.label);
        doc.text(info.label, 14, y);
        doc.setFont('helvetica', 'normal');
        doc.text(info.value, 14 + labelWidth + 2, y); // Small offset after label
        y += 6;
    });

    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 0, 0);
    doc.text(`#${consecutivo}`, pageWidth - margin, 45, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha: ${fecha}`, pageWidth - margin, 51, { align: 'right' });

    let yOffset = y + 5;
    const tabla = document.getElementById('tablaResultados');
    if (!tabla) {
        alert('No se encontraron resultados de Material y Pliegues para exportar.');
        return;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Cotización de Materiales y Servicios', 14, yOffset);
    yOffset += 5;

    let pesoTotal = 0;
    let costoMaterialTotal = 0;
    let costoPlieguesTotal = 0;
    let costoLaserTotal = 0;
    let costoTotal = 0;
    let resultados = [];

    const aplicarAumento = document.getElementById('aplicarAumento').checked;
    const aplicarDescuento = document.getElementById('aplicarDescuento').checked;
    const porcentaje = parseFloat(document.getElementById('porcentaje').value) || 0;
    let factor = 1;

    if (aplicarAumento && aplicarDescuento) {
        alert('Error: No se puede aplicar aumento y descuento al mismo tiempo.');
        return;
    }

    if ((aplicarAumento || aplicarDescuento) && porcentaje > 0) {
        factor = aplicarAumento ? (1 + porcentaje / 100) : (1 - porcentaje / 100);
    }

    for (let i = 1; i <= 10; i++) {
        const cantidad = parseInt(document.querySelector(`input[name="cantidad${i}"]`).value) || 0;
        const ancho = parseFloat(document.querySelector(`input[name="ancho${i}"]`).value) || 0;
        const largo = parseFloat(document.querySelector(`input[name="largo${i}"]`).value) || 0;
        const espesor = parseFloat(document.querySelector(`input[name="espesor${i}"]`).value) || 0;
        const pliegues = parseInt(document.querySelector(`input[name="pliegues${i}"]`).value) || 0;
        const material = document.querySelector(`select[name="material${i}"]`).value;
        const proceso = document.querySelector(`select[name="proceso${i}"]`).value || "Ninguna";
        const materialProvisto = document.querySelector(`input[name="materialProvisto${i}"]`).checked;
        const precioKiloManual = parseFloat(document.querySelector(`input[name="precioKilo${i}"]`).value) || 0;
        const precioPliegueManual = parseFloat(document.querySelector(`input[name="precioPliegue${i}"]`).value) || 0;

        if (cantidad === 0 && ancho === 0 && largo === 0 && espesor === 0 && pliegues === 0 && !material) continue;

        const area_mm2 = ancho * largo;
        const densidad_kg_mm3 = materiales[material].densidad;
        const precioUnitario_cop_kg = materialProvisto ? 0 : (precioKiloManual > 0 ? precioKiloManual : materiales[material].precio * factor);

        const peso_pieza = area_mm2 * espesor * densidad_kg_mm3;
        const pesoTotalFila = peso_pieza * cantidad;
        const costoMaterial = redondearCOP(pesoTotalFila * precioUnitario_cop_kg);
        const precioPorPliegueCalculado = calcularPrecioPliegue(peso_pieza);
        const precioPorPliegue = precioPliegueManual > 0 ? precioPliegueManual : precioPorPliegueCalculado * factor;
        const costoTotalPliegues = redondearCOP(precioPorPliegue * pliegues * cantidad);
        const costoLaserPorPieza = redondearCOP(calcularCostoLaser(cantidad, peso_pieza, proceso) * factor);
        const costoLaserFila = redondearCOP(costoLaserPorPieza * cantidad);

        const costoUnitarioMaterial = peso_pieza * precioUnitario_cop_kg;
        const costoUnitarioPliegues = precioPorPliegue * pliegues;
        const precioUnitarioPorPieza = redondearCOP(costoUnitarioMaterial + costoUnitarioPliegues + costoLaserPorPieza);
        const costoFila = redondearCOP(precioUnitarioPorPieza * cantidad);

        resultados.push({
            fila: i,
            material: material,
            cantidad: cantidad,
            largo: redondearDecimales(largo),
            ancho: redondearDecimales(ancho),
            espesor: redondearDecimales(espesor),
            peso: redondearDecimales(peso_pieza, 3),
            pesoTotal: redondearDecimales(pesoTotalFila, 3),
            precioUnitario: precioUnitarioPorPieza,
            costoMaterial: costoMaterial,
            costoFila: costoFila,
            materialProvisto: materialProvisto,
            precioKilo: redondearDecimales(precioUnitario_cop_kg, 0)
        });

        pesoTotal += pesoTotalFila;
        costoMaterialTotal += costoMaterial;
        costoPlieguesTotal += costoTotalPliegues;
        costoLaserTotal += costoLaserFila;
        costoTotal += costoFila;
    }

    const iva = redondearCOP(costoTotal * 0.19);
    const totalConIva = redondearCOP(costoTotal + iva);

    doc.autoTable({
        startY: yOffset,
        head: [['Item', 'Material', 'Cantidad (Unid)', 'Largo (mm)', 'Ancho (mm)', 'Espesor (mm)', 'Peso (kgs)', 'Precio unitario', 'Peso Total (kgs)', 'Total Material', 'Valor Total']],
        body: resultados.map(r => [
            r.fila,
            r.material + (r.materialProvisto ? ' (Provisto por cliente)' : ''),
            r.cantidad,
            formatearNumero(r.largo, 0),
            formatearNumero(r.ancho, 0),
            formatearNumero(r.espesor, 0),
            formatearNumero(r.peso, 3),
            formatearNumero(r.precioUnitario, 0),
            formatearNumero(r.pesoTotal, 3),
            formatearNumero(r.costoMaterial, 0),
            formatearNumero(r.costoFila, 0)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontSize: 7, halign: 'center', cellPadding: 1 },
        bodyStyles: { fontSize: 7, textColor: [0, 0, 0], fillColor: [245, 250, 255], cellPadding: 1 },
        styles: { cellPadding: 1, overflow: 'linebreak', cellWidth: 'auto', valign: 'middle', lineWidth: 0.1 },
        margin: { left: 10, right: 10, top: 10, bottom: 10 },
        tableWidth: 195.9,
        columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 30 },
            2: { cellWidth: 12 },
            3: { cellWidth: 12 },
            4: { cellWidth: 12 },
            5: { cellWidth: 12 },
            6: { cellWidth: 12 },
            7: { cellWidth: 18 },
            8: { cellWidth: 18 },
            9: { cellWidth: 23, halign: 'right' },
            10: { cellWidth: 23, halign: 'right' }
        },
        didDrawPage: function (data) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Cotización Elaborada por: ${nombreResponsable}`, data.settings.margin.left, 10);
        }
    });

    const tableWidth = 195.9;
    const summaryWidth = 60;
    const startX = 10 + (tableWidth - summaryWidth);

    yOffset = doc.lastAutoTable.finalY + 5;
    doc.autoTable({
        startY: yOffset,
        head: [['Descripción', 'Valor']],
        body: [
            ['Suma Total Material', formatearNumero(costoMaterialTotal, 0)],
            ['Suma Total Pliegue', formatearNumero(costoPlieguesTotal, 0)],
            ['Suma Total Corte', formatearNumero(costoLaserTotal, 0)],
            ['Subtotal', formatearNumero(costoTotal, 0)],
            ['IVA (19%)', formatearNumero(iva, 0)],
            ['TOTAL general', formatearNumero(totalConIva, 0)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontSize: 7, halign: 'left', cellPadding: 1 },
        bodyStyles: { fontSize: 7, textColor: [0, 0, 0], fillColor: [245, 250, 255], cellPadding: 1 },
        styles: { cellPadding: 1, overflow: 'linebreak', lineWidth: 0.05, valign: 'middle' },
        margin: { left: startX, right: 10 },
        tableWidth: summaryWidth,
        columnStyles: {
            0: { cellWidth: 23, halign: 'left' },
            1: { cellWidth: 23, halign: 'right' }
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.row.index === 5) {
                data.cell.styles.fillColor = [255, 243, 224];
                data.cell.styles.textColor = [255, 0, 0];
                data.cell.styles.fontSize = 8;
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.cellPadding = 1.5;
            }
        }
    });

    const notas = document.getElementById('notas').value || 'Sin observaciones';
    const notasX = 10;
    const notasY = yOffset;
    const notasWidth = startX - 10 - 5;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVACIONES:', notasX, notasY);
    doc.setFont('helvetica', 'normal');
    const notasLines = doc.splitTextToSize(notas, notasWidth);
    doc.text(notasLines, notasX, notasY + 5);

    const tableHeight = doc.lastAutoTable.finalY - yOffset;
    const notasHeight = notasLines.length * 4;
    let currentY = yOffset + Math.max(tableHeight, notasHeight + 5) + 5;

    const MAX_WIDTH = 60;
    const MAX_HEIGHT = 40;
    const MARGIN_LEFT = 10;
    const PAGE_WIDTH = doc.internal.pageSize.width;
    const SPACE_X = 5;
    let currentX = MARGIN_LEFT;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    if (imageDataURLs.length > 0) {
        doc.text('Anéxos:', MARGIN_LEFT, currentY);
        currentY += 5;

        imageDataURLs.forEach((dataURL, index) => {
            const remainingSpace = PAGE_WIDTH - currentX - MARGIN_LEFT;
            if (remainingSpace < MAX_WIDTH) {
                currentX = MARGIN_LEFT;
                currentY += MAX_HEIGHT + 5;
                if (currentY + MAX_HEIGHT > doc.internal.pageSize.height - 20) {
                    doc.addPage();
                    currentY = 20;
                    currentX = MARGIN_LEFT;
                }
            }
            doc.addImage(dataURL, 'JPEG', currentX, currentY, MAX_WIDTH, MAX_HEIGHT);
            currentX += MAX_WIDTH + SPACE_X;
        });
    }

    try {
        const fileName = `${consecutivo}_${requester}.pdf`;
        doc.save(fileName);
    } catch (e) {
        alert('Error al generar el PDF: ' + e.message);
    }
}

// --- FUNCIÓN PARA POBLAR MENÚS DE MATERIALES ---
function poblarMenusMateriales() {
    const opcionesMateriales = `
        <option value="">Seleccione Material</option>
        ${Object.keys(materiales).map(mat => `<option value="${mat}">${mat}</option>`).join('')}
    `;
    for (let i = 1; i <= 10; i++) {
        const selectElement = document.querySelector(`select[name="material${i}"]`);
        if (selectElement) {
            selectElement.innerHTML = opcionesMateriales;
            // Agregar evento para actualizar precio kilo al cambiar material
            selectElement.addEventListener('change', () => {
                const material = selectElement.value;
                const precioKiloInput = document.querySelector(`input[name="precioKilo${i}"]`);
                if (material && materiales[material]) {
                    precioKiloInput.value = redondearDecimales(materiales[material].precio, 0);
                } else {
                    precioKiloInput.value = '';
                }
                actualizarPrecioPliegue(i);
            });
        }
    }

    const dxfMenu = document.getElementById('dxfMaterial');
    dxfMenu.innerHTML = '<option value="">Seleccione un material</option>';
    Object.keys(dxfVelocidades).forEach(key => {
        const velocidad_mm_s = dxfVelocidades[key];
        const option = document.createElement('option');
        option.value = velocidad_mm_s;
        option.textContent = `${key} (${redondearDecimales(velocidad_mm_s, 2)} mm/s)`;
        dxfMenu.appendChild(option);
    });
}

// --- FUNCIÓN PARA LIMPIAR FORMULARIO ---
function limpiarFormulario() {
    document.getElementById('formulario').reset();
    document.getElementById('nit').value = '';
    document.getElementById('requester').value = '';
    document.getElementById('error').innerHTML = '';
    document.getElementById('resultados').innerHTML = '';
    document.getElementById('dxfForm').reset();
    document.getElementById('dxfResults').style.display = 'none';
    document.getElementById('dxfError').innerHTML = '';
    document.getElementById('costoMinuto').value = '10000';
    document.getElementById('consecutivoCotizacion').value = '';
    document.getElementById('responsableCotizacion').value = 'SIN ESPECIFICAR';
    document.getElementById('validezOferta').value = '1 DÍA';
    document.getElementById('plazoEntrega').value = 'A CONVENIR';
    document.getElementById('formaPago').value = 'CONTADO';
    document.getElementById('precioDisenoAlto').value = '';
    document.getElementById('precioDisenoBajo').value = '';
    document.getElementById('precioPlatinaAlto').value = '';
    document.getElementById('precioPlatinaBajo').value = '';
    document.getElementById('minDiseno').value = '';
    document.getElementById('minPlatina').value = '';
    document.getElementById('aplicarAumento').checked = false;
    document.getElementById('aplicarDescuento').checked = false;
    document.getElementById('porcentaje').value = '';
    for (let i = 1; i <= 10; i++) {
        document.getElementById(`precioCorte${i}`).textContent = '-';
        document.querySelector(`input[name="materialProvisto${i}"]`).checked = false;
        document.querySelector(`input[name="precioKilo${i}"]`).value = '';
        document.querySelector(`input[name="precioPliegue${i}"]`).value = '';
    }
}

// Inicializar al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    poblarMenusMateriales();
    document.getElementById('botonCalcular').addEventListener('click', calcular);
    document.getElementById('botonLimpiar').addEventListener('click', limpiarFormulario);
    document.getElementById('pdfButton').addEventListener('click', exportToPDF);
    document.getElementById('calculateDxfCost').addEventListener('click', calculateDxfCost);
    document.getElementById('aplicarPorcentaje').addEventListener('click', aplicarPorcentaje);

    // Agregar event listeners a los campos de entrada de cada fila
    for (let i = 1; i <= 10; i++) {
        ['ancho', 'largo', 'espesor', 'material', 'pliegues', 'cantidad', 'proceso', 'materialProvisto', 'precioKilo', 'precioPliegue'].forEach(campo => {
            const input = document.querySelector(`[name="${campo}${i}"]`);
            if (input) input.addEventListener('input', () => actualizarPrecioPliegue(i));
        });
    }

    // Agregar event listeners a los campos de configuración
    ['precioDisenoAlto', 'precioDisenoBajo', 'precioPlatinaAlto', 'precioPlatinaBajo', 'minDiseno', 'minPlatina'].forEach(campo => {
        const input = document.getElementById(campo);
        if (input) {
            input.addEventListener('input', () => {
                // Actualizar todas las filas cuando cambie un campo de configuración
                for (let i = 1; i <= 10; i++) {
                    actualizarPrecioPliegue(i);
                }
            });
        }
    });
});


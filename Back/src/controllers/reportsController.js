const reportsModel = require('../models/reportsModel');
const PDFDocument = require('pdfkit');

/**
 * Helper para formatear periodos YYYY-MM a YYYY-MES (Español)
 */
const formatPeriod = (period) => {
    if (!period || !period.includes('-')) return period;
    const [year, month] = period.split('-');
    const months = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${year}-${months[monthIndex] || month}`;
};

/**
 * Helper para formatear fechas largas a legible (DD/MM/YYYY HH:MM)
 */
const formatDate = (dateStr) => {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
        return dateStr;
    }
};

/**
 * Helper para generar el diseño base del PDF
 */
const generatePDF = (res, title, data, columns, period = null, totalKey = null) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${title.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    // --- DISEÑO PROFESIONAL ---

    // Header: Nombre de la Empresa y Logo (Simulado)
    doc.fillColor('#1d4ed8').fontSize(20).text('JUNTA ADMINISTRADORA DE AGUA POTABLE COMUNIDAD CHALUAPAMBA', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text('Gestión Eficiente y Transparente', { align: 'center' });
    doc.moveDown(1.5);

    // Título del Reporte (Fondo Dinámico)
    const titleY = doc.y;
    doc.rect(30, titleY, 535, 30).fill('#f1f5f9');
    doc.fillColor('#1e293b').fontSize(14).text(title.toUpperCase(), 40, titleY + 8, { bold: true });

    // Fecha y Periodo (Posición relativa al título)
    const infoY = titleY + 35;
    doc.fontSize(9).fillColor('#64748b');
    doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 30, infoY, { width: 535, align: 'right' });
    if (period) {
        doc.fillColor('#1e293b').fontSize(10).text(`Periodo: ${formatPeriod(period)}`, 30, infoY, { width: 535, align: 'left' });
    }

    // --- TABLA DE DATOS ---
    const tableTop = infoY + 25;
    const totalTableWidth = 535;

    // Calcular anchos de columna dinámicos
    const definedWidths = columns.filter(c => c.width).reduce((sum, c) => sum + c.width, 0);
    const undefinedCols = columns.filter(c => !c.width).length;
    const defaultWidth = undefinedCols > 0 ? (totalTableWidth - definedWidths) / undefinedCols : 0;

    // Asignar anchos y posiciones X
    let currentX = 35;
    const columnDefinitions = columns.map(col => {
        const width = col.width || defaultWidth;
        const x = currentX;
        currentX += width;
        return { ...col, width, x };
    });

    // Dibujar Header de Tabla
    doc.rect(30, tableTop, totalTableWidth, 20).fill('#3b82f6');
    doc.fillColor('#ffffff').fontSize(9);
    columnDefinitions.forEach(col => {
        doc.text(col.label, col.x, tableTop + 5, { width: col.width - 5, align: 'left' });
    });

    // Dibujar Filas
    let y = tableTop + 25;
    let lastMonth = null;
    let monthlyTotal = 0;
    let grandTotal = 0;

    const drawSubtotal = (month, total) => {
        if (y > 750) { doc.addPage(); y = 50; }
        doc.rect(30, y - 5, totalTableWidth, 20).fill('#e2e8f0');
        doc.fillColor('#1e293b').fontSize(9).text(`SUBTOTAL ${formatPeriod(month)}:`, 40, y, { bold: true });

        // El subtotal se alinea con la última columna
        const lastCol = columnDefinitions[columnDefinitions.length - 1];
        doc.text(`$ ${total.toFixed(2)}`, lastCol.x, y, { width: lastCol.width, align: 'left', bold: true });
        y += 25;
    };

    data.forEach((row, rowIndex) => {
        const rowData = { ...row };
        const currentMonth = rowData.month_year || rowData.billing_month;

        // Si hay un cambio de mes (y no es el primero), mostramos el subtotal del mes anterior
        if (lastMonth && currentMonth !== lastMonth && totalKey) {
            drawSubtotal(lastMonth, monthlyTotal);
            monthlyTotal = 0;
        }

        // Agrupación por Mes
        if (currentMonth && currentMonth !== lastMonth) {
            if (y > 750) { doc.addPage(); y = 50; }
            doc.rect(30, y - 5, totalTableWidth, 18).fill('#f1f5f9');
            doc.fillColor('#1e293b').fontSize(9).text(formatPeriod(currentMonth), 40, y, { bold: true });
            y += 20;
            lastMonth = currentMonth;
        }

        // Acumular totales si aplica
        if (totalKey) {
            const val = parseFloat(rowData[totalKey]) || 0;
            monthlyTotal += val;
            grandTotal += val;
        }

        // Formatear valores
        if (rowData.meter_status === 1) rowData.meter_status = 'Activo';
        else if (rowData.meter_status === 0) rowData.meter_status = 'Inactivo';
        else if (rowData.meter_status !== undefined) rowData.meter_status = '-';

        if (rowData.assignment_status === 1) rowData.assignment_status = 'Vigente';
        else if (rowData.assignment_status === 0) rowData.assignment_status = 'Retirado';
        else if (rowData.assignment_status !== undefined) rowData.assignment_status = '-';

        if (rowData.invoice_status === 'paid') rowData.invoice_status = 'Pagado';
        if (rowData.invoice_status === 'pending') rowData.invoice_status = 'Pendiente';

        if (rowData.payment_date) rowData.payment_date = formatDate(rowData.payment_date);

        if (rowData.meter_type) {
            rowData.meter_type = rowData.meter_type.charAt(0).toUpperCase() + rowData.meter_type.slice(1);
        }

        const rowHeights = columnDefinitions.map(col => {
            const val = String(rowData[col.key] || '');
            return doc.heightOfString(val, { width: col.width - 10, fontSize: 8 });
        });
        const maxRowHeight = Math.max(...rowHeights) + 10;

        if (y + maxRowHeight > 780) {
            doc.addPage();
            y = 50;
            doc.rect(30, y - 10, totalTableWidth, 20).fill('#3b82f6');
            doc.fillColor('#ffffff').fontSize(9);
            columnDefinitions.forEach(col => {
                doc.text(col.label, col.x, y - 5, { width: col.width - 5, align: 'left' });
            });
            y += 20;
        }

        if (rowIndex % 2 === 0) {
            doc.rect(30, y - 5, totalTableWidth, maxRowHeight).fill('#f8fafc');
        }

        doc.fillColor('#475569').fontSize(8);
        columnDefinitions.forEach(col => {
            const val = String(rowData[col.key] || '');
            doc.text(val, col.x, y, { width: col.width - 10, align: 'left', lineGap: 2 });
        });

        y += maxRowHeight;
    });

    // Subtotal del último mes si aplica
    if (lastMonth && totalKey) {
        drawSubtotal(lastMonth, monthlyTotal);
    }

    // Gran Total Final si aplica
    if (totalKey) {
        if (y > 750) { doc.addPage(); y = 50; }
        doc.rect(30, y - 5, totalTableWidth, 25).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(10).text('TOTAL FINAL:', 40, y + 5, { bold: true });

        const lastCol = columnDefinitions[columnDefinitions.length - 1];
        doc.text(`$ ${grandTotal.toFixed(2)}`, lastCol.x, y + 5, { width: lastCol.width, align: 'left', bold: true });
    }

    // Footer
    try {
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).fillColor('#94a3b8').text(`Página ${i + 1}`, 30, doc.page.height - 40, { align: 'center' });
        }
    } catch (footerErr) {
        console.error('Error al generar footer de PDF:', footerErr);
    }

    doc.end();
};

const getUsersMeters = async (req, res, next) => {
    try {
        const data = await reportsModel.getUsersMetersReport();
        if (req.query.format === 'pdf') {
            const cols = [
                { label: 'Usuario', key: 'user_name', width: 200 },
                { label: 'Cédula', key: 'national_id' },
                { label: 'Código Med.', key: 'meter_code' },
                { label: 'Tipo', key: 'meter_type' },
                { label: 'Asignación', key: 'assignment_status' }
            ];
            generatePDF(res, 'Directorio de Usuarios y Medidores', data, cols);
        } else {
            res.json(data);
        }
    } catch (err) {
        next(err);
    }
};

const getReadings = async (req, res, next) => {
    try {
        const { startMonth, endMonth, format } = req.query;
        if (!startMonth || !endMonth) {
            return res.status(400).json({ message: 'Mes inicial y final son requeridos (YYYY-MM)' });
        }
        const data = await reportsModel.getReadingsReport(startMonth, endMonth);

        if (format === 'pdf') {
            const cols = [
                { label: 'Usuario', key: 'user_name', width: 160 },
                { label: 'Medidor', key: 'meter_code', width: 80 },
                { label: 'Tipo', key: 'meter_type', width: 60 },
                { label: 'Lec. Ant.', key: 'previous_reading', width: 55 },
                { label: 'Lec. Act.', key: 'current_reading', width: 55 },
                { label: 'Cons.', key: 'consumption', width: 45 },
                { label: 'Estado', key: 'invoice_status', width: 60 }
            ];
            generatePDF(res, 'Historial de Lecturas', data, cols, `${startMonth} a ${endMonth}`);
        } else {
            res.json(data);
        }
    } catch (err) {
        next(err);
    }
};

const getRecollection = async (req, res, next) => {
    try {
        const { startMonth, endMonth, format } = req.query;
        if (!startMonth || !endMonth) {
            return res.status(400).json({ message: 'Mes inicial y final son requeridos (YYYY-MM)' });
        }
        const data = await reportsModel.getRecollectionReport(startMonth, endMonth);

        if (format === 'pdf') {
            const cols = [
                { label: 'Usuario', key: 'user_name', width: 200 },
                { label: 'Fecha Pago', key: 'payment_date' },
                { label: 'Mes Fact.', key: 'billing_month' },
                { label: 'Método', key: 'payment_method' },
                { label: 'Total $', key: 'paid_amount' }
            ];
            // 'paid_amount' incluye Consumo, Riego y Rubros Adicionales
            generatePDF(res, 'Reporte de Recaudación', data, cols, `${startMonth} a ${endMonth}`, 'paid_amount');
        } else {
            res.json(data);
        }
    } catch (err) {
        next(err);
    }
};

const getDelinquency = async (req, res, next) => {
    try {
        const { startMonth, endMonth, format } = req.query;
        if (!startMonth || !endMonth) {
            return res.status(400).json({ message: 'Mes inicial y final son requeridos (YYYY-MM)' });
        }
        const data = await reportsModel.getDelinquencyReport(startMonth, endMonth);

        if (format === 'pdf') {
            const cols = [
                { label: 'Usuario', key: 'user_name', width: 200 },
                { label: 'Cédula', key: 'national_id' },
                { label: 'Mes Fact.', key: 'billing_month' },
                { label: 'Estado', key: 'status' },
                { label: 'Total $', key: 'total_debt' }
            ];
            // 'total_debt' incluye deuda de agua y rubros adicionales
            generatePDF(res, 'Reporte de Morosidad', data, cols, `${startMonth} a ${endMonth}`, 'total_debt');
        } else {
            res.json(data);
        }
    } catch (err) {
        next(err);
    }
};

const getAdditionalCharges = async (req, res, next) => {
    try {
        const { startMonth, endMonth, format } = req.query;
        if (!startMonth || !endMonth) {
            return res.status(400).json({ message: 'Mes inicial y final son requeridos (YYYY-MM)' });
        }
        const data = await reportsModel.getAdditionalChargesReport(startMonth, endMonth);

        if (format === 'pdf') {
            const cols = [
                { label: 'Usuario', key: 'user_name' },
                { label: 'Mes Fact.', key: 'billing_month' },
                { label: 'Concepto', key: 'concept' },
                { label: 'Monto $', key: 'concept_amount' },
                { label: 'Estado', key: 'invoice_status' }
            ];
            // Sumamos 'concept_amount' para ver totales de rubros adicionales
            generatePDF(res, 'Reporte de Rubros Adicionales', data, cols, `${startMonth} a ${endMonth}`, 'concept_amount');
        } else {
            res.json(data);
        }
    } catch (err) {
        next(err);
    }
};

const getActiveUsers = async (req, res, next) => {
    try {
        const { format } = req.query;
        const data = await reportsModel.getActiveUsersReport();

        if (format === 'pdf') {
            const cols = [
                { label: 'Usuario', key: 'user_name', width: 200 },
                { label: 'Cédula', key: 'national_id' },
                { label: 'Teléfono', key: 'phone' },
                { label: 'Correo', key: 'email' },
                { label: 'Dirección', key: 'address' }
            ];
            generatePDF(res, 'Directorio de Usuarios Activos', data, cols);
        } else {
            res.json(data);
        }
    } catch (err) {
        next(err);
    }
};

const getDailyCollections = async (req, res, next) => {
    try {
        const { date, format } = req.query;
        if (!date) {
            return res.status(400).json({ message: 'El parámetro date (YYYY-MM-DD) es requerido.' });
        }
        const data = await reportsModel.getDailyCollectionsReport(date);

        if (format === 'pdf') {
            const cols = [
                { label: 'Cliente',          key: 'cliente',           width: 170 },
                { label: 'Mes Factura',      key: 'mes_factura',       width: 75  },
                { label: 'Nro Fact.',        key: 'invoice_id',        width: 50  },
                { label: 'Monto $',          key: 'monto_factura',     width: 60  },
                { label: 'Efectivo $',       key: 'efectivo_recibido', width: 60  },
                { label: 'Cambio $',         key: 'cambio_entregado',  width: 60  },
            ];
            const [y, m, d] = date.split('-');
            generatePDF(res, `Cobros del día ${d}/${m}/${y}`, data, cols, date, 'monto_factura');
        } else {
            res.json(data);
        }
    } catch (err) {
        next(err);
    }
};

const getCashBalance = async (req, res, next) => {
    try {
        const { startMonth, endMonth, format } = req.query;
        if (!startMonth || !endMonth) {
            return res.status(400).json({ message: 'Mes inicial y final son requeridos (YYYY-MM)' });
        }

        const formatPeriod = (ym) => {
            if (!ym) return '';
            const [y, m] = ym.split('-');
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return `${months[parseInt(m) - 1]} ${y}`;
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.toLocaleDateString('es-ES', { year:'numeric', month:'2-digit', day:'2-digit' });
        };

        const data = await reportsModel.getCashBalanceReport(startMonth, endMonth);
        const details = await reportsModel.getCashExpensesDetailReport(startMonth, endMonth);

        // Agrupar todo mes a mes en un Map para el resumen
        const summaryMap = new Map();
        
        data.ingresos.forEach(i => {
            if (!summaryMap.has(i.mes)) summaryMap.set(i.mes, { mes: i.mes, ingresos: 0, egresos: 0, saldo: 0 });
            summaryMap.get(i.mes).ingresos = parseFloat(i.total_ingresos);
        });
        data.egresos.forEach(e => {
            if (!summaryMap.has(e.mes)) summaryMap.set(e.mes, { mes: e.mes, ingresos: 0, egresos: 0, saldo: 0 });
            summaryMap.get(e.mes).egresos = parseFloat(e.total_egresos);
        });

        // Convertir a Array y calcular saldos
        const summaryArr = Array.from(summaryMap.values()).map(row => {
            row.saldo = row.ingresos - row.egresos;
            return row;
        }).sort((a, b) => a.mes.localeCompare(b.mes)); // Orden cronológico cronológico

        if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Estado_Caja_${startMonth}_${endMonth}.pdf`);
            doc.pipe(res);

            // ================= HEADER GENERAL =================
            doc.fillColor('#1d4ed8').fontSize(20).text('JUNTA ADMINISTRADORA DE AGUA POTABLE COMUNIDAD CHALUAPAMBA', { align: 'center' });
            doc.fontSize(10).fillColor('#64748b').text('Gestión Eficiente y Transparente', { align: 'center' });
            doc.moveDown(1.5);
            
            const titleY = doc.y;
            doc.rect(30, titleY, 535, 30).fill('#f1f5f9');
            doc.fillColor('#1e293b').fontSize(14).text('ESTADO DE CAJA CONSOLIDADO', 40, titleY + 8, { bold: true });
            
            const infoY = titleY + 35;
            doc.fontSize(9).fillColor('#64748b');
            doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 30, infoY, { width: 535, align: 'right' });
            doc.fillColor('#1e293b').fontSize(10).text(`Periodo: ${formatPeriod(startMonth)} a ${formatPeriod(endMonth)}`, 30, infoY, { width: 535, align: 'left' });
            doc.moveDown(2);


            // ================= SECCIÓN 1: RESUMEN MENSUAL =================
            doc.fontSize(12).fillColor('#1e293b').text('RESUMEN DE INGRESOS, EGRESOS Y SALDOS POR MES', 30, doc.y, { bold: true });
            doc.moveDown(0.5);

            let tableTop = doc.y;
            const resCols = [
                { label: '', x: 35, w: 150 }, // Se dibuja manual abajo a la izq
                { label: 'TOTAL INGRESOS', x: 200, w: 100 },
                { label: 'TOTAL EGRESOS', x: 320, w: 100 },
                { label: 'SALDO DEL MES', x: 440, w: 100 }
            ];

            // Header Tabla 1
            doc.rect(30, tableTop, 535, 20).fill('#3b82f6');
            doc.fillColor('#ffffff').fontSize(9);
            resCols.forEach(c => { if(c.label) doc.text(c.label, c.x, tableTop + 5, { width: c.w, align: 'right' }); });
            
            // Excepción de alineamiento param es
            doc.text('MES / PERIODO', 40, tableTop + 5, { width: 140, align: 'left' });

            let y = tableTop + 25;
            let sumIn = 0, sumOut = 0, sumBal = 0;

            summaryArr.forEach((row, i) => {
                sumIn += row.ingresos; sumOut += row.egresos; sumBal += row.saldo;
                if (i % 2 === 0) doc.rect(30, y - 5, 535, 20).fill('#f8fafc');
                
                doc.fillColor('#475569').fontSize(9);
                doc.text(formatPeriod(row.mes), 40, y);
                doc.text(`$ ${row.ingresos.toFixed(2)}`, resCols[1].x, y, { width: resCols[1].w, align: 'right' });
                doc.text(`$ ${row.egresos.toFixed(2)}`, resCols[2].x, y, { width: resCols[2].w, align: 'right' });
                doc.fillColor(row.saldo >= 0 ? '#10b981' : '#ef4444')
                   .text(`$ ${(row.saldo).toFixed(2)}`, resCols[3].x, y, { width: resCols[3].w, align: 'right', bold: true });
                y += 20;
            });

            // Fila de Total
            doc.rect(30, y - 5, 535, 25).fill('#1e293b');
            doc.fillColor('#ffffff').fontSize(10).text('TOTAL ACUMULADO DEL PERIODO:', 40, y + 5, { bold: true });
            doc.text(`$ ${sumIn.toFixed(2)}`, resCols[1].x, y + 5, { width: resCols[1].w, align: 'right', bold: true });
            doc.text(`$ ${sumOut.toFixed(2)}`, resCols[2].x, y + 5, { width: resCols[2].w, align: 'right', bold: true });
            doc.text(`$ ${sumBal.toFixed(2)}`, resCols[3].x, y + 5, { width: resCols[3].w, align: 'right', bold: true });
            
            doc.moveDown(3);


            // ================= SECCIÓN 2: DETALLE DE EGRESOS =================
            if (doc.y > 600) doc.addPage();
            
            doc.fontSize(12).fillColor('#1e293b').text('DETALLE DE REGISTRO DE EGRESOS Y GASTOS', 30, doc.y, { bold: true });
            doc.moveDown(0.5);

            tableTop = doc.y;
            const detCols = [
                { label: 'FECHA', x: 35, w: 60 },
                { label: 'CATEGORÍA', x: 100, w: 120 },
                { label: 'DESCRIPCIÓN', x: 230, w: 230 },
                { label: 'FORMA', x: 470, w: 40 },
                { label: 'MONTO', x: 510, w: 50 },
            ];

            // Header Tabla 2
            const drawTable2Header = (newY) => {
                doc.rect(30, newY, 535, 20).fill('#64748b');
                doc.fillColor('#ffffff').fontSize(8);
                detCols.forEach(c => doc.text(c.label, c.x, newY + 5, { width: c.w, align: c.label === 'MONTO' ? 'right' : 'left' }));
                return newY + 25;
            };

            y = drawTable2Header(tableTop);

            if (details.length === 0) {
                doc.fillColor('#64748b').fontSize(9).text('No hay egresos registrados en este periodo.', 40, y+5);
            } else {
                details.forEach((row, i) => {
                    // Control de salto de pagina
                    const heights = [doc.heightOfString(row.description || '', { width: detCols[2].w, fontSize: 8 })];
                    const rowH = Math.max(...heights) + 10;
                    
                    if (y + rowH > 780) {
                        doc.addPage();
                        y = drawTable2Header(50);
                    }

                    if (i % 2 === 0) doc.rect(30, y - 5, 535, rowH).fill('#f8fafc');

                    doc.fillColor('#475569').fontSize(8);
                    doc.text(formatDate(row.expense_date).split(' ')[0], detCols[0].x, y); // solo fecha
                    doc.text(row.category_name || 'Sin Categoría', detCols[1].x, y, { width: detCols[1].w });
                    doc.text(row.description || '-', detCols[2].x, y, { width: detCols[2].w, lineGap: 2 });
                    doc.text(row.payment_method === 'cash' ? 'Efec.' : 'Transf.', detCols[3].x, y);
                    doc.fillColor('#ef4444').text(`$${parseFloat(row.amount).toFixed(2)}`, detCols[4].x, y, { width: detCols[4].w, align: 'right', bold: true });

                    y += rowH;
                });
            }

            // Footer
            try {
                const pageCount = doc.bufferedPageRange().count;
                for (let i = 0; i < pageCount; i++) {
                    doc.switchToPage(i);
                    doc.fontSize(8).fillColor('#94a3b8').text(`Página ${i + 1}`, 30, doc.page.height - 40, { align: 'center' });
                }
            } catch (err) {}

            doc.end();

        } else {
            res.json({ resumen: summaryArr, detalle: details });
        }
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getUsersMeters,
    getReadings,
    getRecollection,
    getDelinquency,
    getAdditionalCharges,
    getActiveUsers,
    getDailyCollections,
    getCashBalance,
};



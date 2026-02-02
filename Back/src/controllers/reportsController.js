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
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

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
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#94a3b8').text(`Página ${i + 1}`, 30, doc.page.height - 40, { align: 'center' });
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

module.exports = {
    getUsersMeters,
    getReadings,
    getRecollection,
    getDelinquency,
    getAdditionalCharges,
    getActiveUsers
};

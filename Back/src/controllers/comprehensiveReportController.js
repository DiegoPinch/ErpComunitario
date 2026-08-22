const reportsModel = require('../models/reportsModel');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');

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

const formatCurrency = (amount) => {
    return '$' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const translatePaymentMethod = (method) => {
    switch (String(method).toLowerCase()) {
        case 'cash': return 'Efectivo';
        case 'transfer': return 'Transf.';
        case 'deposit': return 'Depósito';
        case 'card': return 'Tarjeta';
        default: return method || 'Otro';
    }
};

const accountingPeriodsModel = require('../models/accountingPeriodsModel');

const getComprehensivePdf = async (req, res, next) => {
    try {
        const { periodId, startDate, endDate, startMonth, endMonth } = req.query;
        let resolvedStartDate, resolvedEndDate, periodTitle;
        let administrationName = '';
        let administrationId = null;
        let boardMembers = [];

        const formatDateOnly = (dStr) => {
            try {
                const d = new Date(dStr);
                if (isNaN(d.getTime())) return dStr;
                const pad = (n) => String(n).padStart(2, '0');
                return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
            } catch(e) { return dStr; }
        };

        let periodData = null;
        if (periodId && periodId !== 'null' && periodId !== 'undefined') {
            const period = await accountingPeriodsModel.getPeriodById(periodId);
            if (!period) {
                return res.status(404).json({ message: 'Corte contable no encontrado' });
            }
            
            // Forzar las fechas a abarcar el día completo
            const sd = new Date(period.start_date);
            resolvedStartDate = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}-${String(sd.getDate()).padStart(2, '0')} 00:00:00`;
            
            const ed = new Date(period.end_date);
            resolvedEndDate = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}-${String(ed.getDate()).padStart(2, '0')} 23:59:59`;

            periodTitle = `Corte: ${period.title}`;
            administrationName = period.administration_name;
            administrationId = period.administration_id;
            periodData = period;
        } else if (startDate && endDate) {
            resolvedStartDate = `${startDate} 00:00:00`;
            resolvedEndDate = `${endDate} 23:59:59`;
            periodTitle = `Reporte Contable: del ${formatDateOnly(startDate)} al ${formatDateOnly(endDate)}`;
            
            const [adminRow] = await pool.query("SELECT name, administration_id FROM administrations WHERE status = 'active' LIMIT 1");
            if (adminRow.length > 0) {
                administrationName = adminRow[0].name;
                administrationId = adminRow[0].administration_id;
            }
        } else if (startMonth && endMonth) {
            resolvedStartDate = `${startMonth}-01 00:00:00`;
            const [ey, em] = endMonth.split('-');
            const lastDay = new Date(parseInt(ey), parseInt(em), 0).getDate();
            resolvedEndDate = `${endMonth}-${String(lastDay).padStart(2,'0')} 23:59:59`;
            periodTitle = `Reporte Contable: de ${startMonth} a ${endMonth}`;
            
            const [adminRow] = await pool.query("SELECT name, administration_id FROM administrations WHERE status = 'active' LIMIT 1");
            if (adminRow.length > 0) {
                administrationName = adminRow[0].name;
                administrationId = adminRow[0].administration_id;
            }
        } else {
            // Current unclosed period
            const allPeriods = await accountingPeriodsModel.getAllPeriods();
            if (allPeriods.length > 0) {
                resolvedStartDate = allPeriods[0].end_date;
            } else {
                resolvedStartDate = '1970-01-01 00:00:00'; // Fallback if no periods exist
            }
            // Use current time as end date
            const now = new Date();
            resolvedEndDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
            periodTitle = 'Corte Actual (En curso)';
            
            const [adminRow] = await pool.query("SELECT name, administration_id FROM administrations WHERE status = 'active' LIMIT 1");
            if (adminRow.length > 0) {
                administrationName = adminRow[0].name;
                administrationId = adminRow[0].administration_id;
            }
        }

        if (administrationId) {
            const [bmRows] = await pool.query(
                `SELECT bm.role, CONCAT(u.first_name, ' ', u.last_name) as member_name
                 FROM board_members bm
                 JOIN users u ON bm.user_id = u.user_id
                 WHERE bm.administration_id = ? AND bm.active = 1`,
                [administrationId]
            );
            boardMembers = bmRows;
        }

        const data = await reportsModel.getComprehensiveReport(resolvedStartDate, resolvedEndDate);
        
        // Formatear datos
        const bankAccounts = data.bankAccounts;
        const incomes = data.incomes;
        const expenses = data.expenses;
        const accountsReceivableDetails = data.accountsReceivableDetails;

        // 1. Obtener saldos iniciales antes de resolvedStartDate
        const [openingCashRes] = await pool.query(`
            SELECT 
                (
                    COALESCE((SELECT SUM(invoice_amount) FROM payments WHERE payment_date < ? AND account_id IS NULL), 0) +
                    COALESCE((SELECT SUM(amount_paid) FROM debt_payments WHERE payment_date < ? AND account_id IS NULL), 0) +
                    COALESCE((SELECT SUM(amount) FROM other_incomes WHERE income_date < ? AND account_id IS NULL), 0) -
                    COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date < ? AND payment_method = 'cash'), 0)
                ) as opening_cash
        `, [resolvedStartDate, resolvedStartDate, resolvedStartDate, resolvedStartDate]);
        const openingCash = parseFloat(openingCashRes[0]?.opening_cash || 0);

        const [openingAccountsRows] = await pool.query(`
            SELECT 
                b.account_id,
                (
                    b.initial_balance +
                    COALESCE((SELECT SUM(amount_paid) FROM payments WHERE payment_date < ? AND account_id = b.account_id), 0) +
                    COALESCE((SELECT SUM(amount_paid) FROM debt_payments WHERE payment_date < ? AND account_id = b.account_id), 0) +
                    COALESCE((SELECT SUM(amount) FROM other_incomes WHERE income_date < ? AND account_id = b.account_id), 0) -
                    COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date < ? AND account_id = b.account_id AND payment_method != 'cash'), 0) +
                    COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date < ? AND account_id = b.account_id AND payment_method = 'cash'), 0)
                ) as opening_balance
            FROM bank_accounts b
        `, [resolvedStartDate, resolvedStartDate, resolvedStartDate, resolvedStartDate, resolvedStartDate]);

        const openingAccounts = {};
        openingAccountsRows.forEach(row => {
            openingAccounts[row.account_id] = parseFloat(row.opening_balance || 0);
        });

        // Estructuras de balance
        const openingGlobal = openingCash + Object.values(openingAccounts).reduce((a, b) => a + b, 0);
        const balances = {
            cash: { initial: openingCash, incomes: 0, expenses: 0, balance: openingCash },
            global: { initial: openingGlobal, incomes: 0, expenses: 0, balance: openingGlobal },
            accounts: {}
        };

        bankAccounts.forEach(acc => {
            const initBal = openingAccounts[acc.account_id] || 0;
            balances.accounts[acc.account_id] = {
                name: `${acc.bank_name} - ${acc.account_number}`,
                initial: initBal,
                incomes: 0,
                expenses: 0,
                balance: initBal
            };
        });

        // Calcular saldos
        incomes.forEach(i => {
            const amt = parseFloat(i.amount) || 0;
            balances.global.incomes += amt;
            if (i.payment_method === 'cash') {
                balances.cash.incomes += amt;
            } else if (i.account_id && balances.accounts[i.account_id]) {
                balances.accounts[i.account_id].incomes += amt;
            } else {
                 balances.cash.incomes += amt; // Fallback
            }
        });

        expenses.forEach(e => {
            const amt = parseFloat(e.amount) || 0;
            if (e.payment_method === 'cash') {
                balances.cash.expenses += amt;
                if (e.account_id && balances.accounts[e.account_id]) {
                    // Es un depósito de efectivo a banco (transferencia interna)
                    balances.accounts[e.account_id].incomes += amt;
                } else {
                    balances.global.expenses += amt;
                }
            } else if (e.account_id && balances.accounts[e.account_id]) {
                balances.accounts[e.account_id].expenses += amt;
                balances.global.expenses += amt;
            } else {
                 balances.cash.expenses += amt; // Fallback
                 balances.global.expenses += amt;
            }
        });

        // Calculate nets
        balances.cash.balance = balances.cash.initial + balances.cash.incomes - balances.cash.expenses;
        Object.values(balances.accounts).forEach(acc => {
            acc.balance = acc.initial + acc.incomes - acc.expenses;
        });
        balances.global.balance = balances.cash.balance + Object.values(balances.accounts).reduce((acc, a) => acc + a.balance, 0);

        // --- Generar PDF ---
        const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Reporte_Integral.pdf`);
        doc.pipe(res);

        // Header
        doc.fillColor('#1d4ed8').fontSize(16).text('JUNTA ADMINISTRADORA DE AGUA POTABLE COMUNIDAD CHALUAPAMBA', { align: 'center' });
        doc.fontSize(10).fillColor('#64748b').text('Reporte Contable Integral Detallado', { align: 'center' });
        doc.moveDown(1);

        const titleY = doc.y;
        doc.rect(30, titleY, 535, 25).fill('#f1f5f9');
        doc.fillColor('#1e293b').fontSize(12).text(periodTitle.toUpperCase(), 40, titleY + 7, { bold: true });
        
        doc.fontSize(9).fillColor('#64748b').text(`Desde: ${formatDate(resolvedStartDate)}  -  Hasta: ${formatDate(resolvedEndDate)}`, 30, titleY + 35, { align: 'left' });
        doc.text(`Generado: ${new Date().toLocaleString()}`, 30, titleY + 35, { align: 'right', width: 535 });
        doc.moveDown(1.5);

        // --- Tabla de Resumen ---
        let currentY = doc.y;
        
        const drawSummaryRow = (label, initial, inc, exp, bal, isHeader = false, isBold = false) => {
            const rowH = 18;
            if (isHeader) doc.rect(30, currentY, 535, rowH).fill('#3b82f6');
            else if (isBold) doc.rect(30, currentY, 535, rowH).fill('#e2e8f0');
            else doc.rect(30, currentY, 535, rowH).stroke('#e2e8f0');

            doc.fillColor(isHeader ? '#ffffff' : '#1e293b').fontSize(isHeader ? 8.5 : 9).font(isBold || isHeader ? 'Helvetica-Bold' : 'Helvetica');
            doc.text(label, 35, currentY + 4, { width: 155 });
            doc.text(isHeader ? initial : formatCurrency(initial), 195, currentY + 4, { width: 85, align: 'right' });
            doc.text(isHeader ? inc : formatCurrency(inc), 285, currentY + 4, { width: 85, align: 'right' });
            doc.text(isHeader ? exp : formatCurrency(exp), 375, currentY + 4, { width: 85, align: 'right' });
            
            if (!isHeader) doc.fillColor(bal >= 0 ? '#10b981' : '#ef4444').font('Helvetica-Bold');
            doc.text(isHeader ? bal : formatCurrency(bal), 465, currentY + 4, { width: 90, align: 'right' });
            currentY += rowH;
        };

        drawSummaryRow('CUENTA / ENTIDAD', 'SALDO INICIAL', 'INGRESOS', 'EGRESOS', 'SALDO FINAL', true);
        drawSummaryRow('Efectivo Físico (Caja)', balances.cash.initial, balances.cash.incomes, balances.cash.expenses, balances.cash.balance);
        Object.values(balances.accounts).forEach(acc => {
            drawSummaryRow(acc.name, acc.initial, acc.incomes, acc.expenses, acc.balance);
        });
        drawSummaryRow('TOTAL GLOBAL (SISTEMA)', balances.global.initial, balances.global.incomes, balances.global.expenses, balances.global.balance, false, true);

        // Nota aclaratoria de transferencias internas
        let totalTransfers = 0;
        expenses.forEach(e => {
            if (e.payment_method === 'cash' && e.account_id) {
                totalTransfers += parseFloat(e.amount) || 0;
            }
        });

        if (totalTransfers > 0) {
            currentY += 5;
            doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Oblique');
            doc.text(`* Nota: Se incluye ${formatCurrency(totalTransfers)} de traspasos de efectivo a cuentas bancarias. Este valor reduce la Caja Chica y aumenta los Bancos, pero se excluye del Egreso Global por ser movimiento interno.`, 30, currentY, { width: 535 });
            currentY += 16;
            doc.y = currentY;
        }

        if (periodData) {
            let auditY = currentY + 15;
            doc.rect(30, auditY, 535, 50).stroke('#cbd5e1').lineWidth(1);
            
            // Título de Auditoría de Caja
            doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
            doc.text('AUDITORÍA DE CIERRE DE CAJA (CORTE CONTABLE)', 40, auditY + 6);
            
            // Subtítulos
            doc.fontSize(8).font('Helvetica');
            doc.text(`Título: ${periodData.title}`, 40, auditY + 18);
            doc.text(`Saldo Anterior: ${formatCurrency(periodData.previous_balance)}`, 40, auditY + 30);
            
            doc.text(`Saldo Sistema: ${formatCurrency(periodData.system_balance)}`, 190, auditY + 18);
            doc.text(`Dinero Físico: ${formatCurrency(periodData.physical_balance)}`, 190, auditY + 30);
            
            const diff = parseFloat(periodData.difference) || 0;
            const diffText = diff === 0 ? 'CUADRADO ($0.00)' : (diff > 0 ? `SOBRANTE DE +${formatCurrency(diff)}` : `FALTANTE DE ${formatCurrency(diff)}`);
            const diffColor = diff === 0 ? '#059669' : '#dc2626';
            
            doc.font('Helvetica-Bold').fillColor(diffColor);
            doc.text(`RESULTADO: ${diffText}`, 360, auditY + 18, { width: 190 });
            doc.font('Helvetica').fontSize(7.5).fillColor('#64748b');
            doc.text('Verificado por Auditoría Interna', 360, auditY + 30);
            
            currentY = auditY + 50;
            doc.y = currentY;
            doc.moveDown(1.5);
        } else {
            doc.moveDown(2);
        }

        // --- Agrupación por Conceptos Contables ---
        const incomeConceptTotals = {};
        
        const normalizeIncomeKey = (key) => {
            if (!key) return 'Otros';
            const normalized = String(key).trim().toLowerCase();
            if (normalized === 'venta de ramal' || normalized === 'instalación' || normalized === 'instalacion') {
                return 'Venta de Ramal';
            }
            if (normalized === 'multa' || normalized === 'multas' || normalized === 'multas de agua') {
                return 'Multas';
            }
            if (normalized === 'donación' || normalized === 'donacion') {
                return 'Donaciones';
            }
            if (normalized === 'cuota extraordinaria' || normalized === 'cuotas extraordinarias') {
                return 'Cuotas Extraordinarias';
            }
            if (normalized === 'consumo de agua' || normalized === 'factura de agua') {
                return 'Consumo de Agua';
            }
            if (normalized === 'pago convenio/deuda' || normalized === 'convenio' || normalized === 'deuda' || normalized === 'pago de convenios') {
                return 'Deuda Histórica';
            }
            // Capitalize
            return key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        };

        incomes.forEach(i => {
            const amt = parseFloat(i.amount) || 0;
            const type = i.type || 'Sin Especificar';
            
            if (type === 'Factura de Agua') {
                if (i.invoice_type === 'installation') {
                    const normKey = normalizeIncomeKey('Venta de Ramal');
                    incomeConceptTotals[normKey] = (incomeConceptTotals[normKey] || 0) + amt;
                } else if (i.invoice_type === 'legacy_debt') {
                    const normKey = normalizeIncomeKey('Pago Convenio/Deuda');
                    incomeConceptTotals[normKey] = (incomeConceptTotals[normKey] || 0) + amt;
                } else {
                    const ratio = i.total_amount > 0 ? (amt / i.total_amount) : 1;
                    let water = parseFloat(i.water_component || 0) * ratio;
                    let fine = parseFloat(i.fine_component || 0) * ratio;
                    let additional = parseFloat(i.additional_component || 0) * ratio;

                    // Fallback
                    if (water + fine + additional === 0 && amt > 0) {
                        if (i.invoice_type === 'water') {
                            water = amt;
                        } else {
                            additional = amt;
                        }
                    }
                    
                    const waterKey = normalizeIncomeKey('Consumo de Agua');
                    const fineKey = normalizeIncomeKey('Multas');
                    const additionalKey = normalizeIncomeKey('Rubros Adicionales');

                    if (water > 0) {
                        incomeConceptTotals[waterKey] = (incomeConceptTotals[waterKey] || 0) + water;
                    }
                    if (fine > 0) {
                        incomeConceptTotals[fineKey] = (incomeConceptTotals[fineKey] || 0) + fine;
                    }
                    if (additional > 0) {
                        incomeConceptTotals[additionalKey] = (incomeConceptTotals[additionalKey] || 0) + additional;
                    }
                }
            } else {
                let keyToNormalize = type;
                const descLower = String(i.source_dest || '').toLowerCase();
                const agreementDescLower = String(i.agreement_desc || '').toLowerCase();
                
                if (descLower.includes('ramal') || descLower.includes('conexion') || descLower.includes('conexión') ||
                    agreementDescLower.includes('ramal') || agreementDescLower.includes('conexion') || agreementDescLower.includes('conexión')) {
                    keyToNormalize = 'Venta de Ramal';
                }
                const normKey = normalizeIncomeKey(keyToNormalize);
                incomeConceptTotals[normKey] = (incomeConceptTotals[normKey] || 0) + amt;
            }
        });

        const expenseCategoryTotals = {};
        expenses.forEach(e => {
            const amt = parseFloat(e.amount) || 0;
            const type = e.type || 'Sin Categoría';
            expenseCategoryTotals[type] = (expenseCategoryTotals[type] || 0) + amt;
        });

        // Función para dibujar una tabla de resumen simple (solo dos columnas: Concepto y Monto)
        const drawConceptSummaryTable = (title, dataMap, isIncome) => {
            // Check page space
            if (doc.y > 680) {
                doc.addPage();
                currentY = 40;
            } else {
                currentY = doc.y;
            }

            const total = Object.values(dataMap).reduce((acc, val) => acc + val, 0);

            doc.rect(30, currentY, 260, 18).fill(isIncome ? '#10b981' : '#ef4444');
            doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(title, 40, currentY + 5);
            currentY += 18;

            let isPair = false;
            for (const [concept, amount] of Object.entries(dataMap)) {
                if (doc.y > 780) {
                    doc.addPage();
                    currentY = 40;
                }
                if (isPair) doc.rect(30, currentY, 260, 16).fill('#f8fafc');
                else doc.rect(30, currentY, 260, 16).fill('#ffffff');
                doc.stroke('#e2e8f0');
                
                doc.fillColor('#1e293b').fontSize(8).font('Helvetica');
                doc.text(concept, 35, currentY + 4, { width: 160 });
                doc.text(formatCurrency(amount), 200, currentY + 4, { width: 85, align: 'right' });
                currentY += 16;
                isPair = !isPair;
            }

            // Total row
            doc.rect(30, currentY, 260, 16).fill('#e2e8f0');
            doc.fillColor('#1e293b').font('Helvetica-Bold');
            doc.text('TOTAL', 35, currentY + 4, { width: 160 });
            doc.fillColor(isIncome ? '#059669' : '#dc2626');
            doc.text(formatCurrency(total), 200, currentY + 4, { width: 85, align: 'right' });
            currentY += 25; // Add spacing below the table
        };

        // Draw the two tables side by side or sequentially
        const startYConcepts = doc.y;
        
        // Draw Incomes on the left
        let maxLeftY = 0;
        doc.y = startYConcepts;
        drawConceptSummaryTable('RESUMEN INGRESOS POR CONCEPTO', incomeConceptTotals, true);
        maxLeftY = currentY;

        // Draw Expenses on the right
        currentY = startYConcepts;
        
        const drawRightConceptSummaryTable = (title, dataMap, isIncome) => {
            const rightX = 305;
            const total = Object.values(dataMap).reduce((acc, val) => acc + val, 0);

            doc.rect(rightX, currentY, 260, 18).fill(isIncome ? '#10b981' : '#ef4444');
            doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(title, rightX + 10, currentY + 5);
            currentY += 18;

            let isPair = false;
            for (const [concept, amount] of Object.entries(dataMap)) {
                if (isPair) doc.rect(rightX, currentY, 260, 16).fill('#f8fafc');
                else doc.rect(rightX, currentY, 260, 16).fill('#ffffff');
                doc.stroke('#e2e8f0');
                
                doc.fillColor('#1e293b').fontSize(8).font('Helvetica');
                doc.text(concept, rightX + 5, currentY + 4, { width: 160 });
                doc.text(formatCurrency(amount), rightX + 170, currentY + 4, { width: 85, align: 'right' });
                currentY += 16;
                isPair = !isPair;
            }

            // Total row
            doc.rect(rightX, currentY, 260, 16).fill('#e2e8f0');
            doc.fillColor('#1e293b').font('Helvetica-Bold');
            doc.text('TOTAL', rightX + 5, currentY + 4, { width: 160 });
            doc.fillColor(isIncome ? '#059669' : '#dc2626');
            doc.text(formatCurrency(total), rightX + 170, currentY + 4, { width: 85, align: 'right' });
            currentY += 25;
        };

        drawRightConceptSummaryTable('RESUMEN EGRESOS POR CATEGORÍA', expenseCategoryTotals, false);
        
        // Reset Y to the max of both sides
        doc.y = Math.max(maxLeftY, currentY);
        doc.moveDown(1.5);

        // --- Sección de Cuentas por Cobrar (Cartera Vencida Desglosada) ---
        currentY = doc.y;
        if (currentY > 650) {
            doc.addPage();
            currentY = 40;
        }

        doc.rect(30, currentY, 535, 18).fill('#b45309'); // Color marrón/naranja
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('RESUMEN DE CUENTAS POR COBRAR (CARTERA VENCIDA)', 40, currentY + 5);
        currentY += 18;

        const drawReceivableRow = (label, amount, isTotal = false) => {
            doc.rect(30, currentY, 535, 16).stroke('#e2e8f0');
            if (isTotal) doc.rect(30, currentY, 535, 16).fill('#fffbeb');
            doc.fillColor('#1e293b').fontSize(8).font(isTotal ? 'Helvetica-Bold' : 'Helvetica').text(label, 40, currentY + 4);
            doc.fillColor(isTotal ? '#b45309' : '#1e293b').text(formatCurrency(amount), 440, currentY + 4, { width: 110, align: 'right' });
            currentY += 16;
        };

        // Facturas pendientes
        drawReceivableRow('Facturas de Agua por Cobrar (Consumo/Multas/Rubros)', accountsReceivableDetails.pendingInvoices);

        // Convenios pendientes por concepto
        let agreementsTotal = 0;
        accountsReceivableDetails.pendingAgreements.forEach(arg => {
            const amt = parseFloat(arg.total) || 0;
            agreementsTotal += amt;
            const normName = normalizeIncomeKey(arg.description);
            drawReceivableRow(`Deuda Histórica por Cobrar: ${normName}`, amt);
        });

        const totalReceivables = accountsReceivableDetails.pendingInvoices + agreementsTotal;
        drawReceivableRow('TOTAL DE CUENTAS POR COBRAR (DEUDA VIVA)', totalReceivables, true);
        
        doc.y = currentY + 15;
        let ySign = doc.y;
        if (ySign > 680) {
            doc.addPage();
            ySign = 50;
        }

        doc.strokeColor('#cbd5e1').lineWidth(1);
        
        // Vamos a buscar al presidente, tesorero y secretaria en boardMembers
        const president = boardMembers.find(bm => bm.role.toLowerCase().includes('presi'))?.member_name || '';
        const treasurer = boardMembers.find(bm => bm.role.toLowerCase().includes('teso'))?.member_name || '';
        const secretary = boardMembers.find(bm => bm.role.toLowerCase().includes('secre'))?.member_name || '';

        // Títulos de firma
        doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold');
        
        // Firma Presidente (Izquierda)
        doc.moveTo(40, ySign + 50).lineTo(240, ySign + 50).stroke();
        doc.text('FIRMA PRESIDENTE', 40, ySign + 55, { width: 200, align: 'center' });
        doc.font('Helvetica').fontSize(8);
        if (president) {
            doc.text(president.toUpperCase(), 40, ySign + 68, { width: 200, align: 'center' });
        }
        doc.text(`Directiva: ${administrationName || '2026-2028'}`, 40, ySign + (president ? 78 : 68), { width: 200, align: 'center' });

        // Firma Tesorero (Derecha)
        doc.font('Helvetica-Bold').fontSize(9);
        doc.moveTo(355, ySign + 50).lineTo(555, ySign + 50).stroke();
        doc.text('FIRMA TESORERO', 355, ySign + 55, { width: 200, align: 'center' });
        doc.font('Helvetica').fontSize(8);
        if (treasurer) {
            doc.text(treasurer.toUpperCase(), 355, ySign + 68, { width: 200, align: 'center' });
        }
        doc.text(`Directiva: ${administrationName || '2026-2028'}`, 355, ySign + (treasurer ? 78 : 68), { width: 200, align: 'center' });

        // Si hay secretaria, podemos ponerla en el centro más abajo
        if (secretary) {
            ySign += 95;
            if (ySign > 720) {
                doc.addPage();
                ySign = 50;
            }
            doc.font('Helvetica-Bold').fontSize(9);
            doc.moveTo(197, ySign + 50).lineTo(397, ySign + 50).stroke();
            doc.text('FIRMA SECRETARIA', 197, ySign + 55, { width: 200, align: 'center' });
            doc.font('Helvetica').fontSize(8);
            doc.text(secretary.toUpperCase(), 197, ySign + 68, { width: 200, align: 'center' });
            doc.text(`Directiva: ${administrationName || '2026-2028'}`, 197, ySign + 78, { width: 200, align: 'center' });
        }

        // Footer numerado
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).fillColor('#94a3b8').text(`Página ${i + 1} de ${pageCount}`, 30, 800, { align: 'center' });
        }

        doc.end();
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getComprehensivePdf
};

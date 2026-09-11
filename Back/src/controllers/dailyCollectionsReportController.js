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

const formatDateOnly = (dateStr) => {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
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

const translateConceptType = (type) => {
    switch (String(type).toLowerCase()) {
        case 'fine': return 'Multa';
        case 'standard': return 'Rubro';
        case 'installment': return 'Convenio';
        case 'discount': return 'Descuento';
        default: return type || 'Rubro';
    }
};

const getDailyCollections = async (req, res, next) => {
    try {
        const { date, startDate, endDate, format } = req.query;
        let resolvedStartDate, resolvedEndDate, periodTitle;

        if (date) {
            resolvedStartDate = `${date} 00:00:00`;
            resolvedEndDate = `${date} 23:59:59`;
            const [y, m, d] = date.split('-');
            periodTitle = `Cuadre de Caja: ${d}/${m}/${y}`;
        } else if (startDate && endDate) {
            resolvedStartDate = `${startDate} 00:00:00`;
            resolvedEndDate = `${endDate} 23:59:59`;
            periodTitle = `Cuadre de Caja: del ${formatDateOnly(startDate)} al ${formatDateOnly(endDate)}`;
        } else {
            // Default to today
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            resolvedStartDate = `${todayStr} 00:00:00`;
            resolvedEndDate = `${todayStr} 23:59:59`;
            periodTitle = `Cuadre de Caja de Hoy: ${day}/${month}/${year}`;
        }

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
        const cashOpening = parseFloat(openingCashRes[0]?.opening_cash || 0);

        const [openingAccountsRows] = await pool.query(`
            SELECT 
                (
                    SELECT COALESCE(SUM(initial_balance), 0) FROM bank_accounts
                ) +
                COALESCE((SELECT SUM(amount_paid) FROM payments WHERE payment_date < ? AND account_id IS NOT NULL), 0) +
                COALESCE((SELECT SUM(amount_paid) FROM debt_payments WHERE payment_date < ? AND account_id IS NOT NULL), 0) +
                COALESCE((SELECT SUM(amount) FROM other_incomes WHERE income_date < ? AND account_id IS NOT NULL), 0) -
                COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date < ? AND account_id IS NOT NULL AND payment_method != 'cash'), 0) +
                COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date < ? AND account_id IS NOT NULL AND payment_method = 'cash'), 0)
                as opening_banks
        `, [resolvedStartDate, resolvedStartDate, resolvedStartDate, resolvedStartDate, resolvedStartDate]);
        const bankOpening = parseFloat(openingAccountsRows[0]?.opening_banks || 0);

        const data = await reportsModel.getDetailedCollectionsReport(resolvedStartDate, resolvedEndDate);
        const { invoicePayments, debtPayments, otherIncomes, expenses, conceptsBreakdown, bankAccounts } = data;

        let waterTotal = 0;
        let fineTotal = 0;
        let additionalTotal = 0;
        let ramalTotal = 0;
        let agreementTotal = 0;
        let otherIncomeTotal = 0;
        let grandExpenseTotal = 0;

        let cashIn = 0;
        let cashOut = 0;
        let cashOutExpenses = 0;
        let cashOutTransfers = 0;
        let bankIn = 0;
        let bankInRegular = 0;
        let bankInTransfers = 0;
        let bankOut = 0;

        // Inicializar balances por cuenta bancaria
        const bankAccountBalances = {};
        bankAccounts.forEach(acc => {
            bankAccountBalances[acc.account_id] = {
                account_id: acc.account_id,
                bank_name: acc.bank_name,
                account_number: acc.account_number,
                incomes: 0,
                expenses: 0,
                balance: 0
            };
        });

        // Procesar pagos de facturas con desglose proporcional
        const processedInvoicePayments = invoicePayments.map(p => {
            const netPaid = parseFloat(p.invoice_amount || 0);
            const ratio = parseFloat(p.payment_ratio) || 1;
            let water = parseFloat(p.water_component) * ratio;
            let fine = parseFloat(p.fine_component) * ratio;
            let additional = parseFloat(p.additional_component) * ratio;
            const componentsSum = water + fine + additional;

            // Fallback si no hay componentes asociados pero hay cobro
            if (componentsSum === 0 && netPaid > 0) {
                if (p.invoice_type === 'water') {
                    water = netPaid;
                } else if (p.invoice_type === 'installation') {
                    ramalTotal += netPaid;
                    return {
                        ...p,
                        netPaid,
                        water: 0,
                        fine: 0,
                        additional: 0
                    };
                } else {
                    additional = netPaid;
                }
            }

            waterTotal += water;
            fineTotal += fine;
            additionalTotal += additional;

            const isCash = p.payment_method === 'cash';
            if (isCash) {
                cashIn += netPaid;
            } else {
                bankInRegular += netPaid;
                bankIn += netPaid;
                if (p.account_id && bankAccountBalances[p.account_id]) {
                    bankAccountBalances[p.account_id].incomes += netPaid;
                }
            }

            return {
                ...p,
                netPaid,
                water,
                fine,
                additional
            };
        });

        // Procesar convenios
        debtPayments.forEach(p => {
            const amt = parseFloat(p.amount_paid) || 0;
            const descLower = String(p.agreement_desc || '').toLowerCase();
            if (descLower.includes('ramal') || descLower.includes('conexion') || descLower.includes('conexión')) {
                ramalTotal += amt;
            } else {
                agreementTotal += amt;
            }
            if (p.payment_method === 'cash') {
                cashIn += amt;
            } else {
                bankInRegular += amt;
                bankIn += amt;
                if (p.account_id && bankAccountBalances[p.account_id]) {
                    bankAccountBalances[p.account_id].incomes += amt;
                }
            }
        });

        // Procesar otros ingresos
        otherIncomes.forEach(p => {
            const amt = parseFloat(p.amount_paid) || 0;
            const descLower = String(p.description || '').toLowerCase();
            if (descLower.includes('ramal') || descLower.includes('conexion') || descLower.includes('conexión')) {
                ramalTotal += amt;
            } else {
                otherIncomeTotal += amt;
            }
            if (p.payment_method === 'cash') {
                cashIn += amt;
            } else {
                bankInRegular += amt;
                bankIn += amt;
                if (p.account_id && bankAccountBalances[p.account_id]) {
                    bankAccountBalances[p.account_id].incomes += amt;
                }
            }
        });

        // Procesar egresos
        expenses.forEach(p => {
            const amt = parseFloat(p.amount_paid) || 0;
            if (p.payment_method === 'cash') {
                cashOut += amt;
                if (p.account_id && bankAccountBalances[p.account_id]) {
                    // Es una transferencia interna (Depósito de efectivo a banco)
                    cashOutTransfers += amt;
                    bankInTransfers += amt;
                    bankIn += amt;
                    bankAccountBalances[p.account_id].incomes += amt;
                } else {
                    cashOutExpenses += amt;
                    grandExpenseTotal += amt;
                }
            } else {
                bankOut += amt;
                grandExpenseTotal += amt;
                if (p.account_id && bankAccountBalances[p.account_id]) {
                    bankAccountBalances[p.account_id].expenses += amt;
                }
            }
        });

        // Calcular saldos finales por cuenta
        Object.keys(bankAccountBalances).forEach(key => {
            const acc = bankAccountBalances[key];
            acc.balance = acc.incomes - acc.expenses;
        });

        const grandIncomeTotal = waterTotal + fineTotal + additionalTotal + ramalTotal + agreementTotal + otherIncomeTotal;
        const cashNet = cashOpening + cashIn - cashOut;
        const bankNet = bankOpening + bankIn - bankOut;
        const grandNet = grandIncomeTotal - grandExpenseTotal;

        const summary = {
            waterTotal,
            fineTotal,
            additionalTotal,
            ramalTotal,
            agreementTotal,
            otherIncomeTotal,
            grandIncomeTotal,
            grandExpenseTotal,
            cashIn,
            cashOut,
            cashNet,
            bankIn,
            bankOut,
            bankNet,
            grandNet
        };

        // Si no solicita PDF, enviamos JSON
        if (format !== 'pdf') {
            return res.json({
                resumen: [summary], // Mantiene compatibilidad con el array en frontend
                invoicePayments: processedInvoicePayments,
                debtPayments,
                otherIncomes,
                expenses,
                conceptsBreakdown
            });
        }

        // --- GENERAR PDF PROFESIONAL ---
        const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Cuadre_Caja_${(date || 'periodo').replace(/-/g, '_')}.pdf`);
        doc.pipe(res);

        // Header General
        doc.fillColor('#1d4ed8').fontSize(16).text('JUNTA ADMINISTRADORA DE AGUA POTABLE COMUNIDAD CHALUAPAMBA', { align: 'center' });
        doc.fontSize(10).fillColor('#64748b').text('Control Financiero y Arqueo de Caja', { align: 'center' });
        doc.moveDown(1.2);

        // Título del Reporte
        const titleY = doc.y;
        doc.rect(30, titleY, 535, 25).fill('#f1f5f9');
        doc.fillColor('#1e293b').fontSize(12).text(periodTitle.toUpperCase(), 40, titleY + 7, { bold: true });
        
        doc.fontSize(8).fillColor('#64748b').text(`Filtro: ${formatDate(resolvedStartDate)}  a  ${formatDate(resolvedEndDate)}`, 30, titleY + 32, { align: 'left' });
        doc.text(`Impreso: ${new Date().toLocaleString()}`, 30, titleY + 32, { align: 'right', width: 535 });
        doc.moveDown(1.8);

        // ================= TARJETAS DE CONCILIACIÓN (CAJA VS BANCO) =================
        let currentY = doc.y;
        
        // Caja Chica (Izquierda)
        doc.rect(30, currentY, 260, 115).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('CAJA CHICA (EFECTIVO FÍSICO)', 40, currentY + 8);
        doc.font('Helvetica').fontSize(8).fillColor('#475569');
        doc.text(`Saldo Inicial Caja Chica:`, 40, currentY + 23);
        doc.text(formatCurrency(cashOpening), 190, currentY + 23, { width: 90, align: 'right' });
        doc.text(`(+) Recaudación Efectivo:`, 40, currentY + 38);
        doc.text(formatCurrency(cashIn), 190, currentY + 38, { width: 90, align: 'right' });
        doc.text(`(-) Gastos en Efectivo:`, 40, currentY + 53);
        doc.text(formatCurrency(cashOutExpenses), 190, currentY + 53, { width: 90, align: 'right' });
        doc.text(`(-) Depósitos a Bancos:`, 40, currentY + 68);
        doc.text(formatCurrency(cashOutTransfers), 190, currentY + 68, { width: 90, align: 'right' });
        
        doc.rect(35, currentY + 85, 250, 1).fill('#cbd5e1'); // Linea
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(9).text('(=) EFECTIVO ESPERADO:', 40, currentY + 93);
        doc.fillColor(cashNet >= 0 ? '#10b981' : '#ef4444').text(formatCurrency(cashNet), 190, currentY + 93, { width: 90, align: 'right' });

        // Cuentas Bancarias (Derecha)
        doc.rect(305, currentY, 260, 115).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('CUENTAS BANCARIAS', 315, currentY + 8);
        doc.font('Helvetica').fontSize(8).fillColor('#475569');
        doc.text(`Saldo Inicial en Bancos:`, 315, currentY + 23);
        doc.text(formatCurrency(bankOpening), 465, currentY + 23, { width: 90, align: 'right' });
        doc.text(`(+) Recaudación Directa:`, 315, currentY + 38);
        doc.text(formatCurrency(bankInRegular), 465, currentY + 38, { width: 90, align: 'right' });
        doc.text(`(+) Depósitos Recibidos:`, 315, currentY + 53);
        doc.text(formatCurrency(bankInTransfers), 465, currentY + 53, { width: 90, align: 'right' });
        doc.text(`(-) Débitos y Comisiones:`, 315, currentY + 68);
        doc.text(formatCurrency(bankOut), 465, currentY + 68, { width: 90, align: 'right' });
        
        doc.rect(310, currentY + 85, 250, 1).fill('#cbd5e1'); // Linea
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(9).text('(=) SALDO NETO BANCOS:', 315, currentY + 93);
        doc.fillColor(bankNet >= 0 ? '#3b82f6' : '#ef4444').text(formatCurrency(bankNet), 465, currentY + 93, { width: 90, align: 'right' });

        currentY += 125;

        // ================= RESUMEN DE CUENTAS BANCARIAS ESPECÍFICAS =================
        const bankAccountsList = Object.values(bankAccountBalances);
        if (bankAccountsList.length > 0) {
            doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('DETALLE POR CUENTA BANCARIA', 30, currentY);
            currentY += 12;
            
            // Draw Table Header
            doc.rect(30, currentY, 535, 14).fill('#cbd5e1');
            doc.fillColor('#334155').fontSize(7.5).font('Helvetica-Bold');
            doc.text('BANCO / NRO CUENTA', 35, currentY + 3);
            doc.text('(+) DEPÓSITOS', 250, currentY + 3, { width: 90, align: 'right' });
            doc.text('(-) EGRESOS', 350, currentY + 3, { width: 90, align: 'right' });
            doc.text('(=) SALDO NETO', 460, currentY + 3, { width: 95, align: 'right' });
            currentY += 14;
            
            bankAccountsList.forEach((acc, idx) => {
                if (idx % 2 === 1) doc.rect(30, currentY, 535, 14).fill('#f1f5f9');
                doc.rect(30, currentY, 535, 14).stroke('#e2e8f0');
                
                doc.fillColor('#475569').fontSize(7.5).font('Helvetica');
                doc.text(`${acc.bank_name} - ${acc.account_number}`, 35, currentY + 3);
                doc.text(formatCurrency(acc.incomes), 250, currentY + 3, { width: 90, align: 'right' });
                doc.text(formatCurrency(acc.expenses), 350, currentY + 3, { width: 90, align: 'right' });
                doc.fillColor(acc.balance >= 0 ? '#10b981' : '#ef4444').font('Helvetica-Bold')
                   .text(formatCurrency(acc.balance), 460, currentY + 3, { width: 95, align: 'right' });
                
                currentY += 14;
            });
            currentY += 10;
        }

        doc.y = currentY;
        doc.moveDown(0.5);

        // ================= CONCILIACIÓN POR CONCEPTOS RECAUDADOS =================
        currentY = doc.y;
        doc.rect(30, currentY, 535, 18).fill('#1d4ed8');
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('DESGLOSE DE CONCEPTOS RECAUDADOS EN EL PERÍODO', 40, currentY + 5);
        currentY += 18;

        const drawConceptRow = (label, amount, isSubTotal = false) => {
            doc.rect(30, currentY, 535, 16).stroke('#e2e8f0');
            if (isSubTotal) doc.rect(30, currentY, 535, 16).fill('#e2e8f0');
            doc.fillColor('#1e293b').fontSize(8).font(isSubTotal ? 'Helvetica-Bold' : 'Helvetica').text(label, 40, currentY + 4);
            doc.text(formatCurrency(amount), 440, currentY + 4, { width: 110, align: 'right' });
            currentY += 16;
        };

        drawConceptRow('Cobros de Facturas: Consumo de Agua (Base + Exceso)', waterTotal);
        drawConceptRow('Cobros de Facturas: Multas de Agua', fineTotal);
        drawConceptRow('Cobros de Facturas: Rubros Adicionales (Otros)', additionalTotal);
        drawConceptRow('Venta de Ramal / Derechos de Conexión', ramalTotal);
        drawConceptRow('Cuentas por Cobrar: Abonos a Deuda Histórica (Otros)', agreementTotal);
        drawConceptRow('Otros Ingresos Extraordinarios directos', otherIncomeTotal);
        drawConceptRow('(=) TOTAL INGRESOS RECAUDADOS', grandIncomeTotal, true);
        drawConceptRow('(-) TOTAL EGRESOS / GASTOS REALIZADOS', grandExpenseTotal);
        
        // Gran Balance Fila
        doc.rect(30, currentY, 535, 20).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('(=) SALDO NETO GLOBAL DE CAJA (SISTEMA):', 40, currentY + 6);
        doc.fillColor(grandNet >= 0 ? '#10b981' : '#ef4444').text(formatCurrency(grandNet), 440, currentY + 6, { width: 110, align: 'right' });
        currentY += 35;

        // ================= DESGLOSE DETALLADO DE RUBROS Y MULTAS =================
        if (conceptsBreakdown && conceptsBreakdown.length > 0) {
            if (currentY > 600) {
                doc.addPage();
                currentY = 40;
            }
            
            doc.rect(30, currentY, 535, 18).fill('#8b5cf6'); // Morado para rubros y multas
            doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('DESGLOSE DETALLADO DE MULTAS Y RUBROS ADICIONALES COBRADOS', 40, currentY + 5);
            currentY += 18;
            
            // Subheader
            doc.rect(30, currentY, 535, 15).fill('#f1f5f9');
            doc.stroke('#cbd5e1');
            doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Bold');
            doc.text('CONCEPTO / DESCRIPCIÓN', 35, currentY + 4);
            doc.text('TIPO', 330, currentY + 4);
            doc.text('CANT.', 410, currentY + 4, { width: 30, align: 'center' });
            doc.text('TOTAL RECAUDADO', 460, currentY + 4, { width: 100, align: 'right' });
            currentY += 15;
            
            conceptsBreakdown.forEach((cb, cbIdx) => {
                if (currentY > 750) {
                    doc.addPage();
                    currentY = 40;
                    // Redibujar subheader
                    doc.rect(30, currentY, 535, 15).fill('#f1f5f9');
                    doc.stroke('#cbd5e1');
                    doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Bold');
                    doc.text('CONCEPTO / DESCRIPCIÓN', 35, currentY + 4);
                    doc.text('TIPO', 330, currentY + 4);
                    doc.text('CANT.', 410, currentY + 4, { width: 30, align: 'center' });
                    doc.text('TOTAL RECAUDADO', 460, currentY + 4, { width: 100, align: 'right' });
                    currentY += 15;
                }
                
                if (cbIdx % 2 === 0) doc.rect(30, currentY, 535, 15).fill('#f8fafc');
                doc.rect(30, currentY, 535, 15).stroke('#e2e8f0');
                
                doc.fillColor('#334155').fontSize(7.5).font('Helvetica');
                const truncatedDesc = cb.description.length > 60 ? cb.description.substring(0, 58) + '..' : cb.description;
                doc.text(truncatedDesc, 35, currentY + 4);
                doc.text(translateConceptType(cb.concept_type), 330, currentY + 4);
                doc.text(String(cb.qty_paid), 410, currentY + 4, { width: 30, align: 'center' });
                
                const cbAmt = parseFloat(cb.total_collected) || 0;
                doc.font('Helvetica-Bold').fillColor(cb.concept_type === 'fine' ? '#ef4444' : '#1e293b');
                doc.text(formatCurrency(cbAmt), 460, currentY + 4, { width: 100, align: 'right' });
                
                currentY += 15;
            });
            
            currentY += 25;
        }

        doc.y = currentY;

        // ================= TABLA 1: DETALLE DE INGRESOS =================
        const allIncomesList = [];
        processedInvoicePayments.forEach(p => {
            const methodLabel = p.bank_name ? `${translatePaymentMethod(p.payment_method)} (${p.bank_name})` : translatePaymentMethod(p.payment_method);
            allIncomesList.push({
                date: p.payment_date,
                client: p.client_name,
                doc: p.national_id,
                desc: `Factura ${p.invoice_id} (${p.billing_month || '-'})`,
                concept: `Agua: ${formatCurrency(p.water)} | Multa: ${formatCurrency(p.fine)} | Rubro: ${formatCurrency(p.additional)}`,
                method: methodLabel,
                amount: p.netPaid
            });
        });
        debtPayments.forEach(p => {
            const methodLabel = p.bank_name ? `${translatePaymentMethod(p.payment_method)} (${p.bank_name})` : translatePaymentMethod(p.payment_method);
            allIncomesList.push({
                date: p.payment_date,
                client: p.client_name,
                doc: p.national_id,
                desc: 'Abono Convenio',
                concept: p.agreement_desc || 'Pago de Convenio',
                method: methodLabel,
                amount: p.amount_paid
            });
        });
        otherIncomes.forEach(p => {
            const methodLabel = p.bank_name ? `${translatePaymentMethod(p.payment_method)} (${p.bank_name})` : translatePaymentMethod(p.payment_method);
            allIncomesList.push({
                date: p.payment_date,
                client: 'Directiva',
                doc: '-',
                desc: 'Ingreso Extra',
                concept: p.description || 'Ingreso Extraordinario',
                method: methodLabel,
                amount: p.amount_paid
            });
        });

        // Ordenar ingresos cronológicamente
        allIncomesList.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Dibujar Tabla de Ingresos
        const drawIncomeHeader = (yPos) => {
            doc.rect(30, yPos, 535, 18).fill('#475569');
            doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
            doc.text('CLIENTE / CONCEPTO DE INGRESO', 35, yPos + 5, { width: 150 });
            doc.text('DESC.', 190, yPos + 5, { width: 60 });
            doc.text('DETALLE CONCEPTOS', 255, yPos + 5, { width: 160 });
            doc.text('MÉTODO', 420, yPos + 5, { width: 90 });
            doc.text('MONTO', 515, yPos + 5, { width: 45, align: 'right' });
            return yPos + 22;
        };

        if (doc.y > 600) doc.addPage();
        doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('1. DETALLE CRONOLÓGICO DE INGRESOS', 30, doc.y);
        doc.moveDown(0.3);
        
        let y = drawIncomeHeader(doc.y);

        if (allIncomesList.length === 0) {
            doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('No se registraron ingresos en este periodo.', 40, y + 5);
            doc.y = y + 20;
        } else {
            allIncomesList.forEach((row, idx) => {
                const rowH = 22;
                if (y + rowH > 770) {
                    doc.addPage();
                    y = drawIncomeHeader(40);
                }

                if (idx % 2 === 0) doc.rect(30, y - 2, 535, rowH).fill('#f8fafc');

                doc.fillColor('#334155').fontSize(7.5).font('Helvetica');
                const truncatedClient = String(row.client).length > 25 ? String(row.client).substring(0, 23) + '..' : row.client;
                doc.text(truncatedClient, 35, y + 4, { width: 150 });
                doc.text(row.desc, 190, y + 4, { width: 60 });
                
                doc.fontSize(6.5);
                doc.text(row.concept, 255, y + 4, { width: 160 });
                doc.fontSize(7.5);
                
                doc.text(row.method, 420, y + 4, { width: 90 });
                doc.font('Helvetica-Bold').fillColor('#10b981').text(formatCurrency(row.amount), 515, y + 4, { width: 45, align: 'right' });
                
                y += rowH;
            });
            doc.y = y + 10;
        }
        doc.moveDown(1.5);

        // ================= TABLA 2: DETALLE DE EGRESOS =================
        const drawExpenseHeader = (yPos) => {
            doc.rect(30, yPos, 535, 18).fill('#94a3b8');
doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
            doc.text('CATEGORÍA DE GASTO', 35, yPos + 5, { width: 135 });
            doc.text('DESCRIPCIÓN DEL GASTO', 175, yPos + 5, { width: 240 });
            doc.text('MÉTODO', 420, yPos + 5, { width: 90 });
            doc.text('MONTO', 515, yPos + 5, { width: 45, align: 'right' });
            return yPos + 22;
        };

        const realExpenses = expenses.filter(e => !(e.payment_method === 'cash' && e.account_id));
        const internalTransfers = expenses.filter(e => e.payment_method === 'cash' && e.account_id);

        if (doc.y > 600) doc.addPage();
        doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('2. DETALLE CRONOLÓGICO DE EGRESOS Y GASTOS', 30, doc.y);
        doc.moveDown(0.3);
        
        y = drawExpenseHeader(doc.y);

        if (realExpenses.length === 0) {
            doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('No se registraron egresos o gastos externos en este periodo.', 40, y + 5);
            doc.y = y + 20;
        } else {
            realExpenses.forEach((row, idx) => {
                const rowH = 22;
                if (y + rowH > 770) {
                    doc.addPage();
                    y = drawExpenseHeader(40);
                }

                if (idx % 2 === 0) doc.rect(30, y - 2, 535, rowH).fill('#f8fafc');

                doc.fillColor('#334155').fontSize(7.5).font('Helvetica');
                const categoryLabel = row.category_name || 'Sin Categoría';
                const truncatedCat = categoryLabel.length > 25 ? categoryLabel.substring(0, 23) + '..' : categoryLabel;
                doc.text(truncatedCat, 35, y + 4, { width: 135 });
                
                const truncatedDesc = String(row.description).length > 60 ? String(row.description).substring(0, 58) + '..' : row.description;
                doc.text(truncatedDesc || '-', 175, y + 4, { width: 240 });
                
                const expMethodLabel = row.bank_name ? `${translatePaymentMethod(row.payment_method)} (${row.bank_name})` : translatePaymentMethod(row.payment_method);
                doc.text(expMethodLabel, 420, y + 4, { width: 90 });
                doc.font('Helvetica-Bold').fillColor('#ef4444').text(formatCurrency(row.amount_paid), 515, y + 4, { width: 45, align: 'right' });
                
                y += rowH;
            });
            doc.y = y + 10;
        }

        // Sección de traspasos internos
        if (internalTransfers.length > 0) {
            if (doc.y > 600) doc.addPage();
            doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('3. TRASPASOS INTERNOS DE EFECTIVO A BANCO (DEPÓSITOS)', 30, doc.y);
            doc.moveDown(0.3);
            
            const drawTransferHeader = (yPos) => {
                doc.rect(30, yPos, 535, 18).fill('#3b82f6');
                doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
                doc.text('CONCEPTO / DESCRIPCIÓN', 35, yPos + 5, { width: 330 });
                doc.text('CUENTA BANCARIA DESTINO', 375, yPos + 5, { width: 130 });
                doc.text('MONTO DEPOSITADO', 510, yPos + 5, { width: 50, align: 'right' });
                return yPos + 22;
            };
            
            y = drawTransferHeader(doc.y);
            
            internalTransfers.forEach((row, idx) => {
                const rowH = 22;
                if (y + rowH > 770) {
                    doc.addPage();
                    y = drawTransferHeader(40);
                }

                if (idx % 2 === 0) doc.rect(30, y - 2, 535, rowH).fill('#f8fafc');

                doc.fillColor('#334155').fontSize(7.5).font('Helvetica');
                const truncatedDesc = String(row.description).length > 80 ? String(row.description).substring(0, 78) + '..' : row.description;
                doc.text(truncatedDesc || 'Traspaso a cuenta', 35, y + 4, { width: 330 });
                
                const destLabel = `${row.bank_name || 'Banco'} - ${row.account_number || ''}`;
                doc.text(destLabel, 375, y + 4, { width: 130 });
                
                doc.font('Helvetica-Bold').fillColor('#3b82f6').text(formatCurrency(row.amount_paid), 510, y + 4, { width: 50, align: 'right' });
                y += rowH;
            });
            doc.y = y + 10;
        }

        // Enumerar páginas en el footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(7.5).fillColor('#94a3b8').text(`Página ${i + 1} de ${pageCount}`, 30, 800, { align: 'center' });
        }

        doc.end();

    } catch (err) {
        next(err);
    }
};

module.exports = {
    getDailyCollections
};

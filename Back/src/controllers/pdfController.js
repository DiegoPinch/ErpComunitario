const PDFDocument = require('pdfkit');
const paymentsModel = require('../models/paymentsModel');

const generateReceiptPdf = async (req, res) => {
    try {
        const { invoiceIds } = req.query;
        if (!invoiceIds) {
            return res.status(400).json({ message: 'invoiceIds are required' });
        }

        const ids = invoiceIds.split(',').map(id => parseInt(id));
        const rawData = await paymentsModel.getPaymentReceiptData(ids);

        if (rawData.length === 0) {
            return res.status(404).json({ message: 'No payment data found' });
        }

        const invoicesMap = new Map();
        rawData.forEach(row => {
            if (!invoicesMap.has(row.invoice_id)) {
                invoicesMap.set(row.invoice_id, {
                    invoice_id: row.invoice_id,
                    billing_month: row.billing_month,
                    invoice_amount: parseFloat(row.invoice_amount),
                    amount_paid: parseFloat(row.amount_paid || 0),
                    change_amount: parseFloat(row.change_amount || 0),
                    extra_concepts: row.extra_concepts, // Added this field
                    readings: []
                });
            }
            if (row.meter_code) {
                invoicesMap.get(row.invoice_id).readings.push({
                    type: row.meter_type,
                    prev: row.previous_reading,
                    curr: row.current_reading,
                    cons: row.consumption,
                    amount: row.reading_amount
                });
            }
        });

        const groupedInvoices = Array.from(invoicesMap.values());
        const firstRow = rawData[0];
        const ticketWidth = 226; // 80mm approx

        // Function to calculate height for a single invoice page
        const calcPageHeight = (inv) => {
            let h = 330; // Baseline for header, client info, summary and footer
            h += (inv.readings.length * 35);

            // Add space for extra concepts (estimate 15px per concept, accounting for wrapping)
            if (inv.extra_concepts) {
                const conceptCount = inv.extra_concepts.split(' | ').length;
                h += (conceptCount * 20); // 20px per concept line (with potential wrapping)
            }

            return h;
        };

        let doc;
        const totalGlobalToPay = groupedInvoices.reduce((acc, inv) => acc + inv.invoice_amount, 0);
        const totalGlobalAmountPaid = groupedInvoices.reduce((acc, inv) => acc + inv.amount_paid, 0);
        const totalGlobalChange = groupedInvoices.reduce((acc, inv) => acc + inv.change_amount, 0);

        const formatMonthName = (billingMonth) => {
            const months = {
                '01': 'ENERO', '02': 'FEBRERO', '03': 'MARZO', '04': 'ABRIL',
                '05': 'MAYO', '06': 'JUNIO', '07': 'JULIO', '08': 'AGOSTO',
                '09': 'SEPTIEMBRE', '10': 'OCTUBRE', '11': 'NOVIEMBRE', '12': 'DICIEMBRE'
            };
            const [year, month] = billingMonth.split('-');
            return `${year}-${months[month] || month}`;
        };

        const formatInvoiceId = (id) => id.toString().padStart(6, '0');

        groupedInvoices.forEach((inv, index) => {
            const pageHeight = calcPageHeight(inv);

            if (index === 0) {
                doc = new PDFDocument({ margin: 15, size: [ticketWidth, pageHeight] });
                const filename = `ticket_${firstRow.national_id}_${Date.now()}.pdf`;
                res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-type', 'application/pdf');
                doc.pipe(res);
            } else {
                doc.addPage({ size: [ticketWidth, pageHeight], margin: 15 });
            }

            // --- Page Content ---
            // Brand
            doc.fillColor('#000').font('Helvetica-Bold').fontSize(10).text('JUNTA ADMINISTRADORA DE AGUA POTABLE', { align: 'center' });
            doc.fontSize(9).font('Helvetica-Bold').text('COMUNIDAD CHALUAPAMBA', { align: 'center' });
            doc.moveDown(0.5);

            doc.moveTo(15, doc.y).lineTo(ticketWidth - 15, doc.y).dash(1, { space: 1 }).stroke('#000');
            doc.moveDown(0.5);

            // Header Info
            doc.fontSize(10).font('Helvetica-Bold').text('COMPROBANTE DE PAGO', { align: 'center' });
            doc.moveDown(0.4);

            doc.fontSize(9).font('Helvetica');
            const drawHeaderLine = (label, value) => {
                const y = doc.y;
                doc.font('Helvetica-Bold').fontSize(9).text(label, 15, y);
                doc.font('Helvetica').fontSize(9).text(value, 60, y, { align: 'right', width: ticketWidth - 75 });
                doc.moveDown(0.1);
            };

            const maskedID = firstRow.national_id.slice(-4).padStart(firstRow.national_id.length, 'x');
            drawHeaderLine('FECHA:', new Date(firstRow.payment_date).toLocaleString());
            drawHeaderLine('CLIENTE:', `${firstRow.first_name} ${firstRow.last_name}`);
            drawHeaderLine('CI/RUC:', maskedID);
            doc.moveDown(0.4);

            doc.moveTo(15, doc.y).lineTo(ticketWidth - 15, doc.y).dash(1, { space: 1 }).stroke('#000');
            doc.moveDown(0.5);

            // Invoice Content
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#000').text(`MES: ${formatMonthName(inv.billing_month)}`);
            doc.moveDown(0.3);

            inv.readings.forEach(read => {
                const startY = doc.y;
                doc.font('Helvetica-Bold').fontSize(9).text(read.type?.toUpperCase() || 'MEDIDOR', 15, startY);
                doc.font('Helvetica').fontSize(9).text(`${read.cons} m3`, 85, startY, { width: 45, align: 'right' });
                doc.font('Helvetica-Bold').fontSize(9).text(`$${parseFloat(read.amount || 0).toFixed(2)}`, 135, startY, { width: 76, align: 'right' });

                doc.moveDown(0.05);
                doc.fontSize(8).font('Helvetica').fillColor('#444').text(`Lect: ${read.prev || 0} - ${read.curr || 0}`, 20, doc.y);
                doc.fillColor('#000').moveDown(0.35);
            });

            // --- Rendición de Rubros Adicionales ---
            if (inv.extra_concepts) {
                doc.moveDown(0.2);
                inv.extra_concepts.split(' | ').forEach(conceptStr => {
                    const [desc, val] = conceptStr.split(': $');
                    const startY = doc.y;

                    // Calculate text height for wrapping
                    const textHeight = doc.heightOfString(desc.toUpperCase(), { width: 115, fontSize: 9 });

                    // Render description with wrapping
                    doc.font('Helvetica').fontSize(9).text(desc.toUpperCase(), 15, startY, { width: 115 });

                    // Render price aligned to the first line of the description
                    doc.font('Helvetica').fontSize(9).text(`$${parseFloat(val || 0).toFixed(2)}`, 135, startY, { width: 76, align: 'right' });

                    // Move cursor to after the wrapped text
                    doc.y = startY + textHeight + 2;
                });
            }

            doc.moveTo(25, doc.y).lineTo(ticketWidth - 25, doc.y).dash(1, { space: 2 }).stroke('#ccc');
            doc.moveDown(0.3);

            const subY = doc.y;
            doc.font('Helvetica-Bold').fontSize(9).text(`SUBTOTAL MES:`, 15, subY);
            doc.text(`$${inv.invoice_amount.toFixed(2)}`, 15, subY, { align: 'right', width: ticketWidth - 30 });

            doc.moveDown(0.7);
            doc.moveTo(15, doc.y).lineTo(ticketWidth - 15, doc.y).dash(1, { space: 1 }).stroke('#000');
            doc.moveDown(0.5);

            // Totals area (Global summary for the transaction)
            doc.fontSize(10).font('Helvetica-Bold').text('RESUMEN DE COBRO', { align: 'center' });
            doc.moveDown(0.4);

            const drawRow = (label, value, isBig = false, color = '#000') => {
                const currentY = doc.y;
                doc.fillColor(color).fontSize(isBig ? 12 : 10).font(isBig ? 'Helvetica-Bold' : 'Helvetica').text(label, 15, currentY);
                doc.text(value, 15, currentY, { align: 'right', width: ticketWidth - 30 });
                doc.moveDown(0.2);
            };

            drawRow('TOTAL COBRADO:', `$${totalGlobalToPay.toFixed(2)}`, true);
            drawRow('EFECTIVO RECIBIDO:', `$${totalGlobalAmountPaid.toFixed(2)}`);
            drawRow('CAMBIO ENTREGADO:', `$${totalGlobalChange.toFixed(2)}`);

            doc.fillColor('#000').moveDown(0.8);
            doc.fontSize(8).font('Helvetica-Bold').text('¡GRACIAS POR SU PAGO!', { align: 'center' });
            doc.fontSize(7).font('Helvetica').text('Conserve este ticket para cualquier reclamo', { align: 'center' });
            doc.moveDown(0.5);

            // Identificador de factura en esta página específica
            doc.fontSize(7).font('Helvetica').text(`RECIBO Nro: 001-001-${formatInvoiceId(inv.invoice_id)}`, { align: 'center' });
        });

        doc.end();

    } catch (error) {
        console.error('Error generating Ticket PDF:', error);
        res.status(500).json({ message: 'Internal server error generating Ticket' });
    }
};

module.exports = {
    generateReceiptPdf,
};

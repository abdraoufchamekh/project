const PDFDocument = require('pdfkit');
const pool = require('../config/database');

function numberToFrenchWords(n) {
    n = Math.round(Number(n) || 0);
    if (n === 0) return 'zéro';

    const units = [
        '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
        'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'
    ];

    const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

    function underHundred(num) {
        if (num < 17) return units[num];
        if (num < 20) return 'dix-' + units[num - 10];
        if (num < 70) {
            const t = Math.floor(num / 10);
            const u = num % 10;
            if (u === 1 && (t === 2 || t === 3 || t === 4 || t === 5 || t === 6)) {
                return tens[t] + ' et un';
            }
            return tens[t] + (u ? '-' + units[u] : '');
        }
        if (num < 80) {
            if (num === 71) return 'soixante et onze';
            return 'soixante-' + underHundred(num - 60);
        }
        if (num < 100) {
            if (num === 80) return 'quatre-vingts';
            if (num === 81) return 'quatre-vingt-un';
            return 'quatre-vingt-' + underHundred(num - 80);
        }
        return '';
    }

    function underThousand(num) {
        if (num < 100) return underHundred(num);
        const h = Math.floor(num / 100);
        const r = num % 100;
        let res = h === 1 ? 'cent' : units[h] + ' cent';
        if (r === 0 && h > 1) res += 's';
        else if (r > 0) res += ' ' + underHundred(r);
        return res;
    }

    let result = '';
    const millions = Math.floor(n / 1_000_000);
    const thousands = Math.floor((n % 1_000_000) / 1000);
    const rest = n % 1000;

    if (millions) {
        result += millions === 1 ? 'un million' : underThousand(millions) + ' millions';
    }
    if (thousands) {
        if (result) result += ' ';
        result += thousands === 1 ? 'mille' : underThousand(thousands) + ' mille';
    }
    if (rest) {
        if (result) result += ' ';
        result += underThousand(rest);
    }

    return result.trim();
}

exports.generateInvoice = async (req, res) => {
    try {
        const orderId = req.params.id;

        const orderResult = await pool.query(
            `SELECT o.*, u.name as designer_name
             FROM orders o
             LEFT JOIN users u ON o.assigned_designer = u.id
             WHERE o.id = $1`,
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const order = orderResult.rows[0];

        const productsResult = await pool.query(
            `SELECT type as description, quantity, unit_price
             FROM products
             WHERE order_id = $1
             ORDER BY created_at ASC`,
            [orderId]
        );
        const products = productsResult.rows;

        const settingsResult = await pool.query('SELECT key, value FROM company_settings');
        const settings = {};
        settingsResult.rows.forEach((row) => {
            settings[row.key] = row.value;
        });

        let subtotal = 0;
        // Support both snake_case (DB) and camelCase; coerce to number, default 0
        const deliveryFee = Math.max(0, Number(order.delivery_fee ?? order.deliveryFee ?? 0) || 0);
        const discount = Math.max(0, Number(order.discount ?? 0) || 0);

        products.forEach((p) => {
            const qty = Number(p.quantity) || 1;
            const unitPrice = Number(p.unit_price ?? p.unitPrice ?? 0) || 0;
            subtotal += qty * unitPrice;
        });

        const finalTotal = Math.max(0, subtotal + deliveryFee - discount);
        const finalTotalWords = `${numberToFrenchWords(finalTotal)} dinars algériens`;

        const invoiceNumber = `F-${new Date().getFullYear()}-${orderId.toString().padStart(4, '0')}`;
        const invoiceDate = new Date().toLocaleDateString('fr-FR');

        const companyName = settings.company_name || 'AUREA DECO';
        const vendorName  = settings.vendor_name  || 'MOSEFAOUI NESRINE';
        const activity    = settings.activity     || 'Artisan en impression sur divers supports';
        const address     = settings.address      || 'Sour El Ghozlane – Bouira';
        const phone       = settings.phone        || '07 75 96 07 56';

        const clientName    = order.client_name || order.clientName || 'Client';
        const clientAddress = order.address || '';
        const clientPhone   = order.phone   || '';

        // --- PDF setup ---
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const buffers = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            res.setHeader('Content-Type', 'application/pdf');
            if (req.query.download === 'true') {
                res.setHeader('Content-Disposition', `attachment; filename="facture_${orderId}.pdf"`);
            } else {
                res.setHeader('Content-Disposition', 'inline; filename="facture.pdf"');
            }
            res.send(pdfBuffer);
        });

        // --- HEADER ---
        doc.fontSize(22).fillColor('#111827').text(companyName, { align: 'left' });
        doc.moveDown(0.5);

        // Seller box
        const startY    = doc.y;
        const boxWidth  = 260;
        const boxHeight = 70;

        doc.rect(40, startY, boxWidth, boxHeight).fillOpacity(0.08).fill('#1d4ed8').fillOpacity(1);
        doc.fillColor('#1d4ed8').fontSize(11).text('Informations vendeur', 48, startY + 6);
        doc.fillColor('#111827').fontSize(10)
            .text(`Vendeur : ${vendorName}`,  48, startY + 22)
            .text(`Activité : ${activity}`,   48, startY + 34, { width: boxWidth - 16 })
            .text(`Adresse : ${address}`,     48, startY + 46)
            .text(`Tél : ${phone}`,           48, startY + 58);

        // Client box (right side)
        const rightX     = doc.page.width - doc.page.margins.right - 220;
        const clientBoxY = startY + 18;

        doc.fontSize(11).fillColor('#374151')
            .text(`Date : ${invoiceDate}`, rightX, startY, { align: 'right', width: 220 });

        doc.rect(rightX, clientBoxY, 220, 70).fillOpacity(0.03).fill('#000000').fillOpacity(1);
        doc.fontSize(11).fillColor('#111827').text('CLIENT', rightX + 8, clientBoxY + 6);
        doc.fontSize(10).fillColor('#111827')
            .text(`Nom : ${clientName}`,               rightX + 8, clientBoxY + 22)
            .text(`Adresse : ${clientAddress || '—'}`, rightX + 8, clientBoxY + 34, { width: 204 })
            .text(`Téléphone : ${clientPhone || '—'}`, rightX + 8, clientBoxY + 46);

        // Title
        doc.fontSize(18).fillColor('#111827')
            .text('FACTURE', 0, clientBoxY + 90, { align: 'center' });
        doc.fontSize(11).fillColor('#4b5563')
            .text(`Facture N° ${invoiceNumber}`, 0, clientBoxY + 114, { align: 'center' });

        // --- TABLE ---
        const tableTop   = clientBoxY + 140;
        const itemX      = doc.page.margins.left;
        const unitPriceX = itemX + 260;
        const qtyX       = itemX + 360;
        const totalX     = itemX + 440;
        const tableWidth = doc.page.width - itemX - doc.page.margins.right;

        // Table header
        doc.rect(itemX, tableTop, tableWidth, 22).fill('#1d4ed8');
        doc.fillColor('#ffffff').fontSize(11)
            .text('Description',  itemX + 8,  tableTop + 6)
            .text('Prix unitaire', unitPriceX, tableTop + 6, { width: 80, align: 'right' })
            .text('Quantité',      qtyX,       tableTop + 6, { width: 60, align: 'right' })
            .text('Total',         totalX,     tableTop + 6, { width: 80, align: 'right' });

        // Table rows
        let rowY = tableTop + 28;
        doc.fontSize(10);

        products.forEach((p, index) => {
            const qty       = Number(p.quantity) || 1;
            const unitPrice = Number(p.unit_price ?? p.unitPrice ?? 0) || 0;
            const lineTotal = qty * unitPrice;

            if (index % 2 === 1) {
                doc.rect(itemX, rowY - 2, tableWidth, 18).fillOpacity(0.04).fill('#6b7280').fillOpacity(1);
            }

            doc.fillColor('#111827')
                .text(p.description,                              itemX + 8,  rowY, { width: 240 })
                .text(`${unitPrice.toLocaleString('fr-FR').replace(/\\s|\\u202F/g, ' ')} DA`, unitPriceX, rowY, { width: 80, align: 'right' })
                .text(qty.toString(),                             qtyX,       rowY, { width: 60, align: 'right' })
                .text(`${lineTotal.toLocaleString('fr-FR').replace(/\\s|\\u202F/g, ' ')} DA`, totalX,     rowY, { width: 80, align: 'right' });

            rowY += 18;
        });

        // Separator line
        doc.moveTo(itemX, rowY + 4)
            .lineTo(itemX + tableWidth, rowY + 4)
            .strokeColor('#d1d5db').stroke();

        // --- TOTALS ---
        const totalsTop = rowY + 16;
        const totalsX   = totalX - 120;

        doc.fontSize(11).fillColor('#111827')
            .text('Sous-total :',        totalsX, totalsTop,      { width: 120, align: 'right' })
            .text(`${subtotal.toLocaleString('fr-FR').replace(/\\s|\\u202F/g, ' ')} DA`,      totalX, totalsTop,      { width: 80, align: 'right' })

            .text('Frais de livraison :', totalsX, totalsTop + 16, { width: 120, align: 'right' })
            .text(`${deliveryFee.toLocaleString('fr-FR').replace(/\\s|\\u202F/g, ' ')} DA`,   totalX, totalsTop + 16, { width: 80, align: 'right' })

            .text('Remise :',             totalsX, totalsTop + 32, { width: 120, align: 'right' })
            .text(`${discount.toLocaleString('fr-FR').replace(/\\s|\\u202F/g, ' ')} DA`,      totalX, totalsTop + 32, { width: 80, align: 'right' });

        doc.fontSize(12).font('Helvetica-Bold')
            .text('Montant Total :',                              totalsX, totalsTop + 52, { width: 120, align: 'right' })
            .text(`${finalTotal.toLocaleString('fr-FR').replace(/\\s|\\u202F/g, ' ')} DA`,    totalX,  totalsTop + 52, { width: 80,  align: 'right' });
        doc.font('Helvetica');

        // --- AMOUNT IN WORDS ---
        doc.fontSize(10).fillColor('#111827')
            .text(
                `Arrêtée la présente facture à la somme de : ${finalTotalWords}.`,
                itemX, totalsTop + 76, { width: 350 }
            );

        // --- SIGNATURE ---
        doc.fontSize(11).fillColor('#4b5563')
            .text('Cachet et signature', totalX - 40, totalsTop + 116, { width: 120, align: 'center' });

        // --- FOOTER ---
        const footerY = doc.page.height - doc.page.margins.bottom - 20;
        doc.fontSize(9).fillColor('#6b7280')
            .text(
                `${companyName} • ${address} • Tél : ${phone}`,
                itemX, footerY,
                { align: 'center', width: tableWidth }
            );

        doc.end();

    } catch (err) {
        console.error('Error generating invoice:', err);
        res.status(500).json({ error: 'Impossible de générer la facture' });
    }
};
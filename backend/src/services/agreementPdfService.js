import PDFDocument from 'pdfkit';

const money = (n) => `Tk ${Number(n).toLocaleString('en-BD')}`;

export const LIABILITY_CLAUSES = [
  'The Renter is fully liable for damage, loss, or theft of the item during the rental period, up to its full replacement value.',
  'The refundable security deposit is held by RentAll as collateral and is not usable as payment toward the rental cost.',
  'Returning the item after the agreed end date incurs a late fee of 1.5x the daily rate for each day (or part of a day) late, deducted from the security deposit and capped at the deposit amount.',
  'The item must be returned in the same condition it was received, ordinary wear and tear excepted.',
  'Any deposit remaining after applicable deductions is refunded to the Renter once the Lender confirms the item has been checked and approved.',
];

// Builds the rental agreement PDF entirely in-process with pdfkit - no
// external template service or network call involved. `rental` must have
// item/renter/lender populated; `payment` is optional (used for the
// transaction reference line once the two-tier payment has gone through).
export function buildAgreementPdf({ rental, payment }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const issuedAt = new Date();

    doc
      .fontSize(20)
      .fillColor('#065f46')
      .text('RentAll', { continued: true })
      .fillColor('#111827')
      .text(' — Digital Rental Agreement');
    doc
      .fontSize(9)
      .fillColor('#6b7280')
      .text(`Issued ${issuedAt.toLocaleString()} · Agreement for Rental #${rental._id}`);
    doc.moveDown(1.2);
    doc.strokeColor('#d1d5db').moveTo(56, doc.y).lineTo(539, doc.y).stroke();
    doc.moveDown(1);

    sectionTitle(doc, 'Parties');
    doc.fontSize(10).fillColor('#111827');
    doc.text(`Lender:  ${rental.lender.name}  <${rental.lender.email}>`);
    doc.text(`Renter:  ${rental.renter.name}  <${rental.renter.email}>`);
    doc.moveDown(1);

    sectionTitle(doc, 'Item & Rental Period');
    doc.fontSize(10).fillColor('#111827');
    doc.text(`Item:  ${rental.item.title}`);
    doc.text(
      `Period:  ${new Date(rental.startDate).toLocaleDateString()} to ${new Date(rental.endDate).toLocaleDateString()}  (${rental.days} day${rental.days === 1 ? '' : 's'})`
    );
    doc.moveDown(1);

    sectionTitle(doc, 'Financial Terms');
    doc.fontSize(10).fillColor('#111827');
    doc.text(`Daily rate:  ${money(rental.dailyRate)}`);
    doc.text(`Rental cost (${rental.days} x daily rate):  ${money(rental.rentalCost)}`);
    doc.text(`Refundable security deposit:  ${money(rental.securityDeposit)}`);
    doc.font('Helvetica-Bold').text(`Total paid:  ${money(rental.totalAmount)}`).font('Helvetica');
    if (payment) {
      doc.fontSize(9).fillColor('#6b7280').text(`Payment reference: ${payment.tranId}`);
    }
    doc.moveDown(1);

    sectionTitle(doc, 'Liability & Late Return Terms');
    doc.fontSize(10).fillColor('#111827');
    LIABILITY_CLAUSES.forEach((clause, i) => {
      doc.text(`${i + 1}. ${clause}`, { align: 'left' });
      doc.moveDown(0.4);
    });

    doc.moveDown(0.6);
    doc.strokeColor('#d1d5db').moveTo(56, doc.y).lineTo(539, doc.y).stroke();
    doc.moveDown(0.6);
    doc
      .fontSize(9)
      .fillColor('#6b7280')
      .text(
        'This document was digitally issued by RentAll and does not require a wet signature. ' +
          'Generated for demonstration purposes as part of a student project; it is not a legally binding contract.'
      );

    doc.end();
  });
}

function sectionTitle(doc, text) {
  doc.fontSize(11).fillColor('#065f46').font('Helvetica-Bold').text(text.toUpperCase());
  doc.font('Helvetica').fillColor('#111827');
  doc.moveDown(0.3);
}

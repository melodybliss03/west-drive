export interface InvoiceData {
  id: string;
  reservationId: string;
  clientName: string;
  clientEmail: string;
  date: string;
  vehicule: string;
  ville: string;
  montant: number;
  description?: string;
}

export function generatePDFInvoice(data: InvoiceData) {
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(data.id)}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: white;
          color: #333;
          line-height: 1.6;
        }
        @page {
          size: A4;
          margin: 20mm;
        }
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
        }
        .container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 40px;
          background: white;
        }
        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #FF5E19;
          padding-bottom: 30px;
          margin-bottom: 40px;
        }
        .logo {
          flex: 1;
        }
        .logo h1 {
          font-size: 28px;
          color: #FF5E19;
          margin: 0 0 8px 0;
          font-weight: 700;
        }
        .logo p {
          font-size: 12px;
          color: #666;
          margin: 0;
        }
        .invoice-title {
          text-align: right;
        }
        .invoice-title h2 {
          font-size: 24px;
          color: #FF5E19;
          margin: 0 0 5px 0;
          font-weight: 600;
        }
        .invoice-title p {
          font-size: 12px;
          color: #666;
          margin: 0;
        }
        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .info-block h3 {
          font-size: 12px;
          color: #FF5E19;
          text-transform: uppercase;
          font-weight: 700;
          margin: 0 0 15px 0;
          letter-spacing: 0.5px;
        }
        .info-block p {
          font-size: 14px;
          color: #333;
          margin: 0 0 5px 0;
        }
        .info-block p strong {
          font-weight: 600;
        }
        .info-block p.sublabel {
          font-size: 12px;
          color: #666;
          margin-top: 3px;
        }
        /* Table */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
        }
        table thead {
          background-color: #f5f5f5;
          border-bottom: 2px solid #FF5E19;
        }
        table th {
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #FF5E19;
          text-transform: uppercase;
        }
        table td {
          padding: 15px 12px;
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }
        table tbody tr:last-child td {
          border-bottom: none;
        }
        .item-name {
          font-weight: 600;
          margin-bottom: 5px;
        }
        .item-desc {
          font-size: 12px;
          color: #666;
        }
        .amount {
          text-align: right;
          font-weight: 700;
          color: #FF5E19;
          font-size: 16px;
        }
        /* Summary */
        .summary {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .summary-box {
          width: 300px;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-top: 1px solid #eee;
          border-bottom: 2px solid #FF5E19;
          margin-bottom: 12px;
        }
        .total-line-label {
          color: #666;
          font-weight: 600;
        }
        .total-line-amount {
          color: #FF5E19;
          font-weight: 700;
          font-size: 18px;
        }
        .tva-note {
          font-size: 11px;
          color: #999;
          text-align: center;
          margin: 12px 0 0 0;
        }
        /* Footer */
        .footer {
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 40px;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
          font-size: 12px;
        }
        .footer .thank-you {
          color: #666;
          font-size: 12px;
          margin-bottom: 10px;
        }
        .footer .company-info {
          color: #999;
          font-size: 10px;
        }
        /* Print Button */
        .print-button {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
          display: none;
        }
        @media screen {
          .print-button {
            display: block;
          }
        }
        .btn {
          background: #FF5E19;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }
        .btn:hover {
          background: #0052cc;
        }
      </style>
    </head>
    <body>
      <div class="print-button">
        <button class="btn" onclick="window.print()">🖨️ Imprimer / Télécharger en PDF</button>
      </div>

      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">
            <h1>WEST DRIVE</h1>
            <p>Location de véhicules en Île-de-France</p>
          </div>
          <div class="invoice-title">
            <h2>FACTURE</h2>
            <p>N° <strong>${escapeHtml(data.id)}</strong></p>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="info-grid">
          <div class="info-block">
            <h3>Client</h3>
            <p><strong>${escapeHtml(data.clientName)}</strong></p>
            <p class="sublabel">${escapeHtml(data.clientEmail)}</p>
          </div>
          <div class="info-block">
            <h3>Détails Réservation</h3>
            <p><span style="color: #666;">Réservation :</span> <strong>${escapeHtml(data.reservationId)}</strong></p>
            <p><span style="color: #666;">Date :</span> <strong>${escapeHtml(data.date)}</strong></p>
            <p class="sublabel">${escapeHtml(data.ville)}</p>
          </div>
        </div>

        <!-- Table -->
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="item-name">${escapeHtml(data.vehicule)}</div>
                <div class="item-desc">${escapeHtml(data.description || 'Location de véhicule')}</div>
              </td>
              <td class="amount">${data.montant.toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>

        <!-- Summary -->
        <div class="summary">
          <div class="summary-box">
            <div class="total-line">
              <span class="total-line-label">Total TTC :</span>
              <span class="total-line-amount">${data.montant.toFixed(2)} €</span>
            </div>
            <p class="tva-note">TVA incluse</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="thank-you">Merci de votre confiance !</p>
          <p class="company-info">WEST DRIVE - Location de véhicules</p>
          <p class="company-info">Île-de-France | Support: contact@westdrive.fr</p>
          <p class="company-info">Document généré électroniquement - ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      <script>
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
            setTimeout(() => window.close(), 100);
          }, 500);
        });
      </script>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.id}.pdf`;
  
  // Ouvrir dans une nouvelle fenêtre avec option pour imprimer/sauvegarder
  const printWindow = window.open(url, '_blank');
  
  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

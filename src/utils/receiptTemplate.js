// Utility to generate receipt HTML for downloadReceipt
export function getReceiptHTML(details) {
  const reference = details.reference || `TP-${Date.now()}`;
  const date = details.timestamp ? new Date(details.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString();
  const clientName = localStorage.getItem("name") || "__________________________";
  const businessName = details.businessName || "_______________________";
  const address = details.address || "___________________________";
  const contact = localStorage.getItem("contactNumber") || "_________________________";
  const method = details.method || "";
  const bank = details.bank || "";
  return `
    <!doctype html>
    <html>
    <head>
      <meta charset=\"utf-8\" />
      <title>TRUSTPERMIT SERVICES - Official Receipt</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; padding: 32px; color: #22223b; background: #f8f9fa; }
        .receipt { max-width: 800px; margin: 0 auto; background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; box-shadow: 0 2px 8px #e5e7eb; padding: 32px; }
        h1 { color: #4F46E5; font-size: 2rem; margin-bottom: 0; }
        h2 { color: #22223b; font-size: 1.2rem; margin-top: 0; }
        .section { margin: 24px 0; }
        .label { font-weight: bold; }
        .breakdown-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .breakdown-table th, .breakdown-table td { border: 1px solid #E5E7EB; padding: 8px 12px; text-align: left; }
        .breakdown-table th { background: #f3f4f6; }
        .summary { font-size: 1.1rem; margin-top: 12px; }
        .summary strong { font-size: 1.2rem; }
        .payment-methods { margin: 12px 0; }
        .notes { font-size: 0.98rem; color: #555; margin-top: 12px; }
        .footer { margin-top: 32px; text-align: center; color: #4F46E5; font-weight: bold; font-size: 1.1rem; }
        .divider { border-top: 1px solid #E5E7EB; margin: 18px 0; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <h1>TRUSTPERMIT SERVICES</h1>
        <h2>Permit Processing & Documentation Assistance</h2>
        <div class="divider"></div>
        <div class="section">
          <span class="label">Receipt No.:</span> TP-2026-0001<br>
          <span class="label">Date Issued:</span> ${date}
        </div>
        <div class="section">
          <span class="label">Client Name:</span> ${clientName}<br>
          <span class="label">Business Name:</span> ${businessName}<br>
          <span class="label">Address:</span> ${address}<br>
          <span class="label">Contact No.:</span> ${contact}
        </div>
        <div class="divider"></div>
        <div class="section">
          <h3>📋 PERMIT PROCESS BREAKDOWN</h3>
          <table class="breakdown-table">
            <tr><th>Step</th><th>Process Description</th><th style="text-align:right">Fee (PHP)</th></tr>
            <tr><td>1</td><td>Barangay Clearance</td><td style="text-align:right">₱500.00</td></tr>
            <tr><td>2</td><td>DTI / SEC Registration Assistance</td><td style="text-align:right">₱1,500.00</td></tr>
            <tr><td>3</td><td>Mayor’s Permit Processing</td><td style="text-align:right">₱2,500.00</td></tr>
            <tr><td>4</td><td>BIR Registration (TIN & Books)</td><td style="text-align:right">₱2,000.00</td></tr>
            <tr><td>5</td><td>Sanitary Permit</td><td style="text-align:right">₱800.00</td></tr>
            <tr><td>6</td><td>Fire Safety Inspection Certificate (FSIC)</td><td style="text-align:right">₱1,200.00</td></tr>
            <tr><td>7</td><td>Environmental Clearance (if applicable)</td><td style="text-align:right">₱1,000.00</td></tr>
            <tr><td>8</td><td>Documentation & Processing Fee</td><td style="text-align:right">₱2,000.00</td></tr>
          </table>
        </div>
        <div class="divider"></div>
        <div class="section summary">
          <div><strong>Subtotal:</strong> ₱11,500.00</div>
          <div><strong>Service Charge:</strong> ₱500.00</div>
          <div><strong>TOTAL AMOUNT:</strong> <span style="font-size:1.3rem; color:#16a34a;">₱12,000.00</span></div>
        </div>
        <div class="divider"></div>
        <div class="section payment-methods">
          <h3>💳 PAYMENT METHOD</h3>
          <div>☐ GCash</div>
          <div>☐ Bank Transfer</div>
          <div style="margin-top:8px;"><span class="label">Reference No.:</span> ${reference}</div>
        </div>
        <div class="divider"></div>
        <div class="section notes">
          <h3>📝 NOTES</h3>
          <ul>
            <li>Processing time: 5–10 working days</li>
            <li>Fees may vary depending on business type and location</li>
            <li>Client must provide complete requirements</li>
          </ul>
        </div>
        <div class="divider"></div>
        <div class="section">
          <span class="label">Processed by:</span> _________________________
        </div>
        <div class="footer">
          Thank you for choosing TRUSTPERMIT!<br>
          Your trusted partner in fast and reliable permit processing.
        </div>
      </div>
    </body>
    </html>
  `;
}
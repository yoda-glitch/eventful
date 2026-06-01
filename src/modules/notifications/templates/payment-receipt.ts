export const paymentReceiptTemplate = (data: {
  firstName: string;
  eventTitle: string;
  amount: number;
  reference: string;
}): { subject: string; html: string } => ({
  subject: `Payment Receipt — ${data.reference}`,
  html: `
    <h2>Hi ${data.firstName},</h2>
    <p>We received your payment of <strong>₦${data.amount.toLocaleString()}</strong> for <strong>${data.eventTitle}</strong>.</p>
    <p><strong>Reference:</strong> ${data.reference}</p>
    <p>Thank you for your purchase.</p>
  `,
});

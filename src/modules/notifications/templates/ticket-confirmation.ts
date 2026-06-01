const formatDate = (isoDate: string): string => {
  return new Date(isoDate).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  });
};

export const ticketConfirmationTemplate = (data: {
  firstName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  tickets: { ticketId: string; qrCodeHash: string }[];
}): { subject: string; html: string } => ({
  subject: `Your tickets for ${data.eventTitle}`,
  html: `
    <h2>Hi ${data.firstName},</h2>
    <p>Your payment was successful. Here are your tickets for <strong>${data.eventTitle}</strong>.</p>
    <p><strong>Date:</strong> ${formatDate(data.eventDate)}</p>
    <p><strong>Venue:</strong> ${data.venue}</p>
    <hr/>
    <h3>Your Tickets</h3>
    ${data.tickets.map((t, i) => `
      <div>
        <p><strong>Ticket ${i + 1}</strong></p>
        <p>ID: ${t.ticketId}</p>
        <p>QR Hash: ${t.qrCodeHash}</p>
      </div>
    `).join('')}
    <p>Present your QR code at the entrance.</p>
  `,
});

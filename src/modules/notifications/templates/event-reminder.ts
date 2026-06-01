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

export const eventReminderTemplate = (data: {
  firstName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
}): { subject: string; html: string } => ({
  subject: `Reminder: ${data.eventTitle} is coming up`,
  html: `
    <h2>Hi ${data.firstName},</h2>
    <p>Just a reminder that <strong>${data.eventTitle}</strong> is coming up soon.</p>
    <p><strong>Date:</strong> ${formatDate(data.eventDate)}</p>
    <p><strong>Venue:</strong> ${data.venue}</p>
    <p>Don't forget to bring your QR code ticket.</p>
  `,
});

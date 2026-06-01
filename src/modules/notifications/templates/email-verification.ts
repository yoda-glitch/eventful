export const emailVerificationTemplate = (data: {
  firstName: string;
  verifyToken: string;
}): { subject: string; html: string } => ({
  subject: 'Verify your Eventful account',
  html: `
    <h2>Hi ${data.firstName},</h2>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${process.env['APP_URL'] ?? 'http://localhost:3000'}/api/v1/auth/verify-email/${data.verifyToken}">
      Verify Email
    </a>
    <p>This link expires in 24 hours.</p>
  `,
});

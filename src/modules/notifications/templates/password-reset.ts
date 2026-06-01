export const passwordResetTemplate = (data: {
  firstName: string;
  resetToken: string;
}): { subject: string; html: string } => ({
  subject: 'Reset your Eventful password',
  html: `
    <h2>Hi ${data.firstName},</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${process.env['APP_URL'] ?? 'http://localhost:3000'}/api/v1/auth/reset-password/${data.resetToken}">
      Reset Password
    </a>
    <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
  `,
});

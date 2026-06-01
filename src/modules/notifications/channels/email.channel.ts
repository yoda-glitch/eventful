import nodemailer from 'nodemailer';
import { env } from '@/config';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendEmail = async (data: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: data.to,
    subject: data.subject,
    html: data.html,
  });
};

import crypto from 'crypto';

export const generateTicketBatch = (
  orderId: string,
  tierId: string,
  quantity: number
): { orderId: string; tierId: string; qrCodeHash: string }[] => {
  return Array.from({ length: quantity }, () => ({
    orderId,
    tierId,
    qrCodeHash: crypto
      .createHash('sha256')
      .update(`${orderId}:${tierId}:${crypto.randomUUID()}`)
      .digest('hex'),
  }));
};

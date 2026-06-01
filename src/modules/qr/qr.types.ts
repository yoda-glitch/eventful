export interface ValidateQRDto {
  qrCodeHash: string;
}

export interface QRPayload {
  ticketId: string;
  qrCodeHash: string;
  eventId: string;
}

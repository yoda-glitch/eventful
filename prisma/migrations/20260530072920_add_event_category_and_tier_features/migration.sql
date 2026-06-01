-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('MUSIC', 'NIGHTLIFE', 'PERFORMING_ARTS', 'HOLIDAYS', 'DATING', 'HOBBIES', 'BUSINESS', 'FOOD_AND_DRINK', 'CONFERENCE', 'CONCERT', 'COMMUNITY', 'SEASONAL', 'OTHER');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "category" "EventCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos';

-- AlterTable
ALTER TABLE "TicketTier" ADD COLUMN     "description" TEXT,
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "Event"("category");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Payment_reference_idx" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Ticket_qrCodeHash_idx" ON "Ticket"("qrCodeHash");

-- CreateIndex
CREATE INDEX "Ticket_orderId_idx" ON "Ticket"("orderId");

-- CreateIndex
CREATE INDEX "TicketTier_eventId_idx" ON "TicketTier"("eventId");

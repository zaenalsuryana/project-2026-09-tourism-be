-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "discount_id" UUID;

-- CreateIndex
CREATE INDEX "orders_discount_id_idx" ON "orders"("discount_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

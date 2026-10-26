-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- CreateTable
CREATE TABLE "destination_capacity_overrides" (
    "id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "override_date" DATE NOT NULL,
    "daily_visitor_limit" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "destination_capacity_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL DEFAULT 'FIXED',
    "value" INTEGER NOT NULL,
    "min_order_amount" INTEGER NOT NULL DEFAULT 0,
    "max_discount_amount" INTEGER,
    "quota" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "start_at" TIMESTAMPTZ(6),
    "end_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "destination_capacity_overrides_destination_id_override_date_key" ON "destination_capacity_overrides"("destination_id", "override_date");

-- CreateIndex
CREATE INDEX "discounts_destination_id_is_active_idx" ON "discounts"("destination_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_destination_id_code_key" ON "discounts"("destination_id", "code");

-- AddForeignKey
ALTER TABLE "destination_capacity_overrides" ADD CONSTRAINT "destination_capacity_overrides_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

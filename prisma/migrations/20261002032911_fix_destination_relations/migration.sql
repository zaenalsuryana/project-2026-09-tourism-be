-- CreateEnum
CREATE TYPE "DestinationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "destinations" (
    "id" UUID NOT NULL,
    "manager_id" UUID NOT NULL,
    "category_id" SMALLINT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(170) NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "province" VARCHAR(80) NOT NULL,
    "city" VARCHAR(80) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "contact_phone" VARCHAR(20),
    "contact_email" VARCHAR(254),
    "facilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "DestinationStatus" NOT NULL DEFAULT 'DRAFT',
    "is_sales_open" BOOLEAN NOT NULL DEFAULT true,
    "status_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "destinations_manager_id_key" ON "destinations"("manager_id");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");

-- CreateIndex
CREATE INDEX "destinations_status_province_city_idx" ON "destinations"("status", "province", "city");

-- CreateIndex
CREATE INDEX "destinations_category_id_idx" ON "destinations"("category_id");

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

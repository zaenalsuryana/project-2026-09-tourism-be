-- CreateEnum
CREATE TYPE "CrowdThresholdUnit" AS ENUM ('PERCENT', 'VISITORS');

-- AlterTable
ALTER TABLE "destinations" ADD COLUMN     "crowd_busy_from" INTEGER,
ADD COLUMN     "crowd_moderate_from" INTEGER,
ADD COLUMN     "crowd_reference_capacity" INTEGER,
ADD COLUMN     "crowd_threshold_unit" "CrowdThresholdUnit",
ADD COLUMN     "crowd_very_busy_from" INTEGER,
ADD COLUMN     "daily_visitor_limit" INTEGER;

-- CreateTable
CREATE TABLE "destination_daily_occupancies" (
    "destination_id" UUID NOT NULL,
    "visit_date" DATE NOT NULL,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "checked_in" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "destination_daily_occupancies_pkey" PRIMARY KEY ("destination_id","visit_date")
);

-- AddForeignKey
ALTER TABLE "destination_daily_occupancies" ADD CONSTRAINT "destination_daily_occupancies_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

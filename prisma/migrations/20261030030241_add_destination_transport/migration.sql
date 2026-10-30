-- CreateTable
CREATE TABLE "destination_transports" (
    "id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "public_transit_guide" TEXT,
    "nearest_station" VARCHAR(150),
    "estimated_time" VARCHAR(100),
    "tips" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "destination_transports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "destination_transports_destination_id_key" ON "destination_transports"("destination_id");

-- AddForeignKey
ALTER TABLE "destination_transports" ADD CONSTRAINT "destination_transports_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

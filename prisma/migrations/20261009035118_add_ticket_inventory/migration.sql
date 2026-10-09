-- CreateTable
CREATE TABLE "ticket_inventories" (
    "id" UUID NOT NULL,
    "ticket_type_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "quota" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ticket_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ticket_inventories_ticket_type_id_date_key" ON "ticket_inventories"("ticket_type_id", "date");

-- AddForeignKey
ALTER TABLE "ticket_inventories" ADD CONSTRAINT "ticket_inventories_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

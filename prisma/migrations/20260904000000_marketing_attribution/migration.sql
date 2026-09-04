-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "channel_id" TEXT,
ADD COLUMN     "medium_id" TEXT,
ADD COLUMN     "touchpoint" TEXT;

-- CreateTable
CREATE TABLE "marketing_channel_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_channel_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_channels" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_mediums" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_mediums_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketing_channel_groups_name_key" ON "marketing_channel_groups"("name");

-- CreateIndex
CREATE INDEX "marketing_channels_is_active_idx" ON "marketing_channels"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_channels_group_id_name_key" ON "marketing_channels"("group_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_mediums_name_key" ON "marketing_mediums"("name");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "marketing_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_medium_id_fkey" FOREIGN KEY ("medium_id") REFERENCES "marketing_mediums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_channels" ADD CONSTRAINT "marketing_channels_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "marketing_channel_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- CreateEnum
CREATE TYPE "AccessScope" AS ENUM ('OWN', 'TEAM', 'DEPARTMENT', 'ALL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FieldAccess" AS ENUM ('HIDDEN', 'READ', 'WRITE');

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "data_scope" "AccessScope" NOT NULL DEFAULT 'OWN',
ADD COLUMN     "is_read_only" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "report_scope" "AccessScope" NOT NULL DEFAULT 'OWN';

-- CreateTable
CREATE TABLE "field_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "entity_type" "RelatedEntityType" NOT NULL,
    "field_name" TEXT NOT NULL,
    "access" "FieldAccess" NOT NULL,

    CONSTRAINT "field_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "field_permissions_role_id_entity_type_field_name_key" ON "field_permissions"("role_id", "entity_type", "field_name");

-- AddForeignKey
ALTER TABLE "field_permissions" ADD CONSTRAINT "field_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;


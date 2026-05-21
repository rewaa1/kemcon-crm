-- DropForeignKey
ALTER TABLE "ProjectItem" DROP CONSTRAINT "ProjectItem_fabricId_fkey";

-- AlterTable
ALTER TABLE "ProjectItem" ADD COLUMN     "customFabricName" TEXT,
ALTER COLUMN "fabricId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ProjectItem" ADD CONSTRAINT "ProjectItem_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "Fabric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

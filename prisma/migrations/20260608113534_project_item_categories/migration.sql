-- AlterTable
ALTER TABLE "ProjectItem" ADD COLUMN     "itemCategory" TEXT,
ADD COLUMN     "itemDepth" DECIMAL(10,3),
ADD COLUMN     "metersPerUnit" DECIMAL(10,3);

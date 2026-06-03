-- AlterTable
ALTER TABLE "ProjectItem" ADD COLUMN     "customFabricCode" TEXT,
ADD COLUMN     "fabricLeftover" DECIMAL(12,3),
ADD COLUMN     "itemCount" INTEGER,
ADD COLUMN     "itemHeight" DECIMAL(10,3),
ADD COLUMN     "itemWidth" DECIMAL(10,3),
ADD COLUMN     "totalSupplied" DECIMAL(12,3);

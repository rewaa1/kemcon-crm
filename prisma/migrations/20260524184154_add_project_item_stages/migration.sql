-- CreateTable
CREATE TABLE "ProjectItemStage" (
    "id" TEXT NOT NULL,
    "projectItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stageDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectItemStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectItemStage_projectItemId_idx" ON "ProjectItemStage"("projectItemId");

-- AddForeignKey
ALTER TABLE "ProjectItemStage" ADD CONSTRAINT "ProjectItemStage_projectItemId_fkey" FOREIGN KEY ("projectItemId") REFERENCES "ProjectItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

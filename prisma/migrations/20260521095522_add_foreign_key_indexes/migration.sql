-- CreateIndex
CREATE INDEX "HotelContact_hotelId_idx" ON "HotelContact"("hotelId");

-- CreateIndex
CREATE INDEX "HotelLocation_hotelId_idx" ON "HotelLocation"("hotelId");

-- CreateIndex
CREATE INDEX "InventoryBatch_fabricId_idx" ON "InventoryBatch"("fabricId");

-- CreateIndex
CREATE INDEX "InventoryBatch_purchaseOrderLineId_idx" ON "InventoryBatch"("purchaseOrderLineId");

-- CreateIndex
CREATE INDEX "Project_hotelId_idx" ON "Project"("hotelId");

-- CreateIndex
CREATE INDEX "ProjectItem_projectId_idx" ON "ProjectItem"("projectId");

-- CreateIndex
CREATE INDEX "ProjectItem_fabricId_idx" ON "ProjectItem"("fabricId");

-- CreateIndex
CREATE INDEX "ProjectItem_locationId_idx" ON "ProjectItem"("locationId");

-- CreateIndex
CREATE INDEX "ProjectItemUsage_projectItemId_idx" ON "ProjectItemUsage"("projectItemId");

-- CreateIndex
CREATE INDEX "ProjectItemUsage_inventoryBatchId_idx" ON "ProjectItemUsage"("inventoryBatchId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_projectId_idx" ON "PurchaseOrder"("projectId");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_purchaseOrderId_idx" ON "PurchaseOrderLine"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_fabricId_idx" ON "PurchaseOrderLine"("fabricId");

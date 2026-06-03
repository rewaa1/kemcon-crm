export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" was not found`);
  }
}

export class HotelNotFoundError extends NotFoundError {
  constructor(id: string) {
    super("Hotel", id);
  }
}

export class VendorNotFoundError extends NotFoundError {
  constructor(id: string) {
    super("Vendor", id);
  }
}

export class FabricNotFoundError extends NotFoundError {
  constructor(id: string) {
    super("Fabric", id);
  }
}

export class PurchaseOrderNotFoundError extends NotFoundError {
  constructor(id: string) {
    super("PurchaseOrder", id);
  }
}

export class ProjectNotFoundError extends NotFoundError {
  constructor(id: string) {
    super("Project", id);
  }
}

export class InsufficientStockError extends DomainError {
  constructor(fabricId: string, shortfall: number) {
    super(`Insufficient stock for fabric "${fabricId}": ${shortfall.toFixed(3)} units short`);
  }
}

export class ProjectNotDeletableError extends DomainError {
  constructor() {
    super("Only DRAFT projects can be deleted");
  }
}

export class StageExceedsRemainingError extends DomainError {
  constructor(remaining: number) {
    super(`Only ${remaining} piece(s) remaining for this item`);
  }
}

export class ItemCountBelowDeliveredError extends DomainError {
  constructor(delivered: number) {
    super(`Piece count can't be lower than the ${delivered} piece(s) already delivered`);
  }
}

export type Hotel = {
  id: string;
  nameEn: string;
  nameAr: string;
  createdAt: Date;
  updatedAt: Date;
  locations: HotelLocation[];
  contacts: HotelContact[];
};

export type HotelSummary = {
  id: string;
  nameEn: string;
  nameAr: string;
  createdAt: Date;
  _count: {
    projects: number;
    contacts: number;
    locations: number;
  };
};

export type HotelSummaryWithLocations = HotelSummary & {
  locations: HotelLocation[];
};

export type HotelLocation = {
  id: string;
  nameEn: string;
  nameAr: string;
  address: string | null;
  hotelId: string;
};

export type HotelContact = {
  id: string;
  nameEn: string;
  nameAr: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  hotelId: string;
};

export type CreateHotelInput = {
  nameEn: string;
  nameAr: string;
};

export type UpdateHotelInput = Partial<CreateHotelInput>;

export type CreateLocationInput = {
  hotelId: string;
  nameEn: string;
  nameAr: string;
  address?: string;
};

export type CreateContactInput = {
  hotelId: string;
  nameEn: string;
  nameAr?: string;
  role?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
};

export type UpdateContactInput = Partial<Omit<CreateContactInput, "hotelId">>;

export interface IHotelRepository {
  findAll(): Promise<HotelSummary[]>;
  findAllWithLocations(): Promise<HotelSummaryWithLocations[]>;
  findById(id: string): Promise<Hotel | null>;
  create(data: CreateHotelInput): Promise<Hotel>;
  update(id: string, data: UpdateHotelInput): Promise<Hotel>;
  delete(id: string): Promise<void>;
  addLocation(data: CreateLocationInput): Promise<HotelLocation>;
  deleteLocation(id: string): Promise<void>;
  addContact(data: CreateContactInput): Promise<HotelContact>;
  updateContact(id: string, data: UpdateContactInput): Promise<HotelContact>;
  deleteContact(id: string): Promise<void>;
}

import { PrismaClient, SupplySource, FabricUnit } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── FIFO stock tracker ────────────────────────────────────────────────────────
// Keyed by fabricId, each entry is an ordered list of batches (oldest first).
// We mutate `.remaining` in-place as we consume stock.
const batchQueue = new Map<string, { id: string; remaining: number }[]>();

function consumeStock(
  fabricId: string,
  qty: number
): { batchId: string; quantityUsed: number }[] {
  const queue = batchQueue.get(fabricId) ?? [];
  const result: { batchId: string; quantityUsed: number }[] = [];
  let needed = qty;
  for (const b of queue) {
    if (needed < 0.001) break;
    const use = Math.min(b.remaining, needed);
    if (use > 0.001) {
      result.push({ batchId: b.id, quantityUsed: use });
      b.remaining = Math.max(0, b.remaining - use);
      needed -= use;
    }
  }
  return result;
}

async function addItem(
  projectId: string,
  fabricId: string | null,
  itemTypeEn: string,
  itemTypeAr: string,
  qty: number,
  unit: FabricUnit,
  source: SupplySource,
  locationId?: string,
  notes?: string
) {
  const item = await prisma.projectItem.create({
    data: {
      projectId,
      fabricId,
      itemTypeEn,
      itemTypeAr,
      locationId,
      quantityNeeded: qty,
      unit,
      source,
      notes,
    },
  });

  if (source === "INVENTORY" && fabricId) {
    const usages = consumeStock(fabricId, qty);
    for (const u of usages) {
      await prisma.projectItemUsage.create({
        data: {
          projectItemId: item.id,
          inventoryBatchId: u.batchId,
          quantityUsed: u.quantityUsed,
        },
      });
    }
  }

  return item;
}

// ─── Reference data ────────────────────────────────────────────────────────────

const VENDOR_DATA = [
  { nameEn: "Egyptian Textile Mills",    nameAr: "مطاحن النسيج المصري",       phone: "+20-2-2683-0001", email: "sales@etmills.com.eg",          address: "Industrial Zone, 6th of October City, Giza" },
  { nameEn: "Tessitura Italiana S.r.l.", nameAr: "تيسيتورا إيطاليانا",        phone: "+39-02-8888-0001", email: "export@tessitura-italiana.it",   address: "Via Montenapoleone 12, Milan, Italy" },
  { nameEn: "Anatolia Fabrics Co.",      nameAr: "شركة الأناضول للأقمشة",     phone: "+90-212-555-0101", email: "info@anatoliafabrics.com",       address: "Tekstilkent, Istanbul, Turkey" },
  { nameEn: "Nile Textile Group",        nameAr: "مجموعة النيل للنسيج",       phone: "+20-3-486-0200",  email: "orders@niletextile.com.eg",      address: "Alexandria Free Zone, Alexandria" },
  { nameEn: "Premier Fabrics UK",        nameAr: "بريمير فابريكس",            phone: "+44-20-7946-0101", email: "trade@premierfabrics.co.uk",     address: "28 Cloth Fair, London EC1A 7JQ" },
  { nameEn: "Delta Cotton Mills",        nameAr: "دلتا كوتون ميلز",           phone: "+20-40-332-0055", email: "sales@deltacotton.com.eg",       address: "Mahalla El Kubra, Gharbia" },
  { nameEn: "Orient Silk Trading",       nameAr: "أوريانت سيلك ترادينج",      phone: "+971-4-222-3301", email: "silk@orienttrading.ae",          address: "Deira Textile Souk, Dubai, UAE" },
  { nameEn: "Euroweave International",   nameAr: "يوروويف إنترناشيونال",      phone: "+32-2-512-0091", email: "info@euroweave.be",              address: "Rue du Commerce 74, Brussels, Belgium" },
  { nameEn: "Gulf Textile Solutions",    nameAr: "جلف تكستايل سولوشنز",      phone: "+971-6-555-9210", email: "contracts@gulftextile.ae",       address: "Sharjah Industrial Area, UAE" },
  { nameEn: "Barcelona Fabric House",    nameAr: "بارسيلونا فابريك هاوس",     phone: "+34-93-301-0055", email: "export@bcnfabric.es",            address: "Carrer de Pelai 15, Barcelona, Spain" },
];

// vendorIdx arrays reference positions in VENDOR_DATA
const FABRIC_DATA = [
  { codeRef: "FAB-001", nameEn: "Luxury Velvet",          nameAr: "مخمل فاخر",                 unit: "METERS" as FabricUnit, desc: "Heavy 300 GSM velvet — curtains and upholstery",                  vendorIdxs: [0, 1],    stockQty: 6000 },
  { codeRef: "FAB-002", nameEn: "Sheer Voile",            nameAr: "شفون شير",                  unit: "METERS" as FabricUnit, desc: "Lightweight sheer for inner curtain layers",                       vendorIdxs: [2],       stockQty: 1400 }, // intentionally low — will hit low-stock
  { codeRef: "FAB-003", nameEn: "Jacquard Damask",        nameAr: "داماسك جاكار",              unit: "METERS" as FabricUnit, desc: "Floral jacquard weave — bed runners and cushions",                 vendorIdxs: [1],       stockQty: 4000 },
  { codeRef: "FAB-004", nameEn: "Linen-Cotton Blend",     nameAr: "مزيج الكتان والقطن",        unit: "METERS" as FabricUnit, desc: "55% linen 45% cotton — natural hospitality texture",               vendorIdxs: [0, 2],    stockQty: 5000 },
  { codeRef: "FAB-005", nameEn: "Blackout Interlining",   nameAr: "بطانة بلاك أوت",            unit: "ROLLS"  as FabricUnit, desc: "100% blackout lining layer",                                      vendorIdxs: [0],       stockQty: 120  },
  { codeRef: "FAB-006", nameEn: "Egyptian Cotton Percale",nameAr: "بيركال قطن مصري",           unit: "METERS" as FabricUnit, desc: "400TC Egyptian cotton — premium bed sheets",                      vendorIdxs: [5],       stockQty: 5000 },
  { codeRef: "FAB-007", nameEn: "Silk Dupioni",           nameAr: "دوبيوني حرير",              unit: "METERS" as FabricUnit, desc: "Natural silk dupioni — accent pillows and throws",                 vendorIdxs: [6],       stockQty: 2000 },
  { codeRef: "FAB-008", nameEn: "Polyester Chenille",     nameAr: "شنيل بوليستر",              unit: "METERS" as FabricUnit, desc: "Heavy chenille upholstery — durability for hotel seating",         vendorIdxs: [2, 8],    stockQty: 4500 },
  { codeRef: "FAB-009", nameEn: "Brocade Gold",           nameAr: "بروكار ذهبي",               unit: "METERS" as FabricUnit, desc: "Metallic brocade — decorative elements and feature chairs",        vendorIdxs: [7],       stockQty: 2000 },
  { codeRef: "FAB-010", nameEn: "Hotel Sateen",           nameAr: "ساتان فندقي",               unit: "METERS" as FabricUnit, desc: "250TC polyester sateen — standard hotel bedding fabric",           vendorIdxs: [0, 5],    stockQty: 7000 },
  { codeRef: "FAB-011", nameEn: "Outdoor Canvas",         nameAr: "قماش كانفاس خارجي",         unit: "METERS" as FabricUnit, desc: "UV-resistant outdoor canvas — pool cabanas and sun-loungers",      vendorIdxs: [8],       stockQty: 4000 },
  { codeRef: "FAB-012", nameEn: "Faux Leather",           nameAr: "جلد صناعي",                 unit: "METERS" as FabricUnit, desc: "PU faux leather — easy-clean restaurant and bar seating",          vendorIdxs: [3, 9],    stockQty: 3500 },
  { codeRef: "FAB-013", nameEn: "Woven Jacquard",         nameAr: "جاكار منسوج",               unit: "METERS" as FabricUnit, desc: "Mid-weight woven jacquard — dining chair upholstery",              vendorIdxs: [7],       stockQty: 1200 }, // low-stock
  { codeRef: "FAB-014", nameEn: "Cotton Muslin",          nameAr: "موسلين قطن",                unit: "METERS" as FabricUnit, desc: "Light cotton muslin — staging backdrops and lining",               vendorIdxs: [5],       stockQty: 3500 },
  { codeRef: "FAB-015", nameEn: "FR Curtain Fabric",      nameAr: "قماش ستائر مقاوم للحريق",  unit: "ROLLS"  as FabricUnit, desc: "Fire-retardant certified curtain fabric — mandatory for conference", vendorIdxs: [4, 7],    stockQty: 200  },
  { codeRef: "FAB-016", nameEn: "Velvet Blackout",        nameAr: "مخمل بلاك أوت",             unit: "METERS" as FabricUnit, desc: "Blackout velvet — combines blackout and luxury in one layer",       vendorIdxs: [0, 1],    stockQty: 5000 },
  { codeRef: "FAB-017", nameEn: "Satin Stripe",           nameAr: "ساتان مخطط",                unit: "METERS" as FabricUnit, desc: "Satin stripe — headboard and bed-runner fabric",                   vendorIdxs: [1, 9],    stockQty: 3000 },
  { codeRef: "FAB-018", nameEn: "Organza Sheer",          nameAr: "أورجانزا شفافة",            unit: "METERS" as FabricUnit, desc: "Crisp organza — event stage dressing and draping",                 vendorIdxs: [6],       stockQty: 2500 },
  { codeRef: "FAB-019", nameEn: "Tweed Upholstery",       nameAr: "تويد تنجيد",                unit: "METERS" as FabricUnit, desc: "Classic tweed weave — lobby lounge and reception seating",         vendorIdxs: [4],       stockQty: 3000 },
  { codeRef: "FAB-020", nameEn: "Microfiber Suede",       nameAr: "سويد مايكروفايبر",          unit: "METERS" as FabricUnit, desc: "Ultra-soft microfiber suede — premium suite furniture",             vendorIdxs: [8, 9],    stockQty: 2500 },
  { codeRef: "FAB-021", nameEn: "Damask Table Linen",     nameAr: "داماسك مفرش طاولة",         unit: "METERS" as FabricUnit, desc: "Woven damask — restaurant tablecloths and napkins",                vendorIdxs: [3],       stockQty: 4000 },
  { codeRef: "FAB-022", nameEn: "Terry Toweling",         nameAr: "قماش تيري المناشف",         unit: "METERS" as FabricUnit, desc: "Loop-pile terry — spa and pool towels",                            vendorIdxs: [5],       stockQty: 5000 },
];

const HOTEL_DATA = [
  // Cairo (13)
  { nameEn: "Four Seasons Hotel Cairo at Nile Plaza",  nameAr: "فور سيزونز القاهرة في نايل بلازا",    locs: ["Grand Ballroom", "Executive Suites Wing", "Lobby Lounge", "Nile Restaurant"] },
  { nameEn: "The Nile Ritz-Carlton",                   nameAr: "ريتز كارلتون النيل القاهرة",           locs: ["Main Tower Rooms", "Club Lounge", "Nile Terrace Bar"] },
  { nameEn: "Kempinski Nile Hotel",                    nameAr: "كمبينسكي نيل القاهرة",                 locs: ["Royal Suite Floor", "Garden Terrace", "Lobby"] },
  { nameEn: "Conrad Cairo",                            nameAr: "كونراد القاهرة",                       locs: ["Deluxe Rooms", "Presidential Suite", "Conrad Ballroom"] },
  { nameEn: "Marriott Mena House",                     nameAr: "ماريوت مينا هاوس",                     locs: ["Garden Wing", "Pool Villas", "Pyramid View Rooms"] },
  { nameEn: "Fairmont Nile City",                      nameAr: "فيرمونت نايل سيتي",                    locs: ["North Tower", "South Tower", "Raffles Lounge"] },
  { nameEn: "Hilton Cairo Zamalek Residences",         nameAr: "هيلتون القاهرة الزمالك",               locs: ["Studio Suites", "Penthouse Floor", "Rooftop"] },
  { nameEn: "InterContinental Cairo Semiramis",        nameAr: "إنتركونتيننتال القاهرة سميراميس",      locs: ["River Wing", "Garden Wing", "Le Chantilly Restaurant"] },
  { nameEn: "Grand Hyatt Cairo",                       nameAr: "جراند هيات القاهرة",                   locs: ["Grand Club Floor", "Pool Deck", "Regency Ballroom"] },
  { nameEn: "Sofitel Cairo Nile El Gezirah",           nameAr: "سوفيتيل القاهرة النيل الجزيرة",        locs: ["Nile View Rooms", "Prestige Floor", "Bar La Palme d'Or"] },
  { nameEn: "Steigenberger El Tahrir",                 nameAr: "شتايجنبرجر التحرير القاهرة",           locs: ["Standard Rooms", "Junior Suites", "Conference Hall"] },
  { nameEn: "Sheraton Cairo Hotel & Casino",           nameAr: "شيراتون القاهرة",                      locs: ["Club Level", "Garden Block", "Sinbad Restaurant"] },
  { nameEn: "Le Méridien Pyramids Hotel & Spa",        nameAr: "لو ميريديان أهرام",                    locs: ["Pyramid View Rooms", "Spa & Wellness Centre", "La Brasserie"] },
  // Sharm El Sheikh (8)
  { nameEn: "Four Seasons Resort Sharm El Sheikh",     nameAr: "فور سيزونز شرم الشيخ",                 locs: ["Beach Bungalows", "Royal Suite", "Sinai Restaurant"] },
  { nameEn: "Rixos Premium Sharm El Sheikh",           nameAr: "ريكسوس بريميوم شرم الشيخ",             locs: ["Main Building", "Aqua World Area", "Premium Suites"] },
  { nameEn: "Mövenpick Resort Sharm El Sheikh",        nameAr: "موفنبيك ريزورت شرم الشيخ",             locs: ["Main Pool Area", "Beachfront Cabanas", "Presidential Suite"] },
  { nameEn: "Grand Hyatt Sharm El Sheikh",             nameAr: "جراند هيات شرم الشيخ",                 locs: ["Grand Club Rooms", "Dive Centre Area", "Al Fanous Restaurant"] },
  { nameEn: "Ritz-Carlton Sharm El Sheikh",            nameAr: "ريتز كارلتون شرم الشيخ",               locs: ["Club Level", "Marina View Suites", "Pool Terrace"] },
  { nameEn: "Sheraton Sharm Hotel",                    nameAr: "شيراتون شرم الشيخ",                    locs: ["Garden Rooms", "Sea View Block", "Shark's Bay Lounge"] },
  { nameEn: "Baron Resort Sharm El Sheikh",            nameAr: "بارون ريزورت شرم الشيخ",               locs: ["Standard Rooms", "Family Suites", "Rooftop Bar"] },
  { nameEn: "Hilton Sharm Dreams Resort",              nameAr: "هيلتون أحلام شرم الشيخ",               locs: ["Sea View Rooms", "Lagoon Area", "Dreams Ballroom"] },
  // Hurghada (8)
  { nameEn: "Steigenberger Al Dau Beach",              nameAr: "شتايجنبرجر الداو بيتش هرغادا",         locs: ["Beach House Rooms", "Golf Club Wing", "Al Dau Ballroom"] },
  { nameEn: "Rixos Premium Magawish",                  nameAr: "ريكسوس بريميوم ماجاويش هرغادا",        locs: ["Adult Pool Zone", "Family Zone", "Magawish Restaurant"] },
  { nameEn: "Hilton Hurghada Resort",                  nameAr: "هيلتون هرغادا ريزورت",                 locs: ["Lagoon View Rooms", "Beach Rooms", "Executive Lounge"] },
  { nameEn: "Sheraton Hurghada Hotel",                 nameAr: "شيراتون هرغادا",                       locs: ["Main Block", "Pool Side Rooms", "Conference Hall A"] },
  { nameEn: "Mövenpick Resort El Gouna",               nameAr: "موفنبيك الجونة هرغادا",                locs: ["Island Bungalows", "Lagoon Rooms", "El Gouna Restaurant"] },
  { nameEn: "Oberoi Sahl Hasheesh",                    nameAr: "أوبروي سهل حشيش هرغادا",              locs: ["Garden Villas", "Beach Villas", "The Oberoi Spa"] },
  { nameEn: "Jaz Aquamarine Resort",                   nameAr: "جاز أكوامارين هرغادا",                 locs: ["Sea View Block", "Pool Block", "Aquamarine Show Area"] },
  { nameEn: "Pickalbatros Aqua Blu",                   nameAr: "بيكالباتروس أكوا بلو هرغادا",          locs: ["Main Rooms", "Bungalow Area", "Aqua Park Zone"] },
  // Marsa Alam (3)
  { nameEn: "Coral Hills Resort Marsa Alam",           nameAr: "كورال هيلز ريزورت مرسى علم",           locs: ["Standard Rooms", "Sea View Suites", "Coral Restaurant"] },
  { nameEn: "Brayka Bay Resort",                       nameAr: "برايكا باي ريزورت مرسى علم",           locs: ["Beach Chalets", "Main Building", "Sunset Bar"] },
  { nameEn: "Radisson Blu Resort Marsa Alam",          nameAr: "راديسون بلو ريزورت مرسى علم",          locs: ["Sea View Wing", "Lagoon Wing", "Meeting Room 1"] },
  // Luxor (5)
  { nameEn: "Sofitel Winter Palace Luxor",             nameAr: "سوفيتيل قصر الشتاء الأقصر",            locs: ["Historic Wing", "Royal Garden Suites", "1886 Restaurant"] },
  { nameEn: "Steigenberger Nile Palace Luxor",         nameAr: "شتايجنبرجر نايل بالاس الأقصر",         locs: ["Standard Rooms", "Nile View Suites", "Nile Terrace"] },
  { nameEn: "Sonesta St. George Hotel Luxor",          nameAr: "سونستا سانت جورج الأقصر",              locs: ["Main Building", "Pool Rooms", "Rooftop Restaurant"] },
  { nameEn: "Mövenpick Resort Luxor",                  nameAr: "موفنبيك ريزورت الأقصر",                locs: ["Garden Rooms", "Pool Side Rooms", "Al Hambra Restaurant"] },
  { nameEn: "Hilton Luxor Resort & Spa",               nameAr: "هيلتون الأقصر ريزورت وسبا",            locs: ["Nile View Rooms", "Spa Wing", "Executive Lounge"] },
  // Aswan (4)
  { nameEn: "Sofitel Legend Old Cataract Aswan",       nameAr: "سوفيتيل ليجند أبوسمبل أسوان",          locs: ["Historic Palace Wing", "Nile View Rooms", "1902 Restaurant"] },
  { nameEn: "Mövenpick Resort Aswan",                  nameAr: "موفنبيك ريزورت أسوان",                 locs: ["Garden Rooms", "Island Chalets", "Nubian Lounge"] },
  { nameEn: "Pyramisa Isis Island Aswan",              nameAr: "بيراميسا إيزيس آيلاند أسوان",          locs: ["Island Rooms", "Pool Side Bungalows", "Isis Ballroom"] },
  { nameEn: "Basma Hotel Aswan",                       nameAr: "فندق باسما أسوان",                     locs: ["Standard Rooms", "Nile View Rooms", "Terrace Lounge"] },
  // Alexandria (4)
  { nameEn: "Four Seasons Hotel Alexandria",           nameAr: "فور سيزونز الإسكندرية",                locs: ["Sea View Rooms", "Penthouse Suite", "San Stefano Restaurant"] },
  { nameEn: "Helnan Palestine Hotel",                  nameAr: "هيلنان فلسطين الإسكندرية",             locs: ["Main Wing", "Royal Suite Floor", "Pool Terrace"] },
  { nameEn: "Sheraton Montazah Alexandria",            nameAr: "شيراتون المنتزه الإسكندرية",           locs: ["Garden Rooms", "Sea View Block", "Montazah Restaurant"] },
  { nameEn: "Le Méridien Alexandria",                  nameAr: "لو ميريديان الإسكندرية",               locs: ["Standard Rooms", "Executive Floor", "Le Meridien Lounge"] },
  // Others (6)
  { nameEn: "Mövenpick Resort El Sokhna",              nameAr: "موفنبيك السخنة",                       locs: ["Chalet Units", "Main Building", "Beach Club Area"] },
  { nameEn: "Taba Heights Marriott Beach Resort",      nameAr: "ماريوت تابا هايتس",                    locs: ["Sea View Rooms", "Golf Rooms", "Taba Ballroom"] },
  { nameEn: "Makadi Palace Hurghada",                  nameAr: "مكادي بالاس هرغادا",                   locs: ["Palace Rooms", "Makadi Lagoon", "Sultan Restaurant"] },
  { nameEn: "Porto Sokhna Hotel",                      nameAr: "فندق بورتو السخنة",                    locs: ["Standard Rooms", "Sea View Rooms", "Porto Restaurant"] },
  { nameEn: "Dahab Paradise Hotel",                    nameAr: "دهب بارادايس فندق",                    locs: ["Dive Base Rooms", "Lagoon Rooms", "Paradise Bar"] },
  { nameEn: "Nile Valley Hotel Luxor",                 nameAr: "فندق وادي النيل الأقصر",               locs: ["Standard Rooms", "Nile View Rooms"] },
];

// Contact name pools
const FIRST_NAMES_EN = ["Ahmed","Omar","Sara","Layla","Karim","Nour","Hassan","Yasmine","Mohamed","Dina","Amr","Rania","Tarek","Hana","Sherif","Mona"];
const LAST_NAMES_EN  = ["Hassan","Mansour","Khalil","Abdel-Rahman","Ibrahim","Nasser","Farouk","Soliman","Youssef","Gamal","Sabry","Zaki","Badawi","Saleh"];
const FIRST_NAMES_AR = ["أحمد","عمر","سارة","ليلى","كريم","نور","حسن","ياسمين","محمد","دينا","عمرو","رانيا","طارق","هناء","شريف","منى"];
const LAST_NAMES_AR  = ["حسن","منصور","خليل","عبد الرحمن","إبراهيم","ناصر","فاروق","سليمان","يوسف","جمال","صبري","زكي","بدوي","صالح"];
const ROLES = ["Procurement Manager","General Manager","Interior Design Coordinator","F&B Director","Rooms Division Manager","Operations Director","Facilities Manager","Executive Housekeeper","Chief Purchasing Officer","Property Manager"];

// Project name templates — indexed by template number (0-6)
type ProjectTemplate = {
  nameEn: (hotel: string) => string;
  nameAr: (hotel: string) => string;
  items: {
    fabricIdx: number | null;
    itemTypeEn: string; itemTypeAr: string;
    qty: number; unit: FabricUnit;
    source: SupplySource;
    locationSlot: number; // which hotel location to use
    notes?: string;
  }[];
};

const TEMPLATES: ProjectTemplate[] = [
  // 0: Curtain Package
  {
    nameEn: (h) => `${h} — Curtain Refurbishment`,
    nameAr: (h) => `تجديد الستائر — ${h}`,
    items: [
      { fabricIdx: 0,  itemTypeEn: "Main Curtains",        itemTypeAr: "الستائر الرئيسية",    qty: 140, unit: "METERS", source: "INVENTORY", locationSlot: 0 },
      { fabricIdx: 4,  itemTypeEn: "Blackout Lining",      itemTypeAr: "بطانة البلاك أوت",    qty: 3,   unit: "ROLLS",  source: "INVENTORY", locationSlot: 0 },
      { fabricIdx: 1,  itemTypeEn: "Sheer Inner Layer",    itemTypeAr: "البطانة الشفافة",      qty: 110, unit: "METERS", source: "INVENTORY", locationSlot: 0 },
    ],
  },
  // 1: Bedroom Refresh
  {
    nameEn: (h) => `${h} — Guest Room Linen Package`,
    nameAr: (h) => `حزمة مفروشات الغرف — ${h}`,
    items: [
      { fabricIdx: 9,  itemTypeEn: "Fitted Bed Sheets",    itemTypeAr: "ملاءات السرير",        qty: 90,  unit: "METERS", source: "INVENTORY", locationSlot: 0 },
      { fabricIdx: 2,  itemTypeEn: "Bed Runner",           itemTypeAr: "رانر السرير",           qty: 55,  unit: "METERS", source: "INVENTORY", locationSlot: 0 },
      { fabricIdx: 17, itemTypeEn: "Headboard Upholstery", itemTypeAr: "تنجيد الهدبورد",       qty: 40,  unit: "METERS", source: "INVENTORY", locationSlot: 1 },
      { fabricIdx: 5,  itemTypeEn: "Duvet Covers",         itemTypeAr: "أغطية اللحاف",         qty: 70,  unit: "METERS", source: "CLIENT",    locationSlot: 0, notes: "Hotel-supplied Egyptian cotton" },
    ],
  },
  // 2: Restaurant & Dining
  {
    nameEn: (h) => `${h} — Restaurant & Dining Refurbishment`,
    nameAr: (h) => `تجديد المطعم — ${h}`,
    items: [
      { fabricIdx: 20, itemTypeEn: "Table Linen",          itemTypeAr: "مفارش الطاولات",       qty: 80,  unit: "METERS", source: "INVENTORY", locationSlot: 2 },
      { fabricIdx: 12, itemTypeEn: "Dining Chair Covers",  itemTypeAr: "أكسية كراسي الطعام",  qty: 95,  unit: "METERS", source: "INVENTORY", locationSlot: 2 },
      { fabricIdx: 8,  itemTypeEn: "Feature Chair Fabric", itemTypeAr: "قماش الكراسي المميزة", qty: 30,  unit: "METERS", source: "INVENTORY", locationSlot: 2 },
      { fabricIdx: 7,  itemTypeEn: "Banquette Upholstery", itemTypeAr: "تنجيد البانكيت",       qty: 60,  unit: "METERS", source: "DIRECT",    locationSlot: 2, notes: "Direct purchase — custom colour mix" },
    ],
  },
  // 3: Suite Overhaul
  {
    nameEn: (h) => `${h} — Suite Soft Furnishing Overhaul`,
    nameAr: (h) => `تجديد المفروشات الناعمة للأجنحة — ${h}`,
    items: [
      { fabricIdx: 0,  itemTypeEn: "Suite Curtains",       itemTypeAr: "ستائر الجناح",         qty: 120, unit: "METERS", source: "INVENTORY", locationSlot: 1 },
      { fabricIdx: 11, itemTypeEn: "Sofa Upholstery",      itemTypeAr: "تنجيد الأرائك",        qty: 85,  unit: "METERS", source: "INVENTORY", locationSlot: 1 },
      { fabricIdx: 9,  itemTypeEn: "Suite Bed Linen",      itemTypeAr: "مفروشات سرير الجناح",  qty: 70,  unit: "METERS", source: "INVENTORY", locationSlot: 1 },
      { fabricIdx: 19, itemTypeEn: "Armchair Upholstery",  itemTypeAr: "تنجيد الكراسي",        qty: 45,  unit: "METERS", source: "CLIENT",    locationSlot: 1, notes: "Client-supplied suede panels" },
    ],
  },
  // 4: Lobby & Common Areas
  {
    nameEn: (h) => `${h} — Lobby & Public Spaces`,
    nameAr: (h) => `لوبي والمساحات العامة — ${h}`,
    items: [
      { fabricIdx: 15, itemTypeEn: "Lobby Curtains",       itemTypeAr: "ستائر اللوبي",         qty: 160, unit: "METERS", source: "INVENTORY", locationSlot: 0 },
      { fabricIdx: 18, itemTypeEn: "Lounge Seating",       itemTypeAr: "مقاعد اللاونج",        qty: 130, unit: "METERS", source: "INVENTORY", locationSlot: 0 },
      { fabricIdx: 6,  itemTypeEn: "Decorative Throws",    itemTypeAr: "الأغطية الزخرفية",     qty: 50,  unit: "METERS", source: "INVENTORY", locationSlot: 0 },
      { fabricIdx: 13, itemTypeEn: "Wall Draping",         itemTypeAr: "أقمشة الجدران",        qty: 80,  unit: "METERS", source: "DIRECT",    locationSlot: 0, notes: "White muslin — architectural draping" },
    ],
  },
  // 5: Pool & Spa
  {
    nameEn: (h) => `${h} — Pool & Spa Area`,
    nameAr: (h) => `منطقة حمام السباحة والسبا — ${h}`,
    items: [
      { fabricIdx: 10, itemTypeEn: "Cabana Curtains",      itemTypeAr: "ستائر الكابانا",       qty: 180, unit: "METERS", source: "INVENTORY", locationSlot: 1 },
      { fabricIdx: 14, itemTypeEn: "Spa Blackout Drapes",  itemTypeAr: "ستائر السبا المعتمة",  qty: 4,   unit: "ROLLS",  source: "INVENTORY", locationSlot: 1, notes: "FR-certified mandatory for treatment rooms" },
      { fabricIdx: 21, itemTypeEn: "Spa Towelling",        itemTypeAr: "مناشف السبا",          qty: 120, unit: "METERS", source: "CLIENT",    locationSlot: 1, notes: "Supplied by hotel — branding in-house" },
    ],
  },
  // 6: Conference & Events
  {
    nameEn: (h) => `${h} — Conference Centre Fit-Out`,
    nameAr: (h) => `تجهيز مركز المؤتمرات — ${h}`,
    items: [
      { fabricIdx: 14, itemTypeEn: "AV Blackout Curtains", itemTypeAr: "ستائر بلاك أوت للعروض", qty: 6,  unit: "ROLLS",  source: "INVENTORY", locationSlot: 2 },
      { fabricIdx: 17, itemTypeEn: "Stage Dressing",       itemTypeAr: "تزيين المنصة",          qty: 80,  unit: "METERS", source: "INVENTORY", locationSlot: 2 },
      { fabricIdx: 3,  itemTypeEn: "Conference Table Linen", itemTypeAr: "مفارش طاولات المؤتمرات", qty: 150, unit: "METERS", source: "INVENTORY", locationSlot: 2 },
      { fabricIdx: 13, itemTypeEn: "Backdrop Cloth",       itemTypeAr: "قماش الخلفية",          qty: 100, unit: "METERS", source: "CLIENT",    locationSlot: 2, notes: "Client-branded backdrop supplied by hotel" },
    ],
  },
];

// PO data — vendor indices reference VENDOR_DATA positions
// Each PO has lines: [{ fabricIdx, qty, price }]
const PO_RECEIVED = [
  { num: "PO-2026-001", vendorIdx: 0, orderedAt: "2026-01-10", receivedAt: "2026-01-25", lines: [{ fi: 0, qty: 3000, price: 118 }, { fi: 3, qty: 2000, price: 82  }, { fi: 4, qty: 60, price: 420  }] },
  { num: "PO-2026-002", vendorIdx: 1, orderedAt: "2026-01-15", receivedAt: "2026-02-05", lines: [{ fi: 0, qty: 3000, price: 275 }, { fi: 2, qty: 2000, price: 310  }] },
  { num: "PO-2026-003", vendorIdx: 2, orderedAt: "2026-01-20", receivedAt: "2026-02-10", lines: [{ fi: 1, qty: 1400, price: 63  }, { fi: 7, qty: 2000, price: 95  }] },
  { num: "PO-2026-004", vendorIdx: 5, orderedAt: "2026-01-28", receivedAt: "2026-02-20", lines: [{ fi: 5, qty: 2500, price: 145 }, { fi: 9, qty: 3500, price: 88  }, { fi: 21, qty: 2500, price: 56 }] },
  { num: "PO-2026-005", vendorIdx: 0, orderedAt: "2026-02-05", receivedAt: "2026-02-25", lines: [{ fi: 15, qty: 2500, price: 135 }, { fi: 16, qty: 1500, price: 105 }] },
  { num: "PO-2026-006", vendorIdx: 7, orderedAt: "2026-02-10", receivedAt: "2026-03-01", lines: [{ fi: 8, qty: 1000, price: 285 }, { fi: 12, qty: 1200, price: 195 }, { fi: 14, qty: 100, price: 550 }] },
  { num: "PO-2026-007", vendorIdx: 4, orderedAt: "2026-02-15", receivedAt: "2026-03-10", lines: [{ fi: 18, qty: 1500, price: 175 }, { fi: 19, qty: 1250, price: 160 }, { fi: 14, qty: 100, price: 550 }] },
  { num: "PO-2026-008", vendorIdx: 6, orderedAt: "2026-02-20", receivedAt: "2026-03-15", lines: [{ fi: 6, qty: 1000, price: 340 }, { fi: 17, qty: 1500, price: 118 }] },
  { num: "PO-2026-009", vendorIdx: 8, orderedAt: "2026-02-25", receivedAt: "2026-03-20", lines: [{ fi: 10, qty: 2000, price: 72  }, { fi: 20, qty: 2000, price: 98  }] },
  { num: "PO-2026-010", vendorIdx: 3, orderedAt: "2026-03-01", receivedAt: "2026-03-22", lines: [{ fi: 11, qty: 1750, price: 155 }, { fi: 20, qty: 2000, price: 98  }] },
  { num: "PO-2026-011", vendorIdx: 9, orderedAt: "2026-03-05", receivedAt: "2026-03-28", lines: [{ fi: 11, qty: 1750, price: 162 }, { fi: 19, qty: 1750, price: 168 }] },
  { num: "PO-2026-012", vendorIdx: 5, orderedAt: "2026-03-10", receivedAt: "2026-04-01", lines: [{ fi: 13, qty: 1750, price: 48  }, { fi: 21, qty: 2500, price: 56  }] },
  { num: "PO-2026-013", vendorIdx: 0, orderedAt: "2026-03-15", receivedAt: "2026-04-05", lines: [{ fi: 3, qty: 3000, price: 80  }, { fi: 4, qty: 60, price: 430  }] },
  { num: "PO-2026-014", vendorIdx: 1, orderedAt: "2026-03-20", receivedAt: "2026-04-10", lines: [{ fi: 2, qty: 2000, price: 315 }, { fi: 16, qty: 1500, price: 110 }] },
  { num: "PO-2026-015", vendorIdx: 2, orderedAt: "2026-03-25", receivedAt: "2026-04-18", lines: [{ fi: 7, qty: 2500, price: 92  }, { fi: 8, qty: 1000, price: 290  }] },
  { num: "PO-2026-016", vendorIdx: 4, orderedAt: "2026-04-01", receivedAt: "2026-04-25", lines: [{ fi: 18, qty: 1500, price: 178 }, { fi: 6, qty: 1000, price: 345 }] },
  { num: "PO-2026-017", vendorIdx: 5, orderedAt: "2026-04-05", receivedAt: "2026-04-28", lines: [{ fi: 5, qty: 2500, price: 148 }, { fi: 9, qty: 3500, price: 90  }] },
  { num: "PO-2026-018", vendorIdx: 0, orderedAt: "2026-04-10", receivedAt: "2026-05-01", lines: [{ fi: 0, qty: 3000, price: 120 }, { fi: 15, qty: 2500, price: 138 }] },
  { num: "PO-2026-019", vendorIdx: 8, orderedAt: "2026-04-15", receivedAt: "2026-05-05", lines: [{ fi: 10, qty: 2000, price: 75  }, { fi: 17, qty: 1500, price: 112 }] },
  { num: "PO-2026-020", vendorIdx: 7, orderedAt: "2026-04-20", receivedAt: "2026-05-10", lines: [{ fi: 12, qty: 1200, price: 198 }, { fi: 13, qty: 1750, price: 50  }] },
];

const PO_PENDING = [
  { num: "PO-2026-021", vendorIdx: 2, orderedAt: "2026-05-15", expectedAt: "2026-06-05", lines: [{ fi: 1, qty: 800, price: 65 }, { fi: 7, qty: 1500, price: 96 }] },
  { num: "PO-2026-022", vendorIdx: 1, orderedAt: "2026-05-16", expectedAt: "2026-05-24", lines: [{ fi: 0, qty: 2000, price: 280 }, { fi: 2, qty: 1500, price: 320 }] }, // due today
  { num: "PO-2026-023", vendorIdx: 0, orderedAt: "2026-05-17", expectedAt: "2026-05-24", lines: [{ fi: 3, qty: 2000, price: 83 }] }, // due today
  { num: "PO-2026-024", vendorIdx: 4, orderedAt: "2026-05-18", expectedAt: "2026-06-15", lines: [{ fi: 18, qty: 1000, price: 180 }, { fi: 14, qty: 80, price: 560 }] },
  { num: "PO-2026-025", vendorIdx: 5, orderedAt: "2026-05-19", expectedAt: "2026-06-10", lines: [{ fi: 9, qty: 2000, price: 91 }, { fi: 21, qty: 1500, price: 58 }] },
  { num: "PO-2026-026", vendorIdx: 6, orderedAt: "2026-05-20", expectedAt: "2026-06-20", lines: [{ fi: 6, qty: 800, price: 348 }, { fi: 8, qty: 800, price: 292 }] },
  { num: "PO-2026-027", vendorIdx: 3, orderedAt: "2026-05-21", expectedAt: "2026-07-01", lines: [{ fi: 20, qty: 1500, price: 100 }, { fi: 11, qty: 1200, price: 158 }] },
  { num: "PO-2026-028", vendorIdx: 9, orderedAt: "2026-05-22", expectedAt: "2026-06-30", lines: [{ fi: 16, qty: 1000, price: 115 }, { fi: 19, qty: 1000, price: 165 }] },
];

// ─── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🗑  Clearing existing data...");
  await prisma.projectItemUsage.deleteMany();
  await prisma.projectItem.deleteMany();
  await prisma.inventoryBatch.deleteMany();
  await prisma.purchaseOrderLine.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.project.deleteMany();
  await prisma.fabricVendor.deleteMany();
  await prisma.fabric.deleteMany();
  await prisma.hotelContact.deleteMany();
  await prisma.hotelLocation.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.vendor.deleteMany();

  // ── 1. Vendors ──────────────────────────────────────────────────────────────
  console.log("👥 Seeding vendors...");
  const vendors = await Promise.all(
    VENDOR_DATA.map((v) => prisma.vendor.create({ data: v }))
  );

  // ── 2. Fabrics ──────────────────────────────────────────────────────────────
  console.log("🧵 Seeding fabrics...");
  const fabrics = await Promise.all(
    FABRIC_DATA.map((f) =>
      prisma.fabric.create({
        data: {
          codeRef: f.codeRef,
          nameEn: f.nameEn,
          nameAr: f.nameAr,
          description: f.desc,
          unit: f.unit,
          vendors: {
            create: f.vendorIdxs.map((vi) => ({ vendorId: vendors[vi].id })),
          },
        },
      })
    )
  );

  // ── 3. Hotels ───────────────────────────────────────────────────────────────
  console.log("🏨 Seeding 50 hotels...");
  const hotels: { id: string; locationIds: string[] }[] = [];

  for (let i = 0; i < HOTEL_DATA.length; i++) {
    const h = HOTEL_DATA[i];
    const fnIdx  = i % FIRST_NAMES_EN.length;
    const lnIdx  = i % LAST_NAMES_EN.length;
    const fn2Idx = (i + 5) % FIRST_NAMES_EN.length;
    const ln2Idx = (i + 5) % LAST_NAMES_EN.length;
    const roleIdx = i % ROLES.length;

    const hotel = await prisma.hotel.create({
      data: {
        nameEn: h.nameEn,
        nameAr: h.nameAr,
        locations: {
          create: h.locs.map((locName, li) => ({
            nameEn: locName,
            nameAr: locName, // simplified — same for seed
            address: li === 0 ? `${h.nameEn} Main Building` : undefined,
          })),
        },
        contacts: {
          create: [
            {
              nameEn: `${FIRST_NAMES_EN[fnIdx]} ${LAST_NAMES_EN[lnIdx]}`,
              nameAr: `${FIRST_NAMES_AR[fnIdx]} ${LAST_NAMES_AR[lnIdx]}`,
              role: ROLES[roleIdx],
              phone: `+20-${10 + (i % 89)}-${1000 + i * 7}-${1000 + i * 3}`,
              email: `procurement.${LAST_NAMES_EN[lnIdx].toLowerCase().replace(/-/g,"")}@${h.nameEn.split(" ")[0].toLowerCase()}-hotel.com`,
              isPrimary: true,
            },
            {
              nameEn: `${FIRST_NAMES_EN[fn2Idx]} ${LAST_NAMES_EN[ln2Idx]}`,
              nameAr: `${FIRST_NAMES_AR[fn2Idx]} ${LAST_NAMES_AR[ln2Idx]}`,
              role: ROLES[(roleIdx + 1) % ROLES.length],
              phone: `+20-${10 + ((i + 3) % 89)}-${2000 + i * 5}-${2000 + i * 7}`,
              email: `facilities.${LAST_NAMES_EN[ln2Idx].toLowerCase().replace(/-/g,"")}@${h.nameEn.split(" ")[0].toLowerCase()}-hotel.com`,
              isPrimary: false,
            },
          ],
        },
      },
      include: { locations: true },
    });

    hotels.push({ id: hotel.id, locationIds: hotel.locations.map((l) => l.id) });
  }

  // ── 4. Received POs + inventory batches ─────────────────────────────────────
  console.log("📦 Seeding received POs and inventory batches...");

  for (const po of PO_RECEIVED) {
    const created = await prisma.purchaseOrder.create({
      data: {
        poNumber: po.num,
        vendorId: vendors[po.vendorIdx].id,
        status: "RECEIVED",
        orderedAt: new Date(po.orderedAt),
        receivedAt: new Date(po.receivedAt),
        lines: {
          create: po.lines.map((l) => ({
            fabricId: fabrics[l.fi].id,
            quantity: l.qty,
            unitPrice: l.price,
            currency: "EGP",
          })),
        },
      },
      include: { lines: true },
    });

    // Create one inventory batch per line; register in batchQueue (FIFO order = insertion order)
    for (const line of created.lines) {
      const qty = Number(line.quantity);
      const batch = await prisma.inventoryBatch.create({
        data: {
          fabricId: line.fabricId,
          purchaseOrderLineId: line.id,
          quantityIn: qty,
          quantityLeft: qty,     // will be updated after project items are created
          unitCost: line.unitPrice,
          currency: line.currency,
          receivedAt: new Date(po.receivedAt),
        },
      });

      // Register in FIFO queue
      if (!batchQueue.has(line.fabricId)) batchQueue.set(line.fabricId, []);
      batchQueue.get(line.fabricId)!.push({ id: batch.id, remaining: qty });
    }
  }

  // ── 5. Pending POs ──────────────────────────────────────────────────────────
  console.log("📋 Seeding pending POs...");
  for (const po of PO_PENDING) {
    await prisma.purchaseOrder.create({
      data: {
        poNumber: po.num,
        vendorId: vendors[po.vendorIdx].id,
        status: "PENDING",
        orderedAt: new Date(po.orderedAt),
        expectedAt: new Date(po.expectedAt),
        lines: {
          create: po.lines.map((l) => ({
            fabricId: fabrics[l.fi].id,
            quantity: l.qty,
            unitPrice: l.price,
            currency: "EGP",
          })),
        },
      },
    });
  }

  // ── 6. Projects with items ───────────────────────────────────────────────────
  console.log("🗂  Seeding projects and items...");

  // Status distribution across hotels (deterministic)
  const STATUS_CYCLE = [
    "DELIVERED", "IN_PRODUCTION", "CONFIRMED", "DRAFT", "CONFIRMED",
    "IN_PRODUCTION", "DRAFT", "DELIVERED", "CONFIRMED", "IN_PRODUCTION",
    "DRAFT", "CONFIRMED", "IN_PRODUCTION", "CONFIRMED", "DELIVERED",
    "DRAFT", "IN_PRODUCTION", "CONFIRMED", "DRAFT", "CONFIRMED",
  ] as const;

  // Overdue dates (projects with deliveryDate in the past but not DELIVERED)
  const OVERDUE_DATES = ["2026-03-15","2026-04-01","2026-04-10","2026-04-20","2026-05-01","2026-05-10"];

  let projectCount = 0;

  for (let hi = 0; hi < hotels.length; hi++) {
    const hotel   = hotels[hi];
    const locs    = hotel.locationIds;

    // Every hotel gets at least 1 project
    const numProjects = hi % 3 === 0 ? 2 : 1; // every 3rd hotel gets 2

    for (let pi = 0; pi < numProjects; pi++) {
      const templateIdx = (hi + pi) % TEMPLATES.length;
      const template    = TEMPLATES[templateIdx];
      const statusRaw   = STATUS_CYCLE[(hi + pi) % STATUS_CYCLE.length];

      // Make some non-DELIVERED projects overdue
      const isOverdue = statusRaw !== "DELIVERED" && (hi % 8 === 0);
      const deliveryOffset = pi === 0 ? 60 + hi * 2 : 90 + hi;
      const startDate   = new Date(2026, 0, 10 + hi * 3 + pi * 15);
      const deliveryDate = isOverdue
        ? new Date(OVERDUE_DATES[hi % OVERDUE_DATES.length])
        : new Date(startDate.getTime() + deliveryOffset * 24 * 60 * 60 * 1000);

      const hotelName = HOTEL_DATA[hi].nameEn.split(" ").slice(0, 3).join(" ");
      const project = await prisma.project.create({
        data: {
          nameEn: template.nameEn(hotelName),
          nameAr: template.nameAr(HOTEL_DATA[hi].nameAr.split(" ").slice(0, 2).join(" ")),
          status: statusRaw,
          hotelId: hotel.id,
          startDate,
          deliveryDate,
          notes: pi === 0
            ? `Initial ${template.nameEn("").replace("—","").trim()} project for ${HOTEL_DATA[hi].nameEn}.`
            : undefined,
        },
      });

      for (const item of template.items) {
        // Resolve location — fall back to first location if slot out of range
        const locId = locs[Math.min(item.locationSlot, locs.length - 1)];

        // Vary quantity slightly per hotel to make data less uniform
        const qtyVariance = 0.8 + (hi % 5) * 0.1; // 0.8 – 1.2
        const qty = parseFloat((item.qty * qtyVariance).toFixed(1));

        await addItem(
          project.id,
          item.fabricIdx !== null ? fabrics[item.fabricIdx].id : null,
          item.itemTypeEn,
          item.itemTypeAr,
          qty,
          item.unit,
          item.source,
          locId,
          item.notes
        );
      }

      projectCount++;
    }
  }

  // ── 7. Flush quantityLeft on all batches ─────────────────────────────────────
  console.log("🔄 Updating inventory batch quantities...");
  for (const [, queue] of batchQueue) {
    for (const b of queue) {
      await prisma.inventoryBatch.update({
        where: { id: b.id },
        data: { quantityLeft: parseFloat(b.remaining.toFixed(3)) },
      });
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  const [vCount, fCount, hCount, poCount, bCount, pCount, piCount] = await Promise.all([
    prisma.vendor.count(),
    prisma.fabric.count(),
    prisma.hotel.count(),
    prisma.purchaseOrder.count(),
    prisma.inventoryBatch.count(),
    prisma.project.count(),
    prisma.projectItem.count(),
  ]);

  console.log(`\n✅ Seed complete:`);
  console.log(`   ${vCount}  vendors`);
  console.log(`   ${fCount}  fabrics`);
  console.log(`   ${hCount}  hotels`);
  console.log(`   ${poCount} purchase orders`);
  console.log(`   ${bCount}  inventory batches`);
  console.log(`   ${pCount}  projects`);
  console.log(`   ${piCount} project items`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

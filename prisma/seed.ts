import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Clearing existing data...");
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

  console.log("Seeding hotels...");
  const fourSeasons = await prisma.hotel.create({
    data: {
      nameEn: "Four Seasons Hotel Cairo at Nile Plaza",
      nameAr: "فور سيزونز القاهرة في نايل بلازا",
      locations: {
        create: [
          { nameEn: "Grand Ballroom", nameAr: "قاعة البالروم الكبرى", address: "1089 Corniche El Nil, Cairo" },
          { nameEn: "Executive Suites Floor", nameAr: "طابق الأجنحة التنفيذية" },
          { nameEn: "Lobby Lounge", nameAr: "لاونج اللوبي" },
        ],
      },
      contacts: {
        create: [
          { nameEn: "Ahmed Hassan", nameAr: "أحمد حسن", role: "Procurement Manager", phone: "+20-2-2791-7000", email: "a.hassan@fourseasons-cairo.com", isPrimary: true },
          { nameEn: "Layla Mansour", nameAr: "ليلى منصور", role: "Interior Design Lead", phone: "+20-2-2791-7001", email: "l.mansour@fourseasons-cairo.com", isPrimary: false },
        ],
      },
    },
  });

  const movenpick = await prisma.hotel.create({
    data: {
      nameEn: "Mövenpick Resort & Spa Sharm El Sheikh",
      nameAr: "موفنبيك ريزورت وسبا شرم الشيخ",
      locations: {
        create: [
          { nameEn: "Main Pool Area", nameAr: "منطقة حمام السباحة الرئيسية" },
          { nameEn: "Beachfront Cabanas", nameAr: "كابانات الشاطئ" },
          { nameEn: "Presidential Suite", nameAr: "الجناح الرئاسي" },
        ],
      },
      contacts: {
        create: [
          { nameEn: "Omar Khalil", nameAr: "عمر خليل", role: "Operations Director", phone: "+20-69-360-0100", email: "o.khalil@movenpick-sharm.com", isPrimary: true },
        ],
      },
    },
  });

  const kempinski = await prisma.hotel.create({
    data: {
      nameEn: "Kempinski Hotel Soma Bay",
      nameAr: "كمبينسكي هوتل سوما باي",
      locations: {
        create: [
          { nameEn: "Royal Wing", nameAr: "الجناح الملكي" },
          { nameEn: "Spa & Wellness Centre", nameAr: "مركز السبا والعافية" },
        ],
      },
      contacts: {
        create: [
          { nameEn: "Sara Abdel-Rahman", nameAr: "سارة عبد الرحمن", role: "Rooms & F&B Coordinator", phone: "+20-65-354-5000", email: "s.abdelrahman@kempinski-somabay.com", isPrimary: true },
        ],
      },
    },
  });

  console.log("Seeding vendors...");
  const egyptianTextile = await prisma.vendor.create({
    data: {
      nameEn: "Egyptian Textile Mills",
      nameAr: "مطاحن النسيج المصري",
      phone: "+20-2-2683-0001",
      email: "sales@etmills.com.eg",
      address: "Industrial Zone, 6th of October City, Giza",
    },
  });

  const italianFabric = await prisma.vendor.create({
    data: {
      nameEn: "Tessitura Italiana S.r.l.",
      nameAr: "تيسيتورا إيطاليانا",
      phone: "+39-02-8888-0001",
      email: "export@tessitura-italiana.it",
      address: "Via Montenapoleone 12, Milan, Italy",
    },
  });

  const turkishFabrics = await prisma.vendor.create({
    data: {
      nameEn: "Anatolia Fabrics Co.",
      nameAr: "شركة الأناضول للأقمشة",
      phone: "+90-212-555-0101",
      email: "info@anatoliafabrics.com",
      address: "Tekstilkent, Istanbul, Turkey",
    },
  });

  console.log("Seeding fabrics...");
  const luxuryVelvet = await prisma.fabric.create({
    data: {
      codeRef: "FAB-001",
      nameEn: "Luxury Velvet",
      nameAr: "مخمل فاخر",
      description: "Heavy-weight velvet, 300 GSM — curtains and upholstery in luxury settings",
      unit: "METERS",
      vendors: { create: [{ vendorId: egyptianTextile.id }, { vendorId: italianFabric.id }] },
    },
  });

  const sheerVoile = await prisma.fabric.create({
    data: {
      codeRef: "FAB-002",
      nameEn: "Sheer Voile",
      nameAr: "شفون شير",
      description: "Lightweight sheer fabric for inner curtain layers, ivory and white",
      unit: "METERS",
      vendors: { create: [{ vendorId: turkishFabrics.id }] },
    },
  });

  const damask = await prisma.fabric.create({
    data: {
      codeRef: "FAB-003",
      nameEn: "Jacquard Damask",
      nameAr: "داماسك جاكار",
      description: "Jacquard weave with floral patterns — bed runners and decorative pillows",
      unit: "METERS",
      vendors: { create: [{ vendorId: italianFabric.id }] },
    },
  });

  const linenBlend = await prisma.fabric.create({
    data: {
      codeRef: "FAB-004",
      nameEn: "Linen-Cotton Blend",
      nameAr: "مزيج الكتان والقطن",
      description: "55% linen, 45% cotton — natural texture for modern hospitality applications",
      unit: "METERS",
      vendors: { create: [{ vendorId: egyptianTextile.id }, { vendorId: turkishFabrics.id }] },
    },
  });

  const blackoutFabric = await prisma.fabric.create({
    data: {
      codeRef: "FAB-005",
      nameEn: "Blackout Interlining",
      nameAr: "بطانة بلاك أوت",
      description: "100% blackout lining layer behind main curtain fabric",
      unit: "ROLLS",
      vendors: { create: [{ vendorId: egyptianTextile.id }] },
    },
  });

  console.log("Seeding purchase orders...");
  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2026-001",
      vendorId: egyptianTextile.id,
      status: "RECEIVED",
      orderedAt: new Date("2026-04-01"),
      receivedAt: new Date("2026-04-15"),
      notes: "Bulk order for Q2 hotel projects",
      lines: {
        create: [
          { fabricId: luxuryVelvet.id, quantity: 500, unitPrice: 120, currency: "EGP" },
          { fabricId: linenBlend.id, quantity: 300, unitPrice: 85, currency: "EGP" },
          { fabricId: blackoutFabric.id, quantity: 20, unitPrice: 450, currency: "EGP" },
        ],
      },
    },
    include: { lines: true },
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2026-002",
      vendorId: italianFabric.id,
      status: "RECEIVED",
      orderedAt: new Date("2026-04-10"),
      receivedAt: new Date("2026-05-01"),
      notes: "Italian import for Four Seasons project",
      lines: {
        create: [
          { fabricId: luxuryVelvet.id, quantity: 200, unitPrice: 280, currency: "EGP" },
          { fabricId: damask.id, quantity: 150, unitPrice: 320, currency: "EGP" },
        ],
      },
    },
    include: { lines: true },
  });

  await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2026-003",
      vendorId: turkishFabrics.id,
      status: "PENDING",
      orderedAt: new Date("2026-05-10"),
      expectedAt: new Date("2026-06-01"),
      notes: "Turkish voile for Kempinski project — awaiting shipment",
      lines: {
        create: [{ fabricId: sheerVoile.id, quantity: 400, unitPrice: 65, currency: "EGP" }],
      },
    },
  });

  console.log("Seeding inventory batches...");
  const po1VelvetLine = po1.lines.find((l) => l.fabricId === luxuryVelvet.id)!;
  const po1LinenLine = po1.lines.find((l) => l.fabricId === linenBlend.id)!;
  const po1BlackoutLine = po1.lines.find((l) => l.fabricId === blackoutFabric.id)!;
  const po2VelvetLine = po2.lines.find((l) => l.fabricId === luxuryVelvet.id)!;
  const po2DamaskLine = po2.lines.find((l) => l.fabricId === damask.id)!;

  const batch1 = await prisma.inventoryBatch.create({
    data: {
      fabricId: luxuryVelvet.id,
      purchaseOrderLineId: po1VelvetLine.id,
      quantityIn: 500,
      quantityLeft: 350,
      unitCost: 120,
      currency: "EGP",
      receivedAt: new Date("2026-04-15"),
      notes: "Egyptian velvet — burgundy. 150m pre-allocated to Ballroom project.",
    },
  });

  await prisma.inventoryBatch.create({
    data: {
      fabricId: linenBlend.id,
      purchaseOrderLineId: po1LinenLine.id,
      quantityIn: 300,
      quantityLeft: 300,
      unitCost: 85,
      currency: "EGP",
      receivedAt: new Date("2026-04-15"),
    },
  });

  const batch3 = await prisma.inventoryBatch.create({
    data: {
      fabricId: blackoutFabric.id,
      purchaseOrderLineId: po1BlackoutLine.id,
      quantityIn: 20,
      quantityLeft: 18,
      metersPerRoll: 50,
      unitCost: 450,
      currency: "EGP",
      receivedAt: new Date("2026-04-15"),
    },
  });

  await prisma.inventoryBatch.create({
    data: {
      fabricId: luxuryVelvet.id,
      purchaseOrderLineId: po2VelvetLine.id,
      quantityIn: 200,
      quantityLeft: 200,
      unitCost: 280,
      currency: "EGP",
      receivedAt: new Date("2026-05-01"),
      notes: "Italian velvet — premium grade, cream and gold",
    },
  });

  await prisma.inventoryBatch.create({
    data: {
      fabricId: damask.id,
      purchaseOrderLineId: po2DamaskLine.id,
      quantityIn: 150,
      quantityLeft: 150,
      unitCost: 320,
      currency: "EGP",
      receivedAt: new Date("2026-05-01"),
    },
  });

  console.log("Seeding projects...");
  const fourSeasonsLocations = await prisma.hotelLocation.findMany({ where: { hotelId: fourSeasons.id } });
  const movenpickLocations = await prisma.hotelLocation.findMany({ where: { hotelId: movenpick.id } });

  const fsBallroom = fourSeasonsLocations.find((l) => l.nameEn === "Grand Ballroom")!;
  const fsExecSuites = fourSeasonsLocations.find((l) => l.nameEn === "Executive Suites Floor")!;
  const mpPresidential = movenpickLocations.find((l) => l.nameEn === "Presidential Suite")!;

  const project1 = await prisma.project.create({
    data: {
      nameEn: "Grand Ballroom Curtain Refurbishment",
      nameAr: "تجديد ستائر قاعة البالروم الكبرى",
      status: "IN_PRODUCTION",
      hotelId: fourSeasons.id,
      startDate: new Date("2026-04-20"),
      deliveryDate: new Date("2026-06-15"),
      notes: "Full curtain replacement — velvet main layer + blackout lining.",
    },
  });

  const project2 = await prisma.project.create({
    data: {
      nameEn: "Executive Suites Upholstery Package",
      nameAr: "حزمة تنجيد الأجنحة التنفيذية",
      status: "CONFIRMED",
      hotelId: fourSeasons.id,
      startDate: new Date("2026-05-15"),
      deliveryDate: new Date("2026-07-30"),
      notes: "Sofa and chair reupholstery across 12 executive suites, floors 28–30.",
    },
  });

  await prisma.project.create({
    data: {
      nameEn: "Presidential Suite Linen Upgrade",
      nameAr: "ترقية مفروشات الجناح الرئاسي",
      status: "DRAFT",
      hotelId: movenpick.id,
      startDate: new Date("2026-06-01"),
      deliveryDate: new Date("2026-07-15"),
      items: {
        create: [
          {
            fabricId: linenBlend.id,
            itemTypeEn: "Bed Sheets & Duvet Covers",
            itemTypeAr: "ملاءات السرير وأغطية اللحاف",
            locationId: mpPresidential.id,
            quantityNeeded: 40,
            unit: "METERS",
            source: "INVENTORY",
          },
          {
            fabricId: sheerVoile.id,
            itemTypeEn: "Sheer Curtains",
            itemTypeAr: "ستائر شفافة",
            locationId: mpPresidential.id,
            quantityNeeded: 30,
            unit: "METERS",
            source: "DIRECT",
            notes: "Sourced directly from Turkish supplier, not from stock.",
          },
        ],
      },
    },
  });

  // Project 1 items + usage records (IN_PRODUCTION — stock already consumed)
  const item1 = await prisma.projectItem.create({
    data: {
      projectId: project1.id,
      fabricId: luxuryVelvet.id,
      itemTypeEn: "Main Curtains",
      itemTypeAr: "الستائر الرئيسية",
      locationId: fsBallroom.id,
      quantityNeeded: 150,
      unit: "METERS",
      source: "INVENTORY",
      notes: "Burgundy colourway, Egyptian velvet from PO-2026-001",
    },
  });

  const item2 = await prisma.projectItem.create({
    data: {
      projectId: project1.id,
      fabricId: blackoutFabric.id,
      itemTypeEn: "Blackout Lining",
      itemTypeAr: "بطانة البلاك أوت",
      locationId: fsBallroom.id,
      quantityNeeded: 2,
      unit: "ROLLS",
      source: "INVENTORY",
    },
  });

  // Project 2 items (CONFIRMED — not yet consumed)
  await prisma.projectItem.create({
    data: {
      projectId: project2.id,
      fabricId: luxuryVelvet.id,
      itemTypeEn: "Sofa Upholstery",
      itemTypeAr: "تنجيد الأرائك",
      locationId: fsExecSuites.id,
      quantityNeeded: 85,
      unit: "METERS",
      source: "INVENTORY",
      notes: "12 suites × ~7m per sofa set",
    },
  });

  await prisma.projectItem.create({
    data: {
      projectId: project2.id,
      fabricId: damask.id,
      itemTypeEn: "Decorative Cushion Covers",
      itemTypeAr: "أغطية الوسائد الزخرفية",
      locationId: fsExecSuites.id,
      quantityNeeded: 60,
      unit: "METERS",
      source: "INVENTORY",
    },
  });

  // Usage records for project1 items (stock has already been consumed)
  await prisma.projectItemUsage.create({
    data: { projectItemId: item1.id, inventoryBatchId: batch1.id, quantityUsed: 150 },
  });
  await prisma.projectItemUsage.create({
    data: { projectItemId: item2.id, inventoryBatchId: batch3.id, quantityUsed: 2 },
  });

  console.log("\nSeed complete:");
  console.log("  3 hotels  (Four Seasons, Mövenpick, Kempinski)");
  console.log("  3 vendors (Egyptian Textile Mills, Tessitura Italiana, Anatolia Fabrics)");
  console.log("  5 fabrics (Velvet, Voile, Damask, Linen-Cotton, Blackout)");
  console.log("  3 purchase orders (2 received, 1 pending)");
  console.log("  5 inventory batches");
  console.log("  3 projects (IN_PRODUCTION, CONFIRMED, DRAFT)");
  console.log("  6 project items + 2 usage records");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

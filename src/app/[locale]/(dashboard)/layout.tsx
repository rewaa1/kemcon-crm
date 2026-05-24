import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandMenu } from "@/components/layout/command-menu";
import { prisma } from "@/lib/prisma";

async function getSidebarBadges() {
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [pendingPOs, lowStockCount] = await Promise.all([
    prisma.purchaseOrder.count({ where: { status: "PENDING" } }),
    prisma.fabric
      .findMany({
        select: { inventoryBatches: { select: { quantityIn: true, quantityLeft: true } } },
      })
      .then(
        (fabrics) =>
          fabrics.filter((f) => {
            const totalIn = f.inventoryBatches.reduce((s, b) => s + Number(b.quantityIn), 0);
            const totalLeft = f.inventoryBatches.reduce((s, b) => s + Number(b.quantityLeft), 0);
            return totalIn > 0 && totalLeft <= totalIn * 0.2;
          }).length
      ),
  ]);

  return { pendingPOs, lowStockCount };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const badges = await getSidebarBadges();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar badges={badges} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header badges={badges} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <CommandMenu />
    </div>
  );
}

import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { format } from "date-fns";
import { DashboardRepository } from "@/infrastructure/repositories/dashboard.repository";
import { getDashboardStats } from "@/application/dashboard/get-dashboard-stats";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FolderKanban,
  FileEdit,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Package,
} from "lucide-react";
import type { PurchaseOrderStatus } from "@/domain/purchase-order";

const dashboardRepo = new DashboardRepository();

const PO_STATUS_VARIANT: Record<
  PurchaseOrderStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "secondary",
  RECEIVED: "default",
  PARTIAL: "outline",
  CANCELLED: "destructive",
};

export default async function DashboardPage() {
  const [stats, t, tpo] = await Promise.all([
    getDashboardStats(dashboardRepo),
    getTranslations("dashboard"),
    getTranslations("purchaseOrders"),
  ]);
  const locale = await getLocale();

  const { projectCounts, lowStockFabrics, recentPOs } = stats;
  const activeCount = projectCounts.confirmed + projectCounts.inProduction;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("activeProjects")}</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("activeProjectsDesc")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("draftProjects")}</CardTitle>
            <FileEdit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projectCounts.draft}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("draftProjectsDesc")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("deliveredProjects")}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projectCounts.delivered}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("deliveredProjectsDesc")}</p>
          </CardContent>
        </Card>

        <Card className={lowStockFabrics.length > 0 ? "border-destructive/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("lowStockAlerts")}</CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${
                lowStockFabrics.length > 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                lowStockFabrics.length > 0 ? "text-destructive" : ""
              }`}
            >
              {lowStockFabrics.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("lowStockAlertsDesc")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom two-column section */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Recent Purchase Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                {t("recentOrders")}
              </CardTitle>
              <CardDescription>{t("recentOrdersDesc")}</CardDescription>
            </div>
            <Link
              href={`/${locale}/purchase-orders`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("viewAll")} →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentPOs.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-6">{t("noRecentOrders")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tpo("poNumber")}</TableHead>
                    <TableHead>{tpo("vendor")}</TableHead>
                    <TableHead>{tpo("orderedAt")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPOs.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell>
                        <Link
                          href={`/${locale}/purchase-orders/${po.id}`}
                          className="font-mono text-sm font-medium hover:underline"
                        >
                          {po.poNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {po.vendorNameEn}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(po.orderedAt), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={PO_STATUS_VARIANT[po.status as PurchaseOrderStatus]}>
                          {tpo(`status.${po.status as PurchaseOrderStatus}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Fabrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t("lowStock")}
              </CardTitle>
              <CardDescription>{t("lowStockDesc")}</CardDescription>
            </div>
            <Link
              href={`/${locale}/inventory`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("viewInventory")} →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {lowStockFabrics.length === 0 ? (
              <div className="px-6 pb-6">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {t("allStocked")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t("allStockedDesc")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("fabric")}</TableHead>
                    <TableHead className="text-right">{t("stockLeft")}</TableHead>
                    <TableHead className="text-right">{t("stockIn")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockFabrics.map((f) => (
                    <TableRow key={f.fabricId}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{f.nameEn}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {f.codeRef}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive">
                        {f.totalQuantityLeft}
                        {f.unit === "METERS" ? " m" : " rolls"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {f.totalQuantityIn}
                        {f.unit === "METERS" ? " m" : " rolls"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

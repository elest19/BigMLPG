import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Card,
  Group,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { formatDateISO, formatDateLocale } from "../utils/dates";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api, formatCurrency } from "../api/client";
import { useToast } from "../context/ToastContext";
import { formatProductMixLabel } from "../utils/productMix.js";
import DownloadSalesReportModal from "./DownloadSalesReportModal";

const BRAND_PALETTE = [
  "bg-red-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-slate-500",
];

function GrossIncomeIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m9-8a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function NetIncomeIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 17l6-6 4 4 8-8M14 7h7v7"
      />
    </svg>
  );
}

function ExpensesIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 14l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CreditBalanceIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 10h18M7 15h1m4 0h1m4 0h1M7 6h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 012-2z"
      />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function MetricCard({ label, value, icon, tone = "text-slate-500", formula }) {
  return (
    <Card padding="lg" radius="md" shadow="sm" className="bg-gradient-to-br from-blue-900 to-red-900">
      <Group justify="space-between" align="flex-start" mb="xs">
        <Text size="xs" tt="uppercase" fw={700} className="text-slate-100">
          {label}
        </Text>
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 ${tone}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </Group>
      <Text size="xl" fw={800} className={tone}>
        {value}
      </Text>
      {formula ? (
        <Text size="xs" mt={2} className="leading-relaxed text-slate-400">
          {formula}
        </Text>
      ) : null}
    </Card>
  );
}

function SegmentBlock({ title, items, valueKey = "revenue" }) {
  if (!items?.length) {
    return (
      <Card padding="md" radius="md" >
        <Text fw={700} mb="sm">
          {title}
        </Text>
        <Text size="sm" c="dimmed">
          No data for selected period.
        </Text>
      </Card>
    );
  }

  return (
    <Card padding="md" radius="md" className="bg-gradient-to-br from-blue-900 to-red-900">
      <Text fw={700} mb="md" className="text-white">
        {title}
      </Text>
      <Stack gap="sm">
        {items.map((item) => (
          <div key={item.label}>
            <Group justify="space-between" mb={4}>
              <Text size="sm" fw={600} className="text-slate-300">
                {item.label}
              </Text>
              <Text size="sm" fw={700} className="text-red-500">
                {formatCurrency(item[valueKey])}
              </Text>
            </Group>
            <Progress
              value={item.percentage}
              size="sm"
              radius="xl"
              aria-label={`${item.label} share`}
            />
            <Text size="xs" mt={2} className="text-slate-400">
              {item.percentage}%
            </Text>
          </div>
        ))}
      </Stack>
    </Card>
  );
}

export default function SalesReportSection({ refreshKey = 0 }) {
  const { showToast } = useToast();
  const [quickFilter, setQuickFilter] = useState("today");
  const [dateRange, setDateRange] = useState([null, null]);
  const [report, setReport] = useState(null);
  const [dailyMetrics, setDailyMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = { quickFilter };
      if (quickFilter === "custom" && dateRange[0] && dateRange[1]) {
        params.startDate = formatDateISO(dateRange[0]);
        params.endDate = formatDateISO(dateRange[1]);
      }
      const [reportRes, metricsRes] = await Promise.all([
        api.getSalesReport(params),
        api.getDailyMetrics(params),
      ]);
      const normalizedReport = reportRes?.data?.data ?? reportRes?.data ?? reportRes;
      const normalizedMetrics = metricsRes?.data?.data ?? metricsRes?.data ?? metricsRes;
      setReport(normalizedReport);
      setDailyMetrics(normalizedMetrics);
    } catch (err) {
      showToast("Report Failed", err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [quickFilter, dateRange, showToast]);

  useEffect(() => {
    loadReport();
  }, [loadReport, refreshKey]);

  const summary = report?.summary || report?.data?.summary || report || {};
  const brandMetrics = report?.brandMetrics || report?.data?.brandMetrics || [];

  return (
    <section
      className="bg-gradient-to-b from-blue-900 to-red-900 p-6 rounded-xl shadow-sm space-y-6"
      aria-label="Sales Report"
    >
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Title order={3} className="text-white">Sales Report</Title>
          <Text size="sm" mt={4} className="text-slate-400">
            Sales Overview — filter to refresh all widgets
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          label="Quick Filters"
          className="text-slate-100"
          value={quickFilter}
          onChange={(v) => setQuickFilter(v || "today")}
          data={[
            { value: "today", label: "Today" },
            { value: "week", label: "This Week" },
            { value: "month", label: "This Month" },
            { value: "first_half", label: "First Half (Jan–Jun)" },
            { value: "second_half", label: "Second Half (Jul–Dec)" },
            { value: "year", label: "This Year" },
            { value: "custom", label: "Custom Date Range" },
          ]}
        />
        {quickFilter === "custom" && (
          <DatePickerInput
            type="range"
            label="Custom Date Range"
            placeholder="Pick dates"
            value={dateRange}
            onChange={setDateRange}
            className="md:col-span-2"
          />
        )}
      </div>

      {loading && !report ? (
        <Text c="dimmed" ta="center" py="xl">
          Loading sales report...
        </Text>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" className="mb-4">
            <MetricCard
              label="Total Sales Revenue"
              value={formatCurrency(summary?.totalSalesRevenue ?? summary?.grossIncome)}
              icon={<GrossIncomeIcon />}
              tone="text-emerald-600"
              formula={summary?.totalSalesRevenueFormula ?? summary?.grossIncomeFormula}
            />
            <MetricCard
              label="Total Net Income"
              value={formatCurrency(summary?.netIncomeQualified)}
              icon={<NetIncomeIcon />}
              tone="text-cyan-600"
              formula={summary?.netIncomeQualifiedFormula}
            />
            <MetricCard
              label="Fully Paid Net Income"
              value={formatCurrency(summary?.netIncomeFullyPaid)}
              icon={<NetIncomeIcon />}
              tone="text-yellow-600"
              formula={summary?.netIncomeFullyPaidFormula}
            />
            <MetricCard
              label="Expected Credit Net Income"
              value={formatCurrency(summary?.expectedNetIncome ?? summary?.netIncome)}
              icon={<NetIncomeIcon />}
              tone="text-violet-600"
              formula={summary?.expectedNetIncomeFormula ?? summary?.netIncomeFormula}
            />
            <MetricCard
              label="Remaining Credit Balance"
              value={formatCurrency(summary?.totalCreditBalance)}
              icon={<CreditBalanceIcon />}
              tone="text-slate-400"
              formula={summary?.totalCreditBalanceFormula}
            />
            <MetricCard
              label="Total Expenses"
              value={formatCurrency(summary?.totalExpenses)}
              icon={<ExpensesIcon />}
              tone="text-red-600"
            />
            <MetricCard
              label="Total Orders"
              value={summary?.totalOrders ?? 0}
              icon={<OrdersIcon />}
              tone="text-slate-200"
            />
          </SimpleGrid>
          <div className="border-b border-slate-100 pb-3 space-y-3"></div>
          <div>
            <Title order={4} mb="md" className="text-white">
              LPG Business Metrics
            </Title>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Stack gap="md">
                <Card padding="md" radius="md" className="bg-gradient-to-br from-blue-900 to-red-900">
                  <Text fw={700} mb="md" className="text-slate-100">
                    Product & Inventory Mix
                  </Text>
                  <Stack gap="sm">
                    {(report?.productMix || []).map((item) => {
                      const mixLabel = formatProductMixLabel(item);

                      return (
                      <div key={`${item.brand || 'unknown'}-${item.weightClass ?? item.weight_class}`}>
                        <Group justify="space-between" mb={4}>
                          <Group gap="xs">
                            <Text size="sm" fw={600} className="text-slate-300">
                              {mixLabel}
                            </Text>
                          </Group>
                          <Text size="sm" fw={700} className="text-red-500">
                            {formatCurrency(item.revenue)}
                          </Text>
                        </Group>
                        <Progress
                          value={item.percentage}
                          size="sm"
                          radius="xl"
                          color="red"
                        />
                        <div className="text-xs text-slate-400 mt-2">
                          {item.percentage}% of total units&nbsp;
                          <Badge size="sm" variant="light" className="lowercase">
                            {item.unitsSold} units
                          </Badge>
                        </div>
                      </div>
                      );
                    })}
                  </Stack>
                </Card>
              </Stack>

              <Stack gap="md">
                <SegmentBlock
                  title="Customer Type"
                  items={report?.customerType}
                />
                <SegmentBlock
                  title="Payment Method"
                  items={report?.paymentMethod}
                />
              </Stack>
            </div>
          </div>
          <div className="border-b border-slate-100 pb-3 space-y-3"></div>
          <div>
            <Title order={4} mb="md" className="text-white">
              Brand Sales Metric Volume Distribution
            </Title>
            <Card padding="md" radius="md" className="bg-gradient-to-br from-blue-900 to-red-900">
              {brandMetrics.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No sales data for the selected period.
                </Text>
              ) : (
                <div className="space-y-4">
                  {brandMetrics.map((item, index) => (
                    <div key={item.brand} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-100">
                          {item.brand}
                        </span>
                        <span className="text-slate-200">
                          {item.total_items_sold} items ·{" "}
                          <span className="font-bold text-slate-300">
                            {item.percentage}%
                          </span>
                        </span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${BRAND_PALETTE[index % BRAND_PALETTE.length]}`}
                          style={{ width: `${item.percentage}%` }}
                          role="progressbar"
                          aria-valuenow={item.percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${item.brand} sales share`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </section>
  );
}

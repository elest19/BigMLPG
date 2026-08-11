import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatCurrency } from "../api/client";
import { formatDateLocale } from "../utils/dates";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import RecordSaleModal from "../components/RecordSaleModal";
import RecordExpenseModal from "../components/RecordExpenseModal";
import SalesReportSection from "../components/SalesReportSection";
import BrandInventoryOverview from "../components/BrandInventoryOverview";
import Modal from "../components/Modal";
import { subscribeRealtime } from "../utils/realtime";
import { getSalesEntrySummary } from "../utils/salesTable";
import useIsMobile from "../hooks/useIsMobile";
import ResponsiveDetailModal from "../components/ResponsiveDetailModal";

export default function DashboardPage() {
  const { showToast } = useToast();
  const { isAdministrator } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseDeleteTarget, setExpenseDeleteTarget] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(false);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [expenseDateFilter, setExpenseDateFilter] = useState("today");
  const [expenseStartDate, setExpenseStartDate] = useState("");
  const [expenseEndDate, setExpenseEndDate] = useState("");
  const [reportRefreshKey, setReportRefreshKey] = useState(0);
  const [isLowStockExpanded, setIsLowStockExpanded] = useState(true);
  const isMobile = useIsMobile();
  const [mobileDetail, setMobileDetail] = useState(null);

  const loadData = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const expenseParams = {
          limit: "100",
          quickFilter: expenseDateFilter,
        };

        if (expenseDateFilter === "custom") {
          if (expenseStartDate) expenseParams.startDate = expenseStartDate;
          if (expenseEndDate) expenseParams.endDate = expenseEndDate;
        }

        const [metricsRes, salesRes, expensesRes] = await Promise.all([
          api.getMetrics(),
          api.getSales({ todayOnly: "true", page: String(page), limit: "10" }),
          api.getExpenses(expenseParams),
        ]);
        setMetrics(metricsRes.data);
        setRecentSales(salesRes.data);
        setPagination(salesRes.pagination || { page: 1, totalPages: 1 });
        setDailyExpenses(expensesRes.data || []);
      } catch (err) {
        showToast("Load Failed", err.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [expenseDateFilter, expenseEndDate, expenseStartDate, showToast],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const currentPage = pagination?.page || 1;
    const unsubscribeInventory = subscribeRealtime("inventory:changed", () => {
      loadData(currentPage);
      setReportRefreshKey((k) => k + 1);
    });
    const unsubscribeSales = subscribeRealtime("sales:changed", () => {
      loadData(currentPage);
      setReportRefreshKey((k) => k + 1);
    });
    const unsubscribeExpenses = subscribeRealtime("expenses:changed", () => {
      loadData(currentPage);
      setReportRefreshKey((k) => k + 1);
    });
    const unsubscribeCredits = subscribeRealtime("credits:changed", () => {
      loadData(currentPage);
      setReportRefreshKey((k) => k + 1);
    });

    return () => {
      unsubscribeInventory();
      unsubscribeSales();
      unsubscribeExpenses();
      unsubscribeCredits();
    };
  }, [loadData, pagination]);

  const handleSaleSuccess = () => {
    loadData(pagination?.page || 1);
    setReportRefreshKey((k) => k + 1);
  };

  const handleExpenseSuccess = () => {
    loadData(pagination?.page || 1);
    setReportRefreshKey((k) => k + 1);
  };

  const openEditExpense = (item) => {
    setEditingExpense(item);
    setExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const openExpenseDetails = (item) => {
    setMobileDetail({
      title: "Expense Details",
      details: [
        { label: "Expense", value: item.expenses },
        { label: "Amount", value: formatCurrency(item.amount) },
        { label: "Date", value: formatDateLocale(item.date) },
      ],
      footer: isAdministrator ? (
        <>
          <button
            type="button"
            onClick={() => {
              setMobileDetail(null);
              openEditExpense(item);
            }}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileDetail(null);
              setExpenseDeleteTarget(item);
            }}
            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
          >
            Delete
          </button>
        </>
      ) : null,
    });
  };

  const openSaleDetails = (sale) => {
    const entrySummary = getSalesEntrySummary(sale);
    const isPayment = sale.entry_type === "payment";
    setMobileDetail({
      title: "Sale Details",
      details: [
        { label: "Customer", value: sale.customer_name },
        { label: "Product", value: `${sale.brand} - ${sale.weight_class}kg - ${sale.product_status}` },
        { label: "Type", value: entrySummary.typeLabel },
        { label: "Traded", value: sale.lpg_tank_variant || "-" },
        { label: "Quantity", value: isPayment ? "—" : sale.sale_quantity },
        { label: "Unit Price", value: isPayment ? "—" : formatCurrency(sale.unit_price) },
        { label: "Total Billing", value: isPayment ? formatCurrency(sale.balance_paid || 0) : formatCurrency(sale.total_amount) },
        { label: "Balance Paid", value: entrySummary.balancePaidLabel },
        { label: "Date", value: formatDateLocale(sale.log_date || sale.date_created || sale.date_paid) },
      ],
      footer: (
        <button
          type="button"
          onClick={() => setMobileDetail(null)}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-xs font-bold text-white"
        >
          Close
        </button>
      ),
    });
  };

  const confirmDeleteExpense = async () => {
    if (!expenseDeleteTarget) return;
    try {
      setDeletingExpense(true);
      await api.deleteExpense(expenseDeleteTarget.expenses_id);
      showToast("Expense Deleted", "The expense has been removed.");
      setExpenseDeleteTarget(null);
      loadData(pagination.page);
      setReportRefreshKey((k) => k + 1);
    } catch (err) {
      showToast("Delete Failed", err.message, "error");
    } finally {
      setDeletingExpense(false);
    }
  };

  if (loading && !metrics) return <LoadingSpinner />;

  const lowStock = metrics?.lowStockProducts || [];
  const outOfStockCount = lowStock.filter(
    (item) => item.health_indicator === "Out of Stock",
  ).length;
  const lowStockCount = lowStock.filter(
    (item) => item.health_indicator === "Low Stock",
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <article className="bg-white border border-slate-300 p-5 rounded-xl shadow-md">
          <p className="text-xs font-bold text-black uppercase tracking-wider">
            Total Items Sold
          </p>
          <p className="text-2xl font-bold text-slate-600 mt-1">
            {metrics?.totalItemsSold || 0} Items
          </p>
        </article>
        <article className="bg-white border border-slate-300 p-5 rounded-xl shadow-md">
          <p className="text-xs font-bold text-black uppercase tracking-wider">
            Total Filled Stock
          </p>
          <p className="text-2xl font-bold text-slate-600 mt-1">
            {metrics?.totalFilledStock || 0} Tanks
          </p>
        </article>
        <article className="bg-white border border-slate-300 p-5 rounded-xl shadow-md">
          <p className="text-xs font-bold text-black uppercase tracking-wider">
            Total Empty Stock
          </p>
          <p className="text-2xl font-bold text-slate-600 mt-1">
            {metrics?.totalEmptyStock || 0} Cylinders
          </p>
        </article>
      </div>

      <BrandInventoryOverview refreshKey={reportRefreshKey} />

      <div
        className="bg-red-100 border border-red-500 rounded-2xl p-5 shadow-sm"
        role="alert"
      >
          <div>
            <div className="flex w-full items-center justify-between gap-2">
              <h1 className="text-md font-black uppercase tracking-wider text-black">
                Low Stock Reminder
              </h1>

              <button
                type="button"
                onClick={() => setIsLowStockExpanded((value) => !value)}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                aria-expanded={isLowStockExpanded}
                aria-label={
                  isLowStockExpanded
                    ? "Collapse low stock reminder"
                    : "Expand low stock reminder"
                }
              >
                <span>{isLowStockExpanded ? "Collapse" : "Expand"}</span>
                <span
                  className={`transition-transform duration-300 ${
                    isLowStockExpanded ? "rotate-180" : ""
                  }`}
                >
                  ↓
                </span>
              </button>
            </div>
            {!isLowStockExpanded && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                  Out of Stock: {outOfStockCount}
                </span>

                <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                  Low Stock: {lowStockCount}
                </span>
              </div>
            )}
          </div>
          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${isLowStockExpanded ? "max-h-[2400px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs font-semibold text-amber-900">
              {lowStock.map((item) => (
                item.health_indicator === "Out of Stock" ? (
                  <div
                    key={item.product_id}
                    className="bg-red-600 p-3 rounded-lg border border-slate-400 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold block text-slate-100">
                        {item.brand}
                      </span>
                      <span className="text-slate-200 text-[11px]">
                        {item.weight_class}kg -
                        {item.status === "Filled Tank" ? " Filled" : " Empty"}
                      </span>
                    </div>
                    <span
                      className="font-black tracking-wider text-white"
                    >
                      {item.health_indicator.toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <div
                    key={item.product_id}
                    className="bg-amber-500 p-3 rounded-lg border border-slate-400 shadow-sm flex items-center justify-between"
                  >
                      <div>
                      <span className="font-mono font-bold block text-slate-100">
                        {item.brand}
                      </span>
                      <span className="text-slate-200 text-[11px]">
                        {item.weight_class}kg -
                        {item.status === "Filled Tank" ? " Filled" : " Empty"}
                      </span>
                    </div>
                    <span
                       className="font-black tracking-wider text-white"
                    >
                      {`${item.health_indicator.toUpperCase()} (${item.stock_quantity})`}
                    </span>
                  </div>
                ) 
              ))}
            </div>
          </div>
        </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => setExpenseModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow transition"
        >
          Add Expenses
        </button>
        <button
          type="button"
          onClick={() => setSaleModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow transition"
        >
          Record New Sale
        </button>
      </div>

      {isAdministrator && <SalesReportSection refreshKey={reportRefreshKey} />}

      <div className="bg-white border border-slate-300 p-6 rounded-xl shadow-md space-y-4">
        <div className="pb-3 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-black">Expenses</h2>
              <p className="text-xs text-slate-400">
                Filter expenses by date range and review the activity list.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={expenseDateFilter}
                onChange={(e) => setExpenseDateFilter(e.target.value)}
                className="text-xs p-2.5 border border-slate-200 rounded-xl"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="first_half">First Half (Jan-Jun)</option>
                <option value="second_half">Second Half (Jul-Dec)</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Date Range</option>
              </select>
              {expenseDateFilter === "custom" && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={expenseStartDate}
                    placeholder="Start Date"
                    onChange={(e) => setExpenseStartDate(e.target.value)}
                    className="text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                  <input
                    type="date"
                    value={expenseEndDate}
                    placeholder="End Date"
                    onChange={(e) => setExpenseEndDate(e.target.value)}
                    className="text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {isMobile ? (
          <div className="space-y-2">
            {dailyExpenses.map((item) => (
              <button
                key={item.expenses_id}
                type="button"
                onClick={() => openExpenseDetails(item)}
                className="w-full rounded-xl bg-white border border-slate-200 p-3 text-left shadow-md hover:bg-slate-100"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-800">{item.expenses}</span>
                  <span className="font-black text-red-600">{formatCurrency(item.amount)}</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">{formatDateLocale(item.date)}</p>
              </button>
            ))}
            {dailyExpenses.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
                No expenses recorded for the selected period.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto p-2">
            <table className="w-full min-w-[520px] text-left text-xs whitespace-nowrap border border-slate-200 shadow-md">
              <thead className="bg-red-600 text-white font-bold uppercase tracking-wide">
                <tr>
                  <th className="p-3 text-center">Expense</th>
                  <th className="p-3 text-center">Amount</th>
                  <th className="p-3 text-center">Date</th>
                  {isAdministrator && (
                    <th className="p-3 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="font-medium text-slate-600">
                {dailyExpenses.map((item) => (
                  <tr
                    key={item.expenses_id}
                    className="odd:bg-white even:bg-slate-100/95 hover:bg-slate-200/80 transition-colors"
                  >
                    <td className="p-3 font-bold text-slate-800 text-center">
                      {item.expenses}
                    </td>
                    <td className="p-3 text-red-600 font-bold text-center">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="p-3 text-center">
                      {formatDateLocale(item.date)}
                    </td>
                    {isAdministrator && (
                      <td className="p-3 text-center space-x-1">
                        <button
                          type="button"
                          onClick={() => openEditExpense(item)}
                          className="text-xs font-bold text-white bg-blue-500 hover:bg-blue-700 px-2.5 py-1 rounded-lg"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpenseDeleteTarget(item)}
                          className="text-xs font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded-lg"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {dailyExpenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdministrator ? 4 : 3}
                      className="text-center py-4 text-slate-400"
                    >
                      No expenses recorded for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-300 p-6 rounded-xl shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-black">
              Recent Sales Entries
            </h2>
            <p className="text-xs text-slate-400">
              Today&apos;s sales
            </p>
          </div>
          <Link
            to="/sales-log"
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            View Full Log &rarr;
          </Link>
        </div>
        {isMobile ? (
          <div className="space-y-2">
            {recentSales.map((sale) => {
              const entrySummary = getSalesEntrySummary(sale);
              return (
                <button
                  key={`${sale.entry_type}-${sale.sale_id}-${sale.log_date}`}
                  type="button"
                  onClick={() => openSaleDetails(sale)}
                  className="w-full rounded-xl bg-white border border-slate-200 p-3 text-left shadow-md hover:bg-slate-100"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-slate-800">{sale.customer_name}</span>
                    <span className="font-black text-red-600">{entrySummary.balancePaidLabel}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {sale.brand} - {sale.weight_class}kg - {sale.product_status}
                  </p>
                </button>
              );
            })}
            {recentSales.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
                No sales recorded today.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto p-3">
            <table className="w-full min-w-[720px] text-left text-xs whitespace-nowrap border border-slate-200 shadow-md">
              <thead className="bg-blue-600 text-slate-100 font-bold uppercase tracking-wide">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-center">Traded</th>
                  <th className="p-3 text-right">Balance Paid</th>
                </tr>
              </thead>
              <tbody className="font-medium text-slate-600 bg-slate-200">
                {recentSales.map((sale) => {
                  const entrySummary = getSalesEntrySummary(sale);
                  return (
                    <tr
                      key={`${sale.entry_type}-${sale.sale_id}-${sale.log_date}`}
                      className="odd:bg-white even:bg-slate-100/95 hover:bg-slate-200/80 transition-colors"
                    >
                      <td className="p-3 font-bold text-slate-800">
                        {sale.customer_name}
                      </td>
                      <td className="p-3">
                        {sale.brand} - {sale.weight_class}kg - {sale.product_status}
                      </td>
                      <td className="p-3">{entrySummary.typeLabel}</td>
                      <td className="p-3 text-center font-semibold text-indigo-700">
                        {sale.lpg_tank_variant || "-"}
                      </td>
                      <td className="p-3 text-right text-red-600 font-bold">
                        {entrySummary.balancePaidLabel}
                      </td>
                    </tr>
                  );
                })}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-400">
                      No sales recorded today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <nav
            className="flex justify-end gap-2"
            aria-label="Recent sales pagination"
          >
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => loadData(pagination.page - 1)}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs self-center">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadData(pagination.page + 1)}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        )}
      </div>

      <RecordSaleModal
        open={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        onSuccess={handleSaleSuccess}
      />
      <RecordExpenseModal
        open={expenseModalOpen}
        onClose={closeExpenseModal}
        onSuccess={handleExpenseSuccess}
        editingExpense={editingExpense}
      />

      {mobileDetail && (
        <ResponsiveDetailModal
          title={mobileDetail.title}
          onClose={() => setMobileDetail(null)}
          details={mobileDetail.details}
          footer={mobileDetail.footer}
        />
      )}

      {isAdministrator && expenseDeleteTarget && (
        <Modal
          title="Delete Expense"
          onClose={() => setExpenseDeleteTarget(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setExpenseDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingExpense}
                onClick={confirmDeleteExpense}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold"
              >
                {deletingExpense ? "Deleting..." : "Confirm Delete"}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Permanently delete the{" "}
            <strong>{expenseDeleteTarget.expenses}</strong> expense of{" "}
            {formatCurrency(expenseDeleteTarget.amount)}?
          </p>
        </Modal>
      )}
    </div>
  );
}

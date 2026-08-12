import { useCallback, useEffect, useMemo, useState } from "react";
import { api, formatCurrency } from "../api/client";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { subscribeRealtime } from "../utils/realtime";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import ResponsiveDetailModal from "../components/ResponsiveDetailModal";
import BrandAutocomplete from "../components/BrandAutocomplete";
import BrandInventoryOverview from "../components/BrandInventoryOverview";
import useIsMobile from "../hooks/useIsMobile";

const FALLBACK_BRANDS = ["Regasco", "Seagas", "Pryce"];
const WEIGHTS = [2.7, 5, 11, 22, 50];
const STATUSES = ["Filled Tank", "Empty Cylinder"];

const emptyForm = {
  brand: "Regasco",
  weightClass: 11,
  status: "Filled Tank",
  stockQuantity: 0,
  regularRetail: "",
  wholesalePrice: "",
  initialPrice: "",
};

function healthBadgeClass(indicator) {
  if (indicator === "Out of Stock") return "bg-red-50 text-red-700";
  if (indicator === "Low Stock") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

function getArchiveEligibleProductIds(products) {
  const eligible = new Set();
  const grouped = new Map();

  products.forEach((product) => {
    const key = `${product.brand}::${product.weight_class}::${product.status}`;
    const bucket = grouped.get(key) || [];
    bucket.push(product);
    grouped.set(key, bucket);
  });

  grouped.forEach((groupProducts) => {
    const sorted = [...groupProducts].sort(
      (left, right) =>
        new Date(left.created_at || 0) - new Date(right.created_at || 0),
    );

    if (sorted.length <= 1) return;

    const firstPositiveStockIndex = sorted.findIndex(
      (product) => Number(product.stock_quantity || 0) > 0,
    );

    if (firstPositiveStockIndex === -1) {
      sorted.slice(0, sorted.length - 1).forEach((product) => {
        eligible.add(product.product_id);
      });
      return;
    }

    sorted.slice(0, firstPositiveStockIndex).forEach((product) => {
      eligible.add(product.product_id);
    });
  });

  return eligible;
}

function InventoryTable({
  products,
  onEdit,
  onDelete,
  onArchive,
  onView,
  onEditStock,
  isAdmin,
  archiveMode = false,
}) {
  const isMobile = useIsMobile();
  const archiveEligibleIds = useMemo(
    () => getArchiveEligibleProductIds(products),
    [products],
  );

  if (!products.length) {
    return (
      <p className="text-xs text-slate-400 italic py-3">
        No products match the current filters.
      </p>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-2">
        {products.map((p) => (
          <button
            key={p.product_id}
            type="button"
            onClick={() => onView?.(p)}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:bg-slate-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600">Stock</span>
              <span className="font-black text-slate-500">{p.stock_quantity}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Date Created</span>
              <span>{new Date(p.created_at).toLocaleDateString()}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Original Price</span>
              <span>{formatCurrency(p.initial_price)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Consumer Price</span>
              <span>{formatCurrency(p.regular_retail)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Retail Price</span>
              <span>{formatCurrency(p.wholesale_price)}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-3">
      <table className="w-full min-w-[900px] text-left text-xs rounded-xl border border-slate-200 shadow-md sm:text-sm whitespace-nowrap">
        <thead className="bg-blue-600 border border-slate-200 shadow-md text-slate-100 font-bold uppercase tracking-wider">
          <tr>
            <th className="p-3">Status</th>
            <th className="p-3 text-center">Stock</th>
            <th className="p-3 text-center">Health Status</th>
            {isAdmin && <th className="p-3 text-center">Original Price</th>}
            <th className="p-3 text-center">Consumer Price</th>
            <th className="p-3 text-center">Retail Price</th>
            <th className="p-3 text-center">Date Created</th>
            {isAdmin ? (
              <th className="p-3 text-center">Actions</th>
            ) : (
              <th className="p-3 text-center">Stock Action</th>
            )}
          </tr>
        </thead>
        <tbody className="font-medium text-slate-700">
          {products.map((p) => {
            const isArchiveEligible = archiveEligibleIds.has(p.product_id);
            return (
              <tr
                key={p.product_id}
                className="odd:bg-white even:bg-slate-50/95 hover:bg-slate-100/80 transition-colors"
              >
                <td className="p-3">{p.status}</td>
                <td className="p-3 text-center font-black">{p.stock_quantity}</td>
                <td className="p-3 text-center">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-black uppercase ${healthBadgeClass(p.health_indicator)}`}
                  >
                    {p.health_indicator}
                  </span>
                </td>
                {isAdmin && (
                  <td className="p-3 text-center text-slate-500">
                    {formatCurrency(p.initial_price)}
                  </td>
                )}
                <td className="p-3 text-center">
                  {formatCurrency(p.regular_retail)}
                </td>
                <td className="p-3 text-center text-red-600">
                  {formatCurrency(p.wholesale_price)}
                </td>
                <td className="p-3 text-center">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                {isAdmin ? (
                  <td className="p-3 text-center space-x-1">
                    <button
                      type="button"
                      onClick={() => onDelete?.(p)}
                      className="text-xs font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded-lg"
                    >
                      Delete
                    </button>
                    {!archiveMode && (
                      <>
                        {isArchiveEligible ? (
                          <button
                            type="button"
                            onClick={() => onArchive?.(p)}
                            className="text-xs font-bold bg-indigo-100 hover:bg-indigo-600 hover:text-white px-2.5 py-1 rounded-lg"
                          >
                            Add to Archive
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEdit(p)}
                            className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg"
                          >
                            Edit
                          </button>
                        )}
                      </>
                    )}
                  </td>
                ) : (
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => onEditStock?.(p)}
                      className="text-xs font-bold bg-blue-600 text-slate-100 hover:bg-blue-700 hover:text-white px-2.5 py-1 rounded-lg"
                    >
                      Edit Stock
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <hr />
    </div>
  );
}

export default function InventoryPage() {
  const { showToast } = useToast();
  const { isAdministrator } = useAuth();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [brandFilter, setBrandFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [stockTierFilter, setStockTierFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  const [mobileDetail, setMobileDetail] = useState(null);
    const [stockEditTarget, setStockEditTarget] = useState(null);
  const isMobile = useIsMobile();

  const archiveEligibleIds = useMemo(
    () => getArchiveEligibleProductIds(products),
    [products],
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (brandFilter) params.brand = brandFilter;
      if (conditionFilter) params.condition = conditionFilter;
      if (stockTierFilter) params.stockTier = stockTierFilter;
      if (showArchived) params.includeArchived = "true";
      const [productsRes, brandsRes] = await Promise.all([
        api.getProducts(params),
        api.getBrands(),
      ]);
      setProducts(productsRes.data);
      setBrands(Array.isArray(brandsRes.data) ? brandsRes.data : []);
    } catch (err) {
      showToast("Load Failed", err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [brandFilter, conditionFilter, stockTierFilter, showArchived, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = subscribeRealtime("inventory:changed", () => {
      loadData();
      setInventoryRefreshKey((k) => k + 1);
    });

    return unsubscribe;
  }, [loadData]);

  const visibleProducts = useMemo(() => {
    if (showArchived) return products;
    return products.filter((product) => !archiveEligibleIds.has(product.product_id));
  }, [archiveEligibleIds, products, showArchived]);

  const groupedByBrand = useMemo(() => {
    const groups = {};
    brands.forEach((b) => {
      groups[b] = {
        filled: visibleProducts.filter(
          (p) => p.brand === b && p.status === "Filled Tank",
        ),
        empty: visibleProducts.filter(
          (p) => p.brand === b && p.status === "Empty Cylinder",
        ),
      };
    });
    return groups;
  }, [brands, visibleProducts]);

  const openProductDetails = (product) => {
    const isArchiveEligible = archiveEligibleIds?.has?.(product.product_id);
    setMobileDetail({
      title: "Inventory Details",
      details: [
        { label: "Status", value: product.status },
        { label: "Brand", value: product.brand },
        { label: "Weight", value: `${product.weight_class}kg` },
        { label: "Health", value: product.health_indicator },
        { label: "Stock", value: product.stock_quantity },
        { label: "Consumer Price", value: formatCurrency(product.regular_retail) },
        { label: "Retail Price", value: formatCurrency(product.wholesale_price) },
        { label: "Original Price", value: isAdministrator ? formatCurrency(product.initial_price) : null },
        { label: "Date Created", value: new Date(product.created_at).toLocaleDateString() },
      ],
      footer: isAdministrator ? (
        <>
          <button
            type="button"
            onClick={() => {
              setMobileDetail(null);
              setDeleteTarget(product);
            }}
            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
          >
            Delete
          </button>
          {!showArchived && (
            isArchiveEligible ? (
              <button
                type="button"
                onClick={() => {
                  setMobileDetail(null);
                  setArchiveTarget(product);
                }}
                className="rounded-lg bg-indigo-100 px-3 py-2 text-xs font-bold text-indigo-700"
              >
                Add to Archive
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileDetail(null);
                  setEditProduct(product);
                }}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
              >
                Edit
              </button>
            )
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            setMobileDetail(null);
            setStockEditTarget(product);
          }}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
        >
          Edit Stock
        </button>
      ),
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createProduct({
        brand: form.brand,
        weightClass: Number(form.weightClass),
        status: form.status,
        stockQuantity: Number(form.stockQuantity),
        regularRetail: Number(form.regularRetail),
        wholesalePrice: Number(form.wholesalePrice),
        initialPrice: Number(form.initialPrice),
      });
      showToast("Record Created", "Product saved successfully.");
      setForm(emptyForm);
      setAddModalOpen(false);
      await loadData();
      setInventoryRefreshKey((k) => k + 1);
    } catch (err) {
      showToast("Save Failed", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editProduct) return;
    try {
      setSaving(true);
      await api.updateProduct(editProduct.product_id, {
        brand: editProduct.brand,
        weightClass: Number(editProduct.weight_class),
        status: editProduct.status,
        stockQuantity: Number(editProduct.stock_quantity),
        regularRetail: Number(editProduct.regular_retail),
        wholesalePrice: Number(editProduct.wholesale_price),
        initialPrice: Number(editProduct.initial_price),
      });
      showToast("Updated", "Product record updated.");
      setEditProduct(null);
      await loadData();
      setInventoryRefreshKey((k) => k + 1);
    } catch (err) {
      showToast("Update Failed", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStockUpdate = async () => {
    if (!stockEditTarget) return;

    try {
      setSaving(true);
      await api.updateProductStock(stockEditTarget.product_id, {
        stockQuantity: Number(stockEditTarget.stock_quantity),
      });
      showToast("Stock Updated", "Inventory stock has been updated.");
      setStockEditTarget(null);
      await loadData();
      setInventoryRefreshKey((k) => k + 1);
    } catch (err) {
      showToast("Stock Update Failed", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await api.deleteProduct(deleteTarget.product_id);
      showToast("Deleted", "Product permanently removed.");
      setDeleteTarget(null);
      await loadData();
      setInventoryRefreshKey((k) => k + 1);
    } catch (err) {
      showToast("Delete Failed", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      setSaving(true);
      await api.archiveProduct(archiveTarget.product_id);
      showToast("Archived", "Inventory record moved to Archived Inventory.");
      setArchiveTarget(null);
      await loadData();
      setInventoryRefreshKey((k) => k + 1);
    } catch (err) {
      showToast("Archive Failed", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const renderInventorySection = (title, sectionProducts) => {
    if (!sectionProducts.length) return null;

    const groupedByWeight = new Map();
    sectionProducts.forEach((product) => {
      const key = product.weight_class;
      const bucket = groupedByWeight.get(key) || [];
      bucket.push(product);
      groupedByWeight.set(key, bucket);
    });

    return (
      <>
        <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-4 shadow-md">
          <div className="border-b border-slate-200 pb-2">
            <h4 className="text-sm font-black text-black uppercase tracking-wide">
              {title}
            </h4>
          </div>
          <div className="space-y-4">
            {Array.from(groupedByWeight.entries())
              .sort(([left], [right]) => Number(left) - Number(right))
              .map(([weightClass, weightProducts]) => (
                <div
                  key={`${title}-${weightClass}`}
                  className="overflow-hidden"
                >
                  <h5 className="text-xs font-bold uppercase text-slate-600 tracking-wider px-3 py-2">
                    Weight - {weightClass} kg
                  </h5>
                  <div className="p-2 sm:p-3">
                    <InventoryTable
                      products={weightProducts}
                      onEdit={setEditProduct}
                      onDelete={setDeleteTarget}
                      onArchive={setArchiveTarget}
                      onView={openProductDetails}
                      onEditStock={setStockEditTarget}
                      isAdmin={isAdministrator}
                      archiveMode={showArchived}
                    />
                  </div>
                  <div className="border-b border-slate-200 pb-2"></div>
                </div>
              ))}
          </div>
        </div>
      </>
    );
  };

  if (loading && !products.length) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <BrandInventoryOverview refreshKey={inventoryRefreshKey} />

      <section className="bg-white border border-slate-300 p-5 rounded-xl shadow-md space-y-4">
        <div className="border-b border-slate-300 pb-2">
          <h2 className="text-base font-bold text-black">
            Quick Catalog Interactive Filters
          </h2>
          <p className="text-xs text-slate-400">All filters work together</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="brand-filter"
              className="block text-[11px] font-bold uppercase text-slate-600 mb-1"
            >
              Brand
            </label>
            <select
              id="brand-filter"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="condition-filter"
              className="block text-[11px] font-bold uppercase text-slate-600 mb-1"
            >
              Tank Condition
            </label>
            <select
              id="condition-filter"
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            >
              <option value="">All Conditions</option>
              <option value="filled">Filled Tanks</option>
              <option value="empty">Empty Cylinders</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="stock-filter"
              className="block text-[11px] font-bold uppercase text-slate-600 mb-1"
            >
              Live Stock Warning Tier
            </label>
            <select
              id="stock-filter"
              value={stockTierFilter}
              onChange={(e) => setStockTierFilter(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            >
              <option value="">All Stocks</option>
              <option value="out">Out of Stock</option>
              <option value="low">Low Stock (&lt;5)</option>
              <option value="good">Good Stock (&gt;5)</option>
            </select>
          </div>
        </div>
      </section>

      
      <section className="shadow-sm border border-slate-300 rounded-xl bg-white">
          <div className="flex items-center justify-between bg-white rounded-t-xl p-4 shadow-sm">
              <h2 className="text-lg font-bold text-black">
                Inventory Holdings
              </h2>
            {isAdministrator && (
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
              >
              Add Product
              </button>
            )}
          </div>
          <div className="border-b border-slate-400"></div>
        {brands.map((brand) => {
          const { filled, empty } = groupedByBrand[brand];
          if (!filled.length && !empty.length) return null;

          return (
            <div key={brand} className="space-y-4 bg-white rounded-b-xl p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 p-2">
                <h3 className="text-base font-black text-black border-l-4 border-blue-600 pl-3">
                  {brand}
                </h3>
                <div className="space-y-4h-2 w-2 rounded-full bg-blue-500" />
              </div>
              <div className="space-y-8 pt-4">
                {filled.length > 0 && renderInventorySection("Filled Tank", filled)}
                {empty.length > 0 && renderInventorySection("Empty Cylinder", empty)}
              </div>
            </div>
          );
        })}

        {products.length === 0 && (
          <p className="text-center text-slate-400 py-8">
            No inventory matches the selected filters.
          </p>
        )}
      </section>

      {isAdministrator && addModalOpen && (
        <Modal
          title="Add Product"
          onClose={() => setAddModalOpen(false)}
          size="lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-product-form"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold"
              >
                {saving ? "Saving..." : "Save Product Record"}
              </button>
            </>
          }
        >
          <form
            id="add-product-form"
            onSubmit={handleCreate}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <BrandAutocomplete
                  id="brand"
                  value={form.brand}
                  onChange={(value) => setForm({ ...form, brand: value })}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="weight"
                  className="block text-[11px] font-bold uppercase text-slate-500 mb-1"
                >
                  Weight Class
                </label>
                <select
                  id="weight"
                  value={form.weightClass}
                  onChange={(e) =>
                    setForm({ ...form, weightClass: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                >
                  {WEIGHTS.map((w) => (
                    <option key={w} value={w}>
                      {w}kg
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="status"
                  className="block text-[11px] font-bold uppercase text-slate-500 mb-1"
                >
                  Gas Status
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="stock"
                  className="block text-[11px] font-bold uppercase text-slate-500 mb-1"
                >
                  Stock Quantity
                </label>
                <input
                  id="stock"
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) =>
                    setForm({ ...form, stockQuantity: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="initial"
                  className="block text-[11px] font-bold uppercase text-slate-500 mb-1"
                >
                  Original Price
                </label>
                <input
                  id="initial"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.initialPrice}
                  onChange={(e) =>
                    setForm({ ...form, initialPrice: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  placeholder="Acquisition cost"
                />
              </div>
              <div>
                <label
                  htmlFor="retail"
                  className="block text-[11px] font-bold uppercase text-slate-500 mb-1"
                >
                  Consumer Price
                </label>
                <input
                  id="retail"
                  type="number"
                  step="0.01"
                  required
                  value={form.regularRetail}
                  onChange={(e) =>
                    setForm({ ...form, regularRetail: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label
                  htmlFor="wholesale"
                  className="block text-[11px] font-bold uppercase text-slate-500 mb-1"
                >
                  Retail Price
                </label>
                <input
                  id="wholesale"
                  type="number"
                  step="0.01"
                  required
                  value={form.wholesalePrice}
                  onChange={(e) =>
                    setForm({ ...form, wholesalePrice: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {isAdministrator && editProduct && (
        <Modal
          title={`Edit Product No. ${editProduct.product_id}`}
          onClose={() => setEditProduct(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setEditProduct(null)}
                className="px-4 py-2 rounded-xl bg-red-600 text-sm font-bold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleUpdate}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold"
              >
                Save Changes
              </button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="space-y-1 col-span-2">
              <BrandAutocomplete
                value={editProduct.brand}
                onChange={(value) =>
                  setEditProduct({ ...editProduct, brand: value })
                }
                required
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase text-slate-500">
                Weight
              </span>
              <select
                value={editProduct.weight_class}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    weight_class: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg"
              >
                {WEIGHTS.map((w) => (
                  <option key={w} value={w}>
                    {w}kg
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase text-slate-500">
                Status
              </span>
              <select
                value={editProduct.status}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, status: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase text-slate-500">
                Stock
              </span>
              <input
                type="number"
                min="0"
                value={editProduct.stock_quantity}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    stock_quantity: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase text-slate-500">
                Initial Price
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editProduct.initial_price}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    initial_price: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase text-slate-500">
                Regular Retail
              </span>
              <input
                type="number"
                step="0.01"
                value={editProduct.regular_retail}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    regular_retail: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase text-slate-500">
                Wholesale
              </span>
              <input
                type="number"
                step="0.01"
                value={editProduct.wholesale_price}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    wholesale_price: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg"
              />
            </label>
          </div>
        </Modal>
      )}

      {stockEditTarget && (
        <Modal
          title={`Edit Stock - ${stockEditTarget.brand} ${stockEditTarget.weight_class}kg`}
          onClose={() => setStockEditTarget(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setStockEditTarget(null)}
                className="px-4 py-2 rounded-xl bg-red-600 text-sm font-bold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleStockUpdate}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold"
              >
                Save Stock
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase text-slate-500">
              Stock Quantity
            </label>
            <input
              type="number"
              min="0"
              value={stockEditTarget.stock_quantity}
              onChange={(e) =>
                setStockEditTarget({
                  ...stockEditTarget,
                  stock_quantity: e.target.value,
                })
              }
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </Modal>
      )}

      {mobileDetail && (
        <ResponsiveDetailModal
          title={mobileDetail.title}
          onClose={() => setMobileDetail(null)}
          details={mobileDetail.details}
          footer={mobileDetail.footer}
        />
      )}

      {isAdministrator && deleteTarget && (
        <Modal
          title="Delete Product"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold"
              >
                Confirm Delete
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Permanently delete product{" "}
            <strong>{deleteTarget.product_id}</strong> ({deleteTarget.brand}{" "}
            {deleteTarget.weight_class}kg)? This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

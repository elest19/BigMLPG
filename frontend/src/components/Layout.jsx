import { useState } from "react";
import { ActionIcon, Accordion, Text } from "@mantine/core";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StaffProfileModal from "./StaffProfileModal";
import Modal from "./Modal";
import Logo from "../../BigMLPG.jpg";

const navClass = ({ isActive }) =>
  `px-4 py-2.5 text-sm rounded-xl transition ${
    isActive
      ? "font-bold text-blue-600 bg-blue-50"
      : "font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
  }`;

export default function Layout({ children }) {
  const { logout, admin, isAdministrator } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src={Logo}
                alt="BigMLPG Logo"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/80x80?text=BigMLPG";
                }}
                className="h-16 w-16 object-contain rounded-xl shadow-sm border border-slate-100"
              />
              <div>
                <span className="block text-lg font-black text-slate-900 tracking-tight leading-none">
                  BigMLPG
                </span>
                <span className="text-[11px] text-red-600 font-bold tracking-wider uppercase mt-1.5 block">
                  System Management
                </span>
              </div>
            </div>

            <nav
              className="hidden md:flex space-x-1"
              aria-label="Main Navigation"
            >
              <NavLink to="/dashboard" className={navClass} end>
                Dashboard & Sales
              </NavLink>
              <NavLink to="/inventory" className={navClass}>
                Inventory Catalog
              </NavLink>
              <NavLink to="/sales-log" className={navClass}>
                Customer & Sales Log
              </NavLink>
              <NavLink to="/credit-logs" className={navClass}>
                Credit Logs
              </NavLink>
              {isAdministrator && (
                <NavLink to="/admin/profile" className={navClass}>
                  Admin Profile
                </NavLink>
              )}
            </nav>

            <div className="hidden sm:flex items-center space-x-2">
              {!isAdministrator && (
                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-xl transition"
                  aria-label="Open profile"
                >
                  Profile
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-2.5 rounded-xl transition"
              >
                Logout
              </button>
            </div>

            <button
              type="button"
              className="md:hidden text-slate-600 p-2 rounded-xl"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="md:hidden">
          {mobileOpen && (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-slate-950/50"
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
            />
          )}
          <div
            className={`fixed top-0 right-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div>
                <p className="text-sm font-black text-slate-900">BigMLPG</p>
                <p className="text-xs text-slate-500">Navigate the portal</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 space-y-2 px-4 py-4" aria-label="Mobile Navigation">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 font-bold text-blue-600"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
                onClick={() => setMobileOpen(false)}
              >
                Dashboard & Sales
              </NavLink>

              <NavLink
                to="/inventory"
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 font-bold text-blue-600"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
                onClick={() => setMobileOpen(false)}
              >
                Inventory Catalog
              </NavLink>

              <NavLink
                to="/sales-log"
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 font-bold text-blue-600"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
                onClick={() => setMobileOpen(false)}
              >
                Customer & Sales Log
              </NavLink>

              <NavLink
                to="/credit-logs"
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 font-bold text-blue-600"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
                onClick={() => setMobileOpen(false)}
              >
                Credit Logs
              </NavLink>

              {isAdministrator && (
                <NavLink
                  to="/admin/profile"
                  className={({ isActive }) =>
                    `block rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-blue-50 font-bold text-blue-600"
                        : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  Admin Profile
                </NavLink>
              )}

              {!isAdministrator && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(true);
                    setMobileOpen(false);
                  }}
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-100"
                >
                  Profile
                </button>
              )}
            </nav>
            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg bg-red-700 px-3 py-2.5 text-xs font-bold text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto text-center text-xs text-slate-400 font-medium">
        <p>
          &copy; {new Date().getFullYear()} BigMLPG System. All rights reserved.
        </p>
      </footer>

      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        <ActionIcon
          variant="filled"
          color="blue"
          size="lg"
          radius="xl"
          aria-label="Open help manual"
          onClick={() => setHelpOpen(true)}
          className="shadow-lg hover:shadow-xl"
        >
          <span className="text-xl font-black leading-none">?</span>
        </ActionIcon>
      </div>

      {profileOpen && !isAdministrator && (
        <StaffProfileModal onClose={() => setProfileOpen(false)} />
      )}

      {helpOpen && (
        <Modal title="User Manual" onClose={() => setHelpOpen(false)} size="xl">
          <div className="space-y-5">
            <Text size="sm" c="dimmed">
              Use this guide to understand day-to-day operations, reports, inventory behavior, and role-based access.
            </Text>

            <Accordion multiple defaultValue={['sales', 'inventory']}>
              <Accordion.Item value="sales">
                <Accordion.Control>1. Managing Sales, Expenses, and Credit Payments</Accordion.Control>
                <Accordion.Panel>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                    <li>Record a new sale from the dashboard or sales workflow.</li>
                    <li>Edit an existing sale from the Customer &amp; Sales Log when details need to be updated.</li>
                    <li>Delete a sale from the admin profile when removal is authorized.</li>
                    <li>Add an expense from the dashboard to track operating costs.</li>
                    <li>Edit or delete an expense from the expenses section when needed.</li>
                    <li>Use Manage Credit to record a credit payment and keep balances current.</li>
                  </ul>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="inventory">
                <Accordion.Control>2. Inventory Holdings Logic</Accordion.Control>
                <Accordion.Panel>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                    <li>Each sale reduces the matching stock for the sold product.</li>
                    <li>Filled tank stock decreases after a sale, while the customer LPG tank increases the equivalent Empty Cylinder stock.</li>
                    <li>When multiple product entries share the same brand and weight, inventory is matched to the oldest available stock first.</li>
                    <li>Older entries with zero remaining stock may be archived or hidden from active inventory views.</li>
                    <li>The system selects the oldest available stock to keep inventory movement consistent and predictable.</li>
                  </ul>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="reports">
                <Accordion.Control>3. Download Reports</Accordion.Control>
                <Accordion.Panel>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                    <li>Download Sales Log PDF to export the customer and sales table for the selected period.</li>
                    <li>Download Credit Log PDF to export outstanding and paid credit activity.</li>
                    <li>Available filters include Daily, Weekly, Monthly, First Half, Second Half, Yearly, and Custom Date Range.</li>
                  </ul>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="filters">
                <Accordion.Control>4. Table Filters</Accordion.Control>
                <Accordion.Panel>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                    <li>Customer &amp; Sales Log supports customer, product, brand, weight, and date filters.</li>
                    <li>Credit Logs supports similar filtering for customer activity and payment history.</li>
                    <li>The search field helps locate records quickly by matching common values.</li>
                    <li>Filters can be combined to narrow the displayed records to the exact period or segment you need.</li>
                  </ul>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="roles">
                <Accordion.Control>5. User Roles</Accordion.Control>
                <Accordion.Panel>
                  <div className="space-y-3 text-sm text-slate-700">
                    <div>
                      <p className="font-semibold text-slate-900">Admin</p>
                      <ul className="list-disc space-y-1 pl-5 mt-1">
                        <li>Full system access and administrative control.</li>
                        <li>Manage products, staff accounts, and reports.</li>
                        <li>Delete records, delete all sales, and review action history.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Staff</p>
                      <ul className="list-disc space-y-1 pl-5 mt-1">
                        <li>Record sales and manage customer transactions.</li>
                        <li>Manage credit payments and add expenses.</li>
                        <li>View inventory with limited access to administrative functions.</li>
                      </ul>
                    </div>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="features">
                <Accordion.Control>6. Special Features</Accordion.Control>
                <Accordion.Panel>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                    <li>Login rate limiting and account protection help reduce unauthorized access.</li>
                    <li>The Delete All Sales feature is available for administrators when a full reset is required.</li>
                    <li>Real-time updates keep sales, expenses, inventory, and credit changes synchronized across the app.</li>
                    <li>Inventory Brand Overview and Low Stock Reminder help monitor stock conditions quickly.</li>
                    <li>Sales Report metrics and credit payment tracking provide a clear view of business performance.</li>
                  </ul>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { EndlessKnot } from "./TibetanMotif";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true },
  { to: "/patients", label: "Patients", icon: "🧑‍⚕️", permKey: "my_patients" },
  { to: "/appointments", label: "Appointments", icon: "📅", permKey: "my_appointments" },
  { to: "/finance", label: "Finance", icon: "💰", soon: true, permKey: "finance" },
];

const managerLinks = [
  { to: "/managers/procedures", label: "Procedures", permKey: "procedure" },
  { to: "/managers/drug-list", label: "Drug List", permKey: "drug_lists" },
  { to: "/managers/expense-categories", label: "Expense Categories", permKey: "expense" },
];

const settingsLinks = [
  { to: "/settings/staff", label: "Staff", permKey: "users_list" },
  { to: "/settings/roles", label: "Role Manager", permKey: "role_manager" },
];

// Nav items/links with no permKey (e.g. Dashboard) are always shown.
// Everything else is hidden once the resolved permission for its key is
// "none" -- see app/services/role_service.py:resolve_permissions on the
// backend, which is what fills user.permissions.
function isVisible(item, permissions) {
  if (!item.permKey) return true;
  if (!permissions) return true; // still loading -- don't flash-hide items
  return permissions[item.permKey] !== "none";
}

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const permissions = user?.permissions;

  const visibleNavItems = navItems.filter((item) => isVisible(item, permissions));
  const visibleManagerLinks = managerLinks.filter((link) => isVisible(link, permissions));
  const visibleSettingsLinks = settingsLinks.filter((link) => isVisible(link, permissions));

  const isManagersRoute = location.pathname.startsWith("/managers");
  const [managersOpen, setManagersOpen] = useState(isManagersRoute);
  const isSettingsRoute = location.pathname.startsWith("/settings");
  const [settingsOpen, setSettingsOpen] = useState(isSettingsRoute);

  return (
    <aside className="w-64 shrink-0 bg-maroon-800 text-parchment-100 flex flex-col">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-maroon-700">
        <EndlessKnot className="w-8 h-8 text-saffron-300" />
        <div>
          <p className="font-semibold text-parchment-50 leading-tight">Norbu Clinic</p>
          <p className="font-tibetan text-xs text-saffron-200">བོད་སྨན་ཁང་།</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-saffron-500 text-maroon-900 font-medium"
                  : "text-parchment-200 hover:bg-maroon-700"
              }`
            }
          >
            <span aria-hidden>{item.icon}</span>
            <span>{item.label}</span>
            {item.soon && (
              <span className="ml-auto text-[10px] uppercase tracking-wide bg-maroon-700 text-saffron-200 px-1.5 py-0.5 rounded">
                soon
              </span>
            )}
          </NavLink>
        ))}

        {visibleManagerLinks.length > 0 && (
          <div>
            <button
              onClick={() => setManagersOpen((v) => !v)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isManagersRoute
                  ? "bg-saffron-500 text-maroon-900 font-medium"
                  : "text-parchment-200 hover:bg-maroon-700"
              }`}
            >
              <span aria-hidden>🗂️</span>
              <span>Managers</span>
              <span
                className={`ml-auto transition-transform ${managersOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                ▾
              </span>
            </button>

            {managersOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-maroon-700 space-y-1">
                {visibleManagerLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-saffron-500 text-maroon-900 font-medium"
                          : "text-parchment-200 hover:bg-maroon-700"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}

        {visibleSettingsLinks.length > 0 && (
          <div>
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isSettingsRoute
                  ? "bg-saffron-500 text-maroon-900 font-medium"
                  : "text-parchment-200 hover:bg-maroon-700"
              }`}
            >
              <span aria-hidden>⚙️</span>
              <span>Settings</span>
              <span
                className={`ml-auto transition-transform ${settingsOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                ▾
              </span>
            </button>

            {settingsOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-maroon-700 space-y-1">
                {visibleSettingsLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-saffron-500 text-maroon-900 font-medium"
                          : "text-parchment-200 hover:bg-maroon-700"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="px-5 py-4 text-xs text-maroon-300 border-t border-maroon-700 font-tibetan">
        བཀྲ་ཤིས་བདེ་ལེགས། · Tashi Delek
      </div>
    </aside>
  );
}

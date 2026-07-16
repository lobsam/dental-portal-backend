import { NavLink } from "react-router-dom";
import { EndlessKnot } from "./TibetanMotif";

const navItems = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true },
  { to: "/patients", label: "Patients", icon: "🧑‍⚕️" },
  { to: "/appointments", label: "Appointments", icon: "📅" },
  { to: "/treatment-plans", label: "Treatment Plans", icon: "🦷", soon: true },
  { to: "/finance", label: "Finance", icon: "💰", soon: true },
  { to: "/settings", label: "Settings", icon: "⚙️", soon: true },
];

export default function Sidebar() {
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
        {navItems.map((item) => (
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
      </nav>

      <div className="px-5 py-4 text-xs text-maroon-300 border-t border-maroon-700 font-tibetan">
        བཀྲ་ཤིས་བདེ་ལེགས། · Tashi Delek
      </div>
    </aside>
  );
}

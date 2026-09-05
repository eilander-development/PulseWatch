import React from "react";
import {
  Activity,
  Gauge,
  AlertOctagon,
  Wrench
} from "lucide-react";

interface NavigationTabsProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  exceptionCount: number;
  slowQueryCount: number;
  slowRequestCount?: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  exceptionCount,
  slowQueryCount,
  slowRequestCount = 0
}) => {
  const tabs = [
    {
      id: "monitoring",
      label: "Monitoring (APM & Health)",
      sublabel: "Hybride SLA, latency & incident triage",
      icon: Activity,
      badge: slowRequestCount > 0 ? `${slowRequestCount}` : undefined,
      badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold",
      accent: "border-amber-500 text-amber-400"
    },
    {
      id: "performance",
      label: "Performance & Profiling",
      sublabel: "Request waterval & Database N+1",
      icon: Gauge,
      badge: slowQueryCount > 0 ? `${slowQueryCount} queries` : undefined,
      badgeColor: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold",
      accent: "border-indigo-500 text-indigo-400"
    },
    {
      id: "exceptions",
      label: "Exceptions & Incidenten",
      sublabel: "Foutopsporing, code context & breadcrumbs",
      icon: AlertOctagon,
      badge: exceptionCount > 0 ? `${exceptionCount}` : undefined,
      badgeColor: "bg-rose-500 text-white font-bold",
      accent: "border-rose-500 text-rose-400"
    },
    {
      id: "toolbox",
      label: "Toolbox & System",
      sublabel: "Debug Lab (dd/dump), Queues & Daemons",
      icon: Wrench,
      pill: "3 tools",
      accent: "border-emerald-500 text-emerald-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-slate-800/80 pb-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
              isActive
                ? `bg-slate-900/90 ${tab.accent.split(" ")[0]} border-t-2 shadow-sm`
                : "border-slate-800/60 bg-slate-950/40 hover:bg-slate-900/50 hover:border-slate-700/80 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <div className="flex items-center gap-2">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? tab.accent.split(" ")[1] : "text-slate-400"
                  }`}
                />
                <span className={`text-xs font-bold font-mono tracking-tight ${isActive ? "text-white" : "text-slate-300"}`}>
                  {tab.label}
                </span>
              </div>

              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${tab.badgeColor}`}
                >
                  {tab.badge}
                </span>
              )}

              {tab.pill && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                  {tab.pill}
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400 truncate pl-6">
              {tab.sublabel}
            </div>
          </button>
        );
      })}
    </div>
  );
};



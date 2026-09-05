import React, { useState } from "react";
import { Sliders, X, Plus, Check, Trash2, AlertTriangle, ShieldCheck } from "lucide-react";
import { RouteThresholdRule } from "../types";

interface ThresholdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RouteThresholdRule[];
  onSaveRules: (rules: RouteThresholdRule[]) => void;
}

export const ThresholdsModal: React.FC<ThresholdsModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules
}) => {
  const [currentRules, setCurrentRules] = useState<RouteThresholdRule[]>(rules);
  const [newPattern, setNewPattern] = useState("");
  const [newMethod, setNewMethod] = useState("GET|HEAD");
  const [newThreshold, setNewThreshold] = useState("500");

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    const updated = currentRules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setCurrentRules(updated);
  };

  const handleThresholdChange = (id: string, val: number) => {
    const updated = currentRules.map((r) =>
      r.id === id ? { ...r, threshold_ms: val } : r
    );
    setCurrentRules(updated);
  };

  const handleDelete = (id: string) => {
    setCurrentRules(currentRules.filter((r) => r.id !== id));
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern.trim()) return;

    const newRule: RouteThresholdRule = {
      id: "rule-" + Date.now(),
      pattern: newPattern.trim(),
      method: newMethod,
      threshold_ms: parseInt(newThreshold) || 500,
      enabled: true
    };

    setCurrentRules([...currentRules, newRule]);
    setNewPattern("");
    setNewThreshold("500");
  };

  const handleSave = () => {
    onSaveRules(currentRules);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0e1422] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Configureerbare Drempelwaarden &amp; Regels
              </h3>
              <p className="text-xs text-slate-400">
                Stel per route of patroon prestatietoleranties in (vergelijkbaar met Nightwatch SLA rules).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="text-xs text-slate-300 bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Wanneer een endpoint deze drempelwaarde overschrijdt, markeert PulseWatch de request direct als SLA-overschrijding en activeert een alert.
            </span>
          </div>

          {/* Rules List */}
          <div className="space-y-2.5">
            {currentRules.map((rule) => (
              <div
                key={rule.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  rule.enabled
                    ? "bg-slate-900/90 border-slate-800"
                    : "bg-slate-950/50 border-slate-800/50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => handleToggle(rule.id)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                        {rule.method}
                      </span>
                      <span className="text-xs font-mono font-bold text-white truncate">
                        {rule.pattern}
                      </span>
                    </div>
                    {rule.notes && (
                      <div className="text-[10px] text-slate-500 mt-0.5">{rule.notes}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs font-mono">
                    <span className="text-slate-400 text-[11px]">Max:</span>
                    <input
                      type="number"
                      value={rule.threshold_ms}
                      onChange={(e) =>
                        handleThresholdChange(rule.id, parseInt(e.target.value) || 100)
                      }
                      className="w-16 bg-transparent text-amber-400 font-bold focus:outline-none text-right"
                    />
                    <span className="text-slate-500 text-[10px]">ms</span>
                  </div>

                  {rule.id !== "default-all" && rule.id !== "default-unmatched" && (
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      title="Verwijder regel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Rule Form */}
          <form
            onSubmit={handleAddRule}
            className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
          >
            <div className="sm:col-span-3">
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Method
              </label>
              <select
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500/50"
              >
                <option value="GET|HEAD">GET|HEAD</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="ALL">ALL</option>
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Route Patroon (bijv. /articles/*)
              </label>
              <input
                type="text"
                placeholder="/checkout, /reports/{id}"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Drempel
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="500"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono pr-7 focus:outline-none focus:border-amber-500/50"
                />
                <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">
                  ms
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Toevoegen</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {currentRules.filter((r) => r.enabled).length} actieve SLA regels
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Regels Opslaan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

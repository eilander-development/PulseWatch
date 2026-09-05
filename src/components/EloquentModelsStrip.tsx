import React, { useState } from "react";
import { Database, Info, Layers, Search, Filter } from "lucide-react";

interface EloquentModelsStripProps {
  models?: Record<string, number>;
  totalInstancesCount?: number;
}

export const EloquentModelsStrip: React.FC<EloquentModelsStripProps> = ({
  models,
  totalInstancesCount
}) => {
  const [showShortNames, setShowShortNames] = useState<boolean>(false);
  const [modelFilter, setModelFilter] = useState<string>("");

  // Default realistic models if none provided
  const modelEntries: [string, number][] = models
    ? Object.entries(models)
    : [
        ["Beekman\\Shops\\Models\\Configurations\\Overrides", 710],
        ["Beekman\\Shops\\Models\\Configurations", 230],
        ["Beekman\\Shops\\Models\\Articles\\ArticlePrices", 108],
        ["App\\Models\\Brand", 48],
        ["Beekman\\Shops\\Models\\PriceCache\\ConsumerPriceCache", 48],
        ["Beekman\\Shops\\Models\\Assortment\\Articles\\Articles", 24],
        ["App\\Models\\Article", 24],
        ["Beekman\\Config\\Models\\Configs", 13]
      ];

  const totalInstances =
    totalInstancesCount ||
    modelEntries.reduce((acc, [, count]) => acc + count, 0);

  const totalTypes = modelEntries.length;

  const filteredEntries = modelEntries.filter(([name]) => {
    if (!modelFilter) return true;
    return name.toLowerCase().includes(modelFilter.toLowerCase());
  });

  const getShortName = (fullName: string) => {
    return fullName.split("\\").pop() || fullName;
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-sm">
      {/* Header with Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Database className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Geladen Eloquent-modellen
          </h4>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700 font-bold">
            {totalTypes} types · {totalInstances} instanties
          </span>
        </div>

        {/* Toggle short names vs full namespace */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setShowShortNames(!showShortNames)}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer"
          >
            {showShortNames ? "Toon volledige namespace" : "Korte modelnamen"}
          </button>
        </div>
      </div>

      {/* Model Badges Strip */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {filteredEntries.map(([modelName, count]) => {
          const isHeavy = count >= 100;
          const isMedium = count >= 40 && count < 100;

          return (
            <div
              key={modelName}
              title={modelName}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono border transition shadow-sm ${
                isHeavy
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30 font-bold"
                  : isMedium
                  ? "bg-slate-950 text-slate-200 border-slate-700/80 font-medium"
                  : "bg-slate-950/70 text-slate-400 border-slate-800"
              }`}
            >
              <span className="truncate max-w-[280px]">
                {showShortNames ? getShortName(modelName) : modelName}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${
                  isHeavy
                    ? "bg-amber-500/25 text-amber-200"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                &times;{count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Diagnostic Footnote from Screenshot */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="font-mono leading-relaxed">
          <strong className="text-slate-300">Diagnostische hint:</strong> Veel
          instanties bij weinig queries kan wijzen op te brede resultaten; veel
          instanties én veel queries kan op N+1-gedrag wijzen.
        </p>
      </div>
    </div>
  );
};

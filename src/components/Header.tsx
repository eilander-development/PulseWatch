import React, { useState } from "react";
import {
  Activity,
  Radio,
  Zap,
  BookOpen,
  Trash2,
  RefreshCw,
  Server,
  FolderGit2,
  ShieldCheck,
  AlertTriangle,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Code2,
  Shield,
  Terminal
} from "lucide-react";
import { APMStats, Project } from "../types";

interface HeaderProps {
  stats: APMStats | null;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onRefresh: () => void;
  onOpenIntegration: () => void;
  onOpenRecipes?: () => void;
  onOpenEnterpriseRoadmap?: () => void;
  onClearTelemetry: () => void;
  environment: string;
  setEnvironment: (env: string) => void;
  projects?: Project[];
  selectedProject?: string;
  onSelectProject?: (slug: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  isStreaming,
  onToggleStreaming,
  onRefresh,
  onOpenIntegration,
  onOpenRecipes,
  onOpenEnterpriseRoadmap,
  onClearTelemetry,
  environment,
  setEnvironment,
  projects = [],
  selectedProject = "all",
  onSelectProject = (_slug: string) => {}
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);

  const activeProj = projects.find((p) => p.slug === selectedProject);
  const activeDomain = activeProj?.domains?.[0] || (selectedProject !== "all" ? `${selectedProject}.local` : "beekman.local");

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`https://${activeDomain}`);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <header className="border-b border-[#182236] bg-[#090d16]/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
      {/* Top Manager Browser Navigation Bar */}
      <div className="border-b border-[#141b2d] px-4 lg:px-8 py-2.5 bg-[#060911]/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Breadcrumb & Project Browser Input */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
            <span className="text-slate-500 font-mono hidden md:inline">Dashboard &gt; Project</span>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e1424] border border-[#1b253d] flex-1 max-w-xl shadow-inner text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-xs text-white select-all">
                https://{activeDomain}
              </span>

              {/* Subdomain pill switch */}
              {activeProj && activeProj.domains.length > 1 && (
                <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono">+{activeProj.domains.length - 1} domeinen</span>
                </div>
              )}

              <div className="ml-auto flex items-center gap-1.5 shrink-0 pl-2">
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[10px]">
                  Laravel
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold text-[10px] hidden sm:inline-flex items-center gap-1">
                  <Code2 className="w-2.5 h-2.5" />
                  Vue 3
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Actief
                </span>

                <button
                  onClick={handleCopyUrl}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                  title="Kopieer URL"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Runtime Pills */}
          <div className="hidden xl:flex items-center gap-1.5 text-slate-400 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-[#0e1424] border border-[#1b253d] text-slate-300">PHP 8.3</span>
            <span className="px-2.5 py-1 rounded-lg bg-[#0e1424] border border-[#1b253d] text-slate-300">Node 18</span>
            <span className="px-2.5 py-1 rounded-lg bg-[#0e1424] border border-[#1b253d] text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Vite
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#0e1424] border border-[#1b253d] text-slate-300">Queue</span>
            <span className="px-2.5 py-1 rounded-lg bg-[#0e1424] border border-[#1b253d] text-slate-300">Schedule</span>
          </div>
        </div>
      </div>

      {/* Main Bar with Project Controls & Telemetry Actions */}
      <div className="px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Collector Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-teal-600/15 border border-blue-500/30 text-blue-400 shadow-md shadow-blue-950/40">
              <Activity className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-slate-950 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>Profiler &amp; APM</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-medium">
                    Laravel + Vue Probe
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Real-time Docker telemetry, Inertia.js tracking &amp; multi-domein monitoring
              </p>
            </div>
          </div>

          {/* Status Indicators & Action Controls */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Project Selector Dropdown */}
            <div className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0e1424] border border-[#1b253d] text-xs font-mono">
              <FolderGit2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <select
                value={selectedProject}
                onChange={(e) => onSelectProject(e.target.value)}
                aria-label="Selecteer project"
                className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-slate-900 text-slate-200">
                  Alle Projecten ({projects.length})
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.slug} className="bg-slate-900 text-slate-200">
                    {p.name} ({p.domains.length} dom)
                  </option>
                ))}
              </select>
            </div>

            {/* Environment Selector */}
            <div className="relative">
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                aria-label="Selecteer omgeving"
                className="px-2.5 py-1.5 rounded-xl bg-[#0e1424] border border-[#1b253d] text-xs font-mono text-slate-300 hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                <option value="production">env: production</option>
                <option value="staging">env: staging</option>
                <option value="local">env: local (Docker/Herd)</option>
              </select>
            </div>

            {/* Live Streaming (SSE) Toggle */}
            <button
              onClick={onToggleStreaming}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                isStreaming
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                  : "bg-[#0e1424] border-[#1b253d] text-slate-400 hover:bg-slate-800"
              }`}
              title="Schakel realtime SSE streaming in of uit"
            >
              <Radio className={`w-3.5 h-3.5 ${isStreaming ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
              <span className="font-mono text-[11px]">{isStreaming ? "SSE Live" : "Gepauzeerd"}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-xl bg-[#0e1424] border border-[#1b253d] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Vernieuw telemetrie handmatig"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Laravel Recipe Catalog */}
            {onOpenRecipes && (
              <button
                onClick={onOpenRecipes}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-500/30 hover:bg-emerald-600/25 text-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Open de offline Laravel Fix & Recepten Catalogus"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Laravel Recepten</span>
              </button>
            )}

            {/* DevStack Agent Setup & Codex Prompt Modal */}
            <button
              onClick={onOpenIntegration}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/25 border border-blue-500/40 hover:bg-blue-600/35 text-blue-200 text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Agent Specificatie &amp; Codex Prompt</span>
            </button>

            {/* Pro / Enterprise Roadmap Modal */}
            {onOpenEnterpriseRoadmap && (
              <button
                onClick={onOpenEnterpriseRoadmap}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/25 border border-indigo-500/40 hover:bg-indigo-600/35 text-indigo-200 text-xs font-mono font-medium transition-colors cursor-pointer shadow-sm"
                title="Bekijk de Enterprise & Productie Roadmap voor schaalvergroting"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Enterprise Roadmap</span>
              </button>
            )}

            {/* Clear Log */}
            <button
              onClick={onClearTelemetry}
              className="p-1.5 rounded-xl bg-[#0e1424] border border-[#1b253d] text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Wis telemetrie-buffer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart2,
  Database,
  Terminal,
  Layers,
  ShieldCheck
} from "lucide-react";
import { Header } from "./components/Header";
import { MetricCards } from "./components/MetricCards";
import { NavigationTabs } from "./components/NavigationTabs";
import { SlowRequestsMonitorView } from "./components/SlowRequestsMonitorView";
import { RequestProfilerView } from "./components/RequestProfilerView";
import { DebugLabView } from "./components/DebugLabView";
import { ExceptionsView } from "./components/ExceptionsView";
import { QueriesView } from "./components/QueriesView";
import { JobsView } from "./components/JobsView";
import { NightwatchSentinelView } from "./components/NightwatchSentinelView";
import { ProjectsAndAgentModal } from "./components/ProjectsAndAgentModal";
import { LaravelRecipeModal } from "./components/LaravelRecipeModal";
import { EnterpriseRoadmapModal } from "./components/EnterpriseRoadmapModal";
import { LaravelFixRecipe } from "./data/laravelRecipes";
import { TelemetryEvent, APMStats, Project } from "./types";
import { INITIAL_EVENTS, INITIAL_STATS, INITIAL_PROJECTS } from "./data/initialTelemetry";

// Safe JSON fetcher that verifies HTTP status and content-type to avoid '<!doctype' HTML JSON parse errors
async function fetchJsonSafe<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    const contentType = res.headers.get("content-type");
    if (res.ok && contentType && contentType.includes("application/json")) {
      return (await res.json()) as T;
    }
    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const [events, setEvents] = useState<TelemetryEvent[]>(INITIAL_EVENTS);
  const [stats, setStats] = useState<APMStats | null>(INITIAL_STATS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<string>("beekman");
  const [activeTab, setActiveTab] = useState<string>("monitoring");
  const [performanceSubtab, setPerformanceSubtab] = useState<"profiler" | "queries">("profiler");
  const [toolboxSubtab, setToolboxSubtab] = useState<"debug" | "jobs" | "sentinel">("debug");
  const [profilerSelectedRequestId, setProfilerSelectedRequestId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [environment, setEnvironment] = useState<string>("local");

  // Modals state
  const [isIntegrationOpen, setIsIntegrationOpen] = useState<boolean>(false);
  const [isRecipesOpen, setIsRecipesOpen] = useState<boolean>(false);
  const [isEnterpriseRoadmapOpen, setIsEnterpriseRoadmapOpen] = useState<boolean>(false);
  const [selectedRecipe, setSelectedRecipe] = useState<LaravelFixRecipe | null>(null);

  // Cross-tab workflows state
  const [debugLabInitialCode, setDebugLabInitialCode] = useState<string>("");
  const [debugLabInitialFilter, setDebugLabInitialFilter] = useState<string>("");

  const handleOpenRecipe = (recipe: LaravelFixRecipe) => {
    setSelectedRecipe(recipe);
    setIsRecipesOpen(true);
  };

  // Seamless router between main tabs and internal subtabs
  const handleSelectTab = (tabId: string) => {
    if (tabId === "profiler") {
      setActiveTab("performance");
      setPerformanceSubtab("profiler");
    } else if (tabId === "queries") {
      setActiveTab("performance");
      setPerformanceSubtab("queries");
    } else if (tabId === "debug") {
      setActiveTab("toolbox");
      setToolboxSubtab("debug");
    } else if (tabId === "jobs") {
      setActiveTab("toolbox");
      setToolboxSubtab("jobs");
    } else if (tabId === "sentinel") {
      setActiveTab("toolbox");
      setToolboxSubtab("sentinel");
    } else {
      setActiveTab(tabId);
    }
  };

  const handleOpenProfiler = (requestId: string) => {
    setProfilerSelectedRequestId(requestId);
    setActiveTab("performance");
    setPerformanceSubtab("profiler");
  };

  const handleOpenDebugLab = (filter?: string) => {
    if (filter) setDebugLabInitialFilter(filter);
    setActiveTab("toolbox");
    setToolboxSubtab("debug");
  };

  const handleSendQueryToTinker = (code: string) => {
    setDebugLabInitialCode(code);
    setActiveTab("toolbox");
    setToolboxSubtab("debug");
  };

  // Fetch telemetry events & stats & projects safely
  const fetchData = useCallback(async () => {
    try {
      const [eventsData, statsData, projectsData] = await Promise.all([
        fetchJsonSafe<TelemetryEvent[]>("/api/telemetry/events"),
        fetchJsonSafe<APMStats>("/api/telemetry/stats"),
        fetchJsonSafe<Project[]>("/api/projects")
      ]);

      if (eventsData && Array.isArray(eventsData)) {
        setEvents(eventsData);
      }
      if (statsData) {
        setStats(statsData);
      }
      if (projectsData && Array.isArray(projectsData)) {
        setProjects(projectsData);
      }
    } catch {
      // Safe fallback - keep existing state
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time Server-Sent Events (SSE) connection
  useEffect(() => {
    if (!isStreaming) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/telemetry/stream");

      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === "new_event" && parsed.payload) {
            setEvents((prev) => [parsed.payload, ...prev.slice(0, 499)]);
          } else if (parsed.type === "projects_updated" && parsed.payload) {
            setProjects(parsed.payload);
          }
        } catch {
          // Ignore keep-alive comments / non-json
        }
      };

      eventSource.onerror = () => {
        // SSE will automatically reconnect
      };
    } catch (err) {
      console.error("SSE connection error:", err);
    }

    // Fallback polling every 5s in case SSE is interrupted
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(interval);
    };
  }, [isStreaming, fetchData]);

  const handleAddProject = async (newProj: {
    name: string;
    slug: string;
    domains: string[];
    environment: "production" | "staging" | "local";
  }) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProj)
      });
      if (res.ok) {
        const data = await res.json();
        setProjects((prev) => [...prev.filter((p) => p.slug !== data.project.slug), data.project]);
        setSelectedProject(data.project.slug);
      }
    } catch (err) {
      console.error("Failed to add project:", err);
    }
  };

  // Mark event as resolved
  const handleResolve = async (eventId: string) => {
    try {
      const res = await fetch(`/api/telemetry/resolve/${eventId}`, {
        method: "POST"
      });
      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, resolved: true } : e))
        );
      }
    } catch (err) {
      console.error("Failed to resolve event:", err);
    }
  };

  // Clear telemetry
  const handleClearTelemetry = async () => {
    if (window.confirm("Are you sure you want to flush all telemetry events?")) {
      try {
        await fetch("/api/telemetry/clear", { method: "POST" });
        setEvents([]);
        await fetchData();
      } catch (err) {
        console.error("Failed to clear telemetry:", err);
      }
    }
  };

  // Project filtering
  const visibleEvents = useMemo(() => {
    if (selectedProject === "all") return events;
    const activeProject = projects.find(
      (p) => p.slug === selectedProject || p.id === selectedProject
    );
    const allowedDomains = activeProject
      ? activeProject.domains.map((d) => d.toLowerCase())
      : [];

    return events.filter((e) => {
      const proj = e.metadata?.project?.toLowerCase();
      const dom = e.metadata?.domain?.toLowerCase();

      // Explicit project match
      if (
        proj &&
        (proj === selectedProject.toLowerCase() ||
          (activeProject && proj === activeProject.id.toLowerCase()))
      ) {
        return true;
      }

      // Domain match in project's registered domains list
      if (
        dom &&
        allowedDomains.some(
          (d) => d === dom || dom.includes(d) || d.includes(dom)
        )
      ) {
        return true;
      }

      // Substring match in domain
      if (dom && dom.includes(selectedProject.toLowerCase())) {
        return true;
      }

      // Fallback: If event is unassigned, attribute to default master project
      if (!proj && !dom && (selectedProject === "beekman" || selectedProject === "proj-beekman")) {
        return true;
      }

      return false;
    });
  }, [events, selectedProject, projects]);

  const exceptionEvents = visibleEvents.filter((e) => e.type === "exception");
  const queryEvents = visibleEvents.filter((e) => e.type === "query");
  const requestEvents = visibleEvents.filter((e) => e.type === "request");
  const unresolvedExceptions = exceptionEvents.filter((e) => !e.resolved);
  const slowQueries = queryEvents.filter((q) => (q.durationMs || 0) > 300);
  const slowRequests = requestEvents.filter((r) => (r.durationMs || 0) >= 300);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      {/* Top Application Header */}
      <Header
        stats={stats}
        isStreaming={isStreaming}
        onToggleStreaming={() => setIsStreaming(!isStreaming)}
        onRefresh={fetchData}
        onOpenIntegration={() => setIsIntegrationOpen(true)}
        onOpenRecipes={() => setIsRecipesOpen(true)}
        onOpenEnterpriseRoadmap={() => setIsEnterpriseRoadmapOpen(true)}
        onClearTelemetry={handleClearTelemetry}
        environment={environment}
        setEnvironment={setEnvironment}
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* KPI / Vital Signs Pulse Banner */}
        <MetricCards stats={stats} onSelectTab={handleSelectTab} />

        {/* Navigation Tabs (4 Functional Clusters) */}
        <NavigationTabs
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          exceptionCount={unresolvedExceptions.length}
          slowQueryCount={slowQueries.length}
          slowRequestCount={slowRequests.length}
        />

        {/* Tab Views */}
        <div className="pt-2">
          {/* 1. Monitoring (APM & Health) */}
          {activeTab === "monitoring" && (
            <SlowRequestsMonitorView
              events={visibleEvents}
              onInspectInProfiler={handleOpenProfiler}
              onOpenDebugLab={handleOpenDebugLab}
              onOpenAgentGuide={() => setIsIntegrationOpen(true)}
              onOpenRecipe={handleOpenRecipe}
            />
          )}

          {/* 2. Performance & Profiling (Waterval + Database N+1) */}
          {activeTab === "performance" && (
            <div className="space-y-4">
              {/* Internal Subtab Switcher */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                  <button
                    onClick={() => setPerformanceSubtab("profiler")}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                      performanceSubtab === "profiler"
                        ? "bg-rose-600 text-white font-bold shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Request Profiler (Waterval)</span>
                  </button>

                  <button
                    onClick={() => setPerformanceSubtab("queries")}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                      performanceSubtab === "queries"
                        ? "bg-indigo-600 text-white font-bold shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Database &amp; N+1 Queries</span>
                    {slowQueries.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-200 border border-indigo-400/30 text-[10px] font-bold">
                        {slowQueries.length}
                      </span>
                    )}
                  </button>
                </div>

                <div className="text-xs font-mono text-slate-400 hidden sm:flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>
                    {performanceSubtab === "profiler"
                      ? "Milestone traces & execution timeline"
                      : `${queryEvents.length} queries geregistreerd (${slowQueries.length} slow / N+1)`}
                  </span>
                </div>
              </div>

              {performanceSubtab === "profiler" && (
                <RequestProfilerView
                  events={visibleEvents}
                  initialRequestId={profilerSelectedRequestId}
                  onSendQueryToTinker={handleSendQueryToTinker}
                  onOpenDebugLab={handleOpenDebugLab}
                  onOpenRecipe={handleOpenRecipe}
                />
              )}

              {performanceSubtab === "queries" && (
                <QueriesView events={visibleEvents} onOpenRecipe={handleOpenRecipe} />
              )}
            </div>
          )}

          {/* 3. Exceptions & Sentry */}
          {activeTab === "exceptions" && (
            <ExceptionsView
              events={exceptionEvents}
              onResolve={handleResolve}
              onOpenRecipe={handleOpenRecipe}
            />
          )}

          {/* 4. Toolbox & System (Debug Lab, Queues & Sentinel) */}
          {activeTab === "toolbox" && (
            <div className="space-y-4">
              {/* Internal Subtab Switcher */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                  <button
                    onClick={() => setToolboxSubtab("debug")}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                      toolboxSubtab === "debug"
                        ? "bg-emerald-600 text-white font-bold shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Debug Lab (dd, dump &amp; Tinker)</span>
                  </button>

                  <button
                    onClick={() => setToolboxSubtab("jobs")}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                      toolboxSubtab === "jobs"
                        ? "bg-purple-600 text-white font-bold shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Queues &amp; Horizon</span>
                  </button>

                  <button
                    onClick={() => setToolboxSubtab("sentinel")}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                      toolboxSubtab === "sentinel"
                        ? "bg-sky-600 text-white font-bold shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Sentinel Watchdog</span>
                  </button>
                </div>

                <div className="text-xs font-mono text-slate-400 hidden sm:flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Interactive dev tools &amp; background daemons</span>
                </div>
              </div>

              {toolboxSubtab === "debug" && (
                <DebugLabView
                  initialCode={debugLabInitialCode}
                  initialFilter={debugLabInitialFilter}
                  onOpenAgentGuide={() => setIsIntegrationOpen(true)}
                />
              )}

              {toolboxSubtab === "jobs" && (
                <JobsView events={events} onOpenRecipe={handleOpenRecipe} />
              )}

              {toolboxSubtab === "sentinel" && <NightwatchSentinelView />}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-4 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            <span>Laravel APM & Profiler • Real-time Docker Telemetry & Profiling</span>
          </div>
          <div>
            Native PHP Probe met multi-domein ondersteuning &amp; SSE dashboards
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProjectsAndAgentModal
        isOpen={isIntegrationOpen}
        onClose={() => setIsIntegrationOpen(false)}
        projects={projects}
        onAddProject={handleAddProject}
        onOpenEnterpriseRoadmap={() => setIsEnterpriseRoadmapOpen(true)}
      />

      <LaravelRecipeModal
        isOpen={isRecipesOpen}
        onClose={() => setIsRecipesOpen(false)}
        selectedRecipe={selectedRecipe}
        onSelectRecipe={(recipe) => setSelectedRecipe(recipe)}
      />

      <EnterpriseRoadmapModal
        isOpen={isEnterpriseRoadmapOpen}
        onClose={() => setIsEnterpriseRoadmapOpen(false)}
      />
    </div>
  );
}

import React, { useState } from "react";
import {
  AlertOctagon,
  CheckCircle,
  Clock,
  Users,
  Code2,
  FileCode,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  UserCheck,
  Tag,
  Share2,
  ShieldAlert,
  SlidersHorizontal,
  ChevronDown,
  BookOpen
} from "lucide-react";
import { TelemetryEvent, TeamMember } from "../types";
import { findRecipeForEvent, LaravelFixRecipe } from "../data/laravelRecipes";

interface ExceptionsViewProps {
  events: TelemetryEvent[];
  onResolve: (eventId: string) => void;
  onOpenRecipe?: (recipe: LaravelFixRecipe) => void;
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: "mark", name: "Mark Eilander", email: "mark@partsnl.nl", avatar_color: "bg-blue-600" },
  { id: "jackie", name: "Jackie Haley", email: "jackie@beekman.nl", avatar_color: "bg-purple-600" },
  { id: "mary", name: "Mary Freund", email: "mary@beekman.nl", avatar_color: "bg-emerald-600" },
  { id: "laura", name: "Laura Mennell", email: "laura@partsnl.nl", avatar_color: "bg-amber-600" },
  { id: "patrick", name: "Patrick Wilson", email: "patrick@beekman.nl", avatar_color: "bg-rose-600" }
];

export const ExceptionsView: React.FC<ExceptionsViewProps> = ({
  events,
  onResolve,
  onOpenRecipe
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    events[0]?.id || null
  );
  const [filterType, setFilterType] = useState<"all" | "unhandled" | "handled" | "assigned">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignments, setAssignments] = useState<Record<string, string>>({
    [events[0]?.id || ""]: "mark"
  });
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // Derive issue ID like PW-171
  const getIssueId = (id: string, idx: number) => {
    const num = (parseInt(id.replace(/\D/g, "").slice(-3)) || (101 + idx));
    return `PW-${num}`;
  };

  const isHandled = (e: TelemetryEvent) => {
    return e.metadata.handled === true || e.level === "warning" || e.level === "info";
  };

  const totalHandled = events.filter((e) => isHandled(e)).length;
  const totalUnhandled = events.length - totalHandled;
  const totalAffectedUsers = events.reduce((sum, e) => sum + (e.metadata.affected_users || 0), 0);

  const filteredEvents = events.filter((e) => {
    if (filterType === "unhandled" && isHandled(e)) return false;
    if (filterType === "handled" && !isHandled(e)) return false;
    if (filterType === "assigned" && !assignments[e.id]) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.message && e.message.toLowerCase().includes(q)) ||
        (e.metadata.file && e.metadata.file.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const selectedEvent =
    events.find((e) => e.id === selectedEventId) || filteredEvents[0];

  const currentAssignee = selectedEvent ? assignments[selectedEvent.id] : undefined;
  const currentMember = TEAM_MEMBERS.find((m) => m.id === currentAssignee);

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const handleAssign = (memberId: string) => {
    if (!selectedEvent) return;
    setAssignments((prev) => ({
      ...prev,
      [selectedEvent.id]: memberId
    }));
    setShowAssigneeDropdown(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Incident Impact & Error Overview */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0e1320] border border-slate-800/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Foutimpact &amp; Stabiliteit</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Errors have impacted <span className="text-rose-400">{totalAffectedUsers.toLocaleString()} users</span> in this release
          </h2>
          <p className="text-xs text-slate-400">
            Realtime aggregatie van PHP fatal errors, ongehandelde excepties en warning alerts.
          </p>
        </div>

        {/* Handled vs Unhandled stats bar */}
        <div className="w-full md:w-80 space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {totalHandled} Handled
            </span>
            <span className="text-rose-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {totalUnhandled} Unhandled
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden flex">
            <div
              style={{ width: `${Math.round((totalHandled / (events.length || 1)) * 100)}%` }}
              className="bg-emerald-500 h-full"
            />
            <div
              style={{ width: `${Math.round((totalUnhandled / (events.length || 1)) * 100)}%` }}
              className="bg-rose-500 h-full"
            />
          </div>
        </div>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left List: Exception Stream */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search & Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Zoek excepties, files, traces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono transition-colors"
              />
            </div>

            <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-0.5 text-xs font-mono">
              <button
                onClick={() => setFilterType("all")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterType === "all"
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Alle
              </button>
              <button
                onClick={() => setFilterType("unhandled")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterType === "unhandled"
                    ? "bg-rose-500/20 text-rose-300 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Unhandled
              </button>
              <button
                onClick={() => setFilterType("handled")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterType === "handled"
                    ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Handled
              </button>
            </div>
          </div>

          {/* List of Exceptions */}
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-medium text-slate-200">Geen passende excepties gevonden</p>
                <p className="text-xs mt-1 text-slate-400">Alle gerapporteerde fouten zijn opgelost of gefilterd.</p>
              </div>
            ) : (
              filteredEvents.map((evt, idx) => {
                const isSelected = selectedEvent?.id === evt.id;
                const isCrit = evt.level === "critical" || evt.level === "error";
                const issueId = getIssueId(evt.id, idx);
                const assigned = assignments[evt.id] ? TEAM_MEMBERS.find((m) => m.id === assignments[evt.id]) : null;

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "bg-[#0e1320] border-rose-500/50 shadow-md shadow-rose-950/20 ring-1 ring-rose-500/20"
                        : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                          {issueId}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                            isCrit
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {evt.level}
                        </span>
                        {evt.resolved && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Resolved
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {assigned && (
                          <div
                            className={`w-4 h-4 rounded-full ${assigned.avatar_color} text-[9px] font-bold text-white flex items-center justify-center`}
                            title={`Toegewezen aan ${assigned.name}`}
                          >
                            {assigned.name[0]}
                          </div>
                        )}
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatTimeAgo(evt.timestamp)}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-100 mt-2 line-clamp-1 group-hover:text-rose-300">
                      {evt.title}
                    </h4>

                    <p className="text-xs text-slate-400 font-mono mt-1 truncate">
                      {evt.metadata.file
                        ? `${evt.metadata.file}:${evt.metadata.line}`
                        : evt.metadata.request?.url || "Internal Worker"}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Users className="w-3 h-3 text-slate-400" />
                        {evt.metadata.affected_users ?? 4} impacted users
                      </span>
                      <span className="text-rose-400 font-semibold">
                        {evt.metadata.occurrences_last_24h ?? 1} events
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Details: Diagnostic Inspector */}
        <div className="lg:col-span-7">
          {selectedEvent ? (
            <div className="rounded-2xl border border-slate-800 bg-[#0e1320] overflow-hidden shadow-xl">
              {/* Header / Actions */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {getIssueId(selectedEvent.id, 0)}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase font-semibold">
                      {selectedEvent.level}
                    </span>

                    {/* Team Member Assignee Dropdown (Screenshot 6 & 7) */}
                    <div className="relative">
                      <button
                        onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition"
                      >
                        {currentMember ? (
                          <>
                            <span className={`w-3.5 h-3.5 rounded-full ${currentMember.avatar_color} text-[8px] font-bold text-white flex items-center justify-center`}>
                              {currentMember.name[0]}
                            </span>
                            <span>{currentMember.name}</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>Wijs toe</span>
                          </>
                        )}
                        <ChevronDown className="w-3 h-3 text-slate-500" />
                      </button>

                      {showAssigneeDropdown && (
                        <div className="absolute left-0 mt-1.5 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-20 space-y-0.5 font-mono text-xs">
                          <div className="px-2 py-1 text-[10px] uppercase text-slate-500 font-semibold">
                            Teamleden
                          </div>
                          {TEAM_MEMBERS.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => handleAssign(m.id)}
                              className="w-full px-2.5 py-1.5 rounded-lg text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition"
                            >
                              <span className={`w-4 h-4 rounded-full ${m.avatar_color} text-[9px] font-bold text-white flex items-center justify-center`}>
                                {m.name[0]}
                              </span>
                              <div className="truncate">
                                <div>{m.name}</div>
                                <div className="text-[9px] text-slate-500">{m.email}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const matchedRecipe = findRecipeForEvent(
                        selectedEvent.title + " " + (selectedEvent.message || "")
                      );
                      if (!matchedRecipe || !onOpenRecipe) return null;
                      return (
                        <button
                          onClick={() => onOpenRecipe(matchedRecipe)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                          title="Bekijk beproefd Laravel recept (gratis / 0 tokens)"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Laravel Recept ({matchedRecipe.badge.split("/")[0].trim()})</span>
                        </button>
                      );
                    })()}

                    {!selectedEvent.resolved && (
                      <button
                        onClick={() => onResolve(selectedEvent.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Oplossen</span>
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mt-3 leading-snug">
                  {selectedEvent.title}
                </h3>

                {selectedEvent.message && (
                  <p className="text-xs text-rose-300/90 font-mono mt-1.5 p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/30 break-words">
                    {selectedEvent.message}
                  </p>
                )}
              </div>

              <div className="p-5 space-y-5 max-h-[640px] overflow-y-auto">
                {/* Stack Trace Code Preview (PHP Stack Frame Locatie / Snippet) */}
                {(selectedEvent.metadata.code_snippet || selectedEvent.metadata.raw_exception?.snippet) && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-rose-400" />
                        PHP Stack Frame Locatie &bull; Broncode Snippet
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {selectedEvent.metadata.raw_exception?.file || selectedEvent.metadata.file}:
                        {selectedEvent.metadata.raw_exception?.line || selectedEvent.metadata.line}
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 font-mono text-xs overflow-x-auto">
                      {selectedEvent.metadata.raw_exception?.snippet?.lines ? (
                        Object.entries(selectedEvent.metadata.raw_exception.snippet.lines).map(([lineNum, codeStr]) => {
                          const isErrorLine = Number(lineNum) === Number(selectedEvent.metadata.raw_exception?.snippet?.line);
                          return (
                            <div
                              key={lineNum}
                              className={`flex items-center gap-3 py-0.5 px-2 rounded ${
                                isErrorLine
                                  ? "bg-rose-500/20 text-rose-200 border-l-2 border-rose-500 font-semibold"
                                  : "text-slate-400"
                              }`}
                            >
                              <span className="w-8 text-right select-none text-slate-400">
                                {lineNum}
                              </span>
                              <span className="whitespace-pre">{codeStr}</span>
                            </div>
                          );
                        })
                      ) : (
                        selectedEvent.metadata.code_snippet?.map((line) => (
                          <div
                            key={line.line}
                            className={`flex items-center gap-3 py-0.5 px-2 rounded ${
                              line.highlight
                                ? "bg-rose-500/20 text-rose-200 border-l-2 border-rose-500 font-semibold"
                                : "text-slate-400"
                            }`}
                          >
                            <span className="w-8 text-right select-none text-slate-400">
                              {line.line}
                            </span>
                            <span className="whitespace-pre">{line.code}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Incident Chronology & Request Breadcrumbs Timeline */}
                {selectedEvent.metadata.breadcrumbs && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      Incident Chronologie &amp; Breadcrumbs (Events voorafgaand aan crash)
                    </h4>

                    <div className="space-y-1.5 pl-2 border-l-2 border-slate-800 ml-1">
                      {selectedEvent.metadata.breadcrumbs.map((bc, idx) => {
                        const bType = bc.category || bc.type || "system";
                        const typeColor = 
                          bType === "exception" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                          bType === "warning" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                          bType === "query" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                          bType === "auth" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                          bType === "http" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                          "bg-slate-800 text-slate-300";

                        const dotColor = 
                          bType === "exception" ? "bg-rose-500 ring-rose-900" :
                          bType === "warning" ? "bg-amber-500 ring-amber-900" :
                          bType === "query" ? "bg-purple-500 ring-purple-900" :
                          bType === "auth" ? "bg-emerald-500 ring-emerald-900" :
                          bType === "http" ? "bg-blue-500 ring-blue-900" :
                          "bg-slate-600 ring-slate-900";

                        return (
                          <div
                            key={idx}
                            className="relative pl-4 flex items-start justify-between gap-3 text-xs"
                          >
                            <span className={`absolute -left-[13px] top-1.5 w-2 h-2 rounded-full ${dotColor} ring-2`} />
                            <div>
                              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded uppercase mr-2 font-bold ${typeColor}`}>
                                {bType}
                              </span>
                              <span className="text-slate-300 font-mono text-xs">
                                {bc.message}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 shrink-0">
                              {bc.offset_ms !== undefined ? `+${bc.offset_ms}ms` : bc.time}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Request Context & Metadata */}
                {selectedEvent.metadata.request && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Request Context
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Method &amp; Status</span>
                        <span className="text-slate-200 font-semibold">
                          {selectedEvent.metadata.request.method}{" "}
                          <span className="text-rose-400">{selectedEvent.metadata.request.status}</span>
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Route Path</span>
                        <span className="text-slate-200 truncate block">
                          {selectedEvent.metadata.request.url}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Client IP</span>
                        <span className="text-slate-200">
                          {selectedEvent.metadata.request.ip || "127.0.0.1"}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">User ID</span>
                        <span className="text-slate-200">
                          {selectedEvent.metadata.request.user_id ? `#${selectedEvent.metadata.request.user_id}` : "Gast (Unauthenticated)"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400">
              Selecteer een exceptie links om stack traces, breadcrumbs en geautomatiseerde code fixes te bekijken.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

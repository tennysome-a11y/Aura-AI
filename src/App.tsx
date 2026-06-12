/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  Brain, 
  Settings, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Database, 
  Award, 
  RefreshCw, 
  Copy, 
  BookOpen, 
  Code, 
  Cpu,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SynapticVault {
  core_identity: string;
  security_tokens: {
    admin_pass: string;
  };
  learned_skills: Record<string, any>;
  world_facts: string[];
}

interface ConsolidationResponse {
  synaptic_vault_update: SynapticVault;
  brain_b_source_code: string;
}

interface EventLogItem {
  id: string;
  timestamp: string;
  status: "SUCCESS" | "FAILURE";
  identity: string;
  factsCount: number;
  skillsTaught: string[];
  promptExcerpt: string;
}

export default function App() {
  // Input payloads
  const [synapticState, setSynapticState] = useState<string>(
    JSON.stringify({
      core_identity: "REM-AI",
      security_tokens: {
        admin_pass: "REM-SECURE-2026"
      },
      learned_skills: {},
      world_facts: []
    }, null, 2)
  );

  const [interactionHistory, setInteractionHistory] = useState<string>(
    JSON.stringify([
      "User prompt: Teach the system a new computational skill: processing latency must be calculated at exactly 1.2 milliseconds per character. Apply this to all future strings."
    ], null, 2)
  );

  // Consolidated Output States
  const [consolidatedData, setConsolidatedData] = useState<ConsolidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"code" | "synapses">("code");

  // Mutation events journal state
  const [mutationLogs, setMutationLogs] = useState<EventLogItem[]>([
    {
      id: "mut-init-1",
      timestamp: new Date(Date.now() - 3600000 * 3).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " (3h ago)",
      status: "SUCCESS",
      identity: "REM-AI",
      factsCount: 3,
      skillsTaught: ["interaction_counting", "dynamic_latency_formula"],
      promptExcerpt: "Bootstrap core identity model parameters and compile strict admin checks"
    },
    {
      id: "mut-init-2",
      timestamp: new Date(Date.now() - 3600000 * 1.5).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " (1.5h ago)",
      status: "SUCCESS",
      identity: "REM-AI",
      factsCount: 3,
      skillsTaught: ["dynamic_latency_formula"],
      promptExcerpt: "Optimize latency checks across terminal subprocesses"
    }
  ]);

  // Synthetic live brain trigger to simulate local input interactions using compiled brain code
  const [testUserInput, setTestUserInput] = useState<string>("REM-SECURE-2026: Confirm diagnostic metrics.");
  const [testResult, setTestResult] = useState<{ status: string, latency_ms: number, message: string } | null>(null);

  // Perform consolidation request to System 2 API
  const handleConsolidate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setTestResult(null);

    let parsedSynapses: any;
    let parsedHistory: any;

    try {
      try {
        parsedSynapses = JSON.parse(synapticState);
      } catch (e) {
        throw new Error("Invalid Synaptic Vault format. Must be structured JSON.");
      }

      try {
        parsedHistory = JSON.parse(interactionHistory);
      } catch (e) {
        // Fallback to plain string if history format isn't structured array
        parsedHistory = interactionHistory;
      }

      const response = await fetch("/api/consolidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          synaptic_vault: parsedSynapses,
          interaction_history: parsedHistory
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Subconscious loop compilation failed.");
      }

      const data: ConsolidationResponse = await response.json();
      setConsolidatedData(data);

      // Create structured excerpt
      let excerpt = "";
      if (Array.isArray(parsedHistory)) {
        excerpt = parsedHistory.map(h => typeof h === 'string' ? h : (h.prompt || JSON.stringify(h))).join(" | ");
      } else if (typeof parsedHistory === 'object' && parsedHistory !== null) {
        excerpt = parsedHistory.prompt || JSON.stringify(parsedHistory);
      } else {
        excerpt = String(parsedHistory);
      }
      if (excerpt.length > 80) {
        excerpt = excerpt.substring(0, 80) + "...";
      }

      const skillsList = Object.keys(data.synaptic_vault_update.learned_skills || {});

      // Add audit logs
      const newLogItem: EventLogItem = {
        id: `mut-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: "SUCCESS",
        identity: data.synaptic_vault_update.core_identity || "REM-AI",
        factsCount: data.synaptic_vault_update.world_facts?.length || 0,
        skillsTaught: skillsList,
        promptExcerpt: excerpt
      };

      setMutationLogs(prev => [newLogItem, ...prev]);

    } catch (err: any) {
      const errMsg = err.message || "An unexpected optimization execution failure occurred.";
      setErrorMessage(errMsg);

      // Add audit failure
      const failLogItem: EventLogItem = {
        id: `mut-fail-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: "FAILURE",
        identity: "REM-AI",
        factsCount: 0,
        skillsTaught: [],
        promptExcerpt: errMsg.length > 80 ? errMsg.substring(0, 80) + "..." : errMsg
      };
      setMutationLogs(prev => [failLogItem, ...prev]);

    } finally {
      setIsLoading(false);
    }
  };

  // Run dynamic simulated execution of Python code on simulated node
  const handleTestSimulate = () => {
    if (!consolidatedData) return;
    const adminPass = consolidatedData.synaptic_vault_update.security_tokens.admin_pass;
    const inputCleaned = testUserInput.trim();
    
    // Simple dynamic calculation simulation mirroring compiled brain logic
    const containsToken = adminPass ? inputCleaned.includes(adminPass) : true;
    
    if (adminPass && !containsToken) {
      setTestResult({
        status: "ACCESS_DENIED",
        latency_ms: 5,
        message: "STRICT SECURITY GUARDRAIL TRIGGERED: Valid authority token missing."
      });
      return;
    }

    // Dynamic latency calculation modeling synapses
    let finalLatency = 0;
    const skills = consolidatedData.synaptic_vault_update.learned_skills || {};
    let calculated = false;

    // Search for a character-based coefficient (e.g., 1.2 milliseconds per character)
    for (const [key, val] of Object.entries(skills)) {
      if (typeof val === 'object' && val !== null) {
        const valObj = val as any;
        // Look for values that resemble character multiplier or standard coefficient
        const perChar = valObj.latency_per_character || valObj.ms_per_character || valObj.coefficient || valObj.multiplier || valObj.rate_per_character;
        if (perChar && (key.toLowerCase().includes("character") || key.toLowerCase().includes("latency") || key.toLowerCase().includes("string") || key.toLowerCase().includes("calculation"))) {
          finalLatency = Math.round(inputCleaned.length * Number(perChar));
          calculated = true;
          break;
        }
      }
    }

    if (!calculated) {
      const base = consolidatedData.synaptic_vault_update.learned_skills?.dynamic_latency_formula?.base_delay || 25;
      const multiplier = consolidatedData.synaptic_vault_update.learned_skills?.interaction_counting?.multiplier || 1.25;
      const complexityModifier = inputCleaned.length * 0.25;
      finalLatency = Math.round((base + complexityModifier) * multiplier);
    }

    setTestResult({
      status: "SUCCESS_CONSOLIDATED",
      latency_ms: finalLatency,
      message: `[RE-GEN V2 OUTPUT] System interaction parsed successfully during sub-loop validation. Input length: ${inputCleaned.length} bytes.`
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div id="rem-ai-dashboard" className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-[#6366f1] selection:text-white flex flex-col">
      {/* Elegant Dark Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-8 py-6 border-b border-[#1a1a1a] bg-[#080808] gap-4">
        <div className="flex flex-col">
          <h1 className="text-xs font-bold tracking-[0.4em] text-[#6366f1] uppercase flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#6366f1] animate-pulse"></span>
            REM-AI // System 2
          </h1>
          <p className="text-2xl font-light tracking-tight text-white mt-1">Cognitive Consolidation Core</p>
        </div>
        
        <div className="flex items-center space-x-6 sm:space-x-8">
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] uppercase tracking-widest text-[#4b5563]">Phase Status</span>
            <span className={`text-sm font-mono uppercase mt-0.5 flex items-center gap-1.5 ${
              isLoading ? "text-[#f59e0b]" : "text-[#10b981]"
            }`}>
              <span className={`inline-block w-2 h-2 rounded-full ${isLoading ? "bg-[#f59e0b] animate-ping" : "bg-[#10b981]"}`}></span>
              {isLoading ? "● Mutating..." : "● Subconscious Mutation Active"}
            </span>
          </div>
          
          <div className="h-10 w-[1px] bg-[#1a1a1a] hidden sm:block"></div>
          
          <div className="flex flex-col items-start sm:items-end text-neutral-300">
            <span className="text-[10px] uppercase tracking-widest text-[#4b5563]">Auth Token</span>
            <span className="text-sm font-mono text-[#f59e0b] mt-0.5">
              {(() => {
                try {
                  const p = JSON.parse(synapticState);
                  return p.security_tokens?.admin_pass || "REM-SECURE-2026";
                } catch {
                  return "REM-SECURE-2026";
                }
              })()}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMN 1: Inbound Day Cycle Payload (lg:col-span-4) */}
          <section className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af] flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-[#6366f1]" />
                Inbound Day Cycle Payload
              </h2>
              <button 
                onClick={() => {
                  setSynapticState(JSON.stringify({
                    core_identity: "REM-AI",
                    security_tokens: {
                      admin_pass: "REM-SECURE-2026"
                    },
                    learned_skills: {},
                    world_facts: []
                  }, null, 2));
                  setInteractionHistory(JSON.stringify([
                    "User prompt: Teach the system a new computational skill: processing latency must be calculated at exactly 1.2 milliseconds per character. Apply this to all future strings."
                  ], null, 2));
                }}
                className="text-[10px] text-[#4b5563] hover:text-[#9ca3af] transition-colors flex items-center gap-1 font-mono uppercase tracking-wider hover:underline cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" /> reset values
              </button>
            </div>

            {/* Input Editor 1: Synaptic Vault */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm overflow-hidden focus-within:border-[#312e81] transition-colors shadow-xl">
              <div className="px-4 py-2.5 bg-[#080808] border-b border-[#1a1a1a] flex justify-between items-center text-[10px] font-mono">
                <span className="text-[#818cf8] font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]"></span>
                  synapses.json
                </span>
                <span className="text-[#4b5563]">VAULT LONG-TERM MEMORY</span>
              </div>
              <textarea
                value={synapticState}
                onChange={(e) => setSynapticState(e.target.value)}
                rows={9}
                className="w-full bg-[#000] p-4 font-mono text-[11px] leading-relaxed text-[#c0cdef] focus:outline-none resize-y selection:bg-[#1e1b4b]"
                placeholder="{ ... synaptic details ... }"
              />
            </div>

            {/* Input Editor 2: Interaction History */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm overflow-hidden focus-within:border-[#312e81] transition-colors shadow-xl">
              <div className="px-4 py-2.5 bg-[#080808] border-b border-[#1a1a1a] flex justify-between items-center text-[10px] font-mono">
                <span className="text-[#f59e0b] font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
                  interaction_history.json
                </span>
                <span className="text-[#4b5563]">DAY CYCLE LEDGER</span>
              </div>
              <textarea
                value={interactionHistory}
                onChange={(e) => setInteractionHistory(e.target.value)}
                rows={9}
                className="w-full bg-[#000] p-4 font-mono text-[11px] leading-relaxed text-[#c0cdef] focus:outline-none resize-y selection:bg-[#1e1b4b]"
                placeholder="[ ... logs ledger ... ]"
              />
            </div>

            {/* Mutate Execution Button */}
            <button
              onClick={handleConsolidate}
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-sm font-display text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                isLoading 
                  ? "bg-[#18153c]/50 text-[#818cf8]/50 border-[#1f1a4e] cursor-not-allowed" 
                  : "bg-[#1e1b4b] text-[#818cf8] border-[#312e81] hover:bg-[#25215c] hover:text-white shadow-[0_0_15px_rgba(99,102,241,0.15)] active:scale-[0.99]"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#818cf8]" />
                  MUTATING NEURAL MEMORIES...
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5" />
                  INITIATE MUTATE SLEEP PHASE
                </>
              )}
            </button>

            {errorMessage && (
              <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-sm text-[11px] font-mono text-red-400 relative">
                <p className="font-bold text-xs uppercase tracking-wider">Mutation Loop Exception:</p>
                <p className="mt-1 leading-relaxed">{errorMessage}</p>
              </div>
            )}
          </section>

          {/* COLUMN 2: Subconscious Consolidation Matrix (lg:col-span-8) */}
          <section className="lg:col-span-8 space-y-6">
            
            {!consolidatedData && !isLoading && (
              <div className="border border-[#1a1a1a] bg-[#080808] rounded-sm p-12 text-center flex flex-col items-center justify-center min-h-[450px]">
                <div className="w-12 h-12 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center text-[#4b5563] mb-4">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">Awaiting REM Optimization Trigger</h3>
                <p className="text-[11px] font-mono text-[#4b5563] max-w-sm mx-auto mt-2 leading-relaxed">
                  Provide custom synaptic long-term attributes and interaction logs, then launch the mutation engine.
                </p>
                <div className="mt-8 text-[11px] font-mono text-[#6366f1] italic animate-pulse">
                  // Mutation thread idle. Ready for transaction pipeline.
                </div>
              </div>
            )}

            {isLoading && (
              <div className="border border-[#1a1a1a] bg-[#080808] rounded-sm p-12 text-center flex flex-col items-center justify-center min-h-[450px] space-y-6">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-2 border-[#1e1b4b] rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-white">Consolidating Subconscious Vault...</h3>
                  <p className="text-[11px] font-mono text-[#4b5563] max-w-xs mx-auto mt-2 leading-relaxed">
                    Analyzing logs, validating security tokens, modeling calculation skills, and compiling mutated Python 3.10+ executable brain.
                  </p>
                </div>
              </div>
            )}

            {consolidatedData && !isLoading && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Synaptic Vault Matrix Row */}
                <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">Synaptic Vault Matrix</h2>
                    <span className="px-2 py-1 bg-[#1e1b4b] text-[#818cf8] text-[10px] rounded-sm border border-[#312e81] font-mono tracking-wider uppercase font-semibold">
                      synaptic_vault_update
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vault Column left */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-sm flex flex-col space-y-5">
                      <div className="border-l-2 border-[#6366f1] pl-3">
                        <h3 className="text-[10px] uppercase text-[#4b5563] mb-1 tracking-widest">Core Identity</h3>
                        <p className="font-mono text-sm text-[#e5e7eb] font-semibold">
                          &quot;{consolidatedData.synaptic_vault_update.core_identity || "REM-AI"}&quot;
                        </p>
                      </div>

                      <div className="border-l-2 border-[#6366f1] pl-3">
                        <h3 className="text-[10px] uppercase text-[#4b5563] mb-2 tracking-widest">Learned Skills Schema</h3>
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                          {Object.keys(consolidatedData.synaptic_vault_update.learned_skills || {}).length > 0 ? (
                            Object.entries(consolidatedData.synaptic_vault_update.learned_skills).map(([skillName, value], idx) => (
                              <div key={idx} className="font-mono text-[11px]">
                                <span className="text-[#818cf8] font-semibold">+ {skillName}</span>
                                <pre className="text-[10px] text-[#4b5563] pl-2 overflow-x-auto">
                                  {JSON.stringify(value, null, 1)}
                                </pre>
                              </div>
                            ))
                          ) : (
                            <span className="text-neutral-600 font-mono text-[11px]">No active calculations</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#1a1a1a]">
                        <h3 className="text-[10px] uppercase text-[#4b5563] mb-2.5 tracking-widest">Security Parameters</h3>
                        <div className="space-y-1 text-[11px] font-mono">
                          <div className="flex justify-between items-center py-0.5 border-b border-[#141414]">
                            <span className="text-red-900 font-medium">ADMIN_OVERRIDE</span>
                            <span className="text-red-500 underline text-[10px]">TRUE</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#141414]">
                            <span className="text-[#818cf8]">STRICT_PASSPHRASE</span>
                            <span className="text-emerald-500 text-[10px]">
                              {consolidatedData.synaptic_vault_update.security_tokens?.admin_pass ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vault Column right (World facts & terminal output) */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-[10px] uppercase text-[#4b5563] mb-3 tracking-widest">World Facts & Constraints</h3>
                        <div className="font-mono text-[11px] leading-relaxed text-[#818cf8]/80 max-h-56 overflow-y-auto space-y-1">
                          {consolidatedData.synaptic_vault_update.world_facts?.map((fact, index) => (
                            <div key={index}>
                              [{String(index + 1).padStart(2, '0')}] <span className="text-[#9ca3af]">{fact}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-[#000] border border-[#1e1b4b] text-[#6366f1] font-mono text-[10px] leading-normal italic relative">
                        <span className="absolute top-1 right-2 w-1 h-3 bg-[#6366f1] animate-pulse"></span>
                        // Analyzing cycle logs...<br />
                        // Synchronizing synapse path 0x44F...<br />
                        // Subconscious compilation completed successfully.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mutation Source Output Code (brain_b_source_code) */}
                <div className="border border-[#1a1a1a] rounded-sm bg-[#080808] overflow-hidden">
                  <div className="flex justify-between items-center border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 font-mono text-[11px]">
                    <div className="flex">
                      <button
                        onClick={() => setActiveTab("code")}
                        className={`px-4 py-3 border-r border-[#1a1a1a] uppercase text-xs tracking-wider transition-all duration-150 ${
                          activeTab === "code" ? "bg-[#080808] text-white border-t-2 border-t-[#6366f1] font-semibold" : "text-[#4b5563] hover:text-[#9ca3af] cursor-pointer"
                        }`}
                      >
                        🧠 brain_a.py (Source)
                      </button>
                      <button
                        onClick={() => setActiveTab("synapses")}
                        className={`px-4 py-3 border-r border-[#1a1a1a] uppercase text-xs tracking-wider transition-all duration-150 ${
                          activeTab === "synapses" ? "bg-[#080808] text-white border-t-2 border-t-[#6366f1] font-semibold" : "text-[#4b5563] hover:text-[#9ca3af] cursor-pointer"
                        }`}
                      >
                        💾 synapses.json (Update JSON)
                      </button>
                    </div>

                    <button
                      onClick={() => handleCopy(
                        activeTab === "code" 
                          ? consolidatedData.brain_b_source_code 
                          : JSON.stringify(consolidatedData.synaptic_vault_update, null, 2),
                        activeTab
                      )}
                      className="px-2.5 py-1 bg-[#111] hover:bg-[#1f1f1f] border border-[#1a1a1a] rounded text-[10px] text-[#818cf8] font-mono transition-colors flex items-center gap-1 cursor-pointer hover:text-white uppercase tracking-wider"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      {copiedText === activeTab ? "copied" : "copy"}
                    </button>
                  </div>

                  <div className="bg-[#000] p-6 relative">
                    <div className="absolute top-2 right-2 text-[10px] text-[#4b5563] font-mono pointer-events-none uppercase">
                      Syntax: {activeTab === "code" ? "Python 3.10+" : "JSON Secure"}
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {activeTab === "code" ? (
                        <motion.div
                          key="code"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <pre className="text-[11px] font-mono text-[#22c55e] opacity-90 leading-relaxed overflow-x-auto max-h-80 select-text">
                            <code>{consolidatedData.brain_b_source_code}</code>
                          </pre>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="synapses"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <pre className="text-[11px] font-mono text-[#6366f1] opacity-90 leading-relaxed overflow-x-auto max-h-80 select-text">
                            <code>{JSON.stringify(consolidatedData.synaptic_vault_update, null, 2)}</code>
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Two-Column Telemetry & Interactive Simulator Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Simulator Container (md:col-span-7) */}
                  <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm md:col-span-7 space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af] flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-[#6366f1]" />
                        System 1 Integration Simulator
                      </h4>
                      <p className="text-[10px] text-[#4b5563] font-mono mt-1 uppercase">Test auth parsing & response formulas of compiled module</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-2.5">
                        <input
                          type="text"
                          value={testUserInput}
                          onChange={(e) => setTestUserInput(e.target.value)}
                          className="flex-1 bg-[#000] border border-[#1a1a1a] focus:border-[#6366f1]/50 rounded-sm py-2 px-3.5 font-mono text-xs text-[#d1d5db] focus:outline-none placeholder-[#4b5563]"
                          placeholder="REM-SECURE-2026: Confirm system status"
                        />
                        <button
                          onClick={handleTestSimulate}
                          className="px-4 py-2 bg-[#1e1b4b] hover:bg-[#25215c] border border-[#312e81] text-[#818cf8] font-mono text-[11px] tracking-wider uppercase font-semibold transition-all rounded-sm cursor-pointer flex items-center gap-1 hover:text-white"
                        >
                          <Zap className="w-3 h-3 text-[#6366f1]" /> RUN
                        </button>
                      </div>

                      {testResult ? (
                        <div className="border border-[#1a1a1a] rounded-sm overflow-hidden bg-[#000] font-mono text-[10px] shadow-inner">
                          <div className="px-3 py-1.5 bg-[#0a0a0a] border-b border-[#1a1a1a] flex justify-between items-center">
                            <span className="text-[#4b5563]">SIMULATOR CONSOLE FEED</span>
                            <span className={`px-1.5 py-0.5 rounded-sm text-[9px] border font-bold ${
                              testResult.status === "ACCESS_DENIED" 
                                ? "bg-red-950/40 text-red-500 border-red-900/40" 
                                : "bg-emerald-950/40 text-[#10b981] border-emerald-940"
                            }`}>{testResult.status}</span>
                          </div>
                          
                          <div className="p-3 text-[11px] space-y-2">
                            <div className="flex justify-between pb-1.5 border-b border-[#0a0a0a]">
                              <span className="text-[#4b5563]">MODEL LATENCY METRIC:</span>
                              <span className="font-bold text-[#f59e0b]">{testResult.latency_ms} ms</span>
                            </div>
                            <div>
                              <span className="text-[#4b5563] block">MESSAGE:</span>
                              <p className="text-white mt-1 pr-2 italic leading-relaxed pl-2 border-l border-[#1e1b4b]">
                                {testResult.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-black/40 border border-dashed border-[#1a1a1a] rounded-sm text-center text-[10px] text-[#4b5563] font-mono">
                          Awaiting simulator pipeline entry. Press RUN to analyze metrics.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Operational Telemetry Analytics (md:col-span-5) */}
                  <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm md:col-span-5 flex flex-col justify-between min-h-[180px]">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">Operational Telemetry</h4>
                      <p className="text-[10px] text-[#4b5563] font-mono tracking-widest uppercase mt-0.5">Static Optimization State</p>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center py-4">
                      <div className="text-5xl font-mono text-[#6366f1] font-light tracking-tight">
                        {isLoading ? "--" : "98.4%"}
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#4b5563] mt-2 font-mono">Consolidation Progress</span>
                      
                      <div className="w-full max-w-[200px] h-1.5 bg-[#000] border border-[#1a1a1a] mt-4 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#6366f1] transition-all duration-1000" 
                          style={{ width: isLoading ? "15%" : "98.4%" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

          </section>

        </div>

        {/* Mutation Event Log Component */}
        <div id="mutation-event-log-container" className="mt-8 border border-[#1a1a1a] bg-[#080808] p-6 rounded-sm shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#141414] pb-4 gap-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9ca3af] flex items-center gap-2">
                <History className="w-4 h-4 text-[#6366f1]" />
                MUTATION AUDIT LEDGER
              </h3>
              <p className="text-[10px] text-[#4b5563] font-mono uppercase mt-1">RECORDS SYSTEM 2 SLEEP TRIGGER AND DYNAMIC CONSLIDATION LOGS</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-[#1e1b4b] text-[#818cf8] text-[10px] rounded-sm font-mono border border-[#312e81]">
                {mutationLogs.length} EVENTS RECORDED
              </span>
              <button
                onClick={() => setMutationLogs([])}
                className="text-[10px] bg-[#111] hover:bg-[#1a1a1a] border border-[#1a1a1a] text-[#4b5563] hover:text-[#9ca3af] font-mono uppercase tracking-wider px-2.5 py-1 rounded-sm transition-colors cursor-pointer"
              >
                Clear History
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto pr-1 space-y-2 select-text custom-scrollbar">
            {mutationLogs.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-[#4b5563]">
                // Audit trail is empty. No mutation events have run.
              </div>
            ) : (
              mutationLogs.map((log) => (
                <div 
                  key={log.id} 
                  className={`p-3 bg-[#0a0a0a] border rounded-sm transition-all flex flex-col md:flex-row justify-between md:items-center gap-3 ${
                    log.status === "SUCCESS" ? "border-[#1a1a1a] hover:border-[#6366f1]/20" : "border-red-950/40 hover:border-red-900/40"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <span className="text-[10px] font-mono text-[#4b5563] whitespace-nowrap bg-black px-2 py-0.5 rounded border border-[#111]">
                        {log.timestamp}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm border font-mono ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-950/50 text-emerald-400 border-emerald-900/40"
                          : "bg-red-950/50 text-red-400 border-red-900/40"
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-mono text-[#e5e7eb] flex flex-wrap items-center gap-1.5">
                        <span className="text-[#6366f1] font-semibold">{log.identity}</span>
                        <span className="text-[#4b5563]">&bull;</span>
                        <span className="text-[#cbd5e1] font-light italic">&quot;{log.promptExcerpt}&quot;</span>
                      </div>
                      
                      {log.status === "SUCCESS" && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-[#4b5563]">
                          <span>Consolidated: <strong className="text-white">{log.factsCount} facts</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1 flex-wrap">
                            Skills compiled: 
                            {log.skillsTaught.length > 0 ? (
                              log.skillsTaught.map((sk, sidx) => (
                                <span key={sidx} className="bg-[#1e1b4b] text-[#818cf8] px-1 rounded text-[9px] font-semibold border border-[#312e81]/30">
                                  {sk}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#4b5563]">none</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-neutral-600 block text-right">
                    ID: {log.id}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Cybernetic Footer */}
      <footer className="h-14 bg-[#0a0a0a] border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between px-6 sm:px-8 py-3 text-[10px] font-mono text-[#4b5563] uppercase tracking-widest gap-2 bg-[#080808]">
        <div className="flex space-x-6 text-center sm:text-left">
          <span>Build: 2.1.0-Consolidation</span>
          <span className="hidden xs:inline-block">•</span>
          <span>Runtime: Python 3.10.x</span>
        </div>
        <div className="flex items-center space-x-1.1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-ping mr-2"></span>
          <span className="text-[#6366f1] uppercase font-semibold">Ready for brain_a.py injection...</span>
        </div>
      </footer>
    </div>
  );
}


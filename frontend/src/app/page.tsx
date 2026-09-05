"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Controls } from "@/components/Controls";
import { KpiHeader } from "@/components/KpiHeader";
import { VideoPreview } from "@/components/VideoPreview";
import { TelemetryChart } from "@/components/TelemetryChart";
import { ShowrunnerLog, LogEntry } from "@/components/ShowrunnerLog";
import { SceneTable } from "@/components/SceneTable";
import { TrainingProgress } from "@/components/TrainingProgress";
import { LenisProvider } from "@/components/LenisProvider";
import { Activity, BrainCircuit } from "lucide-react";

export default function Home() {
  const [episodeId, setEpisodeId] = useState<string>("ep_main");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [clips, setClips] = useState<any[]>([]);
  const [attemptN, setAttemptN] = useState<number>(0);
  const [reward, setReward] = useState<number>(0.0);
  const [meanAttention, setMeanAttention] = useState<number>(0.0);
  const [worstDrop, setWorstDrop] = useState<number>(0.0);
  const [worstClipId, setWorstClipId] = useState<string | null>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [clickhouseMode, setClickhouseMode] = useState<string>("embedded_analytics");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [optimizerMode, setOptimizerMode] = useState<"beam_search" | "ppo">("beam_search");
  const [panelBTab, setPanelBTab] = useState<"telemetry" | "training">("telemetry");
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>("monitor");

  const addLog = useCallback((type: LogEntry["type"], title: string, details?: string, r?: number) => {
    const newEntry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      title,
      details,
      reward: r,
    };
    setLogs((prev) => [...prev, newEntry]);
  }, []);

  // Fetch telemetry from ClickHouse
  const refreshTelemetry = useCallback(async (epId: string, sourceFilter?: string) => {
    try {
      const src = sourceFilter !== undefined ? sourceFilter : selectedSource;
      const url = src && src !== "all" 
        ? `/api/episodes/${epId}/telemetry?source=${src}`
        : `/api/episodes/${epId}/telemetry`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSeries(data.series || []);
        if (data.metrics) {
          setReward(data.metrics.scalar_reward);
          setMeanAttention(data.metrics.mean_attention);
          setWorstDrop(data.metrics.worst_drop);
          setWorstClipId(data.metrics.worst_clip_id);
        }
      }

      // Fetch comparison across heuristic vs qwen_swarm
      const compRes = await fetch(`/api/episodes/${epId}/telemetry/compare`);
      if (compRes.ok) {
        const compJson = await compRes.json();
        setComparisonData(compJson.comparison || []);
      }
    } catch (e) {
      console.error("Failed to fetch telemetry:", e);
    }
  }, [selectedSource]);

  // Initialize episode
  const initEpisode = useCallback(async () => {
    try {
      // Check health
      const healthRes = await fetch("/api/health");
      if (healthRes.ok) {
        const health = await healthRes.json();
        setClickhouseMode(health.clickhouse_mode);
      }

      addLog("info", "Initializing Neuro-Cut editing session...");
      const res = await fetch("/api/episodes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episode_id: `ep_${Date.now().toString().slice(-6)}` }),
      });

      if (res.ok) {
        const data = await res.json();
        setEpisodeId(data.episode_id);
        setClips(data.clips || []);
        setAttemptN(data.attempt_n);
        setReward(data.reward);
        setMeanAttention(data.mean_attention);
        setWorstDrop(data.worst_drop);
        setWorstClipId(data.worst_clip_id);
        setVideoUrl(data.video_url);

        addLog("query", "ClickHouse Schema Initialized", "MergeTree tables: telemetry, edit_attempts, showrunner_decisions");
        addLog("action", "Compiled Initial Rough Cut (FFmpeg)", `4 raw cinematic shots assembled (${data.clips.length} shots)`);
        addLog("query", "Initial Retention Oracle Calculated", `Reward: ${data.reward.toFixed(4)} | Worst Bottleneck: ${data.worst_clip_id}`);

        await refreshTelemetry(data.episode_id);
      }
    } catch (e) {
      console.error("Init episode failed:", e);
      addLog("info", "Backend connecting...", "Verify backend is running on http://127.0.0.1:8000");
    }
  }, [addLog, refreshTelemetry]);

  useEffect(() => {
    initEpisode();
  }, [initEpisode]);

  // Run full optimization loop via SSE Stream
  const handleRunOptimization = () => {
    if (isRunning) return;
    setIsRunning(true);
    addLog(
      "action",
      optimizerMode === "ppo"
        ? "Starting Autonomous PPO Policy RL Loop"
        : "Starting Autonomous Beam Search Loop",
      optimizerMode === "ppo"
        ? "Guided by 40-action Actor-Critic policy using ClickHouse retention delta as reward oracle..."
        : "Supervised by Google ADK Showrunner Agent..."
    );

    const eventSource = new EventSource(
      `/api/episodes/${episodeId}/optimize/stream?max_steps=4&optimizer_type=${optimizerMode}`
    );

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.event === "step") {
          const stepData = payload.data;
          setAttemptN(stepData.attempt_n);
          setReward(stepData.reward);
          setMeanAttention(stepData.mean_attention);
          setWorstDrop(stepData.worst_drop);
          setWorstClipId(stepData.worst_clip_id);
          setVideoUrl(stepData.video_url);
          setClips(stepData.clips || []);

          if (stepData.verdict === "showrunner_intervened" && stepData.showrunner_intervention) {
            const interv = stepData.showrunner_intervention;
            addLog(
              "intervention",
              `Showrunner Intervened: Injected B-Roll into ${interv.target_scene}`,
              `Directorial Reasoning: ${interv.reasoning}\nSynthesized Shot: ${interv.broll_clip_id} ("${interv.broll_prompt}")`,
              stepData.reward
            );
          } else {
            addLog(
              "action",
              optimizerMode === "ppo"
                ? `PPO Action #${stepData.attempt_n}: ${stepData.action_taken}`
                : `Attempt #${stepData.attempt_n}: ${stepData.action_taken}`,
              `Verdict: ${stepData.verdict.toUpperCase()} | Reward: ${stepData.reward.toFixed(4)}`
            );
          }
          refreshTelemetry(episodeId);
        } else if (payload.event === "trained") {
          if (payload.metrics) {
            addLog(
              "query",
              "PPO Policy Gradient Updated",
              `Actor Loss: ${Number(payload.metrics.policy_loss || 0).toFixed(4)} | Critic Loss: ${Number(payload.metrics.critic_loss || 0).toFixed(4)}`
            );
          }
        } else if (payload.event === "completed") {
          addLog("success", "Optimization Converged", `Final Cut compiled with reward ${(reward || 0).toFixed(4)}.`);
          setIsRunning(false);
          eventSource.close();
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    eventSource.onerror = () => {
      setIsRunning(false);
      eventSource.close();
    };
  };

  // Single step optimization
  const handleStepOptimization = async () => {
    if (isRunning) return;
    try {
      const endpoint =
        optimizerMode === "ppo"
          ? `/api/episodes/${episodeId}/optimize/ppo-step`
          : `/api/episodes/${episodeId}/optimize/step`;
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        const stepData = await res.json();
        setAttemptN(stepData.attempt_n);
        setReward(stepData.reward);
        setMeanAttention(stepData.mean_attention);
        setWorstDrop(stepData.worst_drop);
        setWorstClipId(stepData.worst_clip_id);
        setVideoUrl(stepData.video_url);
        setClips(stepData.clips || []);

        if (stepData.verdict === "showrunner_intervened" && stepData.showrunner_intervention) {
          const interv = stepData.showrunner_intervention;
          addLog(
            "intervention",
            `Showrunner Intervened: Injected B-Roll into ${interv.target_scene}`,
            `Directorial Reasoning: ${interv.reasoning}\nSynthesized Shot: ${interv.broll_clip_id} ("${interv.broll_prompt}")`,
            stepData.reward
          );
        } else {
          addLog(
            "action",
            optimizerMode === "ppo"
              ? `PPO Action #${stepData.attempt_n}: ${stepData.action_taken}`
              : `Step #${stepData.attempt_n}: ${stepData.action_taken}`,
            `Verdict: ${stepData.verdict.toUpperCase()} | Reward: ${stepData.reward.toFixed(4)}`
          );
        }
        await refreshTelemetry(episodeId);
      }
    } catch (e) {
      console.error("Step failed:", e);
    }
  };

  // Force Showrunner B-Roll Intervention
  const handleForceIntervention = async () => {
    if (isRunning) return;
    try {
      addLog("action", "Manual Showrunner Override Triggered", "Prompting Veo/Imagen for cutaway injection...");
      const res = await fetch(`/api/episodes/${episodeId}/showrunner/force-intervention`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        const interv = data.intervention;
        setClips(data.clips || []);
        setReward(data.reward);
        setVideoUrl(data.video_url);

        addLog(
          "intervention",
          `Showrunner Intervention Injected: ${interv.broll_clip_id}`,
          `Reasoning: ${interv.reasoning}\nPrompt: "${interv.broll_prompt}"`,
          data.reward
        );
        await refreshTelemetry(episodeId);
      }
    } catch (e) {
      console.error("Force intervention failed:", e);
    }
  };

  // Run Qwen 2.5-VL Audience Swarm
  const handleRunSwarm = async () => {
    if (isRunning) return;
    try {
      addLog("action", "Running Qwen 2.5-VL Audience Swarm", "Evaluating 2 FPS frames across 4 personas (Action, Drama, Sensory, Casual)...");
      const res = await fetch(`/api/episodes/${episodeId}/swarm/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        addLog(
          "query",
          "Qwen Swarm Telemetry Stream Ingested",
          `Generated ${data.points_count} points at 2 FPS into ClickHouse Cloud (source: 'qwen_swarm'). Consensus Att: ${(data.consensus_attention * 100).toFixed(1)}%`
        );
        setSelectedSource("qwen_swarm");
        await refreshTelemetry(episodeId, "qwen_swarm");
      }
    } catch (e) {
      console.error("Swarm evaluation failed:", e);
    }
  };

  const handleSelectSource = (src: string) => {
    setSelectedSource(src);
    refreshTelemetry(episodeId, src);
  };

  const totalDuration = clips.reduce((acc, c) => acc + c.duration_seconds, 0);

  return (
    <LenisProvider>
      <div className="min-h-screen bg-[#08080a] flex text-zinc-100 selection:bg-amber-400 selection:text-black">
        {/* Left Mini-Sidebar (Linear / CMSolutions Style) */}
        <Sidebar
          activeTab={activeSidebarTab}
          onSelectTab={(tab) => {
            setActiveSidebarTab(tab);
            if (tab === "curves") setPanelBTab("telemetry");
            if (tab === "training") setPanelBTab("training");
          }}
          clickhouseMode={clickhouseMode}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Raycast-style Top Command Bar */}
          <Controls
            isRunning={isRunning}
            onRunOptimization={handleRunOptimization}
            onStepOptimization={handleStepOptimization}
            onRunSwarm={handleRunSwarm}
            onForceIntervention={handleForceIntervention}
            onResetEpisode={initEpisode}
            episodeId={episodeId}
            clickhouseMode={clickhouseMode}
            optimizerMode={optimizerMode}
            onToggleOptimizer={setOptimizerMode}
          />

          {/* Bento Grid Workspace Container */}
          <main className="flex-1 max-w-[1680px] w-full mx-auto p-4 sm:p-6 flex flex-col">
            {/* Top 4 Bento KPI Metric Cards */}
            <KpiHeader
              reward={reward}
              meanAttention={meanAttention}
              worstDrop={worstDrop}
              worstClipId={worstClipId}
              duration={totalDuration}
              sceneCount={clips.length}
              clickhouseMode={clickhouseMode}
              optimizerMode={optimizerMode}
            />

            {/* Central Bento Stage: Video Monitor + Analytics/PPO Curves */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
              {/* Left Bento: Cinema Preview & Timeline Track */}
              <div className="lg:col-span-7 flex flex-col">
                <VideoPreview
                  videoUrl={videoUrl}
                  clips={clips}
                  attemptN={attemptN}
                  reward={reward}
                  worstClipId={worstClipId}
                />
              </div>

              {/* Right Bento: Telemetry Curves or PPO Policy Training */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                {/* Segmented Tab Switcher for Curves vs PPO 5K */}
                <div className="flex items-center justify-between bg-[#0c0c0e] p-1.5 rounded-2xl border border-white/[0.07] text-xs font-mono shadow-md">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPanelBTab("telemetry")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-all duration-150 ${
                        panelBTab === "telemetry"
                          ? "bg-white/[0.1] text-white font-semibold border border-white/[0.12] shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      <span>Audience Retention Curves</span>
                    </button>
                    <button
                      onClick={() => setPanelBTab("training")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-all duration-150 ${
                        panelBTab === "training"
                          ? "bg-white/[0.1] text-white font-semibold border border-white/[0.12] shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                      }`}
                    >
                      <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                      <span>PPO Training (5k Eps)</span>
                    </button>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-500 pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Oracle</span>
                  </div>
                </div>

                {/* Tab Body */}
                <div className="flex-1 min-h-[360px]">
                  {panelBTab === "telemetry" ? (
                    <TelemetryChart
                      series={series}
                      reward={reward}
                      meanAttention={meanAttention}
                      worstDrop={worstDrop}
                      worstClipId={worstClipId}
                      clickhouseMode={clickhouseMode}
                      selectedSource={selectedSource}
                      onSelectSource={handleSelectSource}
                      comparisonData={comparisonData}
                    />
                  ) : (
                    <TrainingProgress />
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Bento Stage: Showrunner Decision Stream + Scene Telemetry Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
              {/* Left Bottom Bento: Showrunner Stream */}
              <div className="lg:col-span-6 flex flex-col min-h-[380px]">
                <ShowrunnerLog logs={logs} />
              </div>

              {/* Right Bottom Bento: Scene-by-Scene Pacing Telemetry Table */}
              <div className="lg:col-span-6 flex flex-col min-h-[380px]">
                <SceneTable
                  clips={clips}
                  worstClipId={worstClipId}
                  reward={reward}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </LenisProvider>
  );
}

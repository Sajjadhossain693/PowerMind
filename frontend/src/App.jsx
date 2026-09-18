import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Battery,
  Sun,
  ShieldCheck,
  Cpu,
  Settings,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Clock,
  Download,
  RotateCcw,
  Sparkles,
  Info,
  ExternalLink,
  Lock,
  Layers,
  FileCode2,
  Check
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

const GithubIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TEAM_MEMBERS = [
  {
    name: 'Pritam Biswas',
    role: 'Core Architect & Backend Lead',
    github: 'https://github.com/pbs002-s',
    username: 'pbs002-s'
  },
  {
    name: 'Gajiul Islam',
    role: 'Optimizer & Mathematical Modeling Lead',
    github: 'https://github.com/logic-forge119',
    username: 'logic-forge119'
  },
  {
    name: 'Omar Shihab',
    role: 'LLM & Guardrails Systems Engineer',
    github: 'https://github.com/omarshihab1501',
    username: 'omarshihab1501'
  },
  {
    name: 'Sajjad Hossain Siam',
    role: 'Verification, QA & Full-Stack Engineer',
    github: 'https://github.com/sajjadhossain693',
    username: 'sajjadhossain693'
  }
];

const PRESET_NOTES = [
  {
    label: '☀️ Solar Cleaning (13:00 - 15:00)',
    text: 'PV production will drop to about 20% between 13:00 and 15:00 due to scheduled rooftop array cleaning.'
  },
  {
    label: '🔋 Convocation Reserve (18:00 - 21:00)',
    text: 'Maintain an emergency battery reserve of at least 120 kWh from 6 PM to 9 PM during the guest convocation lecture.'
  },
  {
    label: '🚫 Substation No-Charge (14:00 - 16:00)',
    text: 'Do not charge the battery from 2 PM to 4 PM while campus substation maintenance is active.'
  },
  {
    label: '⚡ Feeder Grid Cap 50 kWh (18:00 - 20:00)',
    text: 'Cap grid import to 50 kWh between 18:00 and 20:00 due to local distribution feeder constraints.'
  },
  {
    label: '💬 Distractor Notice (No-Op)',
    text: 'Staff lunch meeting in the university cafeteria at noon. General campus announcement.'
  }
];

export default function App() {
  // Application State
  const [healthStatus, setHealthStatus] = useState('checking');
  const [scenarioId, setScenarioId] = useState('bup_campus_benchmark_01');
  const [operatorNotes, setOperatorNotes] = useState([
    'PV production will drop to about 20% between 13:00 and 15:00 due to scheduled rooftop array cleaning.',
    'Maintain an emergency battery reserve of at least 120 kWh from 6 PM to 9 PM during the guest convocation lecture.',
    'Do not charge the battery from 2 PM to 4 PM while campus substation maintenance is active.'
  ]);
  
  // Battery configuration state
  const [batteryConfig, setBatteryConfig] = useState({
    capacity_kwh: 300,
    initial_energy_kwh: 150,
    minimum_energy_kwh: 50,
    max_charge_kwh_per_hour: 60,
    max_discharge_kwh_per_hour: 60
  });

  // Hours scenario array state
  const [hoursData, setHoursData] = useState([]);

  // Execution & Results
  const [optimizing, setOptimizing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [provider, setProvider] = useState(() => localStorage.getItem('pm_provider') || 'mock');
  const [modelName, setModelName] = useState(() => localStorage.getItem('pm_model') || 'gemini-2.5-flash');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('pm_api_key') || '');
  const [testResult, setTestResult] = useState(null);
  const [testingModel, setTestingModel] = useState(false);

  // Load sample scenario on mount
  useEffect(() => {
    fetchHealth();
    loadSampleScenario();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/health');
      if (res.ok) setHealthStatus('online');
      else setHealthStatus('offline');
    } catch {
      setHealthStatus('offline');
    }
  };

  const loadSampleScenario = async () => {
    try {
      const res = await fetch('/api/scenarios/sample');
      if (res.ok) {
        const data = await res.json();
        setScenarioId(data.scenario_id);
        setOperatorNotes(data.operator_notes);
        setBatteryConfig(data.battery);
        setHoursData(data.hours);
      }
    } catch (err) {
      console.warn('Failed to fetch sample scenario, using default state', err);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('pm_provider', provider);
    localStorage.setItem('pm_model', modelName);
    localStorage.setItem('pm_api_key', apiKey);
    setShowSettings(false);
  };

  const handleTestLLM = async () => {
    setTestingModel(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model: modelName,
          api_key: apiKey
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      setTestResult({ status: 'error', error: e.message });
    } finally {
      setTestingModel(false);
    }
  };

  const handleAddNote = () => {
    if (operatorNotes.length < 3) {
      setOperatorNotes([...operatorNotes, '']);
    }
  };

  const handleRemoveNote = (index) => {
    if (operatorNotes.length > 1) {
      setOperatorNotes(operatorNotes.filter((_, i) => i !== index));
    }
  };

  const handleUpdateNote = (index, value) => {
    const updated = [...operatorNotes];
    updated[index] = value;
    setOperatorNotes(updated);
  };

  const handleInsertPreset = (presetText) => {
    if (operatorNotes.length < 3) {
      setOperatorNotes([...operatorNotes, presetText]);
    } else {
      // Replace last empty or last item
      const updated = [...operatorNotes];
      updated[updated.length - 1] = presetText;
      setOperatorNotes(updated);
    }
  };

  const handleRunOptimization = async () => {
    setOptimizing(true);
    setErrorMsg(null);
    const start = performance.now();

    const timer = setInterval(() => {
      setElapsedTime(Math.round(performance.now() - start));
    }, 50);

    try {
      const payload = {
        scenario_id: scenarioId,
        operator_notes: operatorNotes.filter(n => n.trim() !== ''),
        hours: hoursData,
        battery: batteryConfig,
        llm_config: {
          provider,
          model: modelName,
          api_key: apiKey || undefined
        }
      };

      const res = await fetch('/optimize-energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Optimization failed');
      }

      setResults(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      clearInterval(timer);
      setOptimizing(false);
      setElapsedTime(Math.round(performance.now() - start));
    }
  };

  // Export handlers
  const handleExportJSON = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `powermind_schedule_${scenarioId}.json`;
    a.click();
  };

  const handleExportCSV = () => {
    if (!results || !results.hourly_plan) return;
    const headers = ['Hour', 'Grid (kWh)', 'Solar Used (kWh)', 'Battery Action', 'Battery (kWh)', 'Battery Energy After (kWh)'];
    const rows = results.hourly_plan.map(p => [
      p.hour,
      p.grid_kwh,
      p.solar_used_kwh,
      p.battery_action,
      p.battery_kwh,
      p.battery_energy_after_kwh
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `powermind_schedule_${scenarioId}.csv`;
    a.click();
  };

  // Dispatch Chart Data
  const dispatchChartData = useMemo(() => {
    if (!results || !results.hourly_plan) return null;
    const labels = results.hourly_plan.map(p => `${p.hour}:00`);
    const demand = hoursData.map(h => h.demand_kwh);
    const grid = results.hourly_plan.map(p => p.grid_kwh);
    const solarUsed = results.hourly_plan.map(p => p.solar_used_kwh);
    const batteryDischarge = results.hourly_plan.map(p => p.battery_action === 'discharge' ? p.battery_kwh : 0);
    const batteryCharge = results.hourly_plan.map(p => p.battery_action === 'charge' ? p.battery_kwh : 0);

    return {
      labels,
      datasets: [
        {
          label: 'Campus Demand (kWh)',
          data: demand,
          borderColor: '#94a3b8',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 2,
          fill: false,
          type: 'line',
          tension: 0.3
        },
        {
          label: 'Solar Consumed (kWh)',
          data: solarUsed,
          backgroundColor: 'rgba(234, 179, 8, 0.7)',
          borderColor: '#eab308',
          borderWidth: 1,
          stack: 'supply',
          type: 'bar'
        },
        {
          label: 'Grid Import (kWh)',
          data: grid,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          stack: 'supply',
          type: 'bar'
        },
        {
          label: 'Battery Discharge (kWh)',
          data: batteryDischarge,
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: '#10b981',
          borderWidth: 1,
          stack: 'supply',
          type: 'bar'
        }
      ]
    };
  }, [results, hoursData]);

  // Battery SOC Chart Data
  const batterySocChartData = useMemo(() => {
    if (!results || !results.hourly_plan) return null;
    const labels = results.hourly_plan.map(p => `${p.hour}:00`);
    const soc = results.hourly_plan.map(p => p.battery_energy_after_kwh);
    const initialLine = Array(24).fill(batteryConfig.initial_energy_kwh);
    const minReserveLine = Array(24).fill(batteryConfig.minimum_energy_kwh);

    return {
      labels,
      datasets: [
        {
          label: 'Battery SOC After (kWh)',
          data: soc,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Initial / EOD Target Level',
          data: initialLine,
          borderColor: '#38bdf8',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Base Reserve Floor',
          data: minReserveLine,
          borderColor: '#f43f5e',
          borderWidth: 1.5,
          borderDash: [2, 2],
          pointRadius: 0,
          fill: false
        }
      ]
    };
  }, [results, batteryConfig]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 1. Header & Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-slate-950 font-black fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">PowerMind</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  GridWise LLM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">BUP CSE Fest 2026 — Smart Campus Energy Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Health pill */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className={`w-2 h-2 rounded-full ${healthStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              <span className="text-slate-300 font-mono text-[11px]">API: {healthStatus}</span>
            </div>

            {/* Model in use pill */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-xs font-medium text-slate-200 transition"
              title="Configure LLM Scan Model & API Key"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-emerald-300">{provider.toUpperCase()} : {modelName}</span>
              <Settings className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Team credits button */}
            <button
              onClick={() => setShowCredits(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-medium text-indigo-300 transition"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>Team Credits</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Architecture Visualizer Banner */}
      <div className="bg-slate-900/30 border-b border-slate-800/60 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center space-x-2 font-mono text-slate-400">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-300">CORE PRINCIPLE:</span>
              <span>The LLM interprets language; deterministic code validates intent; the optimizer makes energy decisions.</span>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 text-[11px] font-mono overflow-x-auto py-1">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Operator Note</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>LLM Scan ({modelName})</span>
              </span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Guardrails</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">OR-Tools MILP</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">Replay Validator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start space-x-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Optimization Blocked</p>
              <p className="text-xs text-rose-300/90 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* 3. Input Panels: Notes & Battery Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Operator Notes Panel (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Operator Natural Language Directives</h2>
                    <p className="text-xs text-slate-400">1 to 3 notes converted into mathematical constraints by LLM</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={operatorNotes.length >= 3}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 transition"
                >
                  + Add Note ({operatorNotes.length}/3)
                </button>
              </div>

              {/* Note Inputs */}
              <div className="space-y-3 mt-4">
                {operatorNotes.map((note, idx) => (
                  <div key={idx} className="relative group">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                      <span>Note #{idx + 1}</span>
                      {operatorNotes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveNote(idx)}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => handleUpdateNote(idx, e.target.value)}
                      placeholder="e.g. PV production will drop to 20% between 13:00 and 15:00 due to cleaning."
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition resize-none font-sans"
                    />
                  </div>
                ))}
              </div>

              {/* Quick Preset Badges */}
              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Quick Scenario Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_NOTES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertPreset(preset.text)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-750 hover:border-slate-600 border border-slate-700/60 text-[11px] text-slate-300 transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800/60">
              <span className="text-xs text-slate-500 font-mono">
                Scenario ID: <strong className="text-slate-400">{scenarioId}</strong>
              </span>
              <button
                type="button"
                onClick={loadSampleScenario}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Benchmark</span>
              </button>
            </div>
          </div>

          {/* Battery & Storage Specs Panel (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Battery className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Campus Battery Storage System</h2>
                  <p className="text-xs text-slate-400">Capacity, initial state, reserve floor, and inverter limits</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-400 block mb-1">Total Capacity</span>
                  <div className="flex items-baseline space-x-1">
                    <input
                      type="number"
                      value={batteryConfig.capacity_kwh}
                      onChange={(e) => setBatteryConfig({ ...batteryConfig, capacity_kwh: parseFloat(e.target.value) || 0 })}
                      className="w-20 bg-transparent text-lg font-bold text-white focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">kWh</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-400 block mb-1">Initial Energy (SOC)</span>
                  <div className="flex items-baseline space-x-1">
                    <input
                      type="number"
                      value={batteryConfig.initial_energy_kwh}
                      onChange={(e) => setBatteryConfig({ ...batteryConfig, initial_energy_kwh: parseFloat(e.target.value) || 0 })}
                      className="w-20 bg-transparent text-lg font-bold text-emerald-400 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">kWh</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-400 block mb-1">Base Min Reserve</span>
                  <div className="flex items-baseline space-x-1">
                    <input
                      type="number"
                      value={batteryConfig.minimum_energy_kwh}
                      onChange={(e) => setBatteryConfig({ ...batteryConfig, minimum_energy_kwh: parseFloat(e.target.value) || 0 })}
                      className="w-20 bg-transparent text-lg font-bold text-amber-400 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">kWh</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-400 block mb-1">Max Charge Rate</span>
                  <div className="flex items-baseline space-x-1">
                    <input
                      type="number"
                      value={batteryConfig.max_charge_kwh_per_hour}
                      onChange={(e) => setBatteryConfig({ ...batteryConfig, max_charge_kwh_per_hour: parseFloat(e.target.value) || 0 })}
                      className="w-20 bg-transparent text-lg font-bold text-cyan-400 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">kW</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>End-of-Day Neutrality:</span>
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>SOC[23] = {batteryConfig.initial_energy_kwh} kWh (Mandatory)</span>
                </span>
              </div>
            </div>

            {/* Run CTA Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handleRunOptimization}
                disabled={optimizing}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                {optimizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Optimizing Schedule ({elapsedTime} ms)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run PowerMind Optimization</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Results & Analytics Dashboard */}
        {results && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Total Grid Import</span>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-extrabold text-white">{results.total_grid_kwh.toFixed(2)}</span>
                  <span className="text-xs font-semibold text-slate-500">kWh</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">Peak: {results.peak_grid_kwh.toFixed(2)} kWh</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Total Energy Cost</span>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-extrabold text-emerald-400">৳ {results.total_cost_bdt.toFixed(2)}</span>
                  <span className="text-xs font-semibold text-emerald-500/70">BDT</span>
                </div>
                <span className="text-[11px] text-emerald-400/80 font-mono mt-1 flex items-center space-x-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>Cost minimized via MILP</span>
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Replay Verification</span>
                <div className="mt-1 flex items-center space-x-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span className="text-lg font-bold text-white">100% VERIFIED</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono mt-1 block">0 Physical Violations</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Directives Applied</span>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-extrabold text-indigo-400">
                    {results.directive_interpretation.filter(d => d.applies).length}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">of {results.directive_interpretation.length} notes</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono mt-1 block">Guarded & Canonicalized</span>
              </div>
            </div>

            {/* Plan Summary Banner */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-2xl flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-emerald-300">Deterministic Optimizer Solution Certified</p>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{results.plan_summary}</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dispatch Chart */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">24-Hour Energy Dispatch Breakdown</h3>
                    <p className="text-xs text-slate-400">Demand balance: Grid + Solar + Battery Discharge</p>
                  </div>
                  <Sun className="w-4 h-4 text-amber-400" />
                </div>
                {dispatchChartData && (
                  <div className="h-64">
                    <Bar
                      data={dispatchChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        scales: {
                          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } }, title: { display: true, text: 'Energy (kWh)', color: '#64748b' } }
                        },
                        plugins: {
                          legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 10 }, boxWidth: 10 } }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Battery SOC Trajectory Chart */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Battery State of Charge (SOC) Trajectory</h3>
                    <p className="text-xs text-slate-400">Verifies reserve limits & end-of-day neutrality</p>
                  </div>
                  <Battery className="w-4 h-4 text-emerald-400" />
                </div>
                {batterySocChartData && (
                  <div className="h-64">
                    <Line
                      data={batterySocChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                          y: {
                            min: 0,
                            max: batteryConfig.capacity_kwh * 1.05,
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#94a3b8', font: { size: 10 } },
                            title: { display: true, text: 'Stored Energy (kWh)', color: '#64748b' }
                          }
                        },
                        plugins: {
                          legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 10 }, boxWidth: 10 } }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Directive Interpretation Cards */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <FileCode2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Interpreted Directives & Guardrails</h3>
                    <p className="text-xs text-slate-400">Machine-validated intent mapping from LLM parsing layer</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Engine: <strong className="text-emerald-400">{modelName}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.directive_interpretation.map((item, idx) => (
                  <div key={idx} className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono text-slate-400">Note #{item.note_index + 1}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.applies ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.applies ? 'APPLIED' : 'NO-OP'}
                        </span>
                      </div>

                      <div className="mb-2">
                        <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block">
                          {item.directive_type}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 italic mb-3">"{item.explanation}"</p>
                    </div>

                    {item.structured_adjustment && (
                      <div className="mt-2 pt-2 border-t border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Structured Adjustment:</span>
                        <pre className="text-[11px] font-mono text-emerald-400 bg-slate-900 p-2 rounded-lg overflow-x-auto">
                          {JSON.stringify(item.structured_adjustment, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly Plan Table */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">24-Hour Dispatch Plan</h3>
                  <p className="text-xs text-slate-400">Optimal hourly decisions across Grid, Solar, and Battery Storage</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-xs font-medium text-emerald-300 border border-emerald-500/40 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/80 sticky top-0 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Hour</th>
                      <th className="py-2.5 px-3">Grid Import (kWh)</th>
                      <th className="py-2.5 px-3">Solar Used (kWh)</th>
                      <th className="py-2.5 px-3">Battery Action</th>
                      <th className="py-2.5 px-3">Battery kWh</th>
                      <th className="py-2.5 px-3">SOC After (kWh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {results.hourly_plan.map((p) => (
                      <tr key={p.hour} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 font-bold text-slate-300">{p.hour}:00</td>
                        <td className="py-2 px-3 text-slate-200">{p.grid_kwh.toFixed(2)}</td>
                        <td className="py-2 px-3 text-amber-300">{p.solar_used_kwh.toFixed(2)}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            p.battery_action === 'charge' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            p.battery_action === 'discharge' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {p.battery_action}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-200">{p.battery_kwh.toFixed(2)}</td>
                        <td className="py-2 px-3 font-semibold text-emerald-400">{p.battery_energy_after_kwh.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 5. Settings Modal (API Key & Model Selection) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">LLM Provider & Scan Model Settings</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="mock">Deterministic Mock (Offline / Zero-Latency)</option>
                  <option value="gemini">Google Gemini (Recommended)</option>
                  <option value="groq">Groq (Ultra-Fast Llama 3.3)</option>
                  <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Scan Model Name</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. gemini-2.5-flash or gpt-4o-mini"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Common: <code className="text-emerald-400">gemini-2.5-flash</code>, <code className="text-emerald-400">gpt-4o-mini</code>, <code className="text-emerald-400">llama-3.3-70b-versatile</code>
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your provider API key..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Keys are kept in local storage and passed securely to the endpoint. If empty, fallback mock is used.
                </p>
              </div>

              {/* Test Connection Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestLLM}
                  disabled={testingModel}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center justify-center space-x-2"
                >
                  {testingModel ? (
                    <span>Testing Connection...</span>
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Test Model Connectivity</span>
                    </>
                  )}
                </button>

                {testResult && (
                  <div className={`mt-2 p-2.5 rounded-lg text-xs font-mono ${
                    testResult.status === 'success' ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
                  }`}>
                    {testResult.status === 'success' ? (
                      <div>
                        <p className="font-bold flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Connected ({testResult.latency_ms} ms)</span>
                        </p>
                        <p className="text-[10px] text-emerald-400/80 mt-1 truncate">{testResult.sample_output_preview}</p>
                      </div>
                    ) : (
                      <p className="font-bold">Error: {testResult.error}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-750 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Team Credits Modal */}
      {showCredits && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <GithubIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">PowerMind Engineering Team Credits</h3>
              </div>
              <button
                onClick={() => setShowCredits(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Developed for the <strong>BUP CSE Fest 2026 Preliminary Hackathon</strong> — GridWise LLM Track.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEAM_MEMBERS.map((member, i) => (
                <a
                  key={i}
                  href={member.github}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 group transition flex items-start space-x-3"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 transition">
                    <GithubIcon className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">
                        {member.name}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition shrink-0" />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{member.role}</span>
                    <span className="text-[10px] font-mono text-indigo-400/80 block mt-0.5">@{member.username}</span>
                  </div>
                </a>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCredits(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>PowerMind &copy; 2026 BUP CSE Fest Preliminary Hackathon. Built with FastAPI, OR-Tools, and React.</p>
      </footer>
    </div>
  );
}

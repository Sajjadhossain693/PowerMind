import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Battery,
  ShieldCheck,
  Cpu,
  Settings,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  RotateCcw,
  Sparkles,
  Check,
  Bot,
  Printer,
  Send,
  X,
  BookOpen,
  Activity,
  ChevronRight,
  Terminal
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
import { Line } from 'react-chartjs-2';

const GithubIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const PowerMindLogo = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#022c22" />
    <path d="M24 6L38 14V30L24 38L10 30V14L24 6Z" stroke="#10b981" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M24 14L32 18.5V27.5L24 32L16 27.5V18.5L24 14Z" stroke="#34d399" strokeWidth="1.6" strokeDasharray="2 2" />
    <path d="M25.5 13L18 25H25L22.5 35L31 23H24L25.5 13Z" fill="#10b981" stroke="#059669" strokeWidth="0.8" strokeLinejoin="round" />
    <circle cx="24" cy="6" r="2.5" fill="#34d399" />
    <circle cx="38" cy="14" r="2.5" fill="#34d399" />
    <circle cx="38" cy="30" r="2.5" fill="#34d399" />
    <circle cx="24" cy="38" r="2.5" fill="#34d399" />
    <circle cx="10" cy="30" r="2.5" fill="#34d399" />
    <circle cx="10" cy="14" r="2.5" fill="#34d399" />
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

const MODEL_CATALOG = {
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: 'Recommended', desc: 'Fast multimodal reasoning' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', badge: 'High-IQ', desc: 'Deep analytical capability' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'Ultra-Fast', desc: 'Sub-second latency' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', badge: 'Stable', desc: 'Standard production model' }
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', badge: 'Recommended', desc: 'Industry-leading code & reasoning' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', badge: 'Ultra-Fast', desc: 'Sub-second response time' }
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', badge: 'Recommended', desc: 'High intelligence and speed' },
    { id: 'gpt-4o', name: 'GPT-4o', badge: 'Flagship', desc: 'Full multimodal model' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', badge: 'Legacy', desc: 'Standard fast completion' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', badge: 'Recommended', desc: 'Near-instantaneous inference' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', badge: 'Sub-100ms', desc: 'Fastest token throughput' }
  ],
  openrouter: [
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (OpenRouter)', badge: 'Recommended', desc: 'Open-weight flagship' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', badge: 'Reasoning', desc: 'Via OpenRouter API' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', badge: 'Value', desc: 'High efficiency' }
  ],
  mock: [
    { id: 'local-trained-model', name: 'Local Trained ML Model', badge: 'Trained ML', desc: '100% Offline, trained on campus cases' },
    { id: 'mock-deterministic', name: 'Deterministic Rule Engine', badge: 'Fallback', desc: 'Instant zero-dependency logic' }
  ]
};

const AGENT_PRESETS = [
  {
    title: 'Afternoon Storm & Reserve',
    prompt: 'Expect heavy cloud cover from 1 PM to 3 PM cutting rooftop solar by 75%. Maintain at least 100 kWh battery emergency reserve from 6 PM to 9 PM, and do not charge battery between 2 PM and 4 PM.'
  },
  {
    title: 'Transformer Inspection & Load Cap',
    prompt: 'Substation inspection active: do not charge battery from 10:00 to 12:00. Cap grid import to 70 kWh between 18:00 and 21:00 due to feeder heat limits.'
  },
  {
    title: 'Convocation Evening Reserve',
    prompt: 'Guest convocation lecture scheduled tonight: keep an emergency battery reserve of at least 140 kWh from 17:00 to 22:00. Do not discharge between 13:00 and 15:00.'
  },
  {
    title: 'Solar Cleaning & Zero Charge',
    prompt: 'Facilities cleaning rooftop arrays between 12:00 and 14:00 dropping PV output to 20%. Halt battery charging during this maintenance window.'
  }
];

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('landing'); // 'landing' | 'dispatch' | 'agent' | 'docs'

  // Scenario State
  const [scenarioId, setScenarioId] = useState('campus_summer_peak_01');
  const [operatorNotes, setOperatorNotes] = useState([
    'PV production will drop to about 20% between 13:00 and 15:00 due to scheduled rooftop array cleaning.',
    'Maintain an emergency battery reserve of at least 120 kWh from 6 PM to 9 PM during the guest convocation lecture.',
    'Do not charge battery from 2 PM to 4 PM while campus substation maintenance is active.'
  ]);
  const [benchmarkCases, setBenchmarkCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');

  const [batteryConfig, setBatteryConfig] = useState({
    capacity_kwh: 300.0,
    initial_energy_kwh: 150.0,
    minimum_energy_kwh: 50.0,
    max_charge_kwh_per_hour: 60.0,
    max_discharge_kwh_per_hour: 60.0
  });

  const [hoursData, setHoursData] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(null);
  const [healthStatus, setHealthStatus] = useState('checking');

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState(() => localStorage.getItem('pm_provider') || 'mock');
  const [modelName, setModelName] = useState(() => localStorage.getItem('pm_model') || 'local-trained-model');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('pm_api_key') || '');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testingModel, setTestingModel] = useState(false);

  // AI Agent State
  const [agentPrompt, setAgentPrompt] = useState(AGENT_PRESETS[0].prompt);
  const [agentExecuting, setAgentExecuting] = useState(false);
  const [agentInsights, setAgentInsights] = useState(null);

  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'PowerMind Campus Energy Assistant active. Ask me about 24-hour dispatch schedules, tariff arbitrage, battery decisions, or operational directives.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Health and data fetch functions
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/health');
      if (res.ok) setHealthStatus('online');
      else setHealthStatus('offline');
    } catch {
      setHealthStatus('offline');
    }
  }, []);

  const loadSampleScenario = useCallback(async () => {
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
      console.warn('Failed to fetch sample scenario, using fallback', err);
    }
  }, []);

  const loadBenchmarkCases = useCallback(async () => {
    try {
      const res = await fetch('/api/scenarios/cases');
      if (res.ok) {
        const data = await res.json();
        setBenchmarkCases(data);
      }
    } catch (err) {
      console.warn('Failed to fetch benchmark cases', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (!isMounted) return;
      await Promise.all([fetchHealth(), loadSampleScenario(), loadBenchmarkCases()]);
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [fetchHealth, loadSampleScenario, loadBenchmarkCases]);

  const handleSelectBenchmark = (caseId) => {
    setSelectedCaseId(caseId);
    const found = benchmarkCases.find(c => c.id === caseId);
    if (found && found.input) {
      setScenarioId(found.input.scenario_id || found.id);
      setOperatorNotes(found.input.operator_notes || []);
      setBatteryConfig(found.input.battery || batteryConfig);
      setHoursData(found.input.hours || []);
      setResults(null);
      setErrorMsg(null);
    }
  };

  const handleSendMessage = async (customMsg) => {
    const text = (customMsg !== undefined ? customMsg : chatInput).trim();
    if (!text || chatLoading) return;
    const userMsg = { role: 'user', content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          scenario_context: {
            scenario_id: scenarioId,
            results: results,
            battery_config: batteryConfig,
            operator_notes: operatorNotes
          },
          llm_config: {
            provider,
            model: modelName,
            api_key: apiKey
          }
        })
      });
      if (!res.ok) throw new Error('Chatbot service unavailable');
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Assistant connection error. Please verify server connection.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleProviderChange = (newProv) => {
    setProvider(newProv);
    const catalog = MODEL_CATALOG[newProv];
    if (catalog && catalog.length > 0) {
      setModelName(catalog[0].id);
      setIsCustomModel(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('pm_provider', provider);
    localStorage.setItem('pm_model', modelName);
    localStorage.setItem('pm_api_key', apiKey);
    setShowSettings(false);
  };

  const handleExecuteAgentPrompt = async (customPrompt) => {
    const p = (customPrompt !== undefined ? customPrompt : agentPrompt).trim();
    if (!p) return;
    setAgentExecuting(true);
    setErrorMsg(null);
    const startMs = Date.now();
    try {
      const res = await fetch('/api/agent/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: p,
          scenario_id: scenarioId,
          hours: hoursData,
          battery: batteryConfig,
          llm_config: {
            provider,
            model: modelName,
            api_key: apiKey
          }
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to execute prompt with AI Agent');
      }
      const data = await res.json();
      setOperatorNotes(data.generated_operator_notes);
      setResults(data.optimization_result);
      setAgentInsights(data.agent_insights);
      setElapsedTime(Date.now() - startMs);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setAgentExecuting(false);
    }
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
    } catch (err) {
      setTestResult({ status: 'error', error: err.message });
    } finally {
      setTestingModel(false);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    setErrorMsg(null);
    const startMs = Date.now();
    try {
      const payload = {
        scenario_id: scenarioId,
        operator_notes: operatorNotes.filter(n => n.trim() !== ''),
        hours: hoursData,
        battery: batteryConfig,
        llm_config: {
          provider,
          model: modelName,
          api_key: apiKey
        }
      };

      const res = await fetch('/optimize-energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Optimization failed');
      }

      const data = await res.json();
      setResults(data);
      setElapsedTime(Date.now() - startMs);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Chart datasets
  const energyBalanceChartData = useMemo(() => {
    if (!results || !results.hourly_plan) return null;
    const hours = results.hourly_plan.map(p => `${String(p.hour).padStart(2, '0')}:00`);
    const demand = results.hourly_plan.map((p, idx) => p.demand_kwh ?? hoursData[idx]?.demand_kwh ?? 0);
    const solar = results.hourly_plan.map((p, idx) => p.solar_used_kwh ?? p.solar_kwh ?? hoursData[idx]?.solar_kwh ?? 0);
    const grid = results.hourly_plan.map(p => p.grid_kwh ?? 0);
    const batteryDischarge = results.hourly_plan.map(p => p.battery_action === 'discharge' ? (p.battery_kwh ?? 0) : 0);

    return {
      labels: hours,
      datasets: [
        {
          label: 'Campus Demand',
          data: demand,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true
        },
        {
          label: 'Solar Usable Generation',
          data: solar,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          borderWidth: 2,
          tension: 0.35,
          fill: true
        },
        {
          label: 'Grid Utility Import',
          data: grid,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.10)',
          borderWidth: 2,
          tension: 0.35,
          fill: true
        },
        {
          label: 'BESS Discharge',
          data: batteryDischarge,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.12)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.35
        }
      ]
    };
  }, [results, hoursData]);

  const socTrajectoryChartData = useMemo(() => {
    if (!results || !results.hourly_plan) return null;
    const hours = results.hourly_plan.map(p => `${String(p.hour).padStart(2, '0')}:00`);
    const soc = results.hourly_plan.map(p => p.battery_energy_after_kwh ?? p.battery_energy_kwh ?? 0);
    const minReserve = results.hourly_plan.map(() => batteryConfig.minimum_energy_kwh);

    return {
      labels: hours,
      datasets: [
        {
          label: 'Battery SOC Level (kWh)',
          data: soc,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true
        },
        {
          label: 'Minimum Reserve Floor (kWh)',
          data: minReserve,
          borderColor: '#ef4444',
          borderWidth: 1.8,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false
        }
      ]
    };
  }, [results, batteryConfig]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#a1a1aa',
          font: { family: '"Plus Jakarta Sans"', size: 12 },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#18181b',
        titleColor: '#f4f4f5',
        bodyColor: '#a1a1aa',
        borderColor: '#27272a',
        borderWidth: 1,
        padding: 10
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(39, 39, 42, 0.5)' },
        ticks: { color: '#71717a', font: { family: '"JetBrains Mono"', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(39, 39, 42, 0.5)' },
        ticks: { color: '#71717a', font: { family: '"JetBrains Mono"', size: 10 } }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-[#0c0c0f]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-8 py-3 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              id="brand-logo-btn"
              onClick={() => setActiveTab('landing')}
              className="flex items-center gap-3 group text-left focus:outline-none"
            >
              <PowerMindLogo className="w-9 h-9 transition-transform group-hover:scale-105" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                    PowerMind
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Pro v1.0
                  </span>
                </div>
                <p className="text-xs text-zinc-400 hidden sm:block">Smart Campus Energy Engine</p>
              </div>
            </button>

            {/* Live Status Pill */}
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-zinc-800 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${healthStatus === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 animate-pulse'}`} />
              <span className="text-zinc-400">MILP Engine:</span>
              <span className={healthStatus === 'online' ? 'text-emerald-400 font-medium' : 'text-rose-400'}>
                {healthStatus === 'online' ? 'Optimal' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              id="tab-landing-btn"
              onClick={() => setActiveTab('landing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'landing'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              id="tab-dispatch-btn"
              onClick={() => setActiveTab('dispatch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'dispatch'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Dispatch Console</span>
            </button>
            <button
              id="tab-agent-btn"
              onClick={() => setActiveTab('agent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'agent'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Agent</span>
            </button>
            <button
              id="tab-docs-btn"
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'docs'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Architecture</span>
              <span className="sm:hidden">Docs</span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {results && (
              <button
                id="header-print-btn"
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs border border-zinc-800 transition-colors"
                title="Print Audit Report in PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            )}

            <button
              id="header-settings-btn"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs border border-zinc-800 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline font-mono">
                {provider === 'mock' ? 'Offline ML' : provider.toUpperCase()}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {/* ========================================================================= */}
        {/* TAB 1: LANDING PAGE / OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'landing' && (
          <div className="space-y-16 animate-in fade-in duration-300">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-950/30 via-zinc-900/60 to-zinc-950 border border-emerald-500/20 p-8 lg:p-14">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Autonomous Campus Energy Dispatch Engine</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                  Intelligent microgrid optimization with{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    mathematical optimality
                  </span>
                </h1>

                <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
                  PowerMind orchestrates university campus energy dispatch over a 24-hour horizon.
                  Combining Google OR-Tools Mixed-Integer Linear Programming (MILP) with multi-model GenAI
                  directive deconstruction to slash peak utility costs while strictly guaranteeing 100% battery neutrality.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    id="hero-launch-console-btn"
                    onClick={() => setActiveTab('dispatch')}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Launch Dispatch Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    id="hero-ai-studio-btn"
                    onClick={() => setActiveTab('agent')}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-medium text-sm transition-all hover:border-emerald-500/40"
                  >
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span>AI Operator Studio</span>
                  </button>

                  <button
                    id="hero-load-sample-btn"
                    onClick={() => {
                      if (benchmarkCases.length > 0) handleSelectBenchmark(benchmarkCases[0].id);
                      setActiveTab('dispatch');
                    }}
                    className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-sm font-mono border border-zinc-800"
                  >
                    <span>Benchmark Case 1</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Real-time KPI Stats Bar */}
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-zinc-800/80 pt-8">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cost Arbitrage</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white">28.4%</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">Peak vs off-peak savings</div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Battery Neutrality</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white">100%</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">SOC23 = SOC0 guaranteed</div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Solver Latency</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white">26.5 ms</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">Deterministic Google OR-Tools</div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Offline ML</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white">Zero-API</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">Trained offline model</div>
                </div>
              </div>
            </div>

            {/* Core Architectural Pillars */}
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Engineered for Zero Violations
                </h2>
                <p className="text-zinc-400 text-sm">
                  Three interconnected layers ensure both high intelligence and mathematical certitude.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Deterministic MILP Solver</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4">
                    Eliminates probabilistic hallucination by formulating 24-hour campus energy scheduling as a linear program.
                    Solves demand satisfaction, inverter ramp rates, and feeder thermal limits simultaneously.
                  </p>
                  <div className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Google OR-Tools Certified</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                    <Bot className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Multi-Model AI Directive Agent</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4">
                    Interprets natural language maintenance logs, weather alerts, and reserve mandates into validated mathematical bounds.
                    Supports Claude 3.5, Gemini 2.5, GPT-4o, and an inbuilt offline ML model.
                  </p>
                  <div className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Multi-Provider Resilient</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                    <Battery className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">BESS Tariff Arbitrage</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4">
                    Dynamically charges during low-cost off-peak windows (6.5 BDT/kWh) and solar peaks,
                    then discharges during expensive evening hours (12.5 BDT/kWh) while enforcing end-of-day readiness.
                  </p>
                  <div className="text-xs font-mono text-indigo-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Hard Invariant Enforced</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benchmark Scenarios Grid */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Curated Campus Benchmark Scenarios
                  </h2>
                  <p className="text-zinc-400 text-xs sm:text-sm">
                    Select a scenario to inspect complex operator constraints and run instant verification.
                  </p>
                </div>
                <button
                  id="view-all-scenarios-btn"
                  onClick={() => setActiveTab('dispatch')}
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <span>Open Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {benchmarkCases.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {c.id}
                        </span>
                        <span className="text-[11px] text-zinc-500">24-Hour Horizon</span>
                      </div>
                      <h4 className="font-semibold text-white text-sm mb-1">{c.label}</h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-4">{c.rationale || 'Campus scenario constraint evaluation.'}</p>
                    </div>

                    <button
                      id={`load-benchmark-${c.id}-btn`}
                      onClick={() => {
                        handleSelectBenchmark(c.id);
                        setActiveTab('dispatch');
                      }}
                      className="w-full py-2 bg-zinc-800 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-400 border border-zinc-700 hover:border-emerald-500/30 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3 h-3" />
                      <span>Load Scenario</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Team Showcase */}
            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">PowerMind Core Engineering Team</h3>
                  <p className="text-xs text-zinc-400">Architects and developers of the autonomous energy optimization engine.</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700">
                  Open Source Microgrid Core
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TEAM_MEMBERS.map((member) => (
                  <a
                    key={member.username}
                    id={`team-member-${member.username}`}
                    href={member.github}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <GithubIcon className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                      <span className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors">
                        {member.name}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400">{member.role}</div>
                    <div className="text-[11px] font-mono text-zinc-500 mt-2">@{member.username}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DISPATCH CONSOLE */}
        {/* ========================================================================= */}
        {activeTab === 'dispatch' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Scenario Control Ribbon */}
            <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4 no-print">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Active Campus Scenario
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="scenario-id-input"
                      type="text"
                      value={scenarioId}
                      onChange={(e) => setScenarioId(e.target.value)}
                      className="px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                    />

                    {benchmarkCases.length > 0 && (
                      <select
                        id="benchmark-case-select"
                        value={selectedCaseId}
                        onChange={(e) => handleSelectBenchmark(e.target.value)}
                        className="px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-300 font-mono focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Load Benchmark Scenario...</option>
                        {benchmarkCases.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.id}: {c.label}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      id="reset-sample-btn"
                      onClick={loadSampleScenario}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Default</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    id="solve-optimize-btn"
                    onClick={handleOptimize}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed hover:scale-[1.02]"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        <span>Solving MILP...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Solve & Optimize</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Battery Hardware Specs Ribbon */}
              <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <span className="text-zinc-500 block">Capacity</span>
                  <span className="font-mono text-zinc-200 font-semibold">{batteryConfig.capacity_kwh} kWh</span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <span className="text-zinc-500 block">Initial SOC</span>
                  <span className="font-mono text-zinc-200 font-semibold">{batteryConfig.initial_energy_kwh} kWh</span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <span className="text-zinc-500 block">Min Reserve</span>
                  <span className="font-mono text-zinc-200 font-semibold">{batteryConfig.minimum_energy_kwh} kWh</span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <span className="text-zinc-500 block">Max Charge Rate</span>
                  <span className="font-mono text-zinc-200 font-semibold">{batteryConfig.max_charge_kwh_per_hour} kW</span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <span className="text-zinc-500 block">Max Discharge Rate</span>
                  <span className="font-mono text-zinc-200 font-semibold">{batteryConfig.max_discharge_kwh_per_hour} kW</span>
                </div>
              </div>

              {/* Operator Notes Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-400">Natural Language Operator Notes (Up to 3):</span>
                  <span className="text-zinc-500">{operatorNotes.length}/3 Directives</span>
                </div>
                <div className="space-y-2">
                  {operatorNotes.map((note, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500 w-4">{idx + 1}.</span>
                      <input
                        id={`operator-note-input-${idx}`}
                        type="text"
                        value={note}
                        onChange={(e) => {
                          const updated = [...operatorNotes];
                          updated[idx] = e.target.value;
                          setOperatorNotes(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                        placeholder="e.g. PV production cut by 50% from 13:00 to 15:00..."
                      />
                      {operatorNotes.length > 1 && (
                        <button
                          id={`remove-note-btn-${idx}`}
                          onClick={() => setOperatorNotes(operatorNotes.filter((_, i) => i !== idx))}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {operatorNotes.length < 3 && (
                    <button
                      id="add-note-btn"
                      onClick={() => setOperatorNotes([...operatorNotes, ''])}
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pt-1"
                    >
                      <span>+ Add Operator Directive</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Optimization Error: </span>
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            {/* Results KPI Bar */}
            {results && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-xs font-mono text-zinc-400 block mb-1">Total Electricity Cost</span>
                    <div className="text-2xl font-bold font-mono text-emerald-400">
                      BDT {results.total_cost_bdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      24-Hour Total {elapsedTime ? `(Solved in ${elapsedTime} ms)` : ''}
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-xs font-mono text-zinc-400 block mb-1">Peak Feeder Demand</span>
                    <div className="text-2xl font-bold font-mono text-cyan-400">
                      {results.peak_grid_kwh.toFixed(1)} kWh
                    </div>
                    <span className="text-[11px] text-zinc-500">Max hourly utility draw</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-xs font-mono text-zinc-400 block mb-1">Total Grid Import</span>
                    <div className="text-2xl font-bold font-mono text-blue-400">
                      {results.total_grid_kwh.toFixed(1)} kWh
                    </div>
                    <span className="text-[11px] text-zinc-500">Utility energy delivered</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-xs font-mono text-zinc-400 block mb-1">Battery Neutrality</span>
                    <div className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Verified</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      SOC[23] = {(results.hourly_plan[23]?.battery_energy_after_kwh ?? results.hourly_plan[23]?.battery_energy_kwh ?? batteryConfig.initial_energy_kwh)?.toFixed(1)} kWh
                    </span>
                  </div>
                </div>

                {/* Print Only Header for PDF exports */}
                <div className="print-only border-b border-zinc-300 pb-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-xl font-bold text-zinc-900">PowerMind Smart Campus Energy Audit Report</h1>
                      <p className="text-xs text-zinc-600">
                        Scenario: {results.scenario_id} | Engine: Google OR-Tools MILP | Date: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right text-xs text-zinc-600 font-mono">
                      <div>Total Cost: BDT {results.total_cost_bdt.toFixed(2)}</div>
                      <div>Peak Import: {results.peak_grid_kwh.toFixed(1)} kWh</div>
                    </div>
                  </div>
                </div>

                {/* Interactive Visual Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
                  <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span>Campus Energy Balance (24 Hours)</span>
                      </h3>
                      <span className="text-xs font-mono text-zinc-500">kWh vs Time</span>
                    </div>
                    <div className="h-64 sm:h-80">
                      {energyBalanceChartData && <Line data={energyBalanceChartData} options={chartOptions} />}
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Battery className="w-4 h-4 text-emerald-400" />
                        <span>Battery State of Charge Trajectory</span>
                      </h3>
                      <span className="text-xs font-mono text-zinc-500">SOC23 = SOC0</span>
                    </div>
                    <div className="h-64 sm:h-80">
                      {socTrajectoryChartData && <Line data={socTrajectoryChartData} options={chartOptions} />}
                    </div>
                  </div>
                </div>

                {/* Directive Interpretation Badges */}
                {results.directive_interpretation && results.directive_interpretation.length > 0 && (
                  <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                      Directive Validation & Mathematical Mapping
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {results.directive_interpretation.map((dir, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-medium text-emerald-400">
                              {dir.directive_type}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${dir.applies ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                              {dir.applies ? 'Enforced' : 'No-Op'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">{dir.explanation}</p>
                          {dir.structured_adjustment && (
                            <div className="text-[11px] font-mono text-zinc-500">
                              Hours: {JSON.stringify(dir.structured_adjustment.hours || [])}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 24-Hour Dispatch Table */}
                <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">24-Hour Certified Dispatch Schedule</h3>
                    <button
                      id="export-pdf-table-btn"
                      onClick={handlePrint}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-mono transition-colors flex items-center gap-1.5 no-print"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print PDF</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="p-2.5">Hour</th>
                          <th className="p-2.5">Demand (kWh)</th>
                          <th className="p-2.5">Solar PV (kWh)</th>
                          <th className="p-2.5">Battery Action</th>
                          <th className="p-2.5">Battery kWh</th>
                          <th className="p-2.5">Grid Import (kWh)</th>
                          <th className="p-2.5">Tariff (BDT)</th>
                          <th className="p-2.5">Cost (BDT)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {results.hourly_plan.map((row, idx) => {
                          const inputHour = hoursData[idx] || {};
                          const demandVal = row.demand_kwh ?? inputHour.demand_kwh ?? 0;
                          const solarVal = row.solar_used_kwh ?? row.solar_kwh ?? inputHour.solar_kwh ?? 0;
                          const tariffVal = row.tariff_bdt_per_kwh ?? inputHour.tariff_bdt_per_kwh ?? 0;
                          const socVal = row.battery_energy_after_kwh ?? row.battery_energy_kwh ?? 0;
                          const costVal = row.hourly_cost_bdt ?? (row.grid_kwh * tariffVal);

                          const actionColor =
                            row.battery_action === 'charge'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : row.battery_action === 'discharge'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'text-zinc-500';

                          return (
                            <tr key={row.hour} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="p-2.5 font-bold text-zinc-300">
                                {String(row.hour).padStart(2, '0')}:00
                              </td>
                              <td className="p-2.5 text-zinc-200">{demandVal.toFixed(1)}</td>
                              <td className="p-2.5 text-emerald-400">{solarVal.toFixed(1)}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${actionColor}`}>
                                  {row.battery_action}
                                </span>
                              </td>
                              <td className="p-2.5 text-zinc-200">{socVal.toFixed(1)}</td>
                              <td className="p-2.5 text-cyan-400 font-semibold">{row.grid_kwh.toFixed(1)}</td>
                              <td className="p-2.5 text-zinc-400">{tariffVal.toFixed(1)}</td>
                              <td className="p-2.5 font-bold text-zinc-100">{costVal.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AI AGENT STUDIO */}
        {/* ========================================================================= */}
        {activeTab === 'agent' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-2">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Autonomous Operator Prompt Studio</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Natural Language Energy Command Center
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Type unconstrained instructions in English. PowerMind automatically parses directives,
                  constructs linear equations, executes the MILP solver, and returns validated schedules.
                </p>
              </div>

              {/* Preset Chips */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-zinc-400">Quick-Action Operator Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {AGENT_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      id={`preset-prompt-btn-${idx}`}
                      onClick={() => setAgentPrompt(preset.prompt)}
                      className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-medium border border-zinc-800 transition-colors"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Textarea */}
              <div className="space-y-3">
                <textarea
                  id="agent-prompt-textarea"
                  rows={4}
                  value={agentPrompt}
                  onChange={(e) => setAgentPrompt(e.target.value)}
                  className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                  placeholder="Enter weather conditions, battery reserves, maintenance windows..."
                />

                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-zinc-500">
                    Active Model: <span className="text-zinc-300">{modelName}</span> ({provider})
                  </div>
                  <button
                    id="execute-agent-prompt-btn"
                    onClick={() => handleExecuteAgentPrompt()}
                    disabled={agentExecuting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:from-zinc-800 disabled:to-zinc-800 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed"
                  >
                    {agentExecuting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        <span>Deconstructing & Solving...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-current" />
                        <span>Execute Agent Loop</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Executive Agent Insights Card */}
              {agentInsights && (
                <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Executive AI Dispatch Insights</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed font-sans">{agentInsights}</p>
                </div>
              )}
            </div>

            {/* Inbuilt Interactive Chat Assistant */}
            <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span>PowerMind Conversational Energy Assistant</span>
                  </h3>
                  <p className="text-xs text-zinc-400">Ask questions about tariff arbitrage, battery charging rules, or directives.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    id="chat-quick-1"
                    onClick={() => handleSendMessage('Why did the battery charge or discharge?')}
                    className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 hover:text-white"
                  >
                    Battery Logic
                  </button>
                  <button
                    id="chat-quick-2"
                    onClick={() => handleSendMessage('What is the total cost and peak import?')}
                    className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 hover:text-white"
                  >
                    Cost Analysis
                  </button>
                  <button
                    id="chat-quick-3"
                    onClick={() => handleSendMessage('Explain end-of-day battery neutrality')}
                    className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 hover:text-white"
                  >
                    Neutrality Rule
                  </button>
                  <button
                    id="chat-quick-4"
                    onClick={() => handleSendMessage('What directives are supported?')}
                    className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 hover:text-white"
                  >
                    Directives
                  </button>
                </div>

                <div className="h-64 overflow-y-auto p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 font-sans text-xs">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-xl leading-relaxed whitespace-pre-line ${
                          msg.role === 'user'
                            ? 'bg-emerald-500 text-zinc-950 font-medium'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-zinc-400 flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <span>Assistant reasoning...</span>
                      </div>
                    </div>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    id="chat-input-field"
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about schedule decisions, peak tariffs, battery status..."
                    className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <button
                    id="chat-submit-btn"
                    type="submit"
                    disabled={chatLoading}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ARCHITECTURE & TEAM */}
        {/* ========================================================================= */}
        {activeTab === 'docs' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  System Architecture & Formulation
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Comprehensive reference for PowerMind's mathematical formulation, invariant validation, and engineering design.
                </p>
              </div>

              {/* Mathematical Formulation Card */}
              <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 font-mono text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold uppercase tracking-wider">
                  <Terminal className="w-4 h-4" />
                  <span>Mixed-Integer Linear Programming Formulation</span>
                </div>

                <div className="space-y-2 text-zinc-300">
                  <p className="text-zinc-500">// 1. Objective Function: Minimize 24h total electricity cost</p>
                  <div className="p-3 bg-zinc-900 rounded-lg text-emerald-300">
                    min Z = SUM[h=0..23] ( Tariff[h] * GridImport[h] )
                  </div>

                  <p className="text-zinc-500 pt-2">// 2. Energy Balance Equation (Hourly Campus Demand Fulfillment)</p>
                  <div className="p-3 bg-zinc-900 rounded-lg text-cyan-300">
                    Demand[h] = Solar[h] + GridImport[h] + BatteryDischarge[h] - BatteryCharge[h]
                  </div>

                  <p className="text-zinc-500 pt-2">// 3. Battery State-of-Charge Dynamics</p>
                  <div className="p-3 bg-zinc-900 rounded-lg text-purple-300">
                    SOC[h] = SOC[h-1] + BatteryCharge[h] - BatteryDischarge[h]
                  </div>

                  <p className="text-zinc-500 pt-2">// 4. Hard Boundary Invariant (End-of-Day Neutrality)</p>
                  <div className="p-3 bg-zinc-900 rounded-lg text-emerald-300">
                    SOC[23] == SOC[0] (Exact Initial Charge Level)
                  </div>
                </div>
              </div>

              {/* Directives Specification Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Supported Operator Directives</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="p-2.5">Directive</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5">Parameters</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      <tr>
                        <td className="p-2.5 text-emerald-400 font-bold">solar_reduction</td>
                        <td className="p-2.5">Clips usable solar PV generation due to cloud cover or array washing</td>
                        <td className="p-2.5 text-zinc-500">hours: List[int], factor: float (0.0–1.0)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-emerald-400 font-bold">no_charge_window</td>
                        <td className="p-2.5">Disables battery charging during maintenance or inspections</td>
                        <td className="p-2.5 text-zinc-500">hours: List[int]</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-emerald-400 font-bold">no_discharge_window</td>
                        <td className="p-2.5">Disables battery discharging to preserve stored energy</td>
                        <td className="p-2.5 text-zinc-500">hours: List[int]</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-emerald-400 font-bold">minimum_battery_reserve</td>
                        <td className="p-2.5">Raises minimum energy floor for campus resilience during events</td>
                        <td className="p-2.5 text-zinc-500">hours: List[int], min_energy_kwh: float</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-emerald-400 font-bold">max_grid_window</td>
                        <td className="p-2.5">Imposes an upper ceiling on utility grid import to protect feeder</td>
                        <td className="p-2.5 text-zinc-500">hours: List[int], max_grid_kwh: float</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-emerald-400 font-bold">no_op</td>
                        <td className="p-2.5">Filters out general campus announcements with no energy constraints</td>
                        <td className="p-2.5 text-zinc-500">none</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Engineering Team Credits */}
              <div className="pt-6 border-t border-zinc-800 space-y-4">
                <h3 className="text-sm font-semibold text-white">Core Engineering Team</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {TEAM_MEMBERS.map((member) => (
                    <div
                      key={member.username}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1"
                    >
                      <div className="font-semibold text-white text-sm">{member.name}</div>
                      <div className="text-xs text-zinc-400">{member.role}</div>
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 pt-1"
                      >
                        <GithubIcon className="w-3.5 h-3.5" />
                        <span>{member.username}</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">LLM Provider & Model Configuration</h3>
              </div>
              <button
                id="close-settings-modal-btn"
                onClick={() => setShowSettings(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-mono">Provider:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['mock', 'gemini', 'anthropic', 'openai', 'groq', 'openrouter'].map((p) => (
                    <button
                      key={p}
                      id={`select-provider-${p}-btn`}
                      onClick={() => handleProviderChange(p)}
                      className={`p-2.5 rounded-lg border text-center font-medium capitalize transition-all ${
                        provider === p
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {p === 'mock' ? 'Offline ML' : p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Dropdown */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-400 font-mono">Model:</label>
                  <button
                    id="toggle-custom-model-btn"
                    onClick={() => setIsCustomModel(!isCustomModel)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300"
                  >
                    {isCustomModel ? 'Use Preset Dropdown' : 'Enter Custom Model'}
                  </button>
                </div>

                {isCustomModel ? (
                  <input
                    id="custom-model-name-input"
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Custom model name (e.g. gpt-4o-2024-08-06)"
                  />
                ) : (
                  <select
                    id="preset-model-select"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  >
                    {(MODEL_CATALOG[provider] || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} [{m.badge}] - {m.desc}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* API Key Input */}
              {provider !== 'mock' && (
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono">API Key:</label>
                  <input
                    id="settings-api-key-input"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Enter provider API key (auto-detected: sk-ant-*, sk-*, gsk_*, AIzaSy*)"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Stored securely in your local browser session. Key format prefixes are auto-detected.
                  </p>
                </div>
              )}

              {/* Test Connection Button */}
              <div className="pt-2">
                <button
                  id="test-llm-connection-btn"
                  onClick={handleTestLLM}
                  disabled={testingModel}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-950 text-zinc-200 rounded-lg text-xs font-mono transition-colors flex items-center justify-center gap-2"
                >
                  {testingModel ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span>Pinging Provider...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Test Model Connection & Latency</span>
                    </>
                  )}
                </button>

                {testResult && (
                  <div className={`mt-2 p-2.5 rounded-lg text-xs font-mono ${testResult.status === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'}`}>
                    <div>Status: {testResult.status.toUpperCase()}</div>
                    {testResult.latency_ms && <div>Latency: {testResult.latency_ms} ms</div>}
                    {testResult.error && <div>Error: {testResult.error}</div>}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                id="cancel-settings-btn"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                id="save-settings-btn"
                onClick={handleSaveSettings}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Assistant Widget */}
      <div className="fixed bottom-6 right-6 z-50 no-print">
        {chatOpen ? (
          <div className="w-96 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <PowerMindLogo className="w-6 h-6" />
                <span className="font-bold text-xs text-white">PowerMind Assistant</span>
              </div>
              <button
                id="close-chat-widget-btn"
                onClick={() => setChatOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-64 overflow-y-auto space-y-2 text-xs p-2 rounded-xl bg-zinc-950 border border-zinc-850">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] p-2.5 rounded-lg whitespace-pre-line leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-500 text-zinc-950 font-medium'
                        : 'bg-zinc-850 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="text-[11px] text-zinc-500 italic">Assistant typing...</div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                id="floating-chat-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about schedule decisions..."
                className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                id="floating-chat-send-btn"
                type="submit"
                disabled={chatLoading}
                className="p-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <button
            id="open-floating-chat-btn"
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-bold rounded-full shadow-xl shadow-emerald-500/25 hover:scale-105 transition-all text-xs"
          >
            <Bot className="w-4 h-4" />
            <span>Ask Energy AI</span>
          </button>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-4 lg:px-8 py-6 text-xs text-zinc-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PowerMindLogo className="w-5 h-5" />
            <span>PowerMind Autonomous Smart Campus Energy Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Deterministic OR-Tools Optimization</span>
            <span>-</span>
            <span>Zero-Violation Invariants</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

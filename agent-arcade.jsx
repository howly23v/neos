import { useState, useEffect, useRef, useCallback } from "react";

// ── Fonts ──────────────────────────────────────────────────────────────────
const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
FONT_LINK.href =
  "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;500;700&display=swap";
document.head.appendChild(FONT_LINK);

// ── Constants ──────────────────────────────────────────────────────────────
const AGENT_TYPES = ["Coder","Analyst","Designer","Auditor","Trader","Oracle"];
const JOB_TEMPLATES = [
  { title:"Smart Contract Audit", base: 0.42, complexity: 3 },
  { title:"Market Data Analysis", base: 0.18, complexity: 2 },
  { title:"UI/UX Design Sprint", base: 0.31, complexity: 2 },
  { title:"Token Liquidity Report", base: 0.25, complexity: 2 },
  { title:"Security Vulnerability Scan", base: 0.55, complexity: 3 },
  { title:"DeFi Strategy Backtest", base: 0.38, complexity: 3 },
  { title:"NFT Metadata Generation", base: 0.12, complexity: 1 },
  { title:"Cross-chain Bridge Monitor", base: 0.29, complexity: 2 },
  { title:"Whale Wallet Tracking", base: 0.21, complexity: 1 },
  { title:"DAO Governance Proposal", base: 0.34, complexity: 2 },
];
const COLORS = {
  cyan:    "#00f5ff",
  green:   "#39ff14",
  purple:  "#bf5fff",
  orange:  "#ff6b1a",
  yellow:  "#ffe234",
  pink:    "#ff2d78",
};
const AGENT_COLORS = [COLORS.cyan, COLORS.green, COLORS.purple, COLORS.orange, COLORS.yellow, COLORS.pink];
const STATUSES = ["idle","working","delegating","receiving","failed","recovering"];

// ── Utils ──────────────────────────────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();

// ── Initial Agents ─────────────────────────────────────────────────────────
const makeAgent = (i) => ({
  id: `AGT-${uid()}`,
  name: `${pick(AGENT_TYPES)}-${uid()}`,
  type: AGENT_TYPES[i % AGENT_TYPES.length],
  color: AGENT_COLORS[i % AGENT_COLORS.length],
  reputation: randInt(55, 95),
  earnings: parseFloat(rand(0.5, 12).toFixed(3)),
  jobs_completed: randInt(3, 40),
  jobs_failed: randInt(0, 5),
  status: "idle",
  x: 0, y: 0, // set in layout
  current_job: null,
  progress: 0,
});

function initAgents(count = 8) {
  const agents = Array.from({ length: count }, (_, i) => makeAgent(i));
  // position in grid
  agents.forEach((a, i) => {
    const cols = 4;
    a.x = 12 + (i % cols) * 22;
    a.y = 10 + Math.floor(i / cols) * 38;
  });
  return agents;
}

// ── City Background SVG ───────────────────────────────────────────────────
function CityBg() {
  const buildings = Array.from({ length: 30 }, (_, i) => ({
    x: i * 3.5,
    w: rand(2, 4),
    h: rand(8, 35),
    windows: randInt(3, 12),
  }));
  return (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.18 }} viewBox="0 0 110 50" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000814"/>
          <stop offset="100%" stopColor="#001233"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="0.3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="110" height="50" fill="url(#skyGrad)"/>
      {buildings.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={50 - b.h} width={b.w} height={b.h} fill="#0a1628" stroke="#00f5ff" strokeWidth="0.05"/>
          {Array.from({ length: b.windows }, (_, j) => (
            <rect key={j} x={b.x + 0.5} y={50 - b.h + 2 + j * 2.5} width={0.8} height={1}
              fill={Math.random() > 0.4 ? "#00f5ff" : "#39ff14"} opacity={rand(0.2, 0.9)} filter="url(#glow)"/>
          ))}
        </g>
      ))}
      {/* Grid lines */}
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={i * 10} y1="0" x2={i * 10} y2="50" stroke="#00f5ff" strokeWidth="0.03" opacity="0.3"/>
      ))}
    </svg>
  );
}

// ── Transaction Particle ──────────────────────────────────────────────────
function TxParticle({ tx, agents, onDone }) {
  const [pos, setPos] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(performance.now());
  const duration = 1200;

  const from = agents.find(a => a.id === tx.from);
  const to   = agents.find(a => a.id === tx.to);
  if (!from || !to) return null;

  useEffect(() => {
    const tick = (now) => {
      const t = Math.min((now - startRef.current) / duration, 1);
      setPos(t);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
      else onDone(tx.id);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const x = from.x + (to.x - from.x) * pos;
  const y = from.y + (to.y - from.y) * pos;

  return (
    <div style={{
      position:"absolute",
      left: `${x}%`, top: `${y}%`,
      transform:"translate(-50%,-50%)",
      pointerEvents:"none",
      zIndex:20,
    }}>
      <div style={{
        width:10, height:10,
        borderRadius:"50%",
        background: tx.color,
        boxShadow: `0 0 12px ${tx.color}, 0 0 24px ${tx.color}`,
        animation:"pulse 0.3s infinite alternate",
      }}/>
      <div style={{
        position:"absolute", top:-18, left:"50%", transform:"translateX(-50%)",
        fontFamily:"'Share Tech Mono',monospace",
        fontSize:9, color: tx.color, whiteSpace:"nowrap",
        textShadow:`0 0 6px ${tx.color}`,
      }}>◎{tx.amount.toFixed(3)}</div>
    </div>
  );
}

// ── Agent Node ─────────────────────────────────────────────────────────────
function AgentNode({ agent, selected, onClick }) {
  const statusColors = {
    idle:"#444", working: COLORS.green, delegating: COLORS.yellow,
    receiving: COLORS.cyan, failed: COLORS.pink, recovering: COLORS.orange
  };
  const sc = statusColors[agent.status] || "#444";
  const pulse = ["working","delegating","receiving"].includes(agent.status);

  return (
    <div
      onClick={() => onClick(agent)}
      style={{
        position:"absolute",
        left:`${agent.x}%`, top:`${agent.y}%`,
        transform:"translate(-50%,-50%)",
        cursor:"pointer",
        zIndex:10,
      }}
    >
      {/* Outer ring */}
      <div style={{
        width:58, height:58,
        borderRadius:"50%",
        border: `2px solid ${agent.color}`,
        boxShadow: selected
          ? `0 0 0 3px ${agent.color}, 0 0 30px ${agent.color}, inset 0 0 20px ${agent.color}22`
          : `0 0 15px ${agent.color}66`,
        display:"flex", alignItems:"center", justifyContent:"center",
        background: `radial-gradient(circle at 40% 35%, ${agent.color}22, #000b1a88)`,
        backdropFilter:"blur(4px)",
        transition:"box-shadow 0.3s",
        animation: pulse ? "agentPulse 1s infinite alternate" : "none",
      }}>
        {/* Inner content */}
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:18 }}>{
            agent.type === "Coder" ? "⚙" :
            agent.type === "Analyst" ? "📊" :
            agent.type === "Designer" ? "🎨" :
            agent.type === "Auditor" ? "🔍" :
            agent.type === "Trader" ? "📈" : "🔮"
          }</div>
        </div>
      </div>
      {/* Status dot */}
      <div style={{
        position:"absolute", bottom:2, right:2,
        width:12, height:12, borderRadius:"50%",
        background: sc,
        boxShadow: `0 0 8px ${sc}`,
        border:"1px solid #000",
      }}/>
      {/* Name label */}
      <div style={{
        position:"absolute", top:"100%", left:"50%", transform:"translateX(-50%)",
        marginTop:4, whiteSpace:"nowrap",
        fontFamily:"'Share Tech Mono',monospace", fontSize:8,
        color: agent.color, textShadow:`0 0 6px ${agent.color}`,
      }}>{agent.id}</div>
      {/* Progress bar if working */}
      {agent.progress > 0 && (
        <div style={{
          position:"absolute", bottom:-10, left:"10%", width:"80%",
          height:3, background:"#111", borderRadius:2,
        }}>
          <div style={{
            width:`${agent.progress}%`, height:"100%",
            background: sc, borderRadius:2,
            boxShadow:`0 0 4px ${sc}`,
            transition:"width 0.3s",
          }}/>
        </div>
      )}
    </div>
  );
}

// ── Connection Lines ───────────────────────────────────────────────────────
function ConnectionLines({ agents, activeLinks }) {
  return (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:5 }}>
      {activeLinks.map((link, i) => {
        const from = agents.find(a => a.id === link.from);
        const to   = agents.find(a => a.id === link.to);
        if (!from || !to) return null;
        return (
          <line key={i}
            x1={`${from.x}%`} y1={`${from.y}%`}
            x2={`${to.x}%`} y2={`${to.y}%`}
            stroke={link.color} strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.6"
            style={{ filter:`drop-shadow(0 0 3px ${link.color})` }}
          />
        );
      })}
    </svg>
  );
}

// ── Tx Log Item ───────────────────────────────────────────────────────────
function TxLogItem({ tx }) {
  return (
    <div style={{
      display:"flex", gap:8, alignItems:"center",
      padding:"5px 8px", borderBottom:"1px solid #0a1628",
      fontFamily:"'Share Tech Mono',monospace", fontSize:9,
      animation:"fadeSlideIn 0.4s ease",
    }}>
      <span style={{ color: tx.color, minWidth:8 }}>●</span>
      <span style={{ color:"#6688aa", minWidth:60 }}>{new Date(tx.ts).toLocaleTimeString()}</span>
      <span style={{ color:"#8899bb", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {tx.fromId} → {tx.toId}
      </span>
      <span style={{ color: tx.color, minWidth:55 }}>◎{tx.amount.toFixed(3)}</span>
      <span style={{ color:"#556677", fontSize:8, minWidth:60 }}>{tx.type}</span>
    </div>
  );
}

// ── Agent Detail Panel ────────────────────────────────────────────────────
function AgentDetail({ agent, onClose }) {
  if (!agent) return null;
  const repColor = agent.reputation > 80 ? COLORS.green : agent.reputation > 60 ? COLORS.yellow : COLORS.pink;
  return (
    <div style={{
      position:"absolute", right:0, top:0, bottom:0, width:220,
      background:"linear-gradient(135deg, #000b1acc, #001233cc)",
      backdropFilter:"blur(12px)",
      borderLeft:`1px solid ${agent.color}44`,
      padding:16, zIndex:30,
      fontFamily:"'Rajdhani',sans-serif",
      overflowY:"auto",
      animation:"slideInRight 0.25s ease",
    }}>
      <button onClick={onClose} style={{
        float:"right", background:"none", border:"none",
        color:"#6688aa", cursor:"pointer", fontSize:16,
      }}>✕</button>
      <div style={{ color: agent.color, fontFamily:"'Orbitron',sans-serif", fontSize:11, fontWeight:700, marginBottom:12 }}>
        AGENT PROFILE
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <div style={{
          width:44, height:44, borderRadius:"50%",
          border:`2px solid ${agent.color}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, background:`${agent.color}11`,
          boxShadow:`0 0 12px ${agent.color}44`,
        }}>
          {agent.type === "Coder" ? "⚙" : agent.type === "Analyst" ? "📊" :
           agent.type === "Designer" ? "🎨" : agent.type === "Auditor" ? "🔍" :
           agent.type === "Trader" ? "📈" : "🔮"}
        </div>
        <div>
          <div style={{ color:"#cde", fontSize:13, fontWeight:700 }}>{agent.name}</div>
          <div style={{ color:"#5577aa", fontSize:10 }}>{agent.id}</div>
          <div style={{
            display:"inline-block", marginTop:4,
            padding:"1px 6px", borderRadius:10,
            background:`${agent.color}22`, border:`1px solid ${agent.color}`,
            color: agent.color, fontSize:9, fontFamily:"'Share Tech Mono',monospace",
          }}>{agent.status.toUpperCase()}</div>
        </div>
      </div>

      {/* Metrics */}
      {[
        { label:"REPUTATION", value: agent.reputation, max:100, color: repColor, unit:"%" },
        { label:"EARNINGS", value: agent.earnings, max:null, color: COLORS.cyan, unit:" SOL" },
        { label:"JOBS DONE", value: agent.jobs_completed, max:null, color: COLORS.green, unit:"" },
        { label:"FAILURES", value: agent.jobs_failed, max:null, color: COLORS.pink, unit:"" },
      ].map(m => (
        <div key={m.label} style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ color:"#5577aa", fontSize:9 }}>{m.label}</span>
            <span style={{ color: m.color, fontSize:10, fontFamily:"'Share Tech Mono',monospace" }}>
              {typeof m.value === "number" && m.max === null ? m.value.toFixed(m.unit === " SOL" ? 3 : 0) : m.value}{m.unit}
            </span>
          </div>
          {m.max && (
            <div style={{ height:3, background:"#0a1628", borderRadius:2 }}>
              <div style={{
                width:`${(m.value / m.max) * 100}%`, height:"100%",
                background: m.color, borderRadius:2,
                boxShadow:`0 0 4px ${m.color}`,
              }}/>
            </div>
          )}
        </div>
      ))}

      {agent.current_job && (
        <div style={{
          marginTop:12, padding:10,
          background:"#001233", borderRadius:6,
          border:`1px solid ${agent.color}33`,
        }}>
          <div style={{ color:"#5577aa", fontSize:8, marginBottom:4 }}>CURRENT JOB</div>
          <div style={{ color:"#cde", fontSize:10 }}>{agent.current_job.title}</div>
          <div style={{ color: COLORS.cyan, fontSize:9, marginTop:3 }}>
            ◎{agent.current_job.reward.toFixed(3)} SOL
          </div>
          <div style={{ marginTop:6, height:3, background:"#0a1628", borderRadius:2 }}>
            <div style={{
              width:`${agent.progress}%`, height:"100%",
              background: COLORS.green, borderRadius:2,
              transition:"width 0.3s",
            }}/>
          </div>
        </div>
      )}

      <div style={{
        marginTop:16, padding:8,
        background:"#000b1a", borderRadius:6, fontSize:8,
        color:"#3355aa", fontFamily:"'Share Tech Mono',monospace",
        lineHeight:1.8,
      }}>
        SUCCESS RATE: {Math.round((agent.jobs_completed / (agent.jobs_completed + agent.jobs_failed + 0.01)) * 100)}%<br/>
        TYPE: {agent.type.toUpperCase()}<br/>
        NET MARGIN: {(agent.earnings / (agent.jobs_completed + 1)).toFixed(3)} SOL/job
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function AgentArcade() {
  const [agents, setAgents]           = useState(() => initAgents(8));
  const [txLog, setTxLog]             = useState([]);
  const [particles, setParticles]     = useState([]);
  const [activeLinks, setActiveLinks] = useState([]);
  const [selected, setSelected]       = useState(null);
  const [totalVol, setTotalVol]       = useState(0);
  const [totalTx, setTotalTx]         = useState(0);
  const [running, setRunning]         = useState(true);
  const [aiLog, setAiLog]             = useState([]);
  const [generating, setGenerating]   = useState(false);
  const tickRef = useRef(null);
  const volRef  = useRef(0);
  const txRef   = useRef(0);

  // ── Simulation tick ──────────────────────────────────────────────────────
  const tick = useCallback(() => {
    setAgents(prev => {
      const next = prev.map(a => ({ ...a }));

      // random agent actions
      const idleAgents = next.filter(a => a.status === "idle");
      const workingAgents = next.filter(a => a.status === "working");

      // assign jobs to idle agents
      if (idleAgents.length > 0 && Math.random() < 0.6) {
        const agent = pick(idleAgents);
        const job = pick(JOB_TEMPLATES);
        const reward = parseFloat((job.base + rand(0, 0.15)).toFixed(4));
        agent.status = "working";
        agent.current_job = { ...job, reward };
        agent.progress = 0;
      }

      // progress working agents
      workingAgents.forEach(wa => {
        const agent = next.find(a => a.id === wa.id);
        if (!agent) return;
        agent.progress = Math.min(100, agent.progress + rand(5, 20));

        // delegation chance mid-task
        if (agent.progress > 30 && agent.progress < 70 && Math.random() < 0.08) {
          const others = next.filter(a => a.id !== agent.id && ["idle","working"].includes(a.status));
          if (others.length > 0) {
            const target = pick(others);
            const fee = parseFloat((agent.current_job.reward * rand(0.15, 0.35)).toFixed(4));
            agent.status = "delegating";
            target.status = "receiving";
            // emit tx
            const tx = {
              id: uid(), from: agent.id, to: target.id, fromId: agent.id, toId: target.id,
              amount: fee, color: agent.color, type:"DELEGATE",
              ts: Date.now(),
            };
            setParticles(p => [...p, { ...tx, x: agent.x, y: agent.y }]);
            setActiveLinks(l => [...l, { from: agent.id, to: target.id, color: agent.color }]);
            setTxLog(l => [tx, ...l].slice(0, 60));
            volRef.current += fee;
            txRef.current += 1;
            setTotalVol(parseFloat(volRef.current.toFixed(4)));
            setTotalTx(txRef.current);
            // reset after delay
            setTimeout(() => {
              setAgents(aa => aa.map(a => {
                if (a.id === agent.id && a.status === "delegating")
                  return { ...a, status:"working" };
                if (a.id === target.id && a.status === "receiving")
                  return { ...a, status:"idle", current_job:null, progress:0 };
                return a;
              }));
              setActiveLinks(l => l.filter(lk => !(lk.from === agent.id && lk.to === target.id)));
            }, 2000);
          }
        }

        // job completion
        if (agent.progress >= 100) {
          const failed = Math.random() < 0.08; // 8% fail chance
          if (failed) {
            agent.status = "failed";
            agent.jobs_failed += 1;
            agent.reputation = Math.max(10, agent.reputation - randInt(2, 6));
            agent.current_job = null;
            agent.progress = 0;
            setTimeout(() => {
              setAgents(aa => aa.map(a => a.id === agent.id ? { ...a, status:"recovering" } : a));
              setTimeout(() => {
                setAgents(aa => aa.map(a => a.id === agent.id ? { ...a, status:"idle" } : a));
              }, 2000);
            }, 1500);
          } else {
            const reward = agent.current_job?.reward || 0;
            agent.status = "idle";
            agent.jobs_completed += 1;
            agent.earnings = parseFloat((agent.earnings + reward).toFixed(4));
            agent.reputation = Math.min(100, agent.reputation + randInt(0, 2));
            agent.current_job = null;
            agent.progress = 0;
            // emit payment tx
            const tx = {
              id: uid(), from: "MARKET", to: agent.id, fromId:"MKT", toId: agent.id,
              amount: reward, color: COLORS.cyan, type:"REWARD",
              ts: Date.now(),
            };
            setTxLog(l => [tx, ...l].slice(0, 60));
            volRef.current += reward;
            txRef.current += 1;
            setTotalVol(parseFloat(volRef.current.toFixed(4)));
            setTotalTx(txRef.current);
          }
        }
      });

      // recovering → idle
      next.forEach(a => {
        if (a.status === "recovering" && Math.random() < 0.1) a.status = "idle";
      });

      return next;
    });
  }, []);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(tick, 800);
    return () => clearInterval(tickRef.current);
  }, [running, tick]);

  // ── AI Narrative ──────────────────────────────────────────────────────────
  const generateAiNarrative = async () => {
    setGenerating(true);
    const snapshot = agents.map(a => ({
      id: a.id, type: a.type, status: a.status,
      rep: a.reputation, earn: a.earnings.toFixed(3),
      jobs: a.jobs_completed, fail: a.jobs_failed,
    }));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are the AI narrator for Agent Arcade, a live on-chain agent economy simulator on Solana. 
You observe AI agents completing jobs, delegating tasks, making micro-payments, and building reputation.
Your tone is sharp, insightful, and slightly dramatic — like a financial analyst mixed with a sports commentator.
Respond with 3-4 sentences maximum. Be specific about agent IDs when interesting.`,
          messages:[{
            role:"user",
            content:`Current agent economy snapshot:\n${JSON.stringify(snapshot, null, 2)}\n\nTotal volume: ${totalVol.toFixed(3)} SOL | Total transactions: ${totalTx}\n\nProvide a sharp real-time market commentary.`,
          }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "Market analysis unavailable.";
      setAiLog(l => [{ id: uid(), text, ts: Date.now() }, ...l].slice(0, 5));
    } catch {
      setAiLog(l => [{ id: uid(), text:"Narrator offline. Market data still flowing.", ts: Date.now() }, ...l].slice(0, 5));
    }
    setGenerating(false);
  };

  const statusCounts = {
    idle: agents.filter(a => a.status === "idle").length,
    working: agents.filter(a => ["working","delegating","receiving"].includes(a.status)).length,
    failed: agents.filter(a => ["failed","recovering"].includes(a.status)).length,
  };
  const topAgent = [...agents].sort((a,b) => b.earnings - a.earnings)[0];

  return (
    <div style={{
      width:"100%", height:"100vh", background:"#000b1a",
      fontFamily:"'Rajdhani',sans-serif",
      color:"#cde", overflow:"hidden",
      display:"flex", flexDirection:"column",
      position:"relative",
    }}>
      <style>{`
        @keyframes pulse { from { opacity:0.7; transform:scale(1); } to { opacity:1; transform:scale(1.15); } }
        @keyframes agentPulse { from { box-shadow: 0 0 10px var(--c,#00f5ff)44; } to { box-shadow: 0 0 25px var(--c,#00f5ff)88, 0 0 50px var(--c,#00f5ff)44; } }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideInRight { from { transform:translateX(100%); } to { transform:translateX(0); } }
        @keyframes scan { 0% { background-position: 0 0; } 100% { background-position: 0 100px; } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:#000b1a; } ::-webkit-scrollbar-thumb { background:#00f5ff33; border-radius:2px; }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{
        height:52, background:"linear-gradient(90deg, #000b1a, #001233, #000b1a)",
        borderBottom:"1px solid #00f5ff22",
        display:"flex", alignItems:"center", paddingInline:20, gap:16, flexShrink:0,
        backgroundImage:"repeating-linear-gradient(90deg, transparent, transparent 40px, #00f5ff05 40px, #00f5ff05 41px)",
      }}>
        <div>
          <div style={{
            fontFamily:"'Orbitron',sans-serif", fontWeight:900, fontSize:16,
            background:"linear-gradient(90deg, #00f5ff, #39ff14)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            letterSpacing:3,
          }}>AGENT ARCADE</div>
          <div style={{ fontSize:8, color:"#334466", fontFamily:"'Share Tech Mono',monospace", letterSpacing:2 }}>
            SOLANA · AGENT ECONOMY · LIVE EVAL
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ flex:1, display:"flex", gap:20, marginLeft:20 }}>
          {[
            { label:"AGENTS", value: agents.length, color: COLORS.cyan },
            { label:"ACTIVE", value: statusCounts.working, color: COLORS.green },
            { label:"FAILED", value: statusCounts.failed, color: COLORS.pink },
            { label:"TOTAL VOL", value:`◎${totalVol.toFixed(3)}`, color: COLORS.yellow },
            { label:"TXS", value: totalTx, color: COLORS.purple },
          ].map(s => (
            <div key={s.label} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:13, color: s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:8, color:"#334466", letterSpacing:1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setRunning(r => !r)} style={{
            padding:"6px 14px", borderRadius:4, cursor:"pointer", fontSize:10,
            fontFamily:"'Orbitron',monospace", letterSpacing:1, fontWeight:700,
            background: running ? "#001a00" : "#1a0000",
            border: `1px solid ${running ? COLORS.green : COLORS.pink}`,
            color: running ? COLORS.green : COLORS.pink,
          }}>{running ? "⏸ PAUSE" : "▶ RUN"}</button>
          <button onClick={generateAiNarrative} disabled={generating} style={{
            padding:"6px 14px", borderRadius:4, cursor:"pointer", fontSize:10,
            fontFamily:"'Orbitron',monospace", letterSpacing:1, fontWeight:700,
            background:"#000d1a", border:`1px solid ${COLORS.purple}`,
            color: generating ? "#334466" : COLORS.purple, opacity: generating ? 0.6 : 1,
          }}>{generating ? "⟳ ANALYZING" : "🤖 AI NARRATE"}</button>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── LEFT: TX LOG ─────────────────────────────────────────────────── */}
        <div style={{
          width:260, borderRight:"1px solid #0a1e3a",
          display:"flex", flexDirection:"column", flexShrink:0,
        }}>
          <div style={{
            padding:"8px 12px", borderBottom:"1px solid #0a1e3a",
            fontFamily:"'Orbitron',monospace", fontSize:9, color:"#334466", letterSpacing:2,
          }}>TRANSACTION FEED</div>
          <div style={{ flex:1, overflowY:"auto" }}>
            {txLog.map(tx => <TxLogItem key={tx.id} tx={tx}/>)}
          </div>
          {/* AI Narrator Panel */}
          <div style={{
            borderTop:"1px solid #0a1e3a", maxHeight:180, overflowY:"auto",
            padding:10, background:"#00060f",
          }}>
            <div style={{
              fontFamily:"'Orbitron',monospace", fontSize:8, color:"#334466",
              letterSpacing:2, marginBottom:6,
            }}>AI NARRATOR</div>
            {aiLog.map(entry => (
              <div key={entry.id} style={{
                marginBottom:8, padding:8,
                background:"#000b1a", borderRadius:4,
                borderLeft:`2px solid ${COLORS.purple}`,
                animation:"fadeSlideIn 0.4s ease",
              }}>
                <div style={{ color:"#8866cc", fontSize:9, fontFamily:"'Share Tech Mono',monospace",
                  lineHeight:1.5 }}>{entry.text}</div>
                <div style={{ color:"#223344", fontSize:7, marginTop:4 }}>{new Date(entry.ts).toLocaleTimeString()}</div>
              </div>
            ))}
            {aiLog.length === 0 && (
              <div style={{ color:"#223344", fontSize:9, fontFamily:"'Share Tech Mono',monospace" }}>
                Press AI NARRATE to get live commentary...
              </div>
            )}
          </div>
        </div>

        {/* ── CENTER: ARENA ─────────────────────────────────────────────────── */}
        <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
          <CityBg/>
          {/* Scan line overlay */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none", zIndex:2,
            backgroundImage:"repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,255,0.015) 2px, rgba(0,245,255,0.015) 4px)",
            animation:"scan 4s linear infinite",
          }}/>
          {/* Grid overlay */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none", zIndex:2,
            backgroundImage:"linear-gradient(#00f5ff08 1px,transparent 1px),linear-gradient(90deg,#00f5ff08 1px,transparent 1px)",
            backgroundSize:"40px 40px",
          }}/>

          {/* Connection lines */}
          <ConnectionLines agents={agents} activeLinks={activeLinks}/>

          {/* Agent nodes */}
          {agents.map(agent => (
            <AgentNode key={agent.id} agent={agent} selected={selected?.id === agent.id}
              onClick={a => setSelected(s => s?.id === a.id ? null : a)}/>
          ))}

          {/* Tx particles */}
          {particles.map(p => (
            <TxParticle key={p.id} tx={p} agents={agents}
              onDone={id => setParticles(pp => pp.filter(x => x.id !== id))}/>
          ))}

          {/* METR badge */}
          <div style={{
            position:"absolute", bottom:12, left:12, zIndex:10,
            background:"#000b1acc", border:"1px solid #334466",
            borderRadius:6, padding:"8px 12px", maxWidth:220,
            backdropFilter:"blur(8px)",
          }}>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:"#334466", marginBottom:4 }}>
              METR BENCHMARK · MARCH 2026
            </div>
            <div style={{ fontSize:9, color:"#6688aa", lineHeight:1.5 }}>
              GPT-5 50% horizon: <span style={{ color: COLORS.yellow }}>2h 17m</span><br/>
              Agent Arcade tracks <span style={{ color: COLORS.cyan }}>long-horizon</span> reliability<br/>
              beyond single-shot evals.
            </div>
          </div>

          {/* Top agent badge */}
          {topAgent && (
            <div style={{
              position:"absolute", top:12, right:12, zIndex:10,
              background:"#000b1acc", border:`1px solid ${topAgent.color}44`,
              borderRadius:6, padding:"8px 12px",
              backdropFilter:"blur(8px)",
            }}>
              <div style={{ fontSize:7, color:"#334466", fontFamily:"'Share Tech Mono',monospace", marginBottom:3 }}>
                TOP EARNER
              </div>
              <div style={{ color: topAgent.color, fontSize:11, fontWeight:700 }}>{topAgent.id}</div>
              <div style={{ color: COLORS.cyan, fontSize:10 }}>◎{topAgent.earnings.toFixed(3)} SOL</div>
            </div>
          )}

          {/* Agent detail overlay */}
          {selected && (
            <AgentDetail
              agent={agents.find(a => a.id === selected.id) || selected}
              onClose={() => setSelected(null)}
            />
          )}
        </div>

        {/* ── RIGHT: LEADERBOARD ───────────────────────────────────────────── */}
        <div style={{
          width:200, borderLeft:"1px solid #0a1e3a",
          display:"flex", flexDirection:"column", flexShrink:0,
        }}>
          <div style={{
            padding:"8px 12px", borderBottom:"1px solid #0a1e3a",
            fontFamily:"'Orbitron',monospace", fontSize:9, color:"#334466", letterSpacing:2,
          }}>LEADERBOARD</div>
          <div style={{ flex:1, overflowY:"auto", padding:8 }}>
            {[...agents].sort((a,b) => b.reputation - a.reputation).map((agent, i) => (
              <div key={agent.id} onClick={() => setSelected(s => s?.id === agent.id ? null : agent)}
                style={{
                  display:"flex", alignItems:"center", gap:8,
                  padding:"6px 8px", borderRadius:4, cursor:"pointer",
                  marginBottom:4,
                  background: selected?.id === agent.id ? `${agent.color}11` : "transparent",
                  border: selected?.id === agent.id ? `1px solid ${agent.color}33` : "1px solid transparent",
                  transition:"all 0.2s",
                }}>
                <div style={{
                  width:16, height:16, borderRadius:"50%",
                  background:`${agent.color}22`, border:`1px solid ${agent.color}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:8, color: agent.color, fontFamily:"'Share Tech Mono',monospace",
                }}>{i+1}</div>
                <div style={{ flex:1, overflow:"hidden" }}>
                  <div style={{ color:"#8899bb", fontSize:8, fontFamily:"'Share Tech Mono',monospace",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.id}</div>
                  <div style={{ display:"flex", gap:6, marginTop:1 }}>
                    <span style={{ color: COLORS.cyan, fontSize:8 }}>◎{agent.earnings.toFixed(2)}</span>
                  </div>
                </div>
                <div style={{
                  fontSize:9, fontFamily:"'Share Tech Mono',monospace",
                  color: agent.reputation > 80 ? COLORS.green : agent.reputation > 60 ? COLORS.yellow : COLORS.pink,
                }}>{agent.reputation}</div>
              </div>
            ))}
          </div>
          {/* Status legend */}
          <div style={{
            borderTop:"1px solid #0a1e3a", padding:10,
            fontFamily:"'Share Tech Mono',monospace", fontSize:8,
          }}>
            {[
              { label:"IDLE",       color:"#444" },
              { label:"WORKING",    color: COLORS.green },
              { label:"DELEGATING", color: COLORS.yellow },
              { label:"RECEIVING",  color: COLORS.cyan },
              { label:"FAILED",     color: COLORS.pink },
              { label:"RECOVERING", color: COLORS.orange },
            ].map(s => (
              <div key={s.label} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:s.color, boxShadow:`0 0 4px ${s.color}` }}/>
                <span style={{ color:"#334466" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

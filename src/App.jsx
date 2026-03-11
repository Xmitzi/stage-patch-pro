import { useState, useRef, useCallback, useEffect } from "react";

const SB_COLORS=[{key:"SB1",color:"#f59e0b",text:"#000"},{key:"SB2",color:"#22c55e",text:"#000"},{key:"SB3",color:"#3b82f6",text:"#fff"},{key:"SB4",color:"#ef4444",text:"#fff"},{key:"SB5",color:"#f8fafc",text:"#000"},{key:"DIR",color:"#a855f7",text:"#fff"}];
const getSB=(key)=>SB_COLORS.find(s=>s.key===key)||SB_COLORS[0];
// Each entry: string = selectable mic | { divider, label } = brand header
const MIC_OPTIONS=[
  "",
  {divider:true,label:"── AKG ──"},
  "AKG D112","AKG C480B","AKG 451","AKG C214","AKG C414 XLII","AKG C414 ULS","AKG C535","AKG CK91","AKG C418","AKG C419",
  {divider:true,label:"── AUDIO-TECHNICA ──"},
  "AT4071","AT897","AT3035","ATM350",
  {divider:true,label:"── AUDIX ──"},
  "Audix i5","Audix D2","Audix D4","Audix D6","Audix OM5",
  {divider:true,label:"── BEYERDYNAMIC ──"},
  "M201","TG D57","TG D58","TG D71","M160","M88TG",
  {divider:true,label:"── CROWN ──"},
  "Crown CM311","Crown PCC160",
  {divider:true,label:"── DPA ──"},
  "DPA D2011","DPA D2012","DPA D2015","DPA D4011","DPA D4055","DPA D4061","DPA 4066","DPA 4099",
  {divider:true,label:"── EARTHWORKS ──"},
  "EW SR25","EW SR30","EW DM20","EW PM40",
  {divider:true,label:"── ELECTRO-VOICE ──"},
  "EV RE27ND",
  {divider:true,label:"── HEIL ──"},
  "Heil PR30",
  {divider:true,label:"── MILAB ──"},
  "Milab VM44",
  {divider:true,label:"── NEUMANN ──"},
  "KM140","KMS105","KM188","TLM103",
  {divider:true,label:"── SAMSON ──"},
  "Samson CO1","Samson CO2","Samson SP01",
  {divider:true,label:"── SE ELECTRONICS ──"},
  "sE V7",
  {divider:true,label:"── SENNHEISER ──"},
  "MKH416","E901","E604","E904","MD441","MD421","E902","E602","E906",
  {divider:true,label:"── SHURE ──"},
  "B98 (old)","B98 (new)","KSM9","B91","B91A","B87","KSM137","KSM32","SM81","SM91","B52A","B56A","B57A","B58A","SM57","SM58",
  {divider:true,label:"── OTHER ──"},
  "DI","Line","Other",
];
const STAND_OPTIONS=["","Straight","Boom","Short Boom","Desktop","Clip","Floor","None"];
// Inline SVG bass guitar icon
const BassIcon=({size=26,glow=false})=>(
  <svg width={size} height={size} viewBox="0 0 32 40" fill="none" style={{filter:glow?"drop-shadow(0 0 6px #f59e0b)":"none",transition:"filter 0.15s"}}>
    {/* Body */}
    <ellipse cx="16" cy="29" rx="9" ry="7" fill="#8B4513" stroke="#D2691E" strokeWidth="1.2"/>
    <ellipse cx="13" cy="27" rx="3" ry="2.5" fill="#A0522D" opacity="0.6"/>
    {/* Neck */}
    <rect x="14" y="8" width="4" height="21" rx="2" fill="#6B3410" stroke="#D2691E" strokeWidth="1"/>
    {/* Headstock */}
    <rect x="11" y="3" width="10" height="7" rx="2" fill="#5a2d0c" stroke="#D2691E" strokeWidth="1"/>
    {/* Tuning pegs */}
    <circle cx="11" cy="5" r="1.5" fill="#ccc"/>
    <circle cx="11" cy="9" r="1.5" fill="#ccc"/>
    <circle cx="21" cy="5" r="1.5" fill="#ccc"/>
    <circle cx="21" cy="9" r="1.5" fill="#ccc"/>
    {/* Strings */}
    <line x1="14.5" y1="7" x2="14.5" y2="29" stroke="#ccc" strokeWidth="0.5" opacity="0.8"/>
    <line x1="16" y1="7" x2="16" y2="29" stroke="#ccc" strokeWidth="0.5" opacity="0.8"/>
    <line x1="17.5" y1="7" x2="17.5" y2="29" stroke="#ccc" strokeWidth="0.5" opacity="0.8"/>
    <line x1="19" y1="7" x2="19" y2="29" stroke="#ccc" strokeWidth="0.5" opacity="0.8"/>
    {/* Sound hole */}
    <circle cx="16" cy="29" r="2.5" fill="#3a1a05" stroke="#D2691E" strokeWidth="0.8"/>
  </svg>
);

const INSTRUMENTS=[
  {id:"drums",label:"Drums",icon:"🥁"},{id:"kick",label:"Kick",icon:"🪘"},
  {id:"guitar",label:"Gtr Amp",icon:"🎸"},{id:"bass",label:"Bass Amp",icon:"__BASS__"},
  {id:"keys",label:"Keys",icon:"🎹"},{id:"vocal",label:"Vocal",icon:"🎤"},
  {id:"monitor",label:"Monitor",icon:"📢"},{id:"di",label:"DI Box",icon:"📦"},
  {id:"violin",label:"Violin",icon:"🎻"},{id:"trumpet",label:"Trumpet",icon:"🎺"},
  {id:"sax",label:"Sax",icon:"🎷"},{id:"micst",label:"Mic Stand",icon:"🎙️"},
  {id:"sub",label:"Sub",icon:"💥"},{id:"combo",label:"Combo",icon:"📻"},
  {id:"pedal",label:"Pedalboard",icon:"⬛"},{id:"piano",label:"Piano",icon:"🎵"},
];

const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);
const makePatchRows=(n=24)=>Array.from({length:n},(_,i)=>({id:uid(),channel:i+1,stagebox:"SB1",input:i+1,instrument:"",mic:"",stand:"",notes:""}));
const makeSlot=()=>({bandName:"",patchRows:makePatchRows(),stagePlot:{stageW:12,stageD:8,items:[]}});
const makeFestivalData=(festName,stageName,numDays,bandsPerDay)=>({festName,stageName,days:Array.from({length:numDays},(_,d)=>({dayLabel:`Day ${d+1}`,slots:Array.from({length:bandsPerDay[d]||1},makeSlot)}))});
const makeProject=(name,mode)=>({id:uid(),name,mode,numStageboxes:4,createdAt:Date.now(),updatedAt:Date.now(),singleSlot:makeSlot(),festivalData:null});

const S={
  input:{background:"#111318",border:"1px solid #2a2d35",color:"#e2e8f0",padding:"5px 8px",borderRadius:"4px",fontSize:"12px",outline:"none",fontFamily:"monospace",boxSizing:"border-box",width:"100%"},
  btn:(active,color="#f59e0b")=>({background:active?color:"transparent",border:`1px solid ${active?color:"#2a2d35"}`,color:active?(color==="#f59e0b"?"#000":"#fff"):"#94a3b8",padding:"6px 14px",borderRadius:"6px",cursor:"pointer",fontWeight:"600",fontSize:"11px",letterSpacing:"0.08em",textTransform:"uppercase",transition:"all 0.15s"}),
  label:{fontSize:"10px",color:"#f59e0b",letterSpacing:"0.12em",fontWeight:"700",display:"block",marginBottom:"6px"},
};

// ── Storage: localStorage with window.storage fallback ───────────────────────
const store = {
  async get(key) {
    // Try Claude artifact storage first
    if (window.storage) {
      try { return await window.storage.get(key); } catch {}
    }
    // Fallback: localStorage
    const val = localStorage.getItem("spp:" + key);
    return val ? { value: val } : null;
  },
  async set(key, val) {
    if (window.storage) {
      try { await window.storage.set(key, val); } catch {}
    }
    try { localStorage.setItem("spp:" + key, val); } catch(e) { console.error(e); }
  },
  async del(key) {
    if (window.storage) {
      try { await window.storage.delete(key); } catch {}
    }
    localStorage.removeItem("spp:" + key);
  },
};

const saveProject=async(proj)=>{
  const updated={...proj,updatedAt:Date.now()};
  await store.set(`proj:${proj.id}`,JSON.stringify(updated));
  const r=await store.get("proj:list");
  const list=r?JSON.parse(r.value):[];
  const meta={id:proj.id,name:proj.name,mode:proj.mode,updatedAt:updated.updatedAt,createdAt:proj.createdAt};
  const newList=list.find(p=>p.id===proj.id)?list.map(p=>p.id===proj.id?meta:p):[...list,meta];
  await store.set("proj:list",JSON.stringify(newList));
  return updated;
};
const loadAllProjects=async()=>{const r=await store.get("proj:list");return r?JSON.parse(r.value):[];};
const loadProject=async(id)=>{const r=await store.get(`proj:${id}`);return r?JSON.parse(r.value):null;};
const deleteProject=async(id)=>{
  await store.del(`proj:${id}`);
  const r=await store.get("proj:list");
  const list=r?JSON.parse(r.value):[];
  await store.set("proj:list",JSON.stringify(list.filter(p=>p.id!==id)));
};

// ── Stage Plot ────────────────────────────────────────────────────────────────
function StagePlot({plot,onChange}){
  const stageRef=useRef(null);
  const dragRef=useRef(null);
  const itemsRef=useRef(plot.items);
  const onChangeRef=useRef(onChange);
  const plotRef=useRef(plot);
  const[selectedId,setSelectedId]=useState(null);
  const[editingId,setEditingId]=useState(null);
  const[editLabel,setEditLabel]=useState("");

  useEffect(()=>{itemsRef.current=plot.items;},[plot.items]);
  useEffect(()=>{onChangeRef.current=onChange;},[onChange]);
  useEffect(()=>{plotRef.current=plot;},[plot]);

  const startDrag=useCallback((e,id)=>{
    e.preventDefault();e.stopPropagation();
    setSelectedId(id);
    dragRef.current={id,rect:stageRef.current.getBoundingClientRect()};
  },[]);

  useEffect(()=>{
    const onMove=(e)=>{
      if(!dragRef.current)return;
      if(e.cancelable)e.preventDefault();
      const{id,rect}=dragRef.current;
      const cx=e.touches?e.touches[0].clientX:e.clientX;
      const cy=e.touches?e.touches[0].clientY:e.clientY;
      const x=Math.max(2,Math.min(95,((cx-rect.left)/rect.width)*100));
      const y=Math.max(2,Math.min(92,((cy-rect.top)/rect.height)*100));
      const updated=itemsRef.current.map(it=>it.id===id?{...it,x,y}:it);
      itemsRef.current=updated;
      onChangeRef.current({...plotRef.current,items:updated});
    };
    const onUp=()=>{dragRef.current=null;};
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
    window.addEventListener("touchmove",onMove,{passive:false});
    window.addEventListener("touchend",onUp);
    return()=>{
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",onUp);
      window.removeEventListener("touchmove",onMove);
      window.removeEventListener("touchend",onUp);
    };
  },[]);

  const addItem=(instr)=>onChange({...plot,items:[...plot.items,{id:uid(),...instr,x:50,y:50}]});
  const removeItem=(id)=>{onChange({...plot,items:plot.items.filter(it=>it.id!==id)});if(selectedId===id)setSelectedId(null);};
  const commitEdit=()=>{onChange({...plot,items:plot.items.map(it=>it.id===editingId?{...it,label:editLabel}:it)});setEditingId(null);};

  return(
    <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>
      <div style={{width:"155px",minWidth:"155px",background:"#111318",borderRight:"1px solid #1e2028",display:"flex",flexDirection:"column",padding:"10px",overflowY:"auto"}}>
        <div style={S.label}>STAGE SIZE (m)</div>
        <div style={{display:"flex",gap:"6px",marginBottom:"14px"}}>
          {[["W","stageW"],["D","stageD"]].map(([lbl,key])=>(
            <div key={key} style={{flex:1}}>
              <div style={{fontSize:"9px",color:"#64748b",marginBottom:"3px"}}>{lbl}</div>
              <input type="number" value={plot[key]} min="1" onChange={e=>onChange({...plot,[key]:Number(e.target.value)})} style={{...S.input,textAlign:"center"}}/>
            </div>
          ))}
        </div>
        <div style={S.label}>ADD ELEMENT</div>
        <div style={{display:"flex",flexDirection:"column",gap:"3px",flex:1,overflowY:"auto"}}>
          {INSTRUMENTS.map(instr=>(
            <button key={instr.id} onClick={()=>addItem(instr)}
              style={{background:"#0d0f14",border:"1px solid #1e2028",borderRadius:"5px",padding:"5px 8px",cursor:"pointer",color:"#cbd5e1",fontSize:"11px",textAlign:"left",display:"flex",alignItems:"center",gap:"6px"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#f59e0b44";e.currentTarget.style.color="#f8fafc";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e2028";e.currentTarget.style.color="#cbd5e1";}}>
              {instr.icon==="__BASS__" ? <BassIcon size={16}/> : instr.icon} {instr.label}
            </button>
          ))}
        </div>
        {selectedId&&(
          <div style={{display:"flex",flexDirection:"column",gap:"5px",marginTop:"10px"}}>
            <button onClick={()=>{const it=plot.items.find(i=>i.id===selectedId);if(it){setEditingId(selectedId);setEditLabel(it.label);}}} style={{background:"#f59e0b22",border:"1px solid #f59e0b66",color:"#f59e0b",borderRadius:"6px",padding:"6px",cursor:"pointer",fontSize:"11px"}}>✏️ Rename</button>
            <div style={{display:"flex",gap:"4px",alignItems:"center",justifyContent:"center"}}>
              <button onClick={()=>onChange({...plot,items:plot.items.map(it=>it.id===selectedId?{...it,size:Math.max(0.5,(it.size||1)-0.25)}:it)})} style={{background:"#1e2028",border:"1px solid #2a2d35",color:"#e2e8f0",borderRadius:"4px",width:"26px",height:"26px",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
              <span style={{fontSize:"10px",color:"#64748b",minWidth:"28px",textAlign:"center"}}>{Math.round((plot.items.find(i=>i.id===selectedId)?.size||1)*100)}%</span>
              <button onClick={()=>onChange({...plot,items:plot.items.map(it=>it.id===selectedId?{...it,size:Math.min(3,(it.size||1)+0.25)}:it)})} style={{background:"#1e2028",border:"1px solid #2a2d35",color:"#e2e8f0",borderRadius:"4px",width:"26px",height:"26px",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
            </div>
            <button onClick={()=>removeItem(selectedId)} style={{background:"#ef444422",border:"1px solid #ef4444",color:"#ef4444",borderRadius:"6px",padding:"6px",cursor:"pointer",fontSize:"11px"}}>🗑️ Remove</button>
          </div>
        )}
      </div>
      <div style={{flex:1,padding:"12px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
        <div style={{fontSize:"10px",color:"#64748b",marginBottom:"6px",letterSpacing:"0.1em"}}>AUDIENCE ▼ — {plot.stageW}m × {plot.stageD}m</div>
        <div ref={stageRef} onClick={()=>setSelectedId(null)}
          style={{position:"relative",width:"100%",maxWidth:"700px",aspectRatio:`${plot.stageW}/${plot.stageD}`,background:"#1a1d26",border:"2px solid #f59e0b",borderRadius:"4px",overflow:"hidden",cursor:"crosshair",boxShadow:"0 0 30px #f59e0b1a",touchAction:"none"}}>
          {Array.from({length:plot.stageW-1},(_,i)=><div key={`v${i}`} style={{position:"absolute",left:`${((i+1)/plot.stageW)*100}%`,top:0,bottom:0,width:"1px",background:"#ffffff07",pointerEvents:"none"}}/>)}
          {Array.from({length:plot.stageD-1},(_,i)=><div key={`h${i}`} style={{position:"absolute",top:`${((i+1)/plot.stageD)*100}%`,left:0,right:0,height:"1px",background:"#ffffff07",pointerEvents:"none"}}/>)}
          <div style={{position:"absolute",top:"5px",left:"50%",transform:"translateX(-50%)",fontSize:"9px",color:"#2a2d35",letterSpacing:"0.18em",pointerEvents:"none"}}>UPSTAGE</div>
          <div style={{position:"absolute",bottom:"5px",left:"50%",transform:"translateX(-50%)",fontSize:"9px",color:"#2a2d35",letterSpacing:"0.18em",pointerEvents:"none"}}>DOWNSTAGE</div>
          {plot.items.map(item=>(
            <div key={item.id}
              onMouseDown={e=>startDrag(e,item.id)}
              onTouchStart={e=>{e.preventDefault();dragRef.current={id:item.id,rect:stageRef.current.getBoundingClientRect()};setSelectedId(item.id);}}
              onDoubleClick={(e)=>{e.stopPropagation();dragRef.current=null;setEditingId(item.id);setEditLabel(item.label);}}
              style={{position:"absolute",left:`${item.x}%`,top:`${item.y}%`,transform:"translate(-50%,-50%)",cursor:"grab",userSelect:"none",display:"flex",flexDirection:"column",alignItems:"center",zIndex:selectedId===item.id?10:1}}>
              <div style={{fontSize:`${Math.round(26*(item.size||1))}px`,lineHeight:1,transition:"font-size 0.1s"}}>
                {item.icon==="__BASS__"
                  ? <BassIcon size={Math.round(32*(item.size||1))} glow={selectedId===item.id}/>
                  : <span style={{filter:selectedId===item.id?"drop-shadow(0 0 8px #f59e0b)":"none",transition:"filter 0.15s"}}>{item.icon}</span>}
              </div>
              {editingId===item.id
                ?<input autoFocus value={editLabel} onChange={e=>setEditLabel(e.target.value)} onBlur={commitEdit} onKeyDown={e=>e.key==="Enter"&&commitEdit()} onClick={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()}
                    style={{background:"#0a0c10",border:"1px solid #f59e0b",color:"#f8fafc",borderRadius:"3px",padding:"1px 4px",fontSize:"10px",width:"72px",textAlign:"center",outline:"none",fontFamily:"inherit"}}/>
                :<div style={{fontSize:"10px",color:selectedId===item.id?"#f59e0b":"#94a3b8",background:"#0a0c10cc",padding:"1px 5px",borderRadius:"3px",whiteSpace:"nowrap",maxWidth:"82px",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</div>}
            </div>
          ))}
        </div>
        <div style={{fontSize:"10px",color:"#475569",marginTop:"6px"}}>Drag to move · Double-click or ✏️ to rename · − + to resize</div>
      </div>
    </div>
  );
}

// ── Mic Search Input ──────────────────────────────────────────────────────────
const MIC_NAMES = MIC_OPTIONS.filter(m => m !== "" && typeof m === "string");

function MicSearch({value, onChange}) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const isFocused = useRef(false);
  // Only sync from parent when the input is NOT focused (e.g. loading saved data)
  useEffect(() => { if (!isFocused.current) setQuery(value || ""); }, [value]);

  const filtered = query.trim() === ""
    ? MIC_NAMES
    : MIC_NAMES.filter(m => m.toLowerCase().includes(query.toLowerCase()));

  const commit = (val) => {
    setQuery(val);
    onChange(val);
    setOpen(false);
  };

  const handleKey = (e) => {
    if (!open) { if (e.key !== "Escape") setOpen(true); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h+1, filtered.length-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(h => Math.max(h-1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[highlighted]) commit(filtered[highlighted]); else commit(query); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset highlight when filtered list changes
  useEffect(() => { setHighlighted(0); }, [query]);

  return (
    <div ref={containerRef} style={{position:"relative",width:"100%"}}>
      <input
        ref={inputRef}
        value={query}
        placeholder="— mic —"
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => { isFocused.current = true; setOpen(true); }}
        onBlur={() => { isFocused.current = false; }}
        onKeyDown={handleKey}
        style={{...S.input, width:"100%"}}
      />
      {open && filtered.length > 0 && (
        <div style={{position:"absolute",top:"100%",left:0,zIndex:999,background:"#111318",border:"1px solid #f59e0b55",borderRadius:"6px",maxHeight:"220px",overflowY:"auto",width:"220px",boxShadow:"0 8px 24px #000a",marginTop:"2px"}}>
          {filtered.map((m, i) => (
            <div key={m} onMouseDown={e=>{e.preventDefault();commit(m);}}
              style={{padding:"6px 10px",fontSize:"12px",fontFamily:"monospace",cursor:"pointer",color: i===highlighted?"#f59e0b":"#e2e8f0",background: i===highlighted?"#1e2028":"transparent",transition:"background 0.1s"}}
              onMouseEnter={()=>setHighlighted(i)}>
              {query.trim()===""
                ? m
                : (() => {
                    const idx = m.toLowerCase().indexOf(query.toLowerCase());
                    if (idx === -1) return m;
                    return <>{m.slice(0,idx)}<strong style={{color:"#f59e0b"}}>{m.slice(idx,idx+query.length)}</strong>{m.slice(idx+query.length)}</>;
                  })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Patch Sheet ───────────────────────────────────────────────────────────────
function PatchSheet({slot,onChange,numStageboxes,header}){
  const sbOptions=[...SB_COLORS.slice(0,numStageboxes).map(s=>s.key),"DIR"];
  const updateRow=(id,field,val)=>onChange({...slot,patchRows:slot.patchRows.map(r=>r.id===id?{...r,[field]:val}:r)});
  const addRow=()=>onChange({...slot,patchRows:[...slot.patchRows,{id:uid(),channel:slot.patchRows.length+1,stagebox:"SB1",input:slot.patchRows.length+1,instrument:"",mic:"",stand:"",notes:""}]});
  const removeRow=(id)=>onChange({...slot,patchRows:slot.patchRows.filter(r=>r.id!==id)});

  return(
    <div style={{padding:"14px",overflowX:"auto",flex:1}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px",padding:"10px 14px",background:"#111318",borderRadius:"8px",border:"1px solid #f59e0b33"}}>
        <div style={{fontSize:"16px"}}>🎸</div>
        <div style={{flex:1}}>
          <div style={{fontSize:"10px",color:"#f59e0b",letterSpacing:"0.12em",fontWeight:"700",marginBottom:"3px"}}>{header}</div>
          <input value={slot.bandName} onChange={e=>onChange({...slot,bandName:e.target.value})} placeholder="Band / Artist name..."
            style={{background:"transparent",border:"none",borderBottom:"1px solid #f59e0b55",color:"#f8fafc",fontSize:"18px",fontWeight:"800",outline:"none",width:"100%",padding:"2px 0",fontFamily:"'Segoe UI',system-ui,sans-serif"}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:"8px",marginBottom:"12px",flexWrap:"wrap"}}>
        {sbOptions.map(key=>{const sb=getSB(key);return(
          <div key={key} style={{display:"flex",alignItems:"center",gap:"5px",padding:"3px 10px",borderRadius:"12px",background:sb.color+"22",border:`1px solid ${sb.color}66`}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:sb.color}}/>
            <span style={{fontSize:"11px",color:sb.color,fontWeight:"700",fontFamily:"monospace"}}>{key==="DIR"?"DIR (Direct)":key}</span>
          </div>
        );})}
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",minWidth:"760px"}}>
        <thead><tr>{["CH","Stagebox","Input","Instrument","Mic","Stand","Notes",""].map(h=>(
          <th key={h} style={{textAlign:"left",padding:"7px 8px",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",color:"#f59e0b",borderBottom:"1px solid #f59e0b33",fontFamily:"monospace",fontWeight:"600"}}>{h}</th>
        ))}</tr></thead>
        <tbody>
          {slot.patchRows.map((row,idx)=>{
            const sb=getSB(row.stagebox);
            return(
              <tr key={row.id} style={{background:idx%2===0?"#111318":"#0d0f14",transition:"background 0.1s",borderLeft:`3px solid ${sb.color}`}}
                onMouseEnter={e=>e.currentTarget.style.background="#1a1d26"}
                onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#111318":"#0d0f14"}>
                <td style={{padding:"3px 8px",width:"40px"}}><div style={{fontFamily:"monospace",fontSize:"13px",fontWeight:"700",color:"#f59e0b",width:"30px",textAlign:"center"}}>{String(row.channel).padStart(2,"0")}</div></td>
                <td style={{padding:"3px 6px",width:"86px"}}>
                  <select value={row.stagebox} onChange={e=>updateRow(row.id,"stagebox",e.target.value)}
                    style={{...S.input,background:sb.color+"22",color:sb.color,borderColor:sb.color+"66",fontWeight:"700",cursor:"pointer"}}>
                    {sbOptions.map(s=><option key={s} value={s} style={{background:"#111318",color:"#e2e8f0"}}>{s}</option>)}
                  </select>
                </td>
                <td style={{padding:"3px 6px",width:"58px"}}><input type="number" min="1" value={row.input} onChange={e=>updateRow(row.id,"input",e.target.value)} style={{...S.input,width:"48px",textAlign:"center"}}/></td>
                <td style={{padding:"3px 6px"}}><input value={row.instrument} onChange={e=>updateRow(row.id,"instrument",e.target.value)} placeholder="Kick, Snare, Vox…" style={S.input}/></td>
                <td style={{padding:"3px 6px",width:"160px"}}><MicSearch value={row.mic} onChange={val=>updateRow(row.id,"mic",val)}/></td>
                <td style={{padding:"3px 6px",width:"108px"}}><select value={row.stand} onChange={e=>updateRow(row.id,"stand",e.target.value)} style={{...S.input,cursor:"pointer"}}>{STAND_OPTIONS.map(s=><option key={s} value={s}>{s||"— stand —"}</option>)}</select></td>
                <td style={{padding:"3px 6px"}}><input value={row.notes} onChange={e=>updateRow(row.id,"notes",e.target.value)} placeholder="Notes…" style={S.input}/></td>
                <td style={{padding:"3px 6px",width:"28px"}}><button onClick={()=>removeRow(row.id)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:"13px"}}>✕</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button onClick={addRow}
        style={{marginTop:"12px",background:"transparent",border:"1px dashed #2a2d35",color:"#64748b",padding:"7px 18px",borderRadius:"6px",cursor:"pointer",fontSize:"12px",letterSpacing:"0.08em",transition:"all 0.15s"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="#f59e0b";e.currentTarget.style.color="#f59e0b";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="#2a2d35";e.currentTarget.style.color="#64748b";}}>
        + ADD CHANNEL
      </button>
    </div>
  );
}

// ── Festival Setup ────────────────────────────────────────────────────────────
function FestivalSetup({onConfirm,onBack}){
  const[festName,setFestName]=useState("");
  const[stageName,setStageName]=useState("");
  const[numDays,setNumDays]=useState(1);
  const[bandsPerDay,setBandsPerDay]=useState([3]);
  const updateDays=(n)=>{const c=Math.max(1,Math.min(10,n));setNumDays(c);setBandsPerDay(p=>{const a=[...p];while(a.length<c)a.push(3);return a.slice(0,c);});};
  const total=bandsPerDay.slice(0,numDays).reduce((a,b)=>a+b,0);
  const ready=festName.trim().length>0;
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0c10,#111420)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"30px",fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#e2e8f0"}}>
      <div style={{width:"100%",maxWidth:"500px"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:"14px",marginBottom:"20px"}}>← Back</button>
        <div style={{textAlign:"center",marginBottom:"28px"}}><div style={{fontSize:"36px"}}>🎡</div><h2 style={{margin:"8px 0 0",fontSize:"20px",fontWeight:"800",letterSpacing:"0.15em",textTransform:"uppercase"}}>Festival Setup</h2></div>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div><label style={S.label}>FESTIVAL NAME *</label><input value={festName} onChange={e=>setFestName(e.target.value)} placeholder="e.g. Primavera Sound…" style={{...S.input,fontSize:"14px",padding:"8px 12px"}}/></div>
          <div><label style={S.label}>STAGE NAME (optional)</label><input value={stageName} onChange={e=>setStageName(e.target.value)} placeholder="e.g. Main Stage, Tent B…" style={{...S.input,fontSize:"14px",padding:"8px 12px"}}/></div>
          <div>
            <label style={S.label}>HOW MANY DAYS?</label>
            <div style={{display:"flex",gap:"10px",alignItems:"center",justifyContent:"center"}}>
              <button onClick={()=>updateDays(numDays-1)} style={{background:"#1e2028",border:"1px solid #2a2d35",color:"#e2e8f0",width:"38px",height:"38px",borderRadius:"6px",cursor:"pointer",fontSize:"20px"}}>−</button>
              <div style={{minWidth:"50px",textAlign:"center",fontSize:"26px",fontWeight:"800",color:"#f59e0b",fontFamily:"monospace"}}>{numDays}</div>
              <button onClick={()=>updateDays(numDays+1)} style={{background:"#1e2028",border:"1px solid #2a2d35",color:"#e2e8f0",width:"38px",height:"38px",borderRadius:"6px",cursor:"pointer",fontSize:"20px"}}>+</button>
            </div>
          </div>
          <div>
            <label style={S.label}>BANDS PER DAY</label>
            <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
              {Array.from({length:numDays},(_,d)=>(
                <div key={d} style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 14px",background:"#111318",borderRadius:"8px",border:"1px solid #1e2028"}}>
                  <div style={{fontSize:"11px",color:"#94a3b8",fontWeight:"700",minWidth:"50px",fontFamily:"monospace"}}>DAY {d+1}</div>
                  <button onClick={()=>setBandsPerDay(p=>p.map((v,i)=>i===d?Math.max(1,v-1):v))} style={{background:"#1e2028",border:"1px solid #2a2d35",color:"#e2e8f0",width:"28px",height:"28px",borderRadius:"4px",cursor:"pointer",fontSize:"16px"}}>−</button>
                  <div style={{minWidth:"30px",textAlign:"center",fontSize:"18px",fontWeight:"700",color:"#f59e0b",fontFamily:"monospace"}}>{bandsPerDay[d]||1}</div>
                  <button onClick={()=>setBandsPerDay(p=>p.map((v,i)=>i===d?Math.min(20,v+1):v))} style={{background:"#1e2028",border:"1px solid #2a2d35",color:"#e2e8f0",width:"28px",height:"28px",borderRadius:"4px",cursor:"pointer",fontSize:"16px"}}>+</button>
                  <div style={{fontSize:"11px",color:"#475569"}}>{bandsPerDay[d]||1} band{(bandsPerDay[d]||1)!==1?"s":""}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:"10px",padding:"7px 12px",background:"#f59e0b11",border:"1px solid #f59e0b33",borderRadius:"6px",fontSize:"12px",color:"#f59e0b",textAlign:"center"}}>→ {total} patch sheet{total!==1?"s":""} will be created</div>
          </div>
          <button onClick={()=>onConfirm(makeFestivalData(festName,stageName,numDays,bandsPerDay))} disabled={!ready}
            style={{marginTop:"6px",background:ready?"#f59e0b":"#2a2d35",border:"none",color:ready?"#000":"#475569",padding:"13px",borderRadius:"8px",cursor:ready?"pointer":"not-allowed",fontWeight:"800",fontSize:"14px",letterSpacing:"0.1em",textTransform:"uppercase"}}>
            Create Festival Patches →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Project Manager ───────────────────────────────────────────────────────────
function ProjectManager({onOpen,onNew,refreshKey}){
  const[projects,setProjects]=useState([]);
  const[loading,setLoading]=useState(true);
  const[deleting,setDeleting]=useState(null);

  useEffect(()=>{
    setLoading(true);
    loadAllProjects().then(setProjects).finally(()=>setLoading(false));
  },[refreshKey]);

  const handleDelete=async(id)=>{await deleteProject(id);setProjects(p=>p.filter(x=>x.id!==id));setDeleting(null);};
  const fmt=(ts)=>new Date(ts).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0c10,#111420)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#e2e8f0"}}>
      <div style={{width:"100%",maxWidth:"600px"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontSize:"44px",marginBottom:"10px"}}>🎚️</div>
          <h1 style={{fontSize:"24px",fontWeight:"800",letterSpacing:"0.15em",textTransform:"uppercase",margin:0}}>Stage Patch Pro</h1>
          <p style={{color:"#64748b",fontSize:"12px",marginTop:"6px",letterSpacing:"0.1em"}}>LIVE SOUND TECHNICIAN TOOL</p>
        </div>
        <button onClick={onNew}
          style={{width:"100%",background:"transparent",border:"2px dashed #f59e0b",borderRadius:"10px",padding:"18px",cursor:"pointer",color:"#f59e0b",fontSize:"15px",fontWeight:"700",letterSpacing:"0.08em",marginBottom:"20px",transition:"all 0.2s"}}
          onMouseEnter={e=>e.currentTarget.style.background="#f59e0b15"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          + NEW PROJECT
        </button>
        {loading
          ?<div style={{textAlign:"center",color:"#475569",padding:"30px"}}>Loading…</div>
          :projects.length===0
            ?<div style={{textAlign:"center",color:"#475569",padding:"30px",border:"1px solid #1e2028",borderRadius:"8px"}}>No projects yet. Create your first one!</div>
            :<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              <div style={{fontSize:"10px",color:"#475569",letterSpacing:"0.12em",marginBottom:"4px"}}>YOUR PROJECTS</div>
              {[...projects].sort((a,b)=>b.updatedAt-a.updatedAt).map(p=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"12px 16px",background:"#111318",borderRadius:"8px",border:"1px solid #1e2028",transition:"border-color 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#f59e0b33"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#1e2028"}>
                  <div style={{fontSize:"20px"}}>{p.mode==="festival"?"🎡":"🎤"}</div>
                  <div style={{flex:1,cursor:"pointer"}} onClick={()=>onOpen(p.id)}>
                    <div style={{fontWeight:"700",fontSize:"14px"}}>{p.name}</div>
                    <div style={{fontSize:"11px",color:"#475569",marginTop:"2px"}}>{p.mode==="festival"?"Festival Patch":"Single Rider"} · Updated {fmt(p.updatedAt)}</div>
                  </div>
                  {deleting===p.id
                    ?<div style={{display:"flex",gap:"6px"}}>
                      <button onClick={()=>handleDelete(p.id)} style={{background:"#ef4444",border:"none",color:"#fff",padding:"5px 10px",borderRadius:"5px",cursor:"pointer",fontSize:"11px",fontWeight:"700"}}>Delete</button>
                      <button onClick={()=>setDeleting(null)} style={{background:"#1e2028",border:"1px solid #2a2d35",color:"#94a3b8",padding:"5px 10px",borderRadius:"5px",cursor:"pointer",fontSize:"11px"}}>Cancel</button>
                    </div>
                    :<button onClick={()=>setDeleting(p.id)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:"16px",padding:"2px 6px"}}>🗑</button>}
                </div>
              ))}
            </div>}
      </div>
    </div>
  );
}

// ── New Project Modal ─────────────────────────────────────────────────────────
function NewProjectModal({onConfirm,onCancel}){
  const[name,setName]=useState("");
  const[mode,setMode]=useState(null);
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <div style={{background:"#111318",border:"1px solid #2a2d35",borderRadius:"12px",padding:"28px",width:"100%",maxWidth:"400px",color:"#e2e8f0"}}>
        <h3 style={{margin:"0 0 20px",fontSize:"16px",fontWeight:"800",letterSpacing:"0.1em",textTransform:"uppercase"}}>New Project</h3>
        <div style={{marginBottom:"16px"}}>
          <label style={S.label}>PROJECT NAME *</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Primavera 2025, Iron Maiden…" style={{...S.input,fontSize:"14px",padding:"8px 12px"}} autoFocus/>
        </div>
        <div style={{marginBottom:"20px"}}>
          <label style={S.label}>TYPE</label>
          <div style={{display:"flex",gap:"10px"}}>
            {[{k:"single",icon:"🎤",label:"Single Rider"},{k:"festival",icon:"🎡",label:"Festival Patch"}].map(opt=>(
              <button key={opt.k} onClick={()=>setMode(opt.k)}
                style={{flex:1,background:mode===opt.k?"#f59e0b22":"transparent",border:`2px solid ${mode===opt.k?"#f59e0b":"#2a2d35"}`,borderRadius:"8px",padding:"14px 10px",cursor:"pointer",color:mode===opt.k?"#f59e0b":"#94a3b8",textAlign:"center",transition:"all 0.15s"}}>
                <div style={{fontSize:"24px",marginBottom:"6px"}}>{opt.icon}</div>
                <div style={{fontSize:"12px",fontWeight:"700"}}>{opt.label}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          <button onClick={onCancel} style={{flex:1,background:"transparent",border:"1px solid #2a2d35",color:"#94a3b8",padding:"10px",borderRadius:"6px",cursor:"pointer",fontWeight:"600"}}>Cancel</button>
          <button onClick={()=>name.trim()&&mode&&onConfirm(name.trim(),mode)} disabled={!name.trim()||!mode}
            style={{flex:2,background:name.trim()&&mode?"#f59e0b":"#2a2d35",border:"none",color:name.trim()&&mode?"#000":"#475569",padding:"10px",borderRadius:"6px",cursor:name.trim()&&mode?"pointer":"not-allowed",fontWeight:"800",fontSize:"13px",letterSpacing:"0.08em",textTransform:"uppercase"}}>
            Create →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const[screen,setScreen]=useState("home");
  const[showNewModal,setShowNewModal]=useState(false);
  const[project,setProject]=useState(null);
  const[activeTab,setActiveTab]=useState("patch");
  const[activeDay,setActiveDay]=useState(0);
  const[activeBand,setActiveBand]=useState(0);
  const[saveStatus,setSaveStatus]=useState("saved");
  const[homeRefresh,setHomeRefresh]=useState(0);
  const saveTimer=useRef(null);
  const latestProject=useRef(null); // always points to the freshest project

  const doSaveNow=useCallback(async(proj)=>{
    setSaveStatus("saving");
    try{
      const saved=await saveProject(proj);
      setProject(saved);
      setSaveStatus("saved");
      return saved;
    }catch(e){
      console.error("Save failed",e);
      setSaveStatus("error");
      return proj;
    }
  },[]);

  const scheduleAutoSave=useCallback(()=>{
    setSaveStatus("saving");
    if(saveTimer.current)clearTimeout(saveTimer.current);
    // Always read from ref so the timer saves the LATEST state, not a stale closure
    saveTimer.current=setTimeout(()=>doSaveNow(latestProject.current),1000);
  },[doSaveNow]);

  const updateProject=(patch)=>{
    // Use functional update so we never depend on a stale `project` closure
    setProject(prev=>{
      const updated={...prev,...patch};
      latestProject.current=updated; // keep ref in sync
      scheduleAutoSave();
      return updated;
    });
  };

  // Flush pending saves, then go home and force project list reload
  const goHome=useCallback(async()=>{
    if(saveTimer.current){clearTimeout(saveTimer.current);saveTimer.current=null;}
    if(latestProject.current){await doSaveNow(latestProject.current);}
    setHomeRefresh(k=>k+1); // force ProjectManager to re-fetch
    setScreen("home");
  },[project,doSaveNow]);

  const handleOpenProject=async(id)=>{
    const proj=await loadProject(id);
    if(proj){setProject(proj);setActiveDay(0);setActiveBand(0);setActiveTab("patch");setSaveStatus("saved");setScreen(proj.mode==="festival"&&!proj.festivalData?"festSetup":"main");}
  };

  const handleNewProject=async(name,mode)=>{
    const proj=makeProject(name,mode);
    setShowNewModal(false);
    setActiveDay(0);setActiveBand(0);setActiveTab("patch");
    const saved=await doSaveNow(proj); // save immediately on create
    setProject(saved);
    setScreen(mode==="festival"?"festSetup":"main");
  };

  const handleFestivalSetup=async(festivalData)=>{
    const updated={...project,festivalData};
    const saved=await doSaveNow(updated); // save immediately on festival confirm
    setProject(saved);
    setScreen("main");
  };

  const isFestival=project?.mode==="festival";
  const currentDay=isFestival?project?.festivalData?.days[activeDay]:null;
  const currentSlot=isFestival?currentDay?.slots[activeBand]:project?.singleSlot;

  const updateCurrentSlot=(slot)=>{
    if(isFestival){updateProject({festivalData:{...project.festivalData,days:project.festivalData.days.map((d,di)=>di===activeDay?{...d,slots:d.slots.map((s,si)=>si===activeBand?slot:s)}:d)}});}
    else{updateProject({singleSlot:slot});}
  };

  if(screen==="home")return(<><ProjectManager onOpen={handleOpenProject} onNew={()=>setShowNewModal(true)} refreshKey={homeRefresh}/>{showNewModal&&<NewProjectModal onConfirm={handleNewProject} onCancel={()=>setShowNewModal(false)}/>}</>);
  if(screen==="festSetup")return <FestivalSetup onConfirm={handleFestivalSetup} onBack={()=>setScreen("home")}/>;

  const fd=project?.festivalData;
  const numStageboxes=project?.numStageboxes||4;
  const patchHeader=isFestival?`${fd?.festName||""}${fd?.stageName?` · ${fd.stageName}`:""} — ${currentDay?.dayLabel||""}`:project?.name||"";
  const saveLabel=saveStatus==="saving"?"💾 Saving…":saveStatus==="error"?"⚠️ Error":"✅ Saved";
  const saveColor=saveStatus==="saving"?"#64748b":saveStatus==="error"?"#ef4444":"#22c55e";

  return(
    <div style={{height:"100vh",background:"#0a0c10",fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#e2e8f0",display:"flex",flexDirection:"column"}}>
      <div style={{background:"#111318",borderBottom:"1px solid #1e2028",padding:"8px 14px",display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap",flexShrink:0}}>
        <button onClick={goHome} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:"14px",padding:0,display:"flex",alignItems:"center",gap:"5px"}}>
          ← <span style={{fontSize:"11px",letterSpacing:"0.08em"}}>PROJECTS</span>
        </button>
        <div style={{width:"1px",height:"18px",background:"#2a2d35"}}/>
        <div style={{fontWeight:"700",fontSize:"13px",color:"#f59e0b",letterSpacing:"0.08em"}}>{isFestival?"🎡":"🎤"} {project?.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:"5px",marginLeft:"4px"}}>
          <span style={{fontSize:"10px",color:"#475569",letterSpacing:"0.08em"}}>SB:</span>
          {[1,2,3,4,5].map(n=>(
            <button key={n} onClick={()=>updateProject({numStageboxes:n})}
              style={{width:"24px",height:"24px",borderRadius:"4px",border:`2px solid ${n<=numStageboxes?SB_COLORS[n-1].color+"88":"#2a2d35"}`,background:n<=numStageboxes?SB_COLORS[n-1].color+"22":"transparent",color:n<=numStageboxes?SB_COLORS[n-1].color:"#475569",cursor:"pointer",fontSize:"10px",fontWeight:"700",fontFamily:"monospace",transition:"all 0.15s"}}>
              {n}
            </button>
          ))}
        </div>
        <div style={{flex:1}}/>
        <button onClick={()=>doSaveNow(project)}
          style={{background:"none",border:`1px solid ${saveColor}44`,color:saveColor,padding:"4px 10px",borderRadius:"5px",cursor:"pointer",fontSize:"10px",letterSpacing:"0.08em",transition:"all 0.2s"}}>
          {saveLabel}
        </button>
        <div style={{display:"flex",gap:"4px"}}>
          {["patch","stage"].map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} style={S.btn(activeTab===tab)}>
              {tab==="patch"?"📋 Patch":"🗺️ Stage Plot"}
            </button>
          ))}
        </div>
      </div>

      {isFestival&&(
        <div style={{background:"#0d0f14",borderBottom:"1px solid #1e2028",flexShrink:0}}>
          <div style={{display:"flex",gap:"2px",borderBottom:"1px solid #1e2028",overflowX:"auto",padding:"0 14px"}}>
            {fd?.days.map((day,di)=>(
              <button key={di} onClick={()=>{setActiveDay(di);setActiveBand(0);}}
                style={{background:"transparent",border:"none",borderBottom:activeDay===di?"2px solid #f59e0b":"2px solid transparent",color:activeDay===di?"#f59e0b":"#64748b",padding:"9px 16px",cursor:"pointer",fontWeight:"700",fontSize:"11px",letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap",transition:"all 0.15s"}}>
                📅 {day.dayLabel}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:"5px",padding:"7px 14px",overflowX:"auto",alignItems:"center"}}>
            <span style={{fontSize:"10px",color:"#475569",letterSpacing:"0.08em",whiteSpace:"nowrap",marginRight:"4px"}}>BAND:</span>
            {currentDay?.slots.map((slot,bi)=>(
              <button key={bi} onClick={()=>setActiveBand(bi)}
                style={{background:activeBand===bi?"#1e2028":"transparent",border:`1px solid ${activeBand===bi?"#f59e0b55":"#1e2028"}`,color:activeBand===bi?"#f8fafc":"#64748b",padding:"4px 14px",borderRadius:"20px",cursor:"pointer",fontSize:"12px",fontWeight:activeBand===bi?"700":"400",whiteSpace:"nowrap",transition:"all 0.15s"}}>
                {slot.bandName||`Band ${bi+1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
        {activeTab==="patch"&&currentSlot&&(
          <div style={{flex:1,overflowY:"auto"}}>
            <PatchSheet slot={currentSlot} onChange={updateCurrentSlot} numStageboxes={numStageboxes} header={patchHeader}/>
          </div>
        )}
        {activeTab==="stage"&&currentSlot&&(
          <StagePlot plot={currentSlot.stagePlot} onChange={stagePlot=>updateCurrentSlot({...currentSlot,stagePlot})}/>
        )}
      </div>
    </div>
  );
}

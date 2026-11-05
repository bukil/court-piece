import { useEffect, useRef, useState } from 'react';
interface PhoneTableMenuProps { code: string; muted: boolean; onCopy: () => void; onToggleSound: () => void; onRules?: () => void; onLeave: () => void; }
export function PhoneTableMenu({code,muted,onCopy,onToggleSound,onRules,onLeave}: PhoneTableMenuProps) {
  const root=useRef<HTMLDetailsElement>(null);
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const outside=(event:PointerEvent)=>{if(root.current?.open&&!root.current.contains(event.target as Node))root.current.open=false;};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&root.current?.open){root.current.open=false;root.current.querySelector('summary')?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[]);
  const run=(action:()=>void)=>{action();if(root.current)root.current.open=false;};
  return <details ref={root} className="phone-table-menu" onToggle={event=>setOpen(event.currentTarget.open)}><summary role="button" aria-label="More table controls" aria-expanded={open} aria-controls="phone-menu-panel">More <span aria-hidden="true">⋯</span></summary><div id="phone-menu-panel" className="phone-table-menu-panel">
    <button onClick={()=>run(onCopy)}>Room {code} <span aria-hidden="true">⧉</span></button>
    <button onClick={()=>run(onToggleSound)}>{muted?'Turn sound on':'Turn sound off'}</button>
    {onRules&&<button onClick={()=>run(onRules)}>How to play</button>}
    <button onClick={()=>run(onLeave)}>Leave table</button>
  </div></details>;
}

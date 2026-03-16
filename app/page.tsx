'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const DMG_URL =
  'https://github.com/jasPreMar/hyper-pointer/releases/download/v1.0.31/HyperPointer.dmg';

// ─── Hover items ─────────────────────────────────────────────────────────────

type HoverItemId = 'hd' | 'hp' | 'trash' | 'download' | 'apple' | 'finder';

interface HoverItem {
  context: string;
  q: string;
  a: string;
  isAction?: boolean;
}

const ITEMS: Record<HoverItemId, HoverItem> = {
  hd: {
    context: 'Finder › Desktop\nicon: Macintosh HD\nrole: disk icon\n500 GB · 156 GB used',
    q: 'how much space is left?',
    a: '$ df -h /\nFilesystem   Size   Used  Avail\n/dev/disk3  500G   156G   344G\n\n344 GB free. Biggest hogs are Movies (92 GB) and Downloads (28 GB).',
    isAction: true,
  },
  hp: {
    context: 'Finder › Desktop\napp: HyperPointer\nrole: application icon',
    q: 'what does this app do?',
    a: "Adds a floating AI panel to your cursor. Hold ⌘, point at anything on your Mac, and ask Claude about it. Reads what's under your cursor automatically — no context-setting needed.",
  },
  trash: {
    context: 'Finder › Desktop\nicon: Trash\nrole: button\nstate: empty',
    q: 'anything in here?',
    a: "$ ls ~/.Trash\n(empty)\n\nNothing. You're good.",
    isAction: true,
  },
  download: {
    context: 'HyperPointer › About\nbutton: Download for Mac\nrole: default button\nversion: 1.0.31',
    q: 'what does this download?',
    a: 'HyperPointer.dmg — 1.8 MB. Open it, drag to Applications, launch it. Walks you through Accessibility and Screen Recording permissions on first run. Requires macOS 14+ and the Claude CLI.',
  },
  apple: {
    context: 'menu bar\n① Apple menu\nrole: menu button',
    q: "what's in this menu?",
    a: "About This Mac, System Settings, App Store, Recent Items, Force Quit, Sleep, Restart, Shut Down. The Apple menu layout hasn't meaningfully changed since 2001.",
  },
  finder: {
    context: 'menu bar\nFinder\nrole: active application name\nstate: frontmost',
    q: 'can I quit Finder?',
    a: '$ killall Finder\n[Finder relaunches automatically]\n\nYou can kill it but macOS restarts it immediately. Protected process.',
    isAction: true,
  },
};

type ConvState = 'idle' | 'typing-q' | 'waiting' | 'typing-a' | 'done';

function IconHD() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect x="4" y="8" width="36" height="28" rx="3" fill="#d4d0c8" stroke="#666" strokeWidth="1.5" />
      <rect x="4" y="8" width="36" height="8" rx="3" fill="#b8b4ac" stroke="#666" strokeWidth="1.5" />
      <rect x="8" y="20" width="20" height="10" rx="1" fill="white" stroke="#999" strokeWidth="1" />
      <line x1="10" y1="23" x2="26" y2="23" stroke="#ccc" strokeWidth="1" />
      <line x1="10" y1="26" x2="20" y2="26" stroke="#ccc" strokeWidth="1" />
      <circle cx="34" cy="28" r="3" fill="#4adb80" />
      <circle cx="34" cy="28" r="1.5" fill="#7fffaa" />
    </svg>
  );
}

function IconHP() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect x="4" y="4" width="36" height="36" rx="8" fill="#1a1a2e" />
      <rect x="4" y="4" width="36" height="36" rx="8" stroke="#3a3a6e" strokeWidth="1" />
      <path d="M12 10 L12 30 L18 24 L22 32 L26 30 L22 22 L28 22 Z"
        fill="white" stroke="black" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="30" cy="14" r="5" fill="#4af0a0" />
      <circle cx="30" cy="14" r="2.5" fill="#9fffcc" />
    </svg>
  );
}

function IconTrash({ empty }: { empty: boolean }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect x="10" y="10" width="24" height="5" rx="2" fill="#d4d0c8" stroke="#888" strokeWidth="1.5" />
      <rect x="17" y="7" width="10" height="5" rx="2" fill="#d4d0c8" stroke="#888" strokeWidth="1.5" />
      <path d="M12 16 L14 36 L30 36 L32 16 Z" fill={empty ? '#d4d0c8' : '#b8b4ac'} stroke="#888" strokeWidth="1.5" />
      <line x1="18" y1="20" x2="18" y2="33" stroke="#999" strokeWidth="1" />
      <line x1="22" y1="20" x2="22" y2="33" stroke="#999" strokeWidth="1" />
      <line x1="26" y1="20" x2="26" y2="33" stroke="#999" strokeWidth="1" />
    </svg>
  );
}

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
  const [hoveredId, setHoveredId] = useState<HoverItemId | null>(null);
  const [panelAnchor, setPanelAnchor] = useState({ x: 0, y: 0 });
  const [convState, setConvState] = useState<ConvState>('idle');
  const [displayQ, setDisplayQ] = useState('');
  const [displayA, setDisplayA] = useState('');
  const [time, setTime] = useState('');
  const [vpW, setVpW] = useState(1200);
  const [vpH, setVpH] = useState(800);

  const typeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeId = useRef<HoverItemId | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  const [winPos, setWinPos] = useState<{ x: number; y: number } | null>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const upd = () => { setVpW(window.innerWidth); setVpH(window.innerHeight); };
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      setMousePos(pos);
      mousePosRef.current = pos;
    };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const clearAll = useCallback(() => {
    if (typeInterval.current) clearInterval(typeInterval.current);
    setConvState('idle');
    setDisplayQ('');
    setDisplayA('');
  }, []);

  const playConversation = useCallback(
    (id: HoverItemId, anchorX: number, anchorY: number) => {
      clearAll();
      setPanelAnchor({ x: anchorX, y: anchorY });
      const { q, a } = ITEMS[id];
      let qi = 0;
      setConvState('typing-q');
      typeInterval.current = setInterval(() => {
        qi++;
        setDisplayQ(q.slice(0, qi));
        if (qi >= q.length) {
          clearInterval(typeInterval.current!);
          setConvState('waiting');
          setTimeout(() => {
            if (activeId.current !== id) return;
            let ai = 0;
            setConvState('typing-a');
            typeInterval.current = setInterval(() => {
              ai++;
              setDisplayA(a.slice(0, ai));
              if (ai >= a.length) {
                clearInterval(typeInterval.current!);
                setConvState('done');
              }
            }, 14);
          }, 400);
        }
      }, 32);
    },
    [clearAll],
  );

  const handleEnter = useCallback(
    (id: HoverItemId) => {
      activeId.current = id;
      setHoveredId(id);
      clearAll();
      playConversation(id, mousePosRef.current.x, mousePosRef.current.y);
    },
    [clearAll, playConversation],
  );

  const handleLeave = useCallback(() => {
    activeId.current = null;
    setHoveredId(null);
    clearAll();
  }, [clearAll]);

  const handleTitlebarMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const rect = (e.currentTarget.closest('.window') as HTMLElement).getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (winPos === null) {
      const vpw = window.innerWidth;
      const vph = window.innerHeight;
      setWinPos({ x: vpw / 2 - 190, y: vph / 2 - rect.height / 2 });
    }
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !dragOffset.current) return;
      setWinPos({ x: ev.clientX - dragOffset.current.x, y: ev.clientY - dragOffset.current.y });
    };
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [winPos]);

  const rawPanelX = panelAnchor.x + 22;
  const rawPanelY = panelAnchor.y + 22;
  const panelX = Math.min(rawPanelX, vpW - 340);
  const panelY = Math.min(rawPanelY, vpH - 260);

  const bind = (id: HoverItemId) => ({
    onMouseEnter: () => handleEnter(id),
    onMouseLeave: handleLeave,
  });

  const currentItem = hoveredId ? ITEMS[hoveredId] : null;
  const isPointerTarget = hoveredId === 'download';

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; cursor: none !important; }
        html, body {
          margin: 0; padding: 0; overflow: hidden;
          height: 100%; width: 100%;
          font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background: #111;
        }
        .desktop {
          position: fixed; inset: 0;
          background-color: #111;
          background-image: url('/desktop-bg.png');
          background-size: cover;
          background-position: center;
          image-rendering: pixelated;
        }
        .menubar {
          position: fixed; top: 0; left: 0; right: 0; height: 22px;
          background: linear-gradient(180deg, #f4f4f4 0%, #e8e8e8 100%);
          border-bottom: 1px solid #aaa;
          display: flex; align-items: center; padding: 0 4px; gap: 2px;
          z-index: 200; font-size: 13px; font-weight: 400;
          -webkit-font-smoothing: antialiased;
        }
        .menubar-item {
          padding: 1px 8px 2px; border-radius: 3px; color: #111;
          white-space: nowrap; user-select: none;
        }
        .menubar-item.bold { font-weight: 700; }
        .menubar-item.active, .menubar-item:hover { background: #1657d5; color: #fff; }
        .menubar-apple { font-size: 17px; line-height: 1; padding: 0px 8px 2px; color: #111; }
        .menubar-clock { margin-left: auto; font-size: 12px; color: #444; padding-right: 8px; }
        .icon-col {
          position: fixed; top: 32px; right: 12px;
          display: flex; flex-direction: column; gap: 4px; z-index: 10;
        }
        .icon-item {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 5px 6px; border-radius: 4px; width: 72px;
          text-align: center; transition: background 0.1s;
        }
        .icon-item:hover, .icon-item.active {
          background: rgba(0,40,120,0.3);
          outline: 1px dashed rgba(255,255,255,0.4);
        }
        .icon-label {
          font-size: 11px; font-weight: 500; color: #fff;
          text-shadow: 0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.6);
          line-height: 1.3; word-break: break-word;
        }
        .trash-wrap { position: fixed; bottom: 20px; right: 12px; z-index: 10; }
        .window {
          position: fixed;
          width: 380px; background: #ebebeb; border-radius: 6px; border: 1px solid #888;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.8) inset, 0 12px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
          overflow: hidden; z-index: 50;
        }
        .window-titlebar {
          height: 22px;
          background: repeating-linear-gradient(180deg, #d8d8d8 0px, #d8d8d8 1px, #f0f0f0 1px, #f0f0f0 2px);
          border-bottom: 1px solid #aaa;
          display: flex; align-items: center; padding: 0 8px; gap: 6px; position: relative;
        }
        .win-btn { width: 13px; height: 13px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.3); flex-shrink: 0; }
        .win-btn.close { background: #ff5f57; }
        .win-btn.min   { background: #febc2e; }
        .win-btn.max   { background: #28c840; }
        .window-title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 12px; font-weight: 600; color: #333; white-space: nowrap; }
        .window-body { padding: 28px 36px 32px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .app-name { font-size: 20px; font-weight: 700; color: #111; letter-spacing: -0.3px; }
        .app-sub { font-size: 12px; color: #777; margin-top: -4px; }
        .app-tagline { font-size: 13px; color: #555; text-align: center; line-height: 1.6; max-width: 260px; margin: 4px 0 8px; }
        .download-btn {
          display: inline-block; padding: 10px 40px;
          background: linear-gradient(180deg, #f8f8f8 0%, #dcdcdc 100%);
          border: 2px solid #333; border-radius: 6px;
          box-shadow: 0 0 0 3px #333, 0 1px 0 #fff inset, 0 -1px 0 rgba(0,0,0,0.1) inset;
          font-size: 15px; font-weight: 700; color: #111; text-decoration: none;
          letter-spacing: -0.2px; transition: box-shadow 0.08s, transform 0.08s;
          -webkit-font-smoothing: antialiased;
        }
        .download-btn:active {
          transform: translateY(1px);
          box-shadow: 0 0 0 3px #333, 0 -1px 0 #fff inset, 0 1px 0 rgba(0,0,0,0.15) inset;
        }
        .dl-meta { font-size: 10px; color: #999; margin-top: 2px; letter-spacing: 0.2px; }
        .hp-panel {
          position: fixed; z-index: 9000; width: 320px;
          background: rgba(12,12,18,0.97);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;
          padding: 10px 14px 12px;
          font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
          font-size: 11px; color: #c8c8d8;
          box-shadow: 0 8px 40px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.06) inset;
          pointer-events: none;
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        }
        .hp-header {
          display: flex; align-items: center; gap: 6px;
          margin-bottom: 8px; padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .hp-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #4af0a0; box-shadow: 0 0 6px #4af0a0; flex-shrink: 0;
          animation: hp-pulse 1.4s ease-in-out infinite;
        }
        @keyframes hp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        .hp-app-label { font-size: 10px; color: #666; letter-spacing: 0.4px; text-transform: uppercase; }
        .hp-context { color: #8a8a9e; line-height: 1.7; white-space: pre; font-size: 11px; }
        .hp-conversation { margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.07); }
        .hp-q { color: #e8e8f0; margin-bottom: 6px; }
        .hp-q::before { content: '> '; color: #4af0a0; font-weight: bold; }
        .hp-a { color: #9ab8d0; line-height: 1.65; white-space: pre-wrap; }
        .hp-a.is-action { color: #7fd88a; }
        .hp-blink {
          display: inline-block; width: 6px; height: 12px;
          background: #4af0a0; vertical-align: text-bottom; margin-left: 1px;
          animation: blink 0.75s step-end infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor { position: fixed; top: 0; left: 0; pointer-events: none; z-index: 99999; will-change: transform; }
        .cursor-active {
          position: absolute; top: 6px; left: 11px;
          width: 7px; height: 7px; border-radius: 50%;
          background: #4af0a0;
          box-shadow: 0 0 8px #4af0a0, 0 0 16px rgba(74,240,160,0.4);
          animation: hp-pulse 1s ease-in-out infinite;
        }
      `}</style>

      <div className="desktop" />

      <div className="menubar">
        <span className="menubar-apple" {...bind('apple')}>&#xF8FF;</span>
        <span className={`menubar-item bold ${hoveredId === 'finder' ? 'active' : ''}`} {...bind('finder')}>Finder</span>
        <span className="menubar-item">File</span>
        <span className="menubar-item">Edit</span>
        <span className="menubar-item">View</span>
        <span className="menubar-item">Special</span>
        <span className="menubar-item">Help</span>
        <span className="menubar-clock">{time}</span>
      </div>

      <div className="icon-col">
        <div className={`icon-item ${hoveredId === 'hd' ? 'active' : ''}`} {...bind('hd')}>
          <IconHD />
          <span className="icon-label">Macintosh HD</span>
        </div>
        <div className={`icon-item ${hoveredId === 'hp' ? 'active' : ''}`} {...bind('hp')}>
          <IconHP />
          <span className="icon-label">HyperPointer</span>
        </div>
      </div>

      <div className="trash-wrap">
        <div className={`icon-item ${hoveredId === 'trash' ? 'active' : ''}`} {...bind('trash')}>
          <IconTrash empty />
          <span className="icon-label">Trash</span>
        </div>
      </div>

      <div
        className="window"
        style={winPos ? { left: winPos.x, top: winPos.y } : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <div className="window-titlebar" onMouseDown={handleTitlebarMouseDown} style={{ userSelect: 'none' }}>
          <div className="win-btn close" />
          <div className="win-btn min" />
          <div className="win-btn max" />
          <span className="window-title">HyperPointer</span>
        </div>
        <div className="window-body">
          <IconHP />
          <div className="app-name">HyperPointer</div>
          <div className="app-sub">Version 1.0.31</div>
          <p className="app-tagline">
            Hold <kbd style={{ fontFamily: 'inherit', fontWeight: 700 }}>⌘</kbd>.<br />
            Point at anything on your screen.<br />
            Ask Claude about it.
          </p>
          <a href={DMG_URL} download="HyperPointer.dmg" className="download-btn" {...bind('download')}>
            Download for Mac
          </a>
          <div className="dl-meta">macOS 14+ &nbsp;·&nbsp; Free &nbsp;·&nbsp; Requires Claude CLI</div>
        </div>
      </div>

      {currentItem && (
        <div className="hp-panel" style={{ left: panelX, top: panelY }}>
          <div className="hp-header">
            <div className="hp-dot" />
            <span className="hp-app-label">HyperPointer</span>
          </div>
          <div className="hp-context">{currentItem.context}</div>
          {convState !== 'idle' && (
            <div className="hp-conversation">
              <div className="hp-q">
                {displayQ}
                {convState === 'typing-q' && <span className="hp-blink" />}
              </div>
              {convState === 'waiting' && (
                <div className="hp-a"><span className="hp-blink" /></div>
              )}
              {(convState === 'typing-a' || convState === 'done') && (
                <div className={`hp-a${currentItem.isAction ? ' is-action' : ''}`}>
                  {displayA}
                  {convState === 'typing-a' && <span className="hp-blink" />}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="cursor" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}>
        {isPointerTarget ? (
          <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
            <path
              d="M6 1.5 C6 1.5 6 11 6 13 C5.2 12.2 3.8 11.8 2.8 12.8 C1.8 13.8 3 15.2 4 16.2 C5.2 17.4 7 19.5 8 21 C9 22.5 10.5 23.5 12.5 23.5 C15.5 23.5 17 21.5 17 18.5 L17 12 C17 11 16.2 10.2 15.2 10.2 C15 9.2 14.2 8.2 13 8.2 C12.8 7.2 12 6.2 11 6.2 L11 1.5 C11 0.5 9.5 -0.2 8.5 0.8 C7.5 1.5 7.5 1.5 6 1.5 Z"
              fill="white" stroke="black" strokeWidth="1.2" strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="14" height="21" viewBox="0 0 14 21" fill="none">
            <path
              d="M1.5 1.5 L1.5 18 L5.5 13.5 L8.5 20 L10.5 19 L7.5 12.5 L12.5 12.5 Z"
              fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round"
            />
          </svg>
        )}
        {hoveredId && !isPointerTarget && <div className="cursor-active" />}
      </div>
    </>
  );
}

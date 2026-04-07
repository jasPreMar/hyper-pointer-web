'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const DMG_URL =
  'https://github.com/jasPreMar/this/releases/latest/download/This.dmg';

// ─── Hover items ─────────────────────────────────────────────────────────────

type HoverItemId = 'hd' | 'trash' | 'download' | 'apple' | 'finder';

interface HoverItem {
  context: string;
  q: string;
  a: string;
  isAction?: boolean;
}

const ITEMS: Record<HoverItemId, HoverItem> = {
  hd: {
    context: 'Finder \u203A Desktop\nicon: System Software\nrole: disk icon\n500 GB \u00B7 156 GB used',
    q: 'how much space is left?',
    a: '$ df -h /\nFilesystem   Size   Used  Avail\n/dev/disk3  500G   156G   344G\n\n344 GB free. Biggest hogs are Movies (92 GB) and Downloads (28 GB).',
    isAction: true,
  },
  trash: {
    context: 'Finder \u203A Desktop\nicon: Trash\nrole: button\nstate: empty',
    q: 'anything in here?',
    a: "$ ls ~/.Trash\n(empty)\n\nNothing. You\u2019re good.",
    isAction: true,
  },
  download: {
    context: 'This \u203A About\nbutton: Download for Mac\nrole: default button\nversion: 1.0.31',
    q: 'what does this download?',
    a: 'HyperPointer.dmg \u2014 1.8 MB. Open it, drag to Applications, launch it. Walks you through Accessibility and Screen Recording permissions on first run. Requires macOS 14+ and the Claude CLI.',
  },
  apple: {
    context: 'menu bar\n\u2460 Apple menu\nrole: menu button',
    q: "what\u2019s in this menu?",
    a: "About This Mac, System Settings, App Store, Recent Items, Force Quit, Sleep, Restart, Shut Down. The Apple menu layout hasn\u2019t meaningfully changed since 2001.",
  },
  finder: {
    context: 'menu bar\nFile\nrole: menu item\nstate: frontmost',
    q: 'what does File do?',
    a: 'New Folder, Open, Print, Close Window, Get Info, Duplicate, Make Alias, Put Away. Standard Finder file operations since System 1.',
    isAction: true,
  },
};

type ConvState = 'idle' | 'typing-q' | 'waiting' | 'typing-a' | 'done';

/* ─── 1-bit Classic Mac Icons (from Figma) ────────────────────────────────── */

function IconFloppy() {
  return (
    <svg width="45" height="47" viewBox="0 0 46 47" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 45.8475H43.5C44.6046 45.8475 45.5 44.9521 45.5 43.8475V7.73414C45.5 7.27527 45.3422 6.83034 45.0531 6.47401L40.8062 1.23986C40.4264 0.771819 39.8559 0.5 39.2531 0.5H2.5C1.39543 0.5 0.5 1.39543 0.5 2.5V43.8475C0.5 44.9521 1.39543 45.8475 2.5 45.8475Z" fill="white" stroke="black"/>
      <path d="M6.5882 46.5V29.2518C6.5882 28.1472 7.48363 27.2518 8.5882 27.2518H37.9411C39.0457 27.2518 39.9411 28.1472 39.9411 29.2518V46.5" stroke="black"/>
      <path d="M34.1176 0.500015L34.1176 13.5071C34.1176 14.6117 33.2222 15.5071 32.1176 15.5071L12.8235 15.5071C11.7189 15.5071 10.8235 14.6117 10.8235 13.5071L10.8235 0.500018" stroke="black"/>
      <rect x="23.5" y="3.60992" width="5.88235" height="8.78723" rx="1.5" fill="white" stroke="black"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="32" height="46" viewBox="0 0 32 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12.5" y="0.5" width="8" height="1.93617" fill="white" stroke="black"/>
      <rect x="0.5" y="2.45744" width="31" height="2.91489" fill="white" stroke="black"/>
      <path d="M30.5 5.39362V44.0001C30.5 44.8285 29.8284 45.5001 29 45.5001H3C2.17159 45.5001 1.50003 44.8285 1.5 44.0001V5.39362H30.5Z" fill="white" stroke="black"/>
      <path d="M6 9.78723L6.89893 10.667C7.28334 11.0433 7.5 11.5585 7.5 12.0964V39.0445C7.5 39.7203 7.1588 40.3503 6.5929 40.7195L6 41.1064" stroke="black"/>
      <path d="M12 9.78723L12.8989 10.667C13.2833 11.0433 13.5 11.5585 13.5 12.0964V39.0445C13.5 39.7203 13.1588 40.3503 12.5929 40.7195L12 41.1064" stroke="black"/>
      <path d="M18 9.78723L18.8989 10.667C19.2833 11.0433 19.5 11.5585 19.5 12.0964V39.0445C19.5 39.7203 19.1588 40.3503 18.5929 40.7195L18 41.1064" stroke="black"/>
      <path d="M24 9.78723L24.8989 10.667C25.2833 11.0433 25.5 11.5585 25.5 12.0964V39.0445C25.5 39.7203 25.1588 40.3503 24.5929 40.7195L24 41.1064" stroke="black"/>
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="46" height="35" viewBox="0 0 46 35" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="5.5" width="45" height="29" rx="1.5" fill="white" stroke="black"/>
      <path d="M6.91421 1.08579L2.5 5.5H21.5L17.5959 1.16207C17.2166 0.740643 16.6762 0.5 16.1093 0.5H8.32843C7.79799 0.5 7.28929 0.710713 6.91421 1.08579Z" fill="white" stroke="black"/>
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.86104 2.55483C9.3623 1.95654 9.70995 1.13997 9.70995 0.315311C9.70995 0.202122 9.70187 0.0889338 9.67762 0C8.87721 0.0323396 7.90702 0.533603 7.32491 1.21273C6.87216 1.73017 6.45174 2.55483 6.45174 3.37948C6.45174 3.50884 6.46791 3.63012 6.48408 3.67054C6.53259 3.67863 6.61344 3.6948 6.69429 3.6948C7.42193 3.6948 8.32744 3.2097 8.86104 2.55483ZM9.43507 3.86458C8.22233 3.86458 7.24406 4.6003 6.61344 4.6003C5.9424 4.6003 5.06923 3.91309 4.01819 3.91309C2.02122 3.91309 0 5.56241 0 8.667C0 10.6074 0.74381 12.6529 1.67357 13.9707C2.46589 15.0864 3.16119 16 4.15563 16C5.15008 16 5.58666 15.3451 6.80748 15.3451C8.06064 15.3451 8.33552 15.9838 9.43507 15.9838C10.5184 15.9838 11.238 14.9894 11.9171 14.0111C12.6852 12.8873 13.0005 11.7959 13.0167 11.7393C12.952 11.7231 10.8742 10.8742 10.8742 8.50531C10.8742 6.45174 12.5073 5.53007 12.5963 5.4573C11.5291 3.91309 9.88782 3.86458 9.43507 3.86458Z" fill="black"/>
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
        @font-face {
          font-family: 'ChicagoFLF';
          src: url('/fonts/ChicagoFLF.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        *, *::before, *::after { box-sizing: border-box; cursor: none !important; }
        html, body {
          margin: 0; padding: 0; overflow: hidden;
          height: 100%; width: 100%;
          font-family: 'Geneva', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background: #fff;
        }

        /* ─── Desktop ─────────────────────────────────────── */
        .desktop {
          position: fixed; inset: 0;
          background-color: #fff;
          background-image:
            repeating-conic-gradient(#000 0% 25%, transparent 0% 50%);
          background-size: 4px 4px;
        }

        /* ─── Menu Bar ────────────────────────────────────── */
        .menubar {
          position: fixed; top: 0; left: 0; right: 0; height: 24px;
          background: #fff;
          border-bottom: none;
          box-shadow: 0px 1px 0px 0px #000;
          display: flex; align-items: center; padding: 0 0; gap: 2px;
          z-index: 200;
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 14px; font-weight: normal;
          letter-spacing: -0.35px;
        }
        .menubar-apple {
          display: flex; align-items: center; justify-content: center;
          padding: 4px 14px; height: 24px;
        }
        .menubar-item {
          padding: 4px 8px; height: 24px;
          color: #000; white-space: nowrap; user-select: none;
          display: flex; align-items: center;
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 14px; letter-spacing: -0.35px;
        }
        .menubar-item:hover, .menubar-item.active {
          background: #000; color: #fff;
        }

        /* ─── Desktop Icons ───────────────────────────────── */
        .icon-col {
          position: fixed; top: 40px; right: 0;
          display: flex; flex-direction: column; gap: 4px; z-index: 10;
        }
        .icon-item {
          display: flex; flex-direction: column; align-items: center; gap: 1px;
          padding: 4px 6px;
          text-align: center;
        }
        .icon-item:hover, .icon-item.active {
          background: none;
        }
        .icon-item:hover .icon-label, .icon-item.active .icon-label {
          background: #000; color: #fff;
        }
        .icon-item:hover svg, .icon-item.active svg {
          filter: invert(1);
          background: #000;
        }
        .icon-label {
          font-family: 'Geneva', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 14px; font-weight: normal; color: #000;
          background: #fff; padding: 0 4px;
          line-height: 1.3; word-break: break-word;
        }

        /* ─── Trash ───────────────────────────────────────── */
        .trash-wrap {
          position: fixed; bottom: 32px; right: 39px; z-index: 10;
        }

        /* ─── Window ──────────────────────────────────────── */
        .window {
          position: fixed;
          width: 394px; background: #fff;
          border: 1px solid #000;
          box-shadow: 1px 1px 0px 1px #000;
          overflow: hidden; z-index: 50;
        }
        .window-titlebar {
          height: 28px;
          background: #fff;
          border-bottom: 1px solid #000;
          position: relative;
          overflow: hidden;
        }
        /* Horizontal stripes in titlebar */
        .titlebar-stripes {
          position: absolute;
          top: 0; left: 4px; right: 4px; bottom: 0;
        }
        .titlebar-stripe {
          position: absolute;
          left: 0; right: 0; height: 1px;
          background: #000;
        }
        /* Close box */
        .close-box {
          position: absolute; left: 13px; top: 5px;
          width: 16px; height: 16px;
          background: #fff;
          border: 1px solid #000;
          z-index: 2;
        }
        .close-box:hover {
          background: #000;
        }
        /* Window title */
        .window-title {
          position: absolute;
          left: 50%; top: -1px;
          transform: translateX(-50%);
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 20px; font-weight: normal;
          letter-spacing: -0.4px;
          color: #000; white-space: nowrap;
          background: #fff;
          padding: 0 8px;
          z-index: 2;
          line-height: 28px;
        }

        /* ─── Window Body ─────────────────────────────────── */
        .window-body {
          padding: 28px 36px 32px;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          background: #fff;
        }
        .app-name {
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 20px; font-weight: normal; color: #000;
          letter-spacing: -0.4px;
        }
        .app-sub {
          font-family: 'Geneva', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 12px; color: #000; margin-top: -4px;
        }
        .app-tagline {
          font-family: 'Geneva', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 14px; color: #000; text-align: center;
          line-height: 1.6; max-width: 260px; margin: 4px 0 8px;
        }

        /* ─── Buttons (Classic Mac style) ─────────────────── */
        .download-btn {
          display: inline-block; padding: 8px 32px;
          background: #fff;
          border: 2px solid #000; border-radius: 16px;
          box-shadow: 0 0 0 2px #000;
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 14px; font-weight: normal; color: #000;
          text-decoration: none; letter-spacing: -0.35px;
        }
        .download-btn:hover {
          background: #000; color: #fff;
        }
        .download-btn:active {
          background: #000; color: #fff;
        }
        .btn-row { display: flex; gap: 10px; align-items: center; margin-top: 0; }
        .github-btn {
          display: inline-block; padding: 8px 20px;
          background: #fff;
          border: 1px solid #000; border-radius: 16px;
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 14px; font-weight: normal; color: #000;
          text-decoration: none; letter-spacing: -0.35px;
        }
        .github-btn:hover {
          background: #000; color: #fff;
        }
        .dl-meta {
          font-family: 'Geneva', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 10px; color: #000; margin-top: 2px; letter-spacing: 0.2px;
        }

        /* ─── AI Panel (styled for classic Mac) ───────────── */
        .hp-panel {
          position: fixed; z-index: 9000; width: 320px;
          background: #fff;
          border: 1px solid #000;
          box-shadow: 1px 1px 0px 1px #000;
          padding: 10px 14px 12px;
          font-family: 'Geneva', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 12px; color: #000;
          pointer-events: none;
        }
        .hp-header {
          display: flex; align-items: center; gap: 6px;
          margin-bottom: 8px; padding-bottom: 8px;
          border-bottom: 1px solid #000;
        }
        .hp-dot {
          width: 7px; height: 7px;
          background: #000;
          flex-shrink: 0;
          animation: hp-pulse 1.4s ease-in-out infinite;
        }
        @keyframes hp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .hp-app-label {
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 12px; color: #000;
          letter-spacing: 0.4px; text-transform: uppercase;
        }
        .hp-context { color: #000; line-height: 1.7; white-space: pre; font-size: 12px; }
        .hp-conversation {
          margin-top: 10px; padding-top: 10px;
          border-top: 1px solid #000;
        }
        .hp-q { color: #000; margin-bottom: 6px; font-weight: bold; }
        .hp-q::before { content: '> '; font-weight: bold; }
        .hp-a { color: #000; line-height: 1.65; white-space: pre-wrap; }
        .hp-a.is-action { color: #000; }
        .hp-blink {
          display: inline-block; width: 6px; height: 12px;
          background: #000; vertical-align: text-bottom; margin-left: 1px;
          animation: blink 0.75s step-end infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        /* ─── Cursor ──────────────────────────────────────── */
        .cursor {
          position: fixed; top: 0; left: 0;
          pointer-events: none; z-index: 99999; will-change: transform;
        }
        .cursor-active {
          position: absolute; top: 6px; left: 11px;
          width: 7px; height: 7px;
          background: #000;
          animation: hp-pulse 1s ease-in-out infinite;
        }

        /* ─── Scrollbar decorations (visual only) ─────────── */
        .scrollbar-right {
          position: absolute; top: 28px; right: -1px; bottom: -1px;
          width: 28px; background: #fff;
          border-left: 1px solid #000;
          border: 1px solid #000;
        }
        .scrollbar-bottom {
          position: absolute; bottom: -1px; left: -1px; right: 27px;
          height: 28px; background: #fff;
          border: 1px solid #000;
        }
        .resize-handle {
          position: absolute; bottom: -1px; right: -1px;
          width: 28px; height: 28px;
          background: #fff;
          border: 1px solid #000;
        }
        .resize-inner-lg {
          position: absolute; bottom: 5px; right: 5px;
          width: 13px; height: 13px;
          border: 1px solid #000; background: #fff;
        }
        .resize-inner-sm {
          position: absolute; top: 0; left: 0;
          width: 10px; height: 10px;
          border: 1px solid #000; background: #fff;
        }
      `}</style>

      <div className="desktop" />

      {/* ─── Menu Bar ─────────────────────────────────────── */}
      <div className="menubar">
        <span className="menubar-apple" {...bind('apple')}>
          <AppleLogo />
        </span>
        <span className={`menubar-item ${hoveredId === 'finder' ? 'active' : ''}`} {...bind('finder')}>File</span>
        <span className="menubar-item">Edit</span>
        <span className="menubar-item">View</span>
        <span className="menubar-item">Special</span>
      </div>

      {/* ─── Desktop Icons ────────────────────────────────── */}
      <div className="icon-col">
        <div className={`icon-item ${hoveredId === 'hd' ? 'active' : ''}`} {...bind('hd')}>
          <IconFloppy />
          <span className="icon-label">System Software</span>
        </div>
      </div>

      {/* ─── Trash ────────────────────────────────────────── */}
      <div className="trash-wrap">
        <div className={`icon-item ${hoveredId === 'trash' ? 'active' : ''}`} {...bind('trash')}>
          <IconTrash />
          <span className="icon-label">Trash</span>
        </div>
      </div>

      {/* ─── Window ───────────────────────────────────────── */}
      <div
        className="window"
        style={winPos ? { left: winPos.x, top: winPos.y } : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <div className="window-titlebar" onMouseDown={handleTitlebarMouseDown} style={{ userSelect: 'none' }}>
          <div className="titlebar-stripes">
            <div className="titlebar-stripe" style={{ top: 6 }} />
            <div className="titlebar-stripe" style={{ top: 9 }} />
            <div className="titlebar-stripe" style={{ top: 12 }} />
            <div className="titlebar-stripe" style={{ top: 15 }} />
            <div className="titlebar-stripe" style={{ top: 18 }} />
            <div className="titlebar-stripe" style={{ top: 21 }} />
          </div>
          <div className="close-box" />
          <span className="window-title">This</span>
        </div>
        <div className="window-body">
          <div className="app-name">This</div>
          <div className="app-sub">Version 1.0.31</div>
          <p className="app-tagline">
            Hold <kbd style={{ fontFamily: 'inherit', fontWeight: 700 }}>&#x2318;</kbd>.<br />
            Point at anything on your screen.<br />
            Ask Claude about it.
          </p>
          <div className="btn-row">
            <a href={DMG_URL} download="This.dmg" className="download-btn" {...bind('download')}>
              Download for Mac
            </a>
            <a href="https://github.com/jasPreMar/this" target="_blank" rel="noopener noreferrer" className="github-btn">
              GitHub
            </a>
          </div>
          <div className="dl-meta">macOS 14+ &nbsp;&middot;&nbsp; Free &nbsp;&middot;&nbsp; Requires Claude CLI</div>
        </div>

        {/* Scrollbar decorations */}
        <div className="scrollbar-right" />
        <div className="scrollbar-bottom" />
        <div className="resize-handle">
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div className="resize-inner-lg">
              <div className="resize-inner-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── AI Panel ─────────────────────────────────────── */}
      {currentItem && (
        <div className="hp-panel" style={{ left: panelX, top: panelY }}>
          <div className="hp-header">
            <div className="hp-dot" />
            <span className="hp-app-label">This</span>
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

      {/* ─── Custom Cursor ────────────────────────────────── */}
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

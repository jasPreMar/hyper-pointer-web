"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const DMG_URL =
  "https://github.com/jasPreMar/this/releases/latest/download/This.dmg";

// --- Hover items ---

interface HoverItem {
  contextLabel: string;
  q: string;
  a: string;
}

const ITEMS: Record<string, HoverItem> = {
  hd: {
    contextLabel: "System Software",
    q: "how much space is left?",
    a: "344 GB free out of 500 GB. Biggest folders are Movies (92 GB) and Downloads (28 GB).",
  },
  trash: {
    contextLabel: "Trash",
    q: "anything in here?",
    a: "Empty. Nothing to clean up.",
  },
  download: {
    contextLabel: "Button: Download for Mac",
    q: "what does this download?",
    a: "This.dmg \u2014 a lightweight installer. Drag to Applications, grant Accessibility permission, and you\u2019re set.",
  },
  github: {
    contextLabel: "Button: GitHub",
    q: "what\u2019s in the repo?",
    a: "The full source for This. Swift, SwiftUI, macOS 26+. MIT licensed.",
  },
  apple: {
    contextLabel: "Apple Menu",
    q: "what\u2019s in this menu?",
    a: "About This Mac, System Settings, App Store, Recent Items, Force Quit, Sleep, Restart, Shut Down.",
  },
  "menu-file": {
    contextLabel: "File Menu",
    q: "what does File do?",
    a: "New Folder, Open, Print, Close Window, Get Info, Duplicate, Make Alias, Put Away.",
  },
  "menu-edit": {
    contextLabel: "Edit Menu",
    q: "what can I edit?",
    a: "Undo, Cut, Copy, Paste, Clear, Select All. Standard text editing commands.",
  },
  "menu-view": {
    contextLabel: "View Menu",
    q: "what view options are there?",
    a: "By Small Icon, by Icon, by Name, by Date, by Size, by Kind.",
  },
  "menu-special": {
    contextLabel: "Special Menu",
    q: "what\u2019s special about Special?",
    a: "Clean Up, Empty Trash, Erase Disk, Set Startup, Restart, Shut Down. System-level operations.",
  },
  "mi-new-folder": { contextLabel: "Menu Item: New Folder", q: "make me a new folder", a: "Done. \u201Cuntitled folder\u201D created on the desktop." },
  "mi-open": { contextLabel: "Menu Item: Open", q: "what does open do?", a: "Opens the selected item. If nothing is selected, it does nothing." },
  "mi-close": { contextLabel: "Menu Item: Close", q: "close what?", a: "Closes the frontmost window. The application stays running." },
  "mi-get-info": { contextLabel: "Menu Item: Get Info", q: "get info on what?", a: "Shows size, kind, location, and dates for the selected item." },
  "mi-duplicate": { contextLabel: "Menu Item: Duplicate", q: "duplicate what?", a: "Creates a copy of the selected item in the same folder." },
  "mi-put-away": { contextLabel: "Menu Item: Put Away", q: "put away what?", a: "Returns the selected item to its original location." },
  "mi-undo": { contextLabel: "Menu Item: Undo", q: "undo what?", a: "Reverses the last action. \u2318Z." },
  "mi-cut": { contextLabel: "Menu Item: Cut", q: "cut to where?", a: "Removes selection and places it on the clipboard. \u2318X." },
  "mi-copy": { contextLabel: "Menu Item: Copy", q: "copy what?", a: "Copies the current selection to the clipboard. \u2318C." },
  "mi-paste": { contextLabel: "Menu Item: Paste", q: "paste from where?", a: "Inserts whatever is on the clipboard. \u2318V." },
  "mi-select-all": { contextLabel: "Menu Item: Select All", q: "select everything?", a: "Selects all items in the current context. \u2318A." },
  "mi-by-name": { contextLabel: "Menu Item: by Name", q: "sort by name?", a: "Arranges icons alphabetically." },
  "mi-by-date": { contextLabel: "Menu Item: by Date", q: "sort by date?", a: "Arranges icons by last modified date, newest first." },
  "mi-by-size": { contextLabel: "Menu Item: by Size", q: "sort by size?", a: "Arranges icons by file size, largest first." },
  "mi-by-kind": { contextLabel: "Menu Item: by Kind", q: "sort by kind?", a: "Groups items by type: applications, documents, folders." },
  "mi-clean-up": { contextLabel: "Menu Item: Clean Up", q: "clean up what?", a: "Snaps all desktop icons to the nearest grid position." },
  "mi-empty-trash": { contextLabel: "Menu Item: Empty Trash", q: "empty the trash?", a: "Permanently deletes everything in the Trash. This cannot be undone." },
  "mi-restart": { contextLabel: "Menu Item: Restart", q: "restart now?", a: "Closes all apps and restarts the Mac." },
  "mi-shut-down": { contextLabel: "Menu Item: Shut Down", q: "shut down?", a: "Closes all apps and powers off the Mac." },
  "close-box": { contextLabel: "Close Box", q: "what does this close?", a: "Closes this window. The app keeps running in the background." },
  titlebar: { contextLabel: "Window: This", q: "what window is this?", a: "The About window for This. Drag the titlebar to move it." },
  "app-icon": { contextLabel: "App Icon: This", q: "what is this icon?", a: "The icon for This. A hiragana \u305F (ta) in a rounded square." },
  "app-name": { contextLabel: "Label: This", q: "what is This?", a: "A macOS app. Point at anything, speak or type, and it already knows what you mean." },
  version: { contextLabel: "Label: Version 1.0", q: "is this the latest?", a: "Yes, version 1.0. Check GitHub for updates." },
  tagline: { contextLabel: "Text: App Description", q: "how does it work?", a: "Object detection follows your cursor. Speak or type a question. The command menu shows the conversation." },
  "dl-meta": { contextLabel: "Label: System Requirements", q: "what do I need?", a: "macOS 26 Tahoe or later. That\u2019s it. Free and open source." },
  scrollbar: { contextLabel: "Scrollbar", q: "can I scroll?", a: "This window doesn\u2019t scroll. Purely decorative, like the original Mac." },
  "photo-window": { contextLabel: "Window: Engelbart, 1968", q: "who is this?", a: "Doug Engelbart demonstrating \u201CThe Mother of All Demos\u201D in 1968. He invented the mouse, hypertext, and networked computing." },
  desktop: { contextLabel: "Desktop", q: "what am I looking at?", a: "A recreation of the original 1984 Macintosh desktop. The checkerboard pattern was the default wallpaper." },
};

type DemoPhase =
  | "idle"
  | "context-shown"
  | "typing-q"
  | "menu-open"
  | "typing-a"
  | "done";

type OpenMenu = null | "file" | "edit" | "view" | "special";

/* --- 1-bit Classic Mac Icons --- */

function IconFloppy() {
  return (
    <svg width="45" height="47" viewBox="0 0 46 47" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 45.8475H43.5C44.6046 45.8475 45.5 44.9521 45.5 43.8475V7.73414C45.5 7.27527 45.3422 6.83034 45.0531 6.47401L40.8062 1.23986C40.4264 0.771819 39.8559 0.5 39.2531 0.5H2.5C1.39543 0.5 0.5 1.39543 0.5 2.5V43.8475C0.5 44.9521 1.39543 45.8475 2.5 45.8475Z" fill="white" stroke="black" />
      <path d="M6.5882 46.5V29.2518C6.5882 28.1472 7.48363 27.2518 8.5882 27.2518H37.9411C39.0457 27.2518 39.9411 28.1472 39.9411 29.2518V46.5" stroke="black" />
      <path d="M34.1176 0.500015L34.1176 13.5071C34.1176 14.6117 33.2222 15.5071 32.1176 15.5071L12.8235 15.5071C11.7189 15.5071 10.8235 14.6117 10.8235 13.5071L10.8235 0.500018" stroke="black" />
      <rect x="23.5" y="3.60992" width="5.88235" height="8.78723" rx="1.5" fill="white" stroke="black" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="32" height="46" viewBox="0 0 32 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12.5" y="0.5" width="8" height="1.93617" fill="white" stroke="black" />
      <rect x="0.5" y="2.45744" width="31" height="2.91489" fill="white" stroke="black" />
      <path d="M30.5 5.39362V44.0001C30.5 44.8285 29.8284 45.5001 29 45.5001H3C2.17159 45.5001 1.50003 44.8285 1.5 44.0001V5.39362H30.5Z" fill="white" stroke="black" />
      <path d="M6 9.78723L6.89893 10.667C7.28334 11.0433 7.5 11.5585 7.5 12.0964V39.0445C7.5 39.7203 7.1588 40.3503 6.5929 40.7195L6 41.1064" stroke="black" />
      <path d="M12 9.78723L12.8989 10.667C13.2833 11.0433 13.5 11.5585 13.5 12.0964V39.0445C13.5 39.7203 13.1588 40.3503 12.5929 40.7195L12 41.1064" stroke="black" />
      <path d="M18 9.78723L18.8989 10.667C19.2833 11.0433 19.5 11.5585 19.5 12.0964V39.0445C19.5 39.7203 19.1588 40.3503 18.5929 40.7195L18 41.1064" stroke="black" />
      <path d="M24 9.78723L24.8989 10.667C25.2833 11.0433 25.5 11.5585 25.5 12.0964V39.0445C25.5 39.7203 25.1588 40.3503 24.5929 40.7195L24 41.1064" stroke="black" />
    </svg>
  );
}

function IconThis() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="60" height="60" rx="12" fill="white" stroke="black" strokeWidth="2" />
      <g transform="translate(8, 8) scale(0.046875)">
        <path d="M566.985 136.64C567.706 138.622 568.237 140.492 568.63 142.074L568.98 143.554L569.249 144.813C571.978 158.142 572.737 181.151 569.982 215.536C567.406 247.704 561.553 292.003 549.949 351.555C588.039 336.805 617.887 325.764 631.309 320.982C635.895 319.152 640.531 316.972 657.882 307.202L695.056 373.431C676.873 383.67 668.639 387.913 658.721 391.83L658.102 392.076L657.476 392.298C642.663 397.556 601.983 412.627 551.096 432.652C547.961 434.113 544.496 435.642 540.729 437.231C529.792 601.862 535.987 694.995 540.883 723.455C545.621 750.994 559.605 769.37 579.369 802.91C579.478 803.095 579.613 803.389 580.629 803.987C581.952 804.766 584.638 805.934 589.547 806.927C598.805 808.799 610.473 809.111 625.765 808.981C626.079 808.733 626.422 808.459 626.792 808.154C632.041 803.825 639.361 796.61 649.185 785.923C668.899 764.476 693.659 734.681 725.372 697.918L782.771 747.59C752.535 782.641 725.764 814.785 704.99 837.385C694.569 848.722 684.404 859.06 675.007 866.809C670.3 870.691 664.878 874.685 658.957 877.876C653.431 880.855 644.607 884.713 633.773 884.87C616.593 885.117 594.501 885.44 574.532 881.401C553.886 877.225 529.12 867.114 514.044 841.531C499.235 816.399 473.914 781.592 466.132 736.358C463.641 721.883 461.245 697.879 459.9 664.12C415.757 750.096 387.833 798.852 369.711 826.927C352.127 854.171 340.507 867.563 327.117 874.33L289.677 808.355C291.094 806.774 296.159 800.937 306.01 785.676C322.731 759.771 350.753 711.008 397.557 619.394C420.172 575.127 433.352 524.198 445.618 471.836C443.872 472.43 442.118 473.033 440.355 473.632C391.328 490.278 333.749 509.284 275.422 529.647L250.456 457.902C309.142 437.414 367.839 418.028 416.002 401.676C434.438 395.416 451.101 389.672 465.678 384.492C467.17 377.642 468.59 370.973 469.946 364.48C473.678 313.387 478.09 252.349 482.396 207.375C484.551 184.875 486.812 164.923 489.145 152.161C489.742 148.896 490.466 145.403 491.369 142.127L566.985 136.64ZM564.489 162.348C564.481 162.379 564.47 162.425 564.455 162.485C564.646 161.893 564.645 161.782 564.489 162.348Z" fill="black"/>
      </g>
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.86104 2.55483C9.3623 1.95654 9.70995 1.13997 9.70995 0.315311C9.70995 0.202122 9.70187 0.0889338 9.67762 0C8.87721 0.0323396 7.90702 0.533603 7.32491 1.21273C6.87216 1.73017 6.45174 2.55483 6.45174 3.37948C6.45174 3.50884 6.46791 3.63012 6.48408 3.67054C6.53259 3.67863 6.61344 3.6948 6.69429 3.6948C7.42193 3.6948 8.32744 3.2097 8.86104 2.55483ZM9.43507 3.86458C8.22233 3.86458 7.24406 4.6003 6.61344 4.6003C5.9424 4.6003 5.06923 3.91309 4.01819 3.91309C2.02122 3.91309 0 5.56241 0 8.667C0 10.6074 0.74381 12.6529 1.67357 13.9707C2.46589 15.0864 3.16119 16 4.15563 16C5.15008 16 5.58666 15.3451 6.80748 15.3451C8.06064 15.3451 8.33552 15.9838 9.43507 15.9838C10.5184 15.9838 11.238 14.9894 11.9171 14.0111C12.6852 12.8873 13.0005 11.7959 13.0167 11.7393C12.952 11.7231 10.8742 10.8742 10.8742 8.50531C10.8742 6.45174 12.5073 5.53007 12.5963 5.4573C11.5291 3.91309 9.88782 3.86458 9.43507 3.86458Z" fill="black" />
    </svg>
  );
}

// --- Menu definitions ---
const MENUS: Record<string, { label: string; id: string; shortcut?: string; divider?: boolean }[]> = {
  file: [
    { label: "New Folder", id: "mi-new-folder", shortcut: "\u2318N" },
    { label: "Open", id: "mi-open", shortcut: "\u2318O" },
    { label: "Close", id: "mi-close", shortcut: "\u2318W" },
    { label: "", id: "", divider: true },
    { label: "Get Info", id: "mi-get-info", shortcut: "\u2318I" },
    { label: "Duplicate", id: "mi-duplicate", shortcut: "\u2318D" },
    { label: "Put Away", id: "mi-put-away", shortcut: "\u2318Y" },
  ],
  edit: [
    { label: "Undo", id: "mi-undo", shortcut: "\u2318Z" },
    { label: "", id: "", divider: true },
    { label: "Cut", id: "mi-cut", shortcut: "\u2318X" },
    { label: "Copy", id: "mi-copy", shortcut: "\u2318C" },
    { label: "Paste", id: "mi-paste", shortcut: "\u2318V" },
    { label: "", id: "", divider: true },
    { label: "Select All", id: "mi-select-all", shortcut: "\u2318A" },
  ],
  view: [
    { label: "by Name", id: "mi-by-name" },
    { label: "by Date", id: "mi-by-date" },
    { label: "by Size", id: "mi-by-size" },
    { label: "by Kind", id: "mi-by-kind" },
  ],
  special: [
    { label: "Clean Up", id: "mi-clean-up" },
    { label: "Empty Trash", id: "mi-empty-trash" },
    { label: "", id: "", divider: true },
    { label: "Restart", id: "mi-restart" },
    { label: "Shut Down", id: "mi-shut-down" },
  ],
};

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [panelAnchor, setPanelAnchor] = useState({ x: 0, y: 0 });
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [displayQ, setDisplayQ] = useState("");
  const [displayA, setDisplayA] = useState("");
  const [vpW, setVpW] = useState(1200);
  const [vpH, setVpH] = useState(800);
  const [showVoice, setShowVoice] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  const typeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeId = useRef<string | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Window drag
  const [winPos, setWinPos] = useState<{ x: number; y: number } | null>(null);
  const winDragOffset = useRef<{ x: number; y: number } | null>(null);
  const winDragging = useRef(false);

  // Photo window drag
  const [photoPos, setPhotoPos] = useState<{ x: number; y: number } | null>(null);
  const photoDragOffset = useRef<{ x: number; y: number } | null>(null);
  const photoDragging = useRef(false);

  // Icon drag
  const [hdPos, setHdPos] = useState<{ x: number; y: number } | null>(null);
  const hdDragOffset = useRef<{ x: number; y: number } | null>(null);
  const hdDragging = useRef(false);

  const [trashPos, setTrashPos] = useState<{ x: number; y: number } | null>(null);
  const trashDragOffset = useRef<{ x: number; y: number } | null>(null);
  const trashDragging = useRef(false);

  useEffect(() => {
    const upd = () => { setVpW(window.innerWidth); setVpH(window.innerHeight); };
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      setMousePos(pos);
      mousePosRef.current = pos;
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const h = () => setOpenMenu(null);
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  const clearAll = useCallback(() => {
    if (typeInterval.current) clearInterval(typeInterval.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPhase("idle");
    setDisplayQ("");
    setDisplayA("");
    setShowVoice(false);
  }, []);

  const playDemo = useCallback(
    (id: string, anchorX: number, anchorY: number) => {
      clearAll();
      const item = ITEMS[id];
      if (!item) return;
      setPanelAnchor({ x: anchorX, y: anchorY });
      const { q, a } = item;
      setPhase("context-shown");
      timeoutRef.current = setTimeout(() => {
        if (activeId.current !== id) return;
        setShowVoice(true);
        timeoutRef.current = setTimeout(() => {
          if (activeId.current !== id) return;
          setShowVoice(false);
          setPhase("typing-q");
          let qi = 0;
          typeInterval.current = setInterval(() => {
            qi++;
            setDisplayQ(q.slice(0, qi));
            if (qi >= q.length) {
              clearInterval(typeInterval.current!);
              timeoutRef.current = setTimeout(() => {
                if (activeId.current !== id) return;
                setPhase("menu-open");
                timeoutRef.current = setTimeout(() => {
                  if (activeId.current !== id) return;
                  setPhase("typing-a");
                  let ai = 0;
                  typeInterval.current = setInterval(() => {
                    ai++;
                    setDisplayA(a.slice(0, ai));
                    if (ai >= a.length) {
                      clearInterval(typeInterval.current!);
                      setPhase("done");
                    }
                  }, 14);
                }, 300);
              }, 400);
            }
          }, 32);
        }, 800);
      }, 500);
    },
    [clearAll]
  );

  const handleEnter = useCallback(
    (id: string) => {
      activeId.current = id;
      setHoveredId(id);
      clearAll();
      playDemo(id, mousePosRef.current.x, mousePosRef.current.y);
    },
    [clearAll, playDemo]
  );

  const handleLeave = useCallback(() => {
    activeId.current = null;
    setHoveredId(null);
    clearAll();
  }, [clearAll]);

  const bind = (id: string) => ({
    onMouseEnter: () => handleEnter(id),
    onMouseLeave: handleLeave,
  });

  // Generic drag helper
  const startDrag = useCallback(
    (
      e: React.MouseEvent,
      elSelector: string,
      setPos: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>,
      currentPos: { x: number; y: number } | null,
      offsetRef: React.MutableRefObject<{ x: number; y: number } | null>,
      draggingRef: React.MutableRefObject<boolean>,
      defaultPos?: { x: number; y: number }
    ) => {
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = true;
      const rect = (e.currentTarget.closest(elSelector) as HTMLElement).getBoundingClientRect();
      offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (currentPos === null && defaultPos) {
        setPos(defaultPos);
      }
      const onMove = (ev: MouseEvent) => {
        if (!draggingRef.current || !offsetRef.current) return;
        setPos({ x: ev.clientX - offsetRef.current.x, y: ev.clientY - offsetRef.current.y });
      };
      const onUp = () => {
        draggingRef.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    []
  );

  const rawPanelX = panelAnchor.x + 22;
  const rawPanelY = panelAnchor.y + 22;
  const panelX = Math.min(rawPanelX, vpW - 280);
  const panelY = Math.min(rawPanelY, vpH - 100);

  const currentItem = hoveredId ? ITEMS[hoveredId] : null;
  const isPointerTarget = hoveredId === "download" || hoveredId === "github";
  const showFloatingPanel = currentItem && phase !== "idle";
  const showCommandMenu = phase === "menu-open" || phase === "typing-a" || phase === "done";

  // Desktop label near cursor when nothing hovered
  const contextLabel = currentItem ? currentItem.contextLabel : "Desktop";

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
        .desktop {
          position: fixed; inset: 0;
          background-color: #fff;
          background-image: repeating-conic-gradient(#000 0% 25%, transparent 0% 50%);
          background-size: 4px 4px;
        }
        .menubar {
          position: fixed; top: 0; left: 0; right: 0; height: 24px;
          background: #fff;
          box-shadow: 0px 1px 0px 0px #000;
          display: flex; align-items: center; padding: 0; gap: 2px;
          z-index: 200;
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 14px; font-weight: normal;
          letter-spacing: -0.35px;
        }
        .menubar-apple {
          display: flex; align-items: center; justify-content: center;
          padding: 4px 14px; height: 24px;
          position: relative;
        }
        .menubar-item {
          padding: 4px 8px; height: 24px;
          color: #000; white-space: nowrap; user-select: none;
          display: flex; align-items: center;
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 14px; letter-spacing: -0.35px;
          position: relative;
        }
        .menubar-item:hover, .menubar-item.active {
          background: #000; color: #fff;
        }
        /* Dropdown menus */
        .menu-dropdown {
          position: absolute; top: 24px; left: 0;
          background: #fff; border: 1px solid #000;
          box-shadow: 2px 2px 0px 0px #000;
          z-index: 300; min-width: 180px;
          padding: 2px 0;
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 14px;
        }
        .menu-dropdown-item {
          padding: 2px 20px 2px 16px;
          color: #000; white-space: nowrap; user-select: none;
          display: flex; justify-content: space-between; gap: 24px;
        }
        .menu-dropdown-item:hover {
          background: #000; color: #fff;
        }
        .menu-dropdown-item .shortcut {
          color: inherit; font-size: 13px;
        }
        .menu-divider {
          height: 1px; background: #000; margin: 2px 0;
        }
        .icon-col {
          position: fixed; top: 40px; right: 0;
          display: flex; flex-direction: column; gap: 4px; z-index: 10;
        }
        .icon-item {
          display: flex; flex-direction: column; align-items: center; gap: 1px;
          padding: 4px 6px;
          text-align: center;
        }
        .icon-item:hover .icon-label, .icon-item.active .icon-label {
          background: #000; color: #fff;
        }
        .icon-item:hover svg, .icon-item.active svg {
          filter: invert(1); background: #000;
        }
        .icon-label {
          font-family: 'Geneva', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 14px; font-weight: normal; color: #000;
          background: #fff; padding: 0 4px;
          line-height: 1.3; word-break: break-word;
        }
        .trash-wrap {
          position: fixed; bottom: 32px; right: 39px; z-index: 10;
        }
        .window {
          position: fixed;
          width: 520px; background: #fff;
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
        .titlebar-stripes {
          position: absolute;
          top: 0; left: 4px; right: 4px; bottom: 0;
        }
        .titlebar-stripe {
          position: absolute;
          left: 0; right: 0; height: 1px;
          background: #000;
        }
        .close-box {
          position: absolute; left: 13px; top: 5px;
          width: 16px; height: 16px;
          background: #fff;
          border: 1px solid #000;
          z-index: 2;
        }
        .close-box:hover { background: #000; }
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
        .video-embed {
          width: 100%; max-width: 440px;
          aspect-ratio: 16 / 10;
          border: 2px solid #000;
          margin: 4px 0;
          background: #000;
        }
        .video-embed iframe {
          width: 100%; height: 100%;
          border: none; display: block;
        }
        .download-btn {
          display: inline-block; padding: 8px 32px;
          background: #fff;
          border: 2px solid #000; border-radius: 16px;
          box-shadow: 0 0 0 2px #000;
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 14px; font-weight: normal; color: #000;
          text-decoration: none; letter-spacing: -0.35px;
        }
        .download-btn:hover { background: #000; color: #fff; }
        .btn-row { display: flex; gap: 10px; align-items: center; margin-top: 0; }
        .github-btn {
          display: inline-block; padding: 8px 20px;
          background: #fff;
          border: 1px solid #000; border-radius: 16px;
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 14px; font-weight: normal; color: #000;
          text-decoration: none; letter-spacing: -0.35px;
        }
        .github-btn:hover { background: #000; color: #fff; }
        .dl-meta {
          font-family: 'Geneva', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 10px; color: #000; margin-top: 2px; letter-spacing: 0.2px;
        }

        /* Floating Panel */
        .float-panel {
          position: fixed; z-index: 9000; width: 240px;
          background: #fff;
          border: 1px solid #000;
          box-shadow: 1px 1px 0px 1px #000;
          padding: 6px 10px 8px;
          font-family: 'Geneva', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 12px; color: #000;
          pointer-events: none;
        }
        .float-context {
          display: flex; align-items: center; gap: 6px;
          padding-bottom: 6px;
          border-bottom: 1px solid #000;
        }
        .float-context-dot {
          width: 5px; height: 5px;
          background: #000; flex-shrink: 0;
          animation: hp-pulse 1.4s ease-in-out infinite;
        }
        .float-context-label {
          font-size: 12px; color: #000;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .float-input {
          margin-top: 6px; display: flex; align-items: center; gap: 6px;
        }
        .float-input-text {
          flex: 1; font-size: 12px; color: #000; min-height: 14px;
        }
        .float-input-text.placeholder { color: #888; }

        /* Command Menu */
        .cmd-menu {
          position: fixed; bottom: 48px; left: 50%; transform: translateX(-50%);
          width: 520px; z-index: 8000;
          background: #fff;
          border: 1px solid #000;
          box-shadow: 1px 1px 0px 1px #000;
          pointer-events: none; overflow: hidden;
          font-family: 'Geneva', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          animation: cmd-slide-up 0.25s ease-out;
        }
        @keyframes cmd-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .cmd-titlebar {
          height: 28px; background: #fff;
          border-bottom: 1px solid #000;
          position: relative; overflow: hidden;
        }
        .cmd-title {
          position: absolute;
          left: 50%; top: -1px;
          transform: translateX(-50%);
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 20px; font-weight: normal;
          letter-spacing: -0.4px;
          color: #000; white-space: nowrap;
          background: #fff; padding: 0 8px;
          z-index: 2; line-height: 28px;
        }
        .cmd-toolbar {
          display: flex; align-items: center; padding: 4px 10px; gap: 8px;
          border-bottom: 1px solid #000; font-size: 12px;
        }
        .cmd-model {
          font-family: 'Geneva', sans-serif;
          font-size: 11px; color: #000; padding: 1px 6px;
          border: 1px solid #000;
        }
        .cmd-modes { display: flex; gap: 2px; margin-left: auto; }
        .cmd-mode-btn {
          font-family: 'Geneva', sans-serif;
          font-size: 11px; padding: 1px 6px;
          color: #888; background: #fff; border: 1px solid #888;
        }
        .cmd-mode-btn.active { color: #000; border-color: #000; }
        .cmd-tabs {
          display: flex; align-items: center; padding: 0 10px;
          border-bottom: 1px solid #000;
        }
        .cmd-tab {
          font-size: 12px; color: #888; padding: 4px 10px;
          border-right: 1px solid #000;
        }
        .cmd-tab.active { color: #000; font-weight: bold; }
        .cmd-tab-new { font-size: 12px; color: #888; padding: 4px 8px; }
        .cmd-chat { padding: 12px 12px 8px; }
        .cmd-msg { margin-bottom: 10px; }
        .cmd-msg-role {
          font-family: 'ChicagoFLF', 'Chicago', sans-serif;
          font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.3px; margin-bottom: 2px; color: #000;
        }
        .cmd-msg-text { font-size: 13px; line-height: 1.6; color: #000; }
        .cmd-input-row {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 10px; border-top: 1px solid #000;
        }
        .cmd-input-field { flex: 1; font-size: 12px; color: #888; }

        /* Voice Indicator */
        .voice-indicator {
          position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%);
          z-index: 9500;
          background: #fff;
          border: 1px solid #000;
          box-shadow: 1px 1px 0px 1px #000;
          padding: 6px 14px;
          display: flex; align-items: center; gap: 3px;
          pointer-events: none;
          animation: voice-fade-in 0.2s ease-out;
        }
        @keyframes voice-fade-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.9); }
          to { opacity: 1; transform: translateX(-50%) scale(1); }
        }
        .voice-bar {
          width: 2px; background: #000;
          animation: voice-wave 0.6s ease-in-out infinite;
        }
        .voice-bar:nth-child(1) { height: 6px; animation-delay: 0s; }
        .voice-bar:nth-child(2) { height: 12px; animation-delay: 0.1s; }
        .voice-bar:nth-child(3) { height: 16px; animation-delay: 0.2s; }
        .voice-bar:nth-child(4) { height: 10px; animation-delay: 0.15s; }
        .voice-bar:nth-child(5) { height: 5px; animation-delay: 0.05s; }
        @keyframes voice-wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.3); }
        }

        /* Cursor label */
        .cursor-label {
          position: absolute; left: 18px; top: 18px;
          font-family: 'Geneva', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 11px; color: #000;
          background: #fff; border: 1px solid #000;
          padding: 1px 5px;
          white-space: nowrap;
          pointer-events: none;
        }

        .hp-blink {
          display: inline-block; width: 6px; height: 12px;
          background: #000; vertical-align: text-bottom; margin-left: 1px;
          animation: blink 0.75s step-end infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes hp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
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
        .scrollbar-right {
          position: absolute; top: 28px; right: -1px; bottom: -1px;
          width: 28px; background: #fff;
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
          background: #fff; border: 1px solid #000;
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

        /* Photo window */
        .photo-window {
          position: fixed;
          width: 320px; height: 260px;
          background: #fff;
          border: 1px solid #000;
          box-shadow: 1px 1px 0px 1px #000;
          overflow: hidden; z-index: 40;
        }
        .photo-body {
          position: relative; width: 100%; height: calc(100% - 28px);
          overflow: hidden;
        }
        .photo-img {
          width: 100%; height: 100%; object-fit: cover;
          filter: grayscale(1) contrast(3) brightness(1.2);
        }
        .photo-tint {
          display: none;
        }
        .photo-dither {
          position: absolute; inset: 0;
          background-image: repeating-conic-gradient(#000 0% 25%, transparent 0% 50%);
          background-size: 3px 3px;
          mix-blend-mode: multiply;
          opacity: 0.35;
        }

        /* Mobile responsive */
        @media (max-width: 600px) {
          .window {
            width: 100vw !important;
            top: 24px !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            transform: none !important;
            border-left: none;
            border-right: none;
            box-shadow: none;
          }
          .window-body {
            padding: 20px 16px 24px;
          }
          .video-embed {
            max-width: 100%;
          }
          .scrollbar-right,
          .scrollbar-bottom,
          .resize-handle {
            display: none;
          }
          .photo-window,
          .icon-col,
          .trash-wrap {
            display: none;
          }
          .cmd-menu {
            width: 100vw !important;
            left: 0 !important;
            transform: none !important;
            bottom: 0 !important;
            border-left: none;
            border-right: none;
          }
          @keyframes cmd-slide-up {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
        }
      `}</style>

      <div className="desktop" {...bind("desktop")} />

      {/* --- Menu Bar --- */}
      <div className="menubar">
        <span className="menubar-apple" {...bind("apple")}>
          <AppleLogo />
        </span>

        {/* File */}
        <span
          className={`menubar-item ${openMenu === "file" || hoveredId === "menu-file" ? "active" : ""}`}
          onMouseDown={(e) => { e.stopPropagation(); setOpenMenu(openMenu === "file" ? null : "file"); }}
          onMouseEnter={() => { if (openMenu) setOpenMenu("file"); handleEnter("menu-file"); }}
          onMouseLeave={handleLeave}
        >
          File
          {openMenu === "file" && (
            <div className="menu-dropdown" onMouseDown={(e) => e.stopPropagation()}>
              {MENUS.file.map((item, i) =>
                item.divider ? <div key={i} className="menu-divider" /> :
                <div key={i} className="menu-dropdown-item" {...bind(item.id)}>
                  <span>{item.label}</span>
                  {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
                </div>
              )}
            </div>
          )}
        </span>

        {/* Edit */}
        <span
          className={`menubar-item ${openMenu === "edit" || hoveredId === "menu-edit" ? "active" : ""}`}
          onMouseDown={(e) => { e.stopPropagation(); setOpenMenu(openMenu === "edit" ? null : "edit"); }}
          onMouseEnter={() => { if (openMenu) setOpenMenu("edit"); handleEnter("menu-edit"); }}
          onMouseLeave={handleLeave}
        >
          Edit
          {openMenu === "edit" && (
            <div className="menu-dropdown" onMouseDown={(e) => e.stopPropagation()}>
              {MENUS.edit.map((item, i) =>
                item.divider ? <div key={i} className="menu-divider" /> :
                <div key={i} className="menu-dropdown-item" {...bind(item.id)}>
                  <span>{item.label}</span>
                  {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
                </div>
              )}
            </div>
          )}
        </span>

        {/* View */}
        <span
          className={`menubar-item ${openMenu === "view" || hoveredId === "menu-view" ? "active" : ""}`}
          onMouseDown={(e) => { e.stopPropagation(); setOpenMenu(openMenu === "view" ? null : "view"); }}
          onMouseEnter={() => { if (openMenu) setOpenMenu("view"); handleEnter("menu-view"); }}
          onMouseLeave={handleLeave}
        >
          View
          {openMenu === "view" && (
            <div className="menu-dropdown" onMouseDown={(e) => e.stopPropagation()}>
              {MENUS.view.map((item, i) =>
                <div key={i} className="menu-dropdown-item" {...bind(item.id)}>
                  <span>{item.label}</span>
                </div>
              )}
            </div>
          )}
        </span>

        {/* Special */}
        <span
          className={`menubar-item ${openMenu === "special" || hoveredId === "menu-special" ? "active" : ""}`}
          onMouseDown={(e) => { e.stopPropagation(); setOpenMenu(openMenu === "special" ? null : "special"); }}
          onMouseEnter={() => { if (openMenu) setOpenMenu("special"); handleEnter("menu-special"); }}
          onMouseLeave={handleLeave}
        >
          Special
          {openMenu === "special" && (
            <div className="menu-dropdown" onMouseDown={(e) => e.stopPropagation()}>
              {MENUS.special.map((item, i) =>
                item.divider ? <div key={i} className="menu-divider" /> :
                <div key={i} className="menu-dropdown-item" {...bind(item.id)}>
                  <span>{item.label}</span>
                </div>
              )}
            </div>
          )}
        </span>
      </div>

      {/* --- Desktop Icons (draggable) --- */}
      <div
        className="icon-col"
        style={hdPos ? { position: "fixed", top: hdPos.y, left: hdPos.x, right: "auto" } : undefined}
      >
        <div
          className={`icon-item ${hoveredId === "hd" ? "active" : ""}`}
          {...bind("hd")}
          onMouseDown={(e) => {
            const el = e.currentTarget.closest(".icon-col") as HTMLElement;
            const rect = el.getBoundingClientRect();
            startDrag(e, ".icon-col", setHdPos, hdPos, hdDragOffset, hdDragging, { x: rect.left, y: rect.top });
          }}
        >
          <IconFloppy />
          <span className="icon-label">System Software</span>
        </div>
      </div>

      <div
        className="trash-wrap"
        style={trashPos ? { position: "fixed", top: trashPos.y, left: trashPos.x, right: "auto", bottom: "auto" } : undefined}
      >
        <div
          className={`icon-item ${hoveredId === "trash" ? "active" : ""}`}
          {...bind("trash")}
          onMouseDown={(e) => {
            const el = e.currentTarget.closest(".trash-wrap") as HTMLElement;
            const rect = el.getBoundingClientRect();
            startDrag(e, ".trash-wrap", setTrashPos, trashPos, trashDragOffset, trashDragging, { x: rect.left, y: rect.top });
          }}
        >
          <IconTrash />
          <span className="icon-label">Trash</span>
        </div>
      </div>

      {/* --- Photo Window (dithered in app colors) --- */}
      <div
        className="photo-window"
        style={
          photoPos
            ? { left: photoPos.x, top: photoPos.y }
            : { top: "15%", left: "8%" }
        }
        {...bind("photo-window")}
      >
        <div
          className="window-titlebar"
          onMouseDown={(e) => {
            const el = e.currentTarget.closest(".photo-window") as HTMLElement;
            const rect = el.getBoundingClientRect();
            startDrag(e, ".photo-window", setPhotoPos, photoPos, photoDragOffset, photoDragging, { x: rect.left, y: rect.top });
          }}
          style={{ userSelect: "none" }}
        >
          <div className="titlebar-stripes">
            {[6,9,12,15,18,21].map(t => <div key={t} className="titlebar-stripe" style={{ top: t }} />)}
          </div>
          <div className="close-box" />
          <span className="window-title">Engelbart, 1968</span>
        </div>
        <div className="photo-body">
          <img src="/desktop-bg.png" alt="" className="photo-img" />
          <div className="photo-tint" />
          <div className="photo-dither" />
        </div>
      </div>

      {/* --- Main Window --- */}
      <div
        className="window"
        style={
          winPos
            ? { left: winPos.x, top: winPos.y }
            : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
        }
      >
        <div
          className="window-titlebar"
          {...bind("titlebar")}
          onMouseDown={(e) => {
            const rect = (e.currentTarget.closest(".window") as HTMLElement).getBoundingClientRect();
            startDrag(e, ".window", setWinPos, winPos, winDragOffset, winDragging, { x: rect.left, y: rect.top });
          }}
          style={{ userSelect: "none" }}
        >
          <div className="titlebar-stripes">
            {[6,9,12,15,18,21].map(t => <div key={t} className="titlebar-stripe" style={{ top: t }} />)}
          </div>
          <div className="close-box" {...bind("close-box")} />
          <span className="window-title">This</span>
        </div>
        <div className="window-body">
          <div {...bind("app-icon")}><IconThis /></div>
          <div className="app-name" {...bind("app-name")}>This</div>
          <p className="app-tagline" {...bind("tagline")}>
            Point. Speak. Claude.
          </p>
          <div className="btn-row">
            <a
              href={DMG_URL}
              download="This.dmg"
              className="download-btn"
              {...bind("download")}
            >
              Download for Mac
            </a>
            <a
              href="https://github.com/jasPreMar/this"
              target="_blank"
              rel="noopener noreferrer"
              className="github-btn"
              {...bind("github")}
            >
              GitHub
            </a>
          </div>
          <div className="dl-meta" {...bind("dl-meta")}>
            macOS 26+ Tahoe &nbsp;&middot;&nbsp; Free
          </div>
          <div className="video-embed">
            <iframe
              src="https://www.youtube.com/embed/e7nriIU9bM8"
              title="This — Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        <div className="scrollbar-right" {...bind("scrollbar")} />
        <div className="scrollbar-bottom" {...bind("scrollbar")} />
        <div className="resize-handle" {...bind("scrollbar")}>
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <div className="resize-inner-lg">
              <div className="resize-inner-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* --- Floating Panel --- */}
      {showFloatingPanel && currentItem && (
        <div className="float-panel" style={{ left: panelX, top: panelY }}>
          <div className="float-context">
            <div className="float-context-dot" />
            <span className="float-context-label">{currentItem.contextLabel}</span>
          </div>
          <div className="float-input">
            <div className={`float-input-text ${phase === "context-shown" ? "placeholder" : ""}`}>
              {phase === "context-shown" && "Ask about this\u2026"}
              {(phase === "typing-q" || phase === "menu-open" || phase === "typing-a" || phase === "done") && (
                <>{displayQ}{phase === "typing-q" && <span className="hp-blink" />}</>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Command Menu --- */}
      {showCommandMenu && currentItem && (
        <div className="cmd-menu">
          <div className="cmd-titlebar">
            <div className="titlebar-stripes">
              {[6,9,12,15,18,21].map(t => <div key={t} className="titlebar-stripe" style={{ top: t }} />)}
            </div>
            <div className="close-box" />
            <span className="cmd-title">This</span>
          </div>
          <div className="cmd-toolbar">
            <span className="cmd-model">Claude Sonnet</span>
            <div className="cmd-modes">
              <span className="cmd-mode-btn active">Fast</span>
              <span className="cmd-mode-btn">Think</span>
              <span className="cmd-mode-btn">Plan</span>
            </div>
          </div>
          <div className="cmd-tabs">
            <span className="cmd-tab active">Session 1</span>
            <span className="cmd-tab-new">+</span>
          </div>
          <div className="cmd-chat">
            <div className="cmd-msg">
              <div className="cmd-msg-role">&gt; You</div>
              <div className="cmd-msg-text">{currentItem.q}</div>
            </div>
            {(phase === "typing-a" || phase === "done") && (
              <div className="cmd-msg">
                <div className="cmd-msg-role">This</div>
                <div className="cmd-msg-text">
                  {displayA}
                  {phase === "typing-a" && <span className="hp-blink" />}
                </div>
              </div>
            )}
            {phase === "menu-open" && (
              <div className="cmd-msg">
                <div className="cmd-msg-role">This</div>
                <div className="cmd-msg-text"><span className="hp-blink" /></div>
              </div>
            )}
          </div>
          <div className="cmd-input-row">
            <span className="cmd-input-field">Ask a follow-up&hellip;</span>
          </div>
        </div>
      )}

      {/* --- Voice Indicator --- */}
      {showVoice && (
        <div className="voice-indicator">
          <div className="voice-bar" />
          <div className="voice-bar" />
          <div className="voice-bar" />
          <div className="voice-bar" />
          <div className="voice-bar" />
        </div>
      )}

      {/* --- Custom Cursor --- */}
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
        <div className="cursor-label">{contextLabel}</div>
      </div>
    </>
  );
}

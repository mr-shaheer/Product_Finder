import {
     useCallback,
     useEffect,
     useId,
     useLayoutEffect,
     useRef,
     useState,
     type RefObject,
   } from "react";
   import { createPortal } from "react-dom";
   import { Check, ChevronDown } from "lucide-react";
   
   const SHELL =
     "flex items-center rounded-[28px] border border-[var(--color-border)] bg-white px-4 py-1.5 shadow-[var(--shadow-float)] transition-colors focus-within:border-[var(--color-accent)] sm:px-5";
   
   export interface DropdownOption {
     value: string;
     label: string;
   }
   
   interface Position {
     left: number;
     width: number;
     top: number;
     maxHeight: number;
     above: boolean;
   }
   
   /** Keeps the floating list glued to its field (fixed position, flips up if cramped). */
   function useAnchoredPosition(open: boolean, anchorRef: RefObject<HTMLElement | null>) {
     const [pos, setPos] = useState<Position | null>(null);
   
     const update = useCallback(() => {
       const el = anchorRef.current;
       if (!el) return;
       const r = el.getBoundingClientRect();
       const spaceBelow = window.innerHeight - r.bottom - 12;
       const spaceAbove = r.top - 12;
       const above = spaceBelow < 200 && spaceAbove > spaceBelow;
       setPos({
         left: r.left,
         width: r.width,
         top: above ? r.top - 6 : r.bottom + 6,
         maxHeight: Math.max(120, Math.min(280, above ? spaceAbove : spaceBelow)),
         above,
       });
     }, [anchorRef]);
   
     useLayoutEffect(() => {
       if (!open) return;
       update();
       window.addEventListener("resize", update);
       window.addEventListener("scroll", update, true);
       return () => {
         window.removeEventListener("resize", update);
         window.removeEventListener("scroll", update, true);
       };
     }, [open, update]);
   
     return pos;
   }
   
   function useCloseOnOutsideClick(
     open: boolean,
     refs: RefObject<HTMLElement | null>[],
     close: () => void
   ) {
     useEffect(() => {
       if (!open) return;
       function onDown(e: MouseEvent) {
         const target = e.target as Node;
         if (refs.some((r) => r.current?.contains(target))) return;
         close();
       }
       document.addEventListener("mousedown", onDown);
       return () => document.removeEventListener("mousedown", onDown);
       // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [open, close]);
   }
   
   function FloatingList({
     pos,
     listRef,
     listId,
     children,
   }: {
     pos: Position;
     listRef: RefObject<HTMLUListElement | null>;
     listId: string;
     children: React.ReactNode;
   }) {
     return createPortal(
       <ul
         ref={listRef}
         id={listId}
         role="listbox"
         style={{
           position: "fixed",
           left: pos.left,
           top: pos.top,
           width: pos.width,
           maxHeight: pos.maxHeight,
           transform: pos.above ? "translateY(-100%)" : undefined,
         }}
         className="z-[70] overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white p-1.5 shadow-[var(--shadow-float)]"
       >
         {children}
       </ul>,
       document.body
     );
   }
   
   function optionClass(active: boolean, selected: boolean) {
     return `flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-[15px] transition-colors ${
       active ? "bg-[var(--color-surface)]" : ""
     } ${selected ? "font-medium text-[var(--color-accent)]" : "text-[var(--color-ink)]"}`;
   }
   
   /* ------------------------------------------------------------------ */
   /* Dropdown: pick exactly one option                                    */
   /* ------------------------------------------------------------------ */
   
   interface DropdownProps {
     id: string;
     value: string;
     options: DropdownOption[];
     onChange: (value: string) => void;
     placeholder?: string;
   }
   
   export function Dropdown({ id, value, options, onChange, placeholder = "Select..." }: DropdownProps) {
     const [open, setOpen] = useState(false);
     const [active, setActive] = useState(0);
     const anchorRef = useRef<HTMLDivElement>(null);
     const triggerRef = useRef<HTMLButtonElement>(null);
     const listRef = useRef<HTMLUListElement>(null);
     const listId = useId();
   
     const pos = useAnchoredPosition(open, anchorRef);
     const close = useCallback(() => setOpen(false), []);
     useCloseOnOutsideClick(open, [anchorRef, listRef], close);
   
     const selectedIndex = options.findIndex((o) => o.value === value);
     const selected = options[selectedIndex];
   
     useEffect(() => {
       if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
     }, [open, active, listId]);
   
     function openList() {
       setActive(Math.max(selectedIndex, 0));
       setOpen(true);
     }
   
     function choose(index: number) {
       onChange(options[index].value);
       setOpen(false);
       triggerRef.current?.focus();
     }
   
     function onKeyDown(e: React.KeyboardEvent) {
       switch (e.key) {
         case "ArrowDown":
           e.preventDefault();
           if (!open) openList();
           else setActive((i) => Math.min(i + 1, options.length - 1));
           break;
         case "ArrowUp":
           e.preventDefault();
           if (!open) openList();
           else setActive((i) => Math.max(i - 1, 0));
           break;
         case "Home":
           if (open) { e.preventDefault(); setActive(0); }
           break;
         case "End":
           if (open) { e.preventDefault(); setActive(options.length - 1); }
           break;
         case "Enter":
         case " ":
           e.preventDefault();
           if (open) choose(active);
           else openList();
           break;
         case "Escape":
           if (open) {
             e.stopPropagation(); // close the list, not the whole modal
             setOpen(false);
           }
           break;
         case "Tab":
           setOpen(false);
           break;
       }
     }
   
     return (
       <>
         <div ref={anchorRef} className={SHELL}>
           <button
             ref={triggerRef}
             id={id}
             type="button"
             role="combobox"
             aria-haspopup="listbox"
             aria-expanded={open}
             aria-controls={listId}
             aria-activedescendant={open ? `${listId}-${active}` : undefined}
             onClick={() => (open ? setOpen(false) : openList())}
             onKeyDown={onKeyDown}
             className="flex min-h-[40px] flex-1 cursor-pointer items-center justify-between gap-2 bg-transparent py-[6px] text-left text-[15px] leading-relaxed outline-none sm:text-base"
           >
             <span className={selected ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]"}>
               {selected ? selected.label : placeholder}
             </span>
             <ChevronDown
               className={`h-4 w-4 shrink-0 text-[var(--color-ink-faint)] transition-transform duration-150 ${
                 open ? "rotate-180" : ""
               }`}
             />
           </button>
         </div>
   
         {open && pos && (
           <FloatingList pos={pos} listRef={listRef} listId={listId}>
             {options.map((opt, i) => (
               <li
                 key={opt.value}
                 id={`${listId}-${i}`}
                 role="option"
                 aria-selected={opt.value === value}
                 onMouseEnter={() => setActive(i)}
                 onMouseDown={(e) => e.preventDefault()}
                 onClick={() => choose(i)}
                 className={optionClass(i === active, opt.value === value)}
               >
                 <span>{opt.label}</span>
                 {opt.value === value && <Check className="h-4 w-4 shrink-0" />}
               </li>
             ))}
           </FloatingList>
         )}
       </>
     );
   }
   
   /* ------------------------------------------------------------------ */
   /* ComboBox: type anything OR pick a suggestion                         */
   /* ------------------------------------------------------------------ */
   
   interface ComboBoxProps {
     id: string;
     value: string;
     suggestions: string[];
     onChange: (value: string) => void;
     placeholder?: string;
   }
   
   export function ComboBox({ id, value, suggestions, onChange, placeholder }: ComboBoxProps) {
     const [open, setOpen] = useState(false);
     const [active, setActive] = useState(-1);
     const anchorRef = useRef<HTMLDivElement>(null);
     const listRef = useRef<HTMLUListElement>(null);
     const inputRef = useRef<HTMLInputElement>(null);
     const listId = useId();
   
     const pos = useAnchoredPosition(open, anchorRef);
     const close = useCallback(() => setOpen(false), []);
     useCloseOnOutsideClick(open, [anchorRef, listRef], close);
   
     // Show everything when the box is empty or holds an exact suggestion; otherwise filter.
     const exact = suggestions.includes(value);
     const filtered =
       !value || exact
         ? suggestions
         : suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()));
   
     const hasList = suggestions.length > 0;
     const showList = open && hasList && filtered.length > 0 && pos;
   
     useEffect(() => {
       if (open && active >= 0) {
         document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
       }
     }, [open, active, listId]);
   
     function choose(index: number) {
       onChange(filtered[index]);
       setOpen(false);
       inputRef.current?.focus();
     }
   
     function onKeyDown(e: React.KeyboardEvent) {
       if (!hasList) return;
       switch (e.key) {
         case "ArrowDown":
           e.preventDefault();
           if (!open) { setOpen(true); setActive(0); }
           else setActive((i) => Math.min(i + 1, filtered.length - 1));
           break;
         case "ArrowUp":
           e.preventDefault();
           if (open) setActive((i) => Math.max(i - 1, 0));
           break;
         case "Enter":
           if (open && active >= 0 && filtered[active]) {
             e.preventDefault();
             choose(active);
           }
           break;
         case "Escape":
           if (open) {
             e.stopPropagation();
             setOpen(false);
           }
           break;
         case "Tab":
           setOpen(false);
           break;
       }
     }
   
     return (
       <>
         <div ref={anchorRef} className={SHELL}>
           <input
             ref={inputRef}
             id={id}
             type="text"
             role="combobox"
             aria-autocomplete="list"
             aria-expanded={!!showList}
             aria-controls={listId}
             aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
             value={value}
             onChange={(e) => {
               onChange(e.target.value);
               if (hasList) { setOpen(true); setActive(-1); }
             }}
             onKeyDown={onKeyDown}
             placeholder={placeholder}
             autoComplete="off"
             spellCheck={false}
             className="min-h-[40px] flex-1 bg-transparent py-[6px] text-[15px] leading-relaxed text-[var(--color-ink)] outline-none ring-0 placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-0 sm:text-base"
           />
           {hasList && (
             <button
               type="button"
               tabIndex={-1}
               aria-label="Show suggestions"
               onMouseDown={(e) => e.preventDefault()}
               onClick={() => {
                 setOpen((o) => !o);
                 setActive(-1);
                 inputRef.current?.focus();
               }}
               className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
             >
               <ChevronDown
                 className={`h-4 w-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
               />
             </button>
           )}
         </div>
   
         {showList && (
           <FloatingList pos={pos} listRef={listRef} listId={listId}>
             {filtered.map((s, i) => (
               <li
                 key={s}
                 id={`${listId}-${i}`}
                 role="option"
                 aria-selected={s === value}
                 onMouseEnter={() => setActive(i)}
                 onMouseDown={(e) => e.preventDefault()}
                 onClick={() => choose(i)}
                 className={optionClass(i === active, s === value)}
               >
                 <span className="truncate">{s}</span>
                 {s === value && <Check className="h-4 w-4 shrink-0" />}
               </li>
             ))}
           </FloatingList>
         )}
       </>
     );
   }
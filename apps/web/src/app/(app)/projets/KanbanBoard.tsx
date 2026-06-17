'use client';

import { useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCorners,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { Plus, X, GripVertical } from 'lucide-react';
import { tachesApi, type Colonne } from '@/lib/api';
import { cn, initials } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface Tache {
  id: string;
  titre: string;
  colonne: Colonne;
  position: number;
  priorite: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  assignee?: { id: string; name: string } | null;
  pourcentageAvancement: number;
}
export type KanbanData = Record<Colonne, Tache[]>;

const COLONNES: { key: Colonne; label: string; color: string; tint: string; border: string }[] = [
  { key: 'TODO',       label: 'À faire',    color: '#64748B', tint: '#F8FAFC', border: '#E2E8F0' },
  { key: 'EN_COURS',   label: 'En cours',   color: '#3A6B84', tint: 'rgba(124,200,232,0.07)', border: 'rgba(124,200,232,0.35)' },
  { key: 'EN_ATTENTE', label: 'En attente', color: '#C9960C', tint: '#FEF9EE', border: '#FDE68A' },
  { key: 'TERMINE',    label: 'Terminé',    color: '#0D9668', tint: '#ECFDF5', border: '#A7F3D0' },
];

const PRIORITE_STYLE: Record<Tache['priorite'], string> = {
  URGENTE: 'bg-[#FEF2F2] text-[#DC2626]',
  HAUTE: 'bg-[#FEF9EE] text-[#C9960C]',
  NORMALE: 'bg-[#EBF6FB] text-[#3A6B84]',
  BASSE: 'bg-[#F1F5F9] text-[#64748B]',
};

const AV_GRADIENT = 'linear-gradient(135deg,#3A6B84,#7CC8E8)';

export function KanbanBoard({ projetId, initial }: { projetId: string; initial: KanbanData }) {
  const [columns, setColumns] = useState<KanbanData>(initial);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function columnOf(taskId: string): Colonne | null {
    for (const c of COLONNES) if (columns[c.key].some((t) => t.id === taskId)) return c.key;
    return null;
  }
  const activeTask = activeId
    ? Object.values(columns).flat().find((t) => t.id === activeId) ?? null
    : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = String(active.id);
    const overId = String(over.id);

    const fromCol = columnOf(taskId);
    if (!fromCol) return;

    // Drop target: either a column droppable or another card.
    const isColumn = COLONNES.some((c) => c.key === overId);
    const toCol: Colonne = isColumn ? (overId as Colonne) : columnOf(overId) ?? fromCol;
    const moving = columns[fromCol].find((t) => t.id === taskId)!;

    const source = columns[fromCol].filter((t) => t.id !== taskId);
    const targetBase = toCol === fromCol ? source : columns[toCol].filter((t) => t.id !== taskId);
    const insertAt = isColumn
      ? targetBase.length
      : Math.max(0, targetBase.findIndex((t) => t.id === overId));
    const target = [...targetBase.slice(0, insertAt), { ...moving, colonne: toCol }, ...targetBase.slice(insertAt)];

    // No-op guard
    if (toCol === fromCol && columns[fromCol][insertAt]?.id === taskId) return;

    const snapshot = columns;
    const next: KanbanData = { ...columns, [fromCol]: source, [toCol]: target };
    setColumns(next);

    tachesApi.move(taskId, { colonne: toCol, position: insertAt }).catch(() => {
      setColumns(snapshot); // rollback on API error
    });
  }

  async function addTask(colonne: Colonne, titre: string) {
    try {
      const { data } = await tachesApi.create({ projetId, titre, colonne });
      setColumns((c) => ({ ...c, [colonne]: [...c[colonne], data as Tache] }));
    } catch { /* surfaced by the composer */ }
  }

  async function removeTask(id: string, colonne: Colonne) {
    const snapshot = columns;
    setColumns((c) => ({ ...c, [colonne]: c[colonne].filter((t) => t.id !== id) }));
    try { await tachesApi.remove(id); } catch { setColumns(snapshot); }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-4 gap-3">
        {COLONNES.map((col) => (
          <Column key={col.key} meta={col} tasks={columns[col.key]} onAdd={addTask} onRemove={removeTask} />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <Card task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  meta, tasks, onAdd, onRemove,
}: {
  meta: typeof COLONNES[number];
  tasks: Tache[];
  onAdd: (c: Colonne, titre: string) => void;
  onRemove: (id: string, c: Colonne) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: meta.key });
  const [composing, setComposing] = useState(false);
  const [titre, setTitre] = useState('');

  function submit() {
    const v = titre.trim();
    if (!v) return;
    onAdd(meta.key, v);
    setTitre('');
    setComposing(false);
  }

  return (
    <div
      ref={setNodeRef}
      className={cn('flex min-h-[420px] flex-col rounded-2xl border p-2.5 transition-colors')}
      style={{ background: meta.tint, borderColor: isOver ? meta.color : meta.border }}
    >
      {/* Column header */}
      <div className="mb-2.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
          <span className="rounded-full bg-white px-1.5 text-[10px] font-bold text-[#94A3B8]">{tasks.length}</span>
        </div>
        <button onClick={() => setComposing((v) => !v)} className="text-[#94A3B8] hover:text-[#0F172A]" aria-label="Ajouter une tâche">
          <Plus size={15} />
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((t) => <DraggableCard key={t.id} task={t} onRemove={() => onRemove(t.id, meta.key)} />)}

        {composing && (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-sm">
            <textarea
              autoFocus value={titre} onChange={(e) => setTitre(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } if (e.key === 'Escape') setComposing(false); }}
              placeholder="Titre de la tâche…"
              className="w-full resize-none border-0 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none"
              rows={2}
            />
            <div className="mt-1 flex gap-1.5">
              <Button size="sm" variant="gold" onClick={submit}>Ajouter</Button>
              <button onClick={() => { setComposing(false); setTitre(''); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9]"><X size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ task, onRemove }: { task: Tache; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <Card task={task} onRemove={onRemove} />
    </div>
  );
}

function Card({ task, overlay, onRemove }: { task: Tache; overlay?: boolean; onRemove?: () => void }) {
  return (
    <div className={cn(
      'group rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm',
      overlay ? 'rotate-1 shadow-[0_8px_24px_rgba(15,23,42,0.18)]' : 'cursor-grab active:cursor-grabbing'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5">
          <GripVertical size={13} className="mt-0.5 shrink-0 text-[#CBD5E1]" />
          <span className="text-[13px] font-semibold leading-snug text-[#0F172A]">{task.titre}</span>
        </div>
        {onRemove && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="opacity-0 transition-opacity group-hover:opacity-100 text-[#CBD5E1] hover:text-[#DC2626]"
            aria-label="Supprimer"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between pl-[18px]">
        <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold', PRIORITE_STYLE[task.priorite])}>
          {task.priorite[0] + task.priorite.slice(1).toLowerCase()}
        </span>
        {task.assignee && (
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ background: AV_GRADIENT }}
            title={task.assignee.name}
          >
            {initials(...task.assignee.name.split(' '))}
          </span>
        )}
      </div>

      {task.pourcentageAvancement > 0 && task.pourcentageAvancement < 100 && (
        <div className="mt-2 ml-[18px] h-1 overflow-hidden rounded-full bg-[#F1F5F9]">
          <div className="h-full rounded-full bg-[#7CC8E8]" style={{ width: `${task.pourcentageAvancement}%` }} />
        </div>
      )}
    </div>
  );
}

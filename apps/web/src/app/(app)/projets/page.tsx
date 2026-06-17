'use client';

import { useCallback, useEffect, useState } from 'react';
import { projetsApi } from '@/lib/api';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { KanbanBoard, type KanbanData } from './KanbanBoard';

interface ProjetLite { id: string; numero: string; objet: string; client?: { nom: string } }

const EMPTY: KanbanData = { TODO: [], EN_COURS: [], EN_ATTENTE: [], TERMINE: [] };

export default function ProjetsPage() {
  const [projets, setProjets] = useState<ProjetLite[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [data, setData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projetsApi.list({ limit: 100 }).then((r) => {
      const list: ProjetLite[] = r.data.data;
      setProjets(list);
      if (list.length) setSelectedId(list[0].id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadKanban = useCallback(async (id: string) => {
    setLoading(true);
    setData(null);
    try {
      const { data } = await projetsApi.kanban(id);
      setData({ ...EMPTY, ...data });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (selectedId) loadKanban(selectedId); }, [selectedId, loadKanban]);

  const current = projets.find((p) => p.id === selectedId);

  return (
    <div className="p-6">
      {/* Header with project filter */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">Projets — Kanban</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {current ? `${current.numero} · ${current.objet}` : 'Suivi opérationnel des tâches'}
          </p>
        </div>
        <div className="w-64">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger><SelectValue placeholder="Choisir un projet…" /></SelectTrigger>
            <SelectContent>
              {projets.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.numero} — {p.objet}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[420px] animate-pulse rounded-2xl border border-[#E2E8F0] bg-white" />
          ))}
        </div>
      ) : !selectedId ? (
        <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-20 text-center text-sm text-[#94A3B8]">
          Aucun projet. Convertissez une facture en projet pour démarrer un Kanban.
        </div>
      ) : data ? (
        // key remounts the board (fresh state) when switching projects
        <KanbanBoard key={selectedId} projetId={selectedId} initial={data} />
      ) : null}
    </div>
  );
}

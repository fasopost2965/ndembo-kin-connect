'use client';

import { useCallback, useEffect, useState } from 'react';
import { projetsApi } from '@/lib/api';
import { KanbanBoard, type KanbanData } from './KanbanBoard';

function MI({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', ...style }}>
      {name}
    </span>
  );
}

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
  const totalTaches = data ? Object.values(data).flat().length : 0;
  const terminees = data?.TERMINE?.length ?? 0;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* ── Topbar ── */}
      <div
        className="flex items-center gap-4 px-6 shrink-0"
        style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', height: 60 }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[18px] font-extrabold tracking-[-0.3px]" style={{ color: '#0F172A' }}>Projets</span>
          <span className="text-[12px] font-bold px-2 py-0.5 rounded-lg" style={{ background: '#EBF6FB', color: '#3A6B84' }}>
            Kanban
          </span>
        </div>

        {/* Project selector */}
        {projets.length > 0 && (
          <div
            className="flex items-center gap-2 px-3 rounded-[9px]"
            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', height: 36 }}
          >
            <MI name="folder_open" size={14} style={{ color: '#94A3B8' }} />
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontSize: 13, color: '#334155', cursor: 'pointer', minWidth: 200,
              }}
            >
              {projets.map(p => (
                <option key={p.id} value={p.id}>{p.numero} — {p.objet}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1" />

        {/* Stats mini */}
        {data && (
          <div className="flex items-center gap-4 text-[12px]" style={{ color: '#94A3B8' }}>
            <span>
              <strong style={{ color: '#0F172A', fontWeight: 700 }}>{totalTaches}</strong> tâches
            </span>
            <span>
              <strong style={{ color: '#10B981', fontWeight: 700 }}>{terminees}</strong> terminées
            </span>
          </div>
        )}

        <button
          className="flex items-center gap-1.5 px-4 font-bold text-[13px] rounded-[9px]"
          style={{ height: 36, background: '#07101A', color: '#FCD116', border: 'none', cursor: 'pointer' }}
        >
          <MI name="add" size={15} style={{ color: '#FCD116' }} />
          Nouveau projet
        </button>
      </div>

      {/* ── Kanban content ── */}
      <div className="flex-1 p-6 overflow-x-auto">
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[420px] animate-pulse rounded-2xl" style={{ background: '#fff', border: '1px solid #E2E8F0' }} />
            ))}
          </div>
        ) : !selectedId ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
            style={{ background: '#fff', border: '1px dashed #E2E8F0' }}
          >
            <MI name="dashboard" size={48} style={{ color: '#E2E8F0', marginBottom: 12 }} />
            <div className="text-[15px] font-semibold" style={{ color: '#CBD5E1' }}>Aucun projet trouvé</div>
            <div className="text-[13px] mt-1" style={{ color: '#94A3B8' }}>
              Convertissez une facture en projet pour démarrer un Kanban.
            </div>
          </div>
        ) : data ? (
          <KanbanBoard key={selectedId} projetId={selectedId} initial={data} />
        ) : null}
      </div>
    </div>
  );
}

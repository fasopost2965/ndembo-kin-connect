import { createElement as e, type ReactElement } from 'react';
import fs from 'fs';
import path from 'path';
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { SettingsMap } from '../settings';

// ── Brand palette (Design System) ──────────────────────────────────────────────
const NAVY = '#132730';
const GOLD = '#DAA520';
const SLATE = '#64748B';
const LIGHT = '#94A3B8';
const BORDER = '#E2E8F0';

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 44, fontSize: 9, color: '#0F172A', fontFamily: 'Helvetica' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  logo: { width: 54, height: 54, objectFit: 'contain' },
  agency: { fontSize: 13, fontWeight: 700, color: NAVY },
  agencyLine: { fontSize: 8, color: SLATE, marginTop: 2 },
  docBlock: { alignItems: 'flex-end' },
  docTitle: { fontSize: 22, fontWeight: 700, letterSpacing: 1, color: NAVY },
  docNumero: { fontSize: 11, fontWeight: 700, color: GOLD, marginTop: 2 },
  docMeta: { fontSize: 8, color: SLATE, marginTop: 3 },

  clientBox: { borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 12, marginBottom: 22, width: 240 },
  clientLabel: { fontSize: 7, fontWeight: 700, color: LIGHT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  clientNom: { fontSize: 11, fontWeight: 700, color: NAVY },
  clientLine: { fontSize: 8, color: SLATE, marginTop: 2 },

  thead: { flexDirection: 'row', backgroundColor: NAVY, borderRadius: 4, paddingVertical: 6, paddingHorizontal: 8 },
  th: { color: '#fff', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cDesig: { width: '52%' },
  cQte: { width: '12%', textAlign: 'center' },
  cPu: { width: '18%', textAlign: 'right' },
  cTot: { width: '18%', textAlign: 'right' },

  totals: { marginTop: 16, alignSelf: 'flex-end', width: 230 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: SLATE },
  totalVal: { fontSize: 9, fontWeight: 700, color: '#0F172A' },
  ttcRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: BORDER },
  ttcLabel: { fontSize: 11, fontWeight: 700, color: NAVY },
  ttcVal: { fontSize: 13, fontWeight: 700, color: GOLD },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  payGreen: { fontSize: 9, fontWeight: 700, color: '#0D9668' },
  payRed: { fontSize: 9, fontWeight: 700, color: '#DC2626' },

  footer: { position: 'absolute', bottom: 28, left: 44, right: 44, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8 },
  footerText: { fontSize: 7, color: LIGHT, textAlign: 'center', lineHeight: 1.5 },
  notes: { marginTop: 18, fontSize: 8, color: SLATE, lineHeight: 1.5 },
});

export interface PdfLigne { designation: string; quantite: number; prixUnit: number; total: number }

export interface PdfDocInput {
  kind: 'devis' | 'facture';
  numero: string;
  createdAt: Date;
  client: { nom: string; type?: string; email?: string; telephone?: string; ville?: string };
  lignes: PdfLigne[];
  montantHT: number;
  tva: number;
  montantTTC: number;
  // facture-only
  acomptePercu?: number;
  validiteJours?: number; // devis-only
  notes?: string | null;
}

let logoDataUri: string | null | undefined;
function getLogo(): string | null {
  if (logoDataUri !== undefined) return logoDataUri;
  try {
    const p = path.resolve(process.cwd(), 'assets/logo.png');
    const buf = fs.readFileSync(p);
    logoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    logoDataUri = null;
  }
  return logoDataUri;
}

function money(n: number, devise: string): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' ' + devise;
}

function buildDocument(input: PdfDocInput, settings: SettingsMap): ReactElement {
  const devise = settings.devise || 'USD';
  const isFacture = input.kind === 'facture';
  const logo = getLogo();
  const dateStr = input.createdAt.toLocaleDateString('fr-FR');
  const acompte = input.acomptePercu ?? 0;
  const restant = Math.max(0, input.montantTTC - acompte);

  const header = e(View, { key: 'header', style: styles.headerRow }, [
    e(View, { key: 'l', style: { flexDirection: 'row', gap: 10 } }, [
      logo ? e(Image, { key: 'img', style: styles.logo, src: logo }) : null,
      e(View, { key: 'info' }, [
        e(Text, { key: 'n', style: styles.agency }, settings.agence_nom),
        e(Text, { key: 'a', style: styles.agencyLine }, settings.agence_adresse),
        e(Text, { key: 'e', style: styles.agencyLine }, settings.agence_email),
        e(Text, { key: 't', style: styles.agencyLine }, settings.agence_telephone),
      ]),
    ]),
    e(View, { key: 'r', style: styles.docBlock }, [
      e(Text, { key: 'title', style: styles.docTitle }, isFacture ? 'FACTURE' : 'DEVIS'),
      e(Text, { key: 'num', style: styles.docNumero }, input.numero),
      e(Text, { key: 'date', style: styles.docMeta }, `Date : ${dateStr}`),
      !isFacture && input.validiteJours
        ? e(Text, { key: 'val', style: styles.docMeta }, `Validité : ${input.validiteJours} jours`)
        : null,
    ]),
  ]);

  const clientBox = e(View, { key: 'client', style: styles.clientBox }, [
    e(Text, { key: 'lbl', style: styles.clientLabel }, isFacture ? 'Facturé à' : 'Adressé à'),
    e(Text, { key: 'nom', style: styles.clientNom }, input.client.nom),
    input.client.type ? e(Text, { key: 'typ', style: styles.clientLine }, input.client.type) : null,
    input.client.ville ? e(Text, { key: 'vil', style: styles.clientLine }, input.client.ville) : null,
    input.client.email ? e(Text, { key: 'eml', style: styles.clientLine }, input.client.email) : null,
    input.client.telephone ? e(Text, { key: 'tel', style: styles.clientLine }, input.client.telephone) : null,
  ]);

  const thead = e(View, { key: 'thead', style: styles.thead }, [
    e(Text, { key: 'd', style: [styles.th, styles.cDesig] }, 'Désignation'),
    e(Text, { key: 'q', style: [styles.th, styles.cQte] }, 'Qté'),
    e(Text, { key: 'p', style: [styles.th, styles.cPu] }, 'Prix unit.'),
    e(Text, { key: 't', style: [styles.th, styles.cTot] }, 'Total'),
  ]);

  const rows = input.lignes.map((l, i) =>
    e(View, { key: i, style: styles.row }, [
      e(Text, { key: 'd', style: styles.cDesig }, l.designation),
      e(Text, { key: 'q', style: styles.cQte }, String(l.quantite)),
      e(Text, { key: 'p', style: styles.cPu }, money(l.prixUnit, devise)),
      e(Text, { key: 't', style: styles.cTot }, money(l.total, devise)),
    ])
  );

  const totalsChildren = [
    e(View, { key: 'ht', style: styles.totalRow }, [
      e(Text, { key: 'l', style: styles.totalLabel }, 'Total HT'),
      e(Text, { key: 'v', style: styles.totalVal }, money(input.montantHT, devise)),
    ]),
    e(View, { key: 'tva', style: styles.totalRow }, [
      e(Text, { key: 'l', style: styles.totalLabel }, `TVA (${input.tva}%)`),
      e(Text, { key: 'v', style: styles.totalVal }, money(input.montantTTC - input.montantHT, devise)),
    ]),
    e(View, { key: 'ttc', style: styles.ttcRow }, [
      e(Text, { key: 'l', style: styles.ttcLabel }, 'Total TTC'),
      e(Text, { key: 'v', style: styles.ttcVal }, money(input.montantTTC, devise)),
    ]),
  ];

  if (isFacture) {
    totalsChildren.push(
      e(View, { key: 'ac', style: [styles.payRow, { marginTop: 6 }] }, [
        e(Text, { key: 'l', style: styles.totalLabel }, 'Acompte perçu'),
        e(Text, { key: 'v', style: styles.payGreen }, money(acompte, devise)),
      ]),
      e(View, { key: 'rest', style: styles.payRow }, [
        e(Text, { key: 'l', style: styles.totalLabel }, 'Restant dû'),
        e(Text, { key: 'v', style: restant > 0 ? styles.payRed : styles.payGreen }, money(restant, devise)),
      ])
    );
  }

  const totals = e(View, { key: 'totals', style: styles.totals }, totalsChildren);

  const notes = input.notes
    ? e(Text, { key: 'notes', style: styles.notes }, input.notes)
    : null;

  const legalBits = [settings.agence_nom];
  if (settings.agence_rccm) legalBits.push(`RCCM : ${settings.agence_rccm}`);
  if (settings.agence_nif) legalBits.push(`NIF : ${settings.agence_nif}`);
  const footer = e(View, { key: 'footer', style: styles.footer, fixed: true }, [
    e(Text, { key: 'l', style: styles.footerText }, legalBits.join('  ·  ')),
    e(Text, { key: 'm', style: styles.footerText },
      isFacture
        ? 'Paiement par Mobile Money (MTN / Airtel / Orange) ou virement bancaire.'
        : 'Ce devis est valable pour la durée indiquée. Bon pour accord, date et signature.'),
  ]);

  const page = e(Page, { size: 'A4', style: styles.page }, [header, clientBox, thead, ...rows, totals, notes, footer]);

  return e(Document, { title: `${input.numero}`, author: settings.agence_nom }, page);
}

/** Render a devis/facture document to a PDF Buffer. */
export async function renderDocumentPdf(input: PdfDocInput, settings: SettingsMap): Promise<Buffer> {
  return renderToBuffer(buildDocument(input, settings));
}

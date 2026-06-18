import { createElement as e, type ReactElement } from 'react';
import fs from 'fs';
import path from 'path';
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { SettingsMap } from '../settings';

// ── Brand palette — Design System NKC (source: Modeles Facture & Devis.dc.html) ──
const C = {
  navy:      '#07101A',
  gold:      '#FCD116',
  cyan:      '#7CC8E8',
  slate:     '#3A6B84',
  text0:     '#0F172A',
  text1:     '#334155',
  text2:     '#475569',
  text3:     '#64748B',
  text4:     '#94A3B8',
  border:    '#EEF1F4',
  border2:   '#E2E8F0',
  bg1:       '#F7F9FB',
  bg2:       '#FAFBFC',
  bg3:       '#F1F5F9',
  green:     '#059669',
  amberText: '#C9960C',
  amberBg:   '#FEF9EE',
  amberBd:   '#FCE7B0',
  mpesaTxt:  '#B45309',
  airtelBg:  '#FFF1F2',
  airtelTxt: '#BE123C',
  blueBg:    '#EBF6FB',
  blueBd:    '#C4E4F2',
  blueText:  '#3A6B84',
  white:     '#FFFFFF',
};

const styles = StyleSheet.create({
  page: { paddingBottom: 64, fontSize: 9, color: C.text0, fontFamily: 'Helvetica', backgroundColor: C.white },

  // Top colored stripe (4px)
  stripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },

  // Header bands
  headerDark:  { backgroundColor: C.navy, paddingHorizontal: 44, paddingTop: 36, paddingBottom: 28 },
  headerLight: { backgroundColor: C.white, paddingHorizontal: 44, paddingTop: 36, paddingBottom: 24, borderBottomWidth: 2, borderBottomColor: C.navy },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

  logoBoxDark:  { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 9, padding: 7, width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  logoBoxLight: { backgroundColor: C.navy, borderRadius: 9, padding: 7, width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 42, height: 42, objectFit: 'contain' },

  agencyNameDark:  { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: -0.3 },
  agencyNameLight: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.text0, letterSpacing: -0.3 },
  agencySubDark:   { fontSize: 9,  fontFamily: 'Helvetica-Bold', color: C.cyan,  marginTop: 3 },
  agencySubLight:  { fontSize: 9,  fontFamily: 'Helvetica-Bold', color: C.slate, marginTop: 3 },

  docTitleGold: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: C.gold,  letterSpacing: 2, textAlign: 'right' },
  docTitleDark: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: C.text0, letterSpacing: 2, textAlign: 'right' },
  docNumDark:   { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 8, textAlign: 'right', fontFamily: 'Courier' },
  docNumLight:  { fontSize: 11, color: C.text4, marginTop: 8, textAlign: 'right', fontFamily: 'Courier' },

  // Meta row
  metaRow:   { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
  metaCell1: { flex: 1, paddingLeft: 44, paddingRight: 16, paddingVertical: 13, borderRightWidth: 1, borderRightColor: C.border },
  metaCell2: { flex: 1, paddingHorizontal: 24, paddingVertical: 13, borderRightWidth: 1, borderRightColor: C.border },
  metaCell3: { flex: 1, paddingHorizontal: 24, paddingVertical: 13, justifyContent: 'center' },
  metaLbl:   { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  metaVal:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.text0 },

  badgeAmber:     { backgroundColor: C.amberBg, borderWidth: 1, borderColor: C.amberBd, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeBlue:      { backgroundColor: C.blueBg,  borderWidth: 1, borderColor: C.blueBd,  borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeTxtAmber:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.amberText },
  badgeTxtBlue:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.blueText },

  // Body: Emis par + Client
  bodyRow:    { flexDirection: 'row', paddingHorizontal: 44, paddingTop: 24, paddingBottom: 18 },
  emetteCol:  { flex: 1, marginRight: 32 },
  clientCard: { flex: 1, backgroundColor: C.bg1, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 16 },
  sectionLbl: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.text4, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  companyName:{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.text0, marginBottom: 3 },
  clientName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.text0, marginBottom: 3 },
  addrLine:   { fontSize: 9.5, color: C.text2, lineHeight: 1.6 },
  monoSmall:  { fontSize: 8, color: C.text4, lineHeight: 1.6, marginTop: 7, fontFamily: 'Courier' },

  // Table
  tableWrap: { paddingHorizontal: 44 },
  theadDark:  { flexDirection: 'row', backgroundColor: C.navy, borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  theadLight: { flexDirection: 'row', backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border2, borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  thDark:     { fontSize: 7, fontFamily: 'Helvetica-Bold', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.8 },
  thLight:    { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.text3, textTransform: 'uppercase', letterSpacing: 0.8 },

  trow:      { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.bg3 },
  trowAlt:   { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.bg3, backgroundColor: C.bg2 },
  trowBd:    { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border2, borderLeftWidth: 1, borderLeftColor: C.border2, borderRightWidth: 1, borderRightColor: C.border2 },
  trowBdAlt: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border2, borderLeftWidth: 1, borderLeftColor: C.border2, borderRightWidth: 1, borderRightColor: C.border2, backgroundColor: C.bg2 },

  cDesig: { width: '51%' },
  cQte:   { width: '10%', textAlign: 'center' },
  cPu:    { width: '19.5%', textAlign: 'right' },
  cTot:   { width: '19.5%', textAlign: 'right' },

  desigMain: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.text0 },
  desigSub:  { fontSize: 8.5, color: C.text4, marginTop: 2 },
  cellQte:   { fontSize: 11, color: C.text1, textAlign: 'center' },
  cellPu:    { fontSize: 11, color: C.text1, textAlign: 'right', fontFamily: 'Courier' },
  cellTot:   { fontSize: 11, fontFamily: 'Courier', color: C.text0, textAlign: 'right' },

  // Bottom section
  bottomRow:  { flexDirection: 'row', paddingHorizontal: 44, paddingTop: 22, paddingBottom: 6 },
  payCard:    { flex: 1, marginRight: 24, backgroundColor: C.bg1, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 16 },
  signCard:   { flex: 1, marginRight: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border2, borderRadius: 10, padding: 16 },
  bottomLbl:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.text4, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  payText:    { fontSize: 9, color: C.text2, lineHeight: 1.6 },

  tagsRow:      { flexDirection: 'row', marginTop: 8 },
  tagMpesa:     { backgroundColor: C.amberBg, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, marginRight: 5 },
  tagAirtel:    { backgroundColor: C.airtelBg, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  tagMpesaTxt:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.mpesaTxt },
  tagAirtelTxt: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.airtelTxt },
  ibanLine:     { fontSize: 8, color: C.text4, lineHeight: 1.65, marginTop: 9, fontFamily: 'Courier' },

  signHint: { fontSize: 9, color: C.text2, lineHeight: 1.6 },
  signLine: { borderBottomWidth: 1, borderBottomColor: C.border2, marginTop: 14, height: 50 },
  signNote: { fontSize: 8, color: C.text4, marginTop: 5 },

  totalsCol:    { width: 220 },
  totRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  totRowBorder: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: 1, borderTopColor: C.bg3 },
  totLbl:   { fontSize: 10, color: C.text3 },
  totVal:   { fontSize: 10, fontFamily: 'Courier', color: C.text0 },
  totGreen: { fontSize: 10, fontFamily: 'Courier', color: C.green },

  ttcBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.navy, borderRadius: 9, paddingHorizontal: 16, paddingVertical: 13, marginTop: 9 },
  ttcLbl:   { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.white },
  ttcVal:   { fontSize: 20, fontFamily: 'Courier', color: C.gold },

  // Notes
  notes: { marginHorizontal: 44, marginTop: 14, fontSize: 8.5, color: C.text2, lineHeight: 1.5 },

  // Footer
  footer:       { position: 'absolute', bottom: 24, left: 44, right: 44, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  footerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText:   { fontSize: 8, color: C.text4, lineHeight: 1.5, flex: 1 },
  footerDomain: { fontSize: 8, color: '#CBD5E1', fontFamily: 'Courier' },
});

export interface PdfLigne {
  designation: string;
  description?: string;
  quantite: number;
  prixUnit: number;
  total: number;
}

export interface PdfDocInput {
  kind: 'devis' | 'facture';
  numero: string;
  createdAt: Date;
  client: { nom: string; type?: string; email?: string; telephone?: string; ville?: string };
  lignes: PdfLigne[];
  montantHT: number;
  tva: number;
  montantTTC: number;
  remise?: number;
  acomptePercu?: number;
  validiteJours?: number;
  notes?: string | null;
}

let logoDataUri: string | null | undefined;
function getLogo(): string | null {
  if (logoDataUri !== undefined) return logoDataUri;
  try {
    const buf = fs.readFileSync(path.resolve(process.cwd(), 'assets/logo.png'));
    logoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    logoDataUri = null;
  }
  return logoDataUri;
}

function money(n: number, devise: string): string {
  return `${devise} ${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function buildDocument(input: PdfDocInput, settings: SettingsMap): ReactElement {
  const devise     = settings.devise || 'USD';
  const isFacture  = input.kind === 'facture';
  const logo       = getLogo();
  const dateStr    = fmtDate(input.createdAt);
  const dueDays    = isFacture ? 30 : (input.validiteJours ?? 30);
  const dueDateStr = fmtDate(addDays(input.createdAt, dueDays));
  const remise     = input.remise ?? 0;
  const tvaAmount  = input.montantTTC - input.montantHT;

  const agenceNom     = settings.agence_nom     || 'Ndembo Kin Connect SARL';
  const agenceAdresse = settings.agence_adresse || '12, Avenue du Commerce — Gombe\nKinshasa, République Démocratique du Congo';
  const agenceContact = [settings.agence_telephone, settings.agence_email].filter(Boolean).join(' · ');
  const legalLine     = [
    settings.agence_rccm ? `RCCM ${settings.agence_rccm}` : null,
    settings.agence_nif  ? `NIF ${settings.agence_nif}`   : null,
  ].filter(Boolean).join('  ·  ');

  const mpesa  = settings.mobile_mpesa  || '0815 000 000';
  const airtel = settings.mobile_airtel || '0995 000 000';
  const ibanText = [
    settings.banque_nom  ? `Banque : ${settings.banque_nom}` : null,
    settings.banque_iban ? `IBAN ${settings.banque_iban}`    : null,
  ].filter(Boolean).join('\n');

  // ── Header ─────────────────────────────────────────────────────────────────
  const header = e(View, { key: 'header', style: isFacture ? styles.headerDark : styles.headerLight }, [
    e(View, { key: 'stripe', style: [styles.stripe, { backgroundColor: isFacture ? C.gold : C.cyan }] }),
    e(View, { key: 'hrow', style: styles.headerRow }, [
      e(View, { key: 'hl', style: { flexDirection: 'row', alignItems: 'center' } }, [
        e(View, { key: 'lb', style: isFacture ? styles.logoBoxDark : styles.logoBoxLight }, [
          logo ? e(Image, { key: 'img', style: styles.logo, src: logo }) : null,
        ]),
        e(View, { key: 'nc', style: { marginLeft: 12, justifyContent: 'center' } }, [
          e(Text, { key: 'an', style: isFacture ? styles.agencyNameDark : styles.agencyNameLight },
            settings.agence_nom || 'Ndembo Kin Connect'),
          e(Text, { key: 'as', style: isFacture ? styles.agencySubDark : styles.agencySubLight },
            'Management & Représentation Sportive'),
        ]),
      ]),
      e(View, { key: 'hr', style: { alignItems: 'flex-end' } }, [
        e(Text, { key: 'dt', style: isFacture ? styles.docTitleGold : styles.docTitleDark },
          isFacture ? 'FACTURE' : 'DEVIS'),
        e(Text, { key: 'dn', style: isFacture ? styles.docNumDark : styles.docNumLight },
          `N° ${input.numero}`),
      ]),
    ]),
  ]);

  // ── Meta row ───────────────────────────────────────────────────────────────
  const metaRow = e(View, { key: 'meta', style: styles.metaRow }, [
    e(View, { key: 'm1', style: styles.metaCell1 }, [
      e(Text, { key: 'l', style: styles.metaLbl }, "Date d'émission"),
      e(Text, { key: 'v', style: styles.metaVal }, dateStr),
    ]),
    e(View, { key: 'm2', style: styles.metaCell2 }, [
      e(Text, { key: 'l', style: styles.metaLbl }, isFacture ? 'Échéance' : 'Valable jusqu\'au'),
      e(Text, { key: 'v', style: styles.metaVal }, dueDateStr),
    ]),
    e(View, { key: 'm3', style: styles.metaCell3 }, [
      e(View, { key: 'badge', style: isFacture ? styles.badgeAmber : styles.badgeBlue }, [
        e(Text, { key: 't', style: isFacture ? styles.badgeTxtAmber : styles.badgeTxtBlue },
          isFacture ? '● En attente de paiement' : '● Proposition commerciale'),
      ]),
    ]),
  ]);

  // ── Body: Emis par / Client ────────────────────────────────────────────────
  const bodyRow = e(View, { key: 'body', style: styles.bodyRow }, [
    e(View, { key: 'emis', style: styles.emetteCol }, [
      e(Text, { key: 'lbl', style: styles.sectionLbl }, 'Émis par'),
      e(Text, { key: 'nom', style: styles.companyName }, agenceNom),
      e(Text, { key: 'adr', style: styles.addrLine }, agenceAdresse),
      agenceContact ? e(Text, { key: 'ctt', style: styles.addrLine }, agenceContact) : null,
      legalLine     ? e(Text, { key: 'leg', style: styles.monoSmall }, legalLine) : null,
    ]),
    e(View, { key: 'cli', style: styles.clientCard }, [
      e(Text, { key: 'lbl', style: styles.sectionLbl }, isFacture ? 'Facturé à' : 'À l\'attention de'),
      e(Text, { key: 'nom', style: styles.clientName }, input.client.nom),
      input.client.type      ? e(Text, { key: 'typ', style: styles.addrLine }, input.client.type)      : null,
      input.client.ville     ? e(Text, { key: 'vil', style: styles.addrLine }, input.client.ville)     : null,
      input.client.email     ? e(Text, { key: 'eml', style: styles.addrLine }, input.client.email)     : null,
      input.client.telephone ? e(Text, { key: 'tel', style: styles.addrLine }, input.client.telephone) : null,
    ]),
  ]);

  // ── Table ──────────────────────────────────────────────────────────────────
  const theadStyle = isFacture ? styles.theadDark : styles.theadLight;
  const thStyle    = isFacture ? styles.thDark    : styles.thLight;
  const thead = e(View, { key: 'thead', style: theadStyle }, [
    e(Text, { key: 'd', style: [thStyle, styles.cDesig] }, 'Désignation'),
    e(Text, { key: 'q', style: [thStyle, styles.cQte] }, 'Qté'),
    e(Text, { key: 'p', style: [thStyle, styles.cPu] }, 'P. unitaire'),
    e(Text, { key: 't', style: [thStyle, styles.cTot] }, 'Total HT'),
  ]);

  const rows = input.lignes.map((l, i) => {
    const rowStyle = isFacture
      ? (i % 2 === 0 ? styles.trow    : styles.trowAlt)
      : (i % 2 === 0 ? styles.trowBd  : styles.trowBdAlt);
    return e(View, { key: i, style: rowStyle }, [
      e(View, { key: 'dc', style: styles.cDesig }, [
        e(Text, { key: 'dm', style: styles.desigMain }, l.designation),
        l.description ? e(Text, { key: 'ds', style: styles.desigSub }, l.description) : null,
      ]),
      e(Text, { key: 'q', style: [styles.cellQte, styles.cQte] }, String(l.quantite)),
      e(Text, { key: 'p', style: [styles.cellPu,  styles.cPu]  }, money(l.prixUnit, devise)),
      e(Text, { key: 't', style: [styles.cellTot, styles.cTot] }, money(l.total, devise)),
    ]);
  });

  const table = e(View, { key: 'table', style: styles.tableWrap }, [thead, ...rows]);

  // ── Bottom: payment/signature | totals ────────────────────────────────────
  const leftPanel = isFacture
    ? e(View, { key: 'pay', style: styles.payCard }, [
        e(Text, { key: 'lbl', style: styles.bottomLbl }, 'Modalités de paiement'),
        e(Text, { key: 'txt', style: styles.payText }, 'Paiement à 30 jours. Mobile Money accepté :'),
        e(View, { key: 'tags', style: styles.tagsRow }, [
          e(View, { key: 'mp', style: styles.tagMpesa  }, [e(Text, { key: 't', style: styles.tagMpesaTxt  }, `M-Pesa · ${mpesa}`)]),
          e(View, { key: 'at', style: styles.tagAirtel }, [e(Text, { key: 't', style: styles.tagAirtelTxt }, `Airtel · ${airtel}`)]),
        ]),
        ibanText ? e(Text, { key: 'iban', style: styles.ibanLine }, ibanText) : null,
      ])
    : e(View, { key: 'sign', style: styles.signCard }, [
        e(Text, { key: 'lbl', style: styles.bottomLbl }, 'Bon pour accord'),
        e(Text, { key: 'txt', style: styles.signHint },
          'Date, nom et signature du client précédés de la mention « Bon pour accord ».'),
        e(View, { key: 'line', style: styles.signLine }),
        e(Text, { key: 'note', style: styles.signNote }, 'Signature'),
      ]);

  const totalsCol = e(View, { key: 'tots', style: styles.totalsCol }, [
    e(View, { key: 'ht',  style: styles.totRow }, [
      e(Text, { key: 'l', style: styles.totLbl }, 'Sous-total HT'),
      e(Text, { key: 'v', style: styles.totVal }, money(input.montantHT, devise)),
    ]),
    e(View, { key: 'tva', style: styles.totRowBorder }, [
      e(Text, { key: 'l', style: styles.totLbl }, `TVA (${input.tva} %)`),
      e(Text, { key: 'v', style: styles.totVal }, money(tvaAmount, devise)),
    ]),
    e(View, { key: 'rem', style: styles.totRowBorder }, [
      e(Text, { key: 'l', style: styles.totLbl }, 'Remise'),
      e(Text, { key: 'v', style: styles.totGreen }, remise > 0 ? `− ${money(remise, devise)}` : money(0, devise)),
    ]),
    e(View, { key: 'ttc', style: styles.ttcBlock }, [
      e(Text, { key: 'l', style: styles.ttcLbl }, 'Total TTC'),
      e(Text, { key: 'v', style: styles.ttcVal }, money(input.montantTTC, devise)),
    ]),
  ]);

  const bottom = e(View, { key: 'bot', style: styles.bottomRow }, [leftPanel, totalsCol]);

  // ── Notes ──────────────────────────────────────────────────────────────────
  const notesEl = input.notes
    ? e(Text, { key: 'notes', style: styles.notes }, input.notes)
    : null;

  // ── Footer ─────────────────────────────────────────────────────────────────
  const legalBits = [agenceNom];
  if (settings.agence_rccm) legalBits.push(`RCCM : ${settings.agence_rccm}`);
  if (settings.agence_nif)  legalBits.push(`NIF : ${settings.agence_nif}`);
  const footerNote = isFacture
    ? 'Tout retard de paiement entraîne une pénalité de 1,5 % / mois.'
    : "Devis valable 30 jours. Les prix s'entendent hors frais de déplacement éventuels.";

  const footer = e(View, { key: 'footer', style: styles.footer, fixed: true }, [
    e(View, { key: 'fr', style: styles.footerRow }, [
      e(Text, { key: 'l', style: styles.footerText }, `${legalBits.join('  ·  ')}\n${footerNote}`),
      e(Text, { key: 'r', style: styles.footerDomain }, 'ndembokin.cd'),
    ]),
  ]);

  const page = e(Page, { size: 'A4', style: styles.page }, [
    header, metaRow, bodyRow, table, bottom, notesEl, footer,
  ]);

  return e(Document, { title: input.numero, author: agenceNom }, page);
}

export async function renderDocumentPdf(input: PdfDocInput, settings: SettingsMap): Promise<Buffer> {
  return renderToBuffer(buildDocument(input, settings));
}

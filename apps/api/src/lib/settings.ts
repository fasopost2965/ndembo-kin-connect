import { prisma } from './prisma';

/** Default agency settings — overridden by rows in the `Setting` table. */
export const DEFAULT_SETTINGS: Record<string, string> = {
  agence_nom: 'Ndembo Kin Connect',
  agence_email: 'contact@ndembokin.cd',
  agence_telephone: '+243 81 234 5678',
  agence_adresse: 'Avenue du Commerce, Kinshasa, RDC',
  agence_rccm: '',
  agence_nif: '',
  devise: 'USD',
  tva_taux: '16',
};

export type SettingsMap = Record<string, string>;

/** Merge persisted settings over the defaults into a flat key→value map. */
export async function getSettingsMap(): Promise<SettingsMap> {
  const rows = await prisma.setting.findMany();
  const out: SettingsMap = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

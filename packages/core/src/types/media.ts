import type { Visibility } from './index.js';

export interface MediaAsset {
  id: string;
  entry_id?: string | null;
  mime_type: string;
  uri: string;
  storage_key?: string | null;
  original_filename?: string | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  sha256?: string | null;
  visibility?: Visibility | null;
  reference_count?: number;
  public_reference_count?: number;
  alt_text?: string | null;
  caption?: string | null;
  ocr_text?: string | null;
  transcript?: any | null;
  duration_sec?: number | null;
  created_at?: string | null;
}

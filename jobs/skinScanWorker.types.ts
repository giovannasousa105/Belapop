export const QUEUE_NAME = "skin-scan-pipeline";

export interface SkinScanJobPayload {
  scan_id: string;
  image_buffer_base64: string;
  focos: string[];
  session_bp: string;
  user_id?: string;
}

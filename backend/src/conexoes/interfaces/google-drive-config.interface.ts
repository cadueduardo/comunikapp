export interface GoogleDriveConexaoConfig {
  refresh_token_encrypted: string;
  google_email?: string;
  google_name?: string;
  root_folder_id?: string;
  connected_at?: string;
  connected_by_user_id?: string;
}

export interface GoogleDriveUploadResult {
  fileId: string;
  webViewLink: string;
  webContentLink?: string;
  mimeType: string;
  name: string;
}

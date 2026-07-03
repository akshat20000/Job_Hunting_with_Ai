export interface EvaluationRequest {
  job_title: string;
  job_description: string;
  resume_content?: string;
}

export interface EvaluationResult {
  score: number;
  explanation: string;
  key_matches: string[];
  missing_keywords: string[];
}

export interface GenerateArtifactsRequest {
  job_title: string;
  company_name: string;
  job_description: string;
  resume_content?: string;
  output_dir?: string;
}

export interface GenerateArtifactsResponse {
  resume_pdf_path: string;
  cover_letter_pdf_path: string;
  tailored_resume_markdown: string;
  cover_letter_markdown: string;
}

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  model: string;
  files?: Array<{
    name: string;
    type: string;
    data?: string; // base64 for small files
    storagePath?: string; // Storage path for large files like PDFs
    isLargeFile?: boolean; // Flag to indicate if file is stored in Storage
    pdfContent?: string; // extracted PDF text
  }>;
}

const getApiKey = (model: string): string | null => {
  if (model.includes('gpt-5') || model.includes('gpt-4.1') || model.includes('o4')) {
    return Deno.env.get('OPENAI_API_KEY');
  }
  if (model.includes('claude')) {
    return Deno.env.get('ANTHROPIC_API_KEY');
  }
  if (model.includes('gemini')) {
    return Deno.env.get('GOOGLE_API_KEY');
  }
  if (model.includes('grok')) {
    return Deno.env.get('XAI_API_KEY');
  }
  if (model.includes('deepseek')) {
    return Deno.env.get('DEEPSEEK_API_KEY');
  }
  if (model.includes('Llama-4')) {
    return Deno.env.get('APILLM_API_KEY');
  }
  return null;
};

// Function to process PDF from Storage
const processPdfFromStorage = async (storagePath: string): Promise<string> => {
  try {
    console.log('Downloading PDF from storage:', storagePath);
    
    // Download file from Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(storagePath);
    
    if (downloadError) {
      throw new Error(`Error downloading PDF: ${downloadError.message}`);
    }
    
    // Convert blob to arrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();
    
    console.log('PDF downloaded successfully, size:', arrayBuffer.byteLength, 'bytes');
    
    // Extract text from PDF
    try {
});
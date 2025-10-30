// Edge function para processar arquivos Python
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file, fileName, fileType } = await req.json();

    if (!file || !fileName) {
      return new Response(
        JSON.stringify({ error: "Arquivo e nome do arquivo são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let processedContent = "";

    // Processar arquivos Python
    if (fileName.endsWith(".py") || fileType === "text/x-python") {
      // Remover o prefixo data:text/x-python;base64, se existir
      const base64Data = file.includes(",") ? file.split(",")[1] : file;
      const decoder = new TextDecoder("utf-8");
      const binaryData = Uint8Array.from(atob(base64Data), (c) =>
        c.charCodeAt(0)
      );
      processedContent = decoder.decode(binaryData);

      return new Response(
        JSON.stringify({
          success: true,
          content: processedContent,
          type: "python",
          fileName: fileName,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Excel será processado no frontend
    if (
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls") ||
      fileType.includes("spreadsheet") ||
      fileType.includes("excel")
    ) {
      return new Response(
        JSON.stringify({
          success: true,
          content: "Excel file - process on frontend",
          type: "excel",
          fileName: fileName,
          processOnFrontend: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Tipo de arquivo não suportado",
        supportedTypes: [".py", ".xlsx", ".xls"],
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro ao processar arquivo:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erro ao processar arquivo",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY not configured in Supabase secrets");
}
const resend = new Resend(RESEND_API_KEY!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message }: ContactEmailRequest = await req.json();

    // Validação de input
    if (!name || !email || !message) {
      console.error("❌ Missing required fields:", { hasName: !!name, hasEmail: !!email, hasMessage: !!message });
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Serviço de email não configurado" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("📧 Attempting to send contact email");
    console.log("From:", "contato@synergyia.com.br");
    console.log("To:", "contato@synergyia.com.br");
    console.log("Reply-to:", email);
    console.log("Sender name:", name);
    console.log("Message length:", message.length);

    // Send email to company using verified domain
    const emailResponse = await resend.emails.send({
      from: "Synergy AI Contato <contato@synergyia.com.br>",
      to: ["contato@synergyia.com.br"],
      replyTo: email,
      subject: `Nova mensagem de contato - ${name}`,
      html: `
        <h2>Nova mensagem de contato do site Synergy AI</h2>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Esta mensagem foi enviada através do formulário de contato do site Synergy AI Hub.</p>
      `,
    });

    console.log("✅ Email sent successfully!");
    console.log("Email ID:", emailResponse.data?.id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-contact-email function");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Log detalhado do erro para debug
    if (error.response) {
      console.error("API Response Error:", JSON.stringify(error.response, null, 2));
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao enviar email",
        details: error.name 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

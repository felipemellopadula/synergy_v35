import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FREEPIK_API_KEY = Deno.env.get("FREEPIK_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FREEPIK_API_KEY) {
      console.error("FREEPIK_API_KEY not configured");
      throw new Error("FREEPIK_API_KEY not configured");
    }

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify user with Supabase
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      throw new Error("Unauthorized");
    }

    console.log("User authenticated:", user.id);

    const body = await req.json();
    const { 
      image, 
      scale_factor = 2, 
      flavor = "photo",
      ultra_detail = 30,
      sharpen = 7,
      smart_grain = 7
    } = body;

    if (!image) {
      throw new Error("Image is required");
    }

    console.log("Calling Freepik API with params:", { scale_factor, flavor, ultra_detail, sharpen, smart_grain });

    // Call Freepik Upscaler API
    const freepikResponse = await fetch("https://api.freepik.com/v1/ai/image-upscaler-precision-v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": FREEPIK_API_KEY,
      },
      body: JSON.stringify({
        image,
        scale_factor,
        flavor,
        ultra_detail,
        sharpen,
        smart_grain,
      }),
    });

    if (!freepikResponse.ok) {
      const errorText = await freepikResponse.text();
      console.error("Freepik API error:", freepikResponse.status, errorText);
      throw new Error(`Freepik API error: ${freepikResponse.status} - ${errorText}`);
    }

    const freepikData = await freepikResponse.json();
    console.log("Freepik task created:", freepikData);

    const taskId = freepikData.data?.task_id;
    if (!taskId) {
      throw new Error("No task_id returned from Freepik");
    }

    // Poll for result (Freepik is async)
    let result = null;
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(`https://api.freepik.com/v1/ai/image-upscaler-precision-v2/${taskId}`, {
        method: "GET",
        headers: {
          "x-freepik-api-key": FREEPIK_API_KEY,
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("Status check error:", statusResponse.status, errorText);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      console.log("Task status:", statusData.data?.status, "attempt:", attempts);
      console.log("Full status response:", JSON.stringify(statusData, null, 2));

      if (statusData.data?.status === "COMPLETED") {
        result = statusData.data;
        break;
      } else if (statusData.data?.status === "FAILED") {
        throw new Error("Upscale task failed");
      }

      attempts++;
    }

    if (!result) {
      throw new Error("Upscale timed out after 2 minutes");
    }

    console.log("Full result object:", JSON.stringify(result, null, 2));

    // Get the upscaled image URL - try different possible paths
    let upscaledImageUrl = result.generated?.[0]?.url 
      || result.generated?.[0]?.image 
      || result.image 
      || result.output 
      || result.url
      || result.result?.url
      || result.result?.image;
    
    if (!upscaledImageUrl) {
      console.error("Could not find image URL in result:", JSON.stringify(result, null, 2));
      throw new Error("No upscaled image URL in result");
    }

    console.log("Upscale completed:", upscaledImageUrl);

    // Download and save to Supabase storage
    const imageResponse = await fetch(upscaledImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const fileName = `upscaled-${Date.now()}.png`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("images")
      .upload(filePath, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Return the Freepik URL if upload fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl: upscaledImageUrl,
          stored: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("images")
      .getPublicUrl(filePath);

    // Log token usage
    await supabaseAdmin.from("token_usage").insert({
      user_id: user.id,
      model_name: "freepik-upscaler-v2",
      message_content: `Upscale ${scale_factor}x`,
      ai_response_content: "Image upscaled successfully",
      tokens_used: scale_factor * 5, // Approximate cost based on scale
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrlData.publicUrl,
        stored: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

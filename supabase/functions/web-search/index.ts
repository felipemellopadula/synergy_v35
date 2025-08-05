import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, numResults = 5 } = await req.json()
    
    if (!query) {
      throw new Error('Search query is required')
    }

    console.log('Searching for:', query)

    // Use DuckDuckGo Instant Answer API (free and no API key required)
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    
    const response = await fetch(searchUrl)
    
    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Format results
    const results = []
    
    // Add abstract if available
    if (data.Abstract) {
      results.push({
        title: data.Heading || 'Information',
        content: data.Abstract,
        url: data.AbstractURL || '#'
      })
    }

    // Add related topics
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      for (let i = 0; i < Math.min(data.RelatedTopics.length, numResults - results.length); i++) {
        const topic = data.RelatedTopics[i]
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || 'Related Topic',
            content: topic.Text,
            url: topic.FirstURL
          })
        }
      }
    }

    // Add definition if available
    if (data.Definition) {
      results.push({
        title: 'Definition',
        content: data.Definition,
        url: data.DefinitionURL || '#'
      })
    }

    // If no results, add a fallback search suggestion
    if (results.length === 0) {
      results.push({
        title: 'Busca realizada',
        content: `Não foram encontrados resultados específicos para "${query}". Tente reformular sua consulta.`,
        url: '#'
      })
    }

    console.log(`Found ${results.length} results`)

    return new Response(
      JSON.stringify({ results: results.slice(0, numResults) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Web search error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
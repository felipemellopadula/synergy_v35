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

    // Use a scraping approach to get search results
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`)
    }

    const html = await response.text()
    
    // Simple regex to extract search results
    const results = []
    const titleRegex = /<a.*?class="result__a".*?href="([^"]*)".*?>(.*?)<\/a>/g
    const snippetRegex = /<a.*?class="result__snippet".*?>(.*?)<\/a>/g
    
    let titleMatch
    let snippetMatch
    let count = 0
    
    const titles = []
    const snippets = []
    
    // Extract titles and URLs
    while ((titleMatch = titleRegex.exec(html)) !== null && count < numResults) {
      const url = titleMatch[1]
      const title = titleMatch[2].replace(/<[^>]*>/g, '').trim()
      if (title && url) {
        titles.push({ title, url })
        count++
      }
    }
    
    // Extract snippets
    count = 0
    while ((snippetMatch = snippetRegex.exec(html)) !== null && count < numResults) {
      const snippet = snippetMatch[1].replace(/<[^>]*>/g, '').trim()
      if (snippet) {
        snippets.push(snippet)
        count++
      }
    }
    
    // Combine titles with snippets
    for (let i = 0; i < Math.min(titles.length, snippets.length, numResults); i++) {
      results.push({
        title: titles[i].title,
        content: snippets[i] || 'Sem descrição disponível',
        url: titles[i].url
      })
    }
    
    // If no results found, provide a helpful message
    if (results.length === 0) {
      results.push({
        title: 'Busca realizada',
        content: `Não foram encontrados resultados para "${query}". A busca pode estar temporariamente indisponível.`,
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
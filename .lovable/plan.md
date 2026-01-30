
# Plano: Atualizar Texto de Disclaimer e Termos Legais

## Alterações

### 1. Arquivo `src/pages/Home3.tsx` (linha 903-904)

**De:**
```tsx
<p className="text-xs text-muted-foreground">
  *Exceto para Veo3 e Kling
</p>
```

**Para:**
```tsx
<p className="text-xs text-muted-foreground">
  *Exceto modelos premium que custam mais
</p>
```

---

### 2. Arquivo `src/pages/TermsOfService.tsx` (linhas 234-247)

Atualizar a lista de modelos com consumo diferenciado para incluir todos os modelos premium:

**De:**
```tsx
<ul className="list-disc pl-5 space-y-1">
  <li>
    <strong>Google Veo 3.1:</strong> Consumo diferenciado por vídeo
  </li>
  <li>
    <strong>Kling Video 2.6:</strong> Consumo diferenciado por vídeo
  </li>
  <li>
    <strong>Upscale 4K:</strong> Consumo variável conforme resolução
  </li>
</ul>
```

**Para:**
```tsx
<ul className="list-disc pl-5 space-y-1">
  <li>
    <strong>Sora 2 Pro:</strong> 4 créditos por vídeo
  </li>
  <li>
    <strong>Google Veo 3.1:</strong> 3 créditos por vídeo
  </li>
  <li>
    <strong>LTX-2 Pro:</strong> 2 créditos por vídeo
  </li>
  <li>
    <strong>Sora 2:</strong> 1.5 créditos por vídeo
  </li>
  <li>
    <strong>Kling Video 2.6 Pro:</strong> 1.5 créditos por vídeo
  </li>
  <li>
    <strong>LTX-2 Fast:</strong> 1.5 créditos por vídeo
  </li>
  <li>
    <strong>Upscale 4K:</strong> Consumo variável conforme resolução
  </li>
</ul>
```

---

## Resumo das Mudanças

| Arquivo | Local | Alteração |
|---------|-------|-----------|
| `Home3.tsx` | Linha 904 | Trocar "*Exceto para Veo3 e Kling" por "*Exceto modelos premium que custam mais" |
| `TermsOfService.tsx` | Linhas 234-247 | Adicionar Sora 2 Pro (4 créditos), LTX-2 Pro (2 créditos), Sora 2 (1.5 créditos), LTX-2 Fast (1.5 créditos) à lista |

---

## Lista Completa de Modelos Premium (por custo)

| Modelo | Créditos |
|--------|----------|
| Sora 2 Pro | 4.0 |
| Veo 3.1 | 3.0 |
| LTX-2 Pro | 2.0 |
| Sora 2 | 1.5 |
| Kling 2.6 Pro | 1.5 |
| LTX-2 Fast | 1.5 |
| Seedance | 1.0 (padrão) |
| MiniMax | 0.5 |

Modelos que custam 1.0 ou menos não precisam estar nos termos pois representam o custo padrão ou menor.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// DeepSeek model pricing data (per million tokens)
const DEEPSEEK_MODELS = [
  {
    name: "deepseek-chat",
    description: "DeepSeek-V3.1 (Non-thinking Mode)",
    inputPrice: 0.56,
    outputPrice: 1.68,
    context: "128K tokens",
    cacheHitPrice: 0.07
  },
  {
    name: "deepseek-reasoner", 
    description: "DeepSeek-V3.1 (Thinking Mode)",
    inputPrice: 0.56,
    outputPrice: 1.68,
    context: "128K tokens",
    cacheHitPrice: 0.07
  }
];

export const DeepSeekPricingTable = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-blue-400">Preços dos Modelos DeepSeek</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>Contexto</TableHead>
                <TableHead className="text-right">Entrada (USD/1M tokens)</TableHead>
                <TableHead className="text-right">Saída (USD/1M tokens)</TableHead>
                <TableHead className="text-right">Cache Hit (USD/1M tokens)</TableHead>
                <TableHead className="text-right">Custo por Token (Entrada)</TableHead>
                <TableHead className="text-right">Custo por Token (Saída)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEEPSEEK_MODELS.map((model) => (
                <TableRow key={model.name}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-muted-foreground">{model.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{model.context}</TableCell>
                  <TableCell className="text-right font-mono text-blue-400">
                    ${model.inputPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-blue-400">
                    ${model.outputPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-400">
                    ${model.cacheHitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-blue-400">
                    ${(model.inputPrice / 1_000_000).toFixed(10)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-blue-400">
                    ${(model.outputPrice / 1_000_000).toFixed(10)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          * Preços baseados na documentação oficial do DeepSeek (Janeiro 2025)
          <br />
          * Cache Hit: Preço reduzido quando o input já está em cache
        </div>
      </CardContent>
    </Card>
  );
};
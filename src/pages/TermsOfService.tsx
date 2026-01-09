import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Termos de Uso</h1>
              <p className="text-xs text-muted-foreground">
                Última atualização: 09 de Janeiro de 2026
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Intro */}
        <div className="mb-8 p-6 bg-muted/30 rounded-xl border border-border">
          <p className="text-muted-foreground leading-relaxed">
            Bem-vindo ao <strong>Synergy AI</strong>. Estes Termos de Uso
            regulam o acesso e uso da plataforma disponível em{" "}
            <strong>synergyia.com.br</strong>. Ao utilizar nossos serviços,
            você concorda com todos os termos aqui descritos. Leia-os com
            atenção.
          </p>
        </div>

        {/* Accordion Sections */}
        <Accordion type="multiple" className="space-y-4">
          {/* 1. Identificação do Serviço */}
          <AccordionItem value="item-1" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              1. Identificação do Serviço
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                O <strong>Synergy AI</strong> é uma plataforma de geração de
                conteúdo digital utilizando inteligência artificial, oferecendo
                ferramentas para criação de imagens, vídeos, edição e
                aprimoramento de mídia.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Nome:</strong> Synergy AI Hub
                </li>
                <li>
                  <strong>Domínio:</strong> synergyia.com.br
                </li>
                <li>
                  <strong>Contato:</strong> contato@synergyia.com.br
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* 2. Aceitação dos Termos */}
          <AccordionItem value="item-2" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              2. Aceitação dos Termos
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                Ao acessar, navegar ou utilizar qualquer funcionalidade do
                Synergy AI, você declara que:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Leu e compreendeu integralmente estes Termos de Uso;</li>
                <li>
                  Concorda em cumprir todas as condições aqui estabelecidas;
                </li>
                <li>
                  Possui capacidade civil plena para aceitar estes termos ou, se
                  menor de 18 anos, possui autorização de seu responsável legal.
                </li>
              </ul>
              <p>
                Caso não concorde com qualquer disposição, não utilize nossos
                serviços.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* 3. Descrição dos Serviços */}
          <AccordionItem value="item-3" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              3. Descrição dos Serviços
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>O Synergy AI oferece as seguintes funcionalidades:</p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Geração de Imagens
                  </h4>
                  <p>
                    Criação de imagens a partir de descrições textuais (prompts)
                    utilizando modelos de IA como Nano Banana 2 Pro, FLUX.1
                    Kontext, FLUX.2 Pro, Seedream 4.0/4.5, Ideogram 3.0,
                    Qwen-Image e GPT Image 1.5.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Geração de Vídeos
                  </h4>
                  <p>
                    Criação de vídeos a partir de texto ou imagens utilizando
                    modelos como Seedance 1.5 Pro, Google Veo 3.1, Kling Video
                    2.6 Pro, Sora 2 e MiniMax Hailuo 2.3.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Edição de Imagens
                  </h4>
                  <p>
                    Ferramentas de Inpaint, Outpaint e edição assistida por IA
                    para modificar e aprimorar imagens existentes.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Upscale de Imagens
                  </h4>
                  <p>
                    Ampliação de resolução de imagens até 4K mantendo qualidade
                    e detalhes.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Skin Enhancer
                  </h4>
                  <p>
                    Ferramenta especializada para melhoramento de pele em
                    fotografias de retratos.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">AI Avatar</h4>
                  <p>
                    Criação de avatares personalizados com base em imagens de
                    referência do usuário.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 4. Sistema de Créditos */}
          <AccordionItem value="item-4" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              4. Sistema de Créditos
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                O Synergy AI opera com um sistema de créditos pré-pagos para
                utilização dos serviços:
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Pacotes Disponíveis
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Start:</strong> Pacotes de 10, 20 ou 30 créditos
                    </li>
                    <li>
                      <strong>Pro:</strong> Pacotes de 40, 50 ou 100 créditos
                    </li>
                    <li>
                      <strong>Creator:</strong> Pacotes de 250, 500 ou 1000+
                      créditos
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Validade dos Créditos
                  </h4>
                  <p>
                    Os créditos adquiridos possuem validade de{" "}
                    <strong>30 (trinta) dias</strong> a partir da data de
                    compra. Créditos não utilizados dentro deste período serão
                    automaticamente expirados, sem direito a reembolso ou
                    extensão.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Consumo Diferenciado
                  </h4>
                  <p>
                    Alguns modelos de alta demanda computacional podem consumir
                    mais de 1 crédito por operação. Especificamente:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Google Veo 3.1:</strong> Consumo diferenciado por
                      vídeo
                    </li>
                    <li>
                      <strong>Kling Video 2.6:</strong> Consumo diferenciado por
                      vídeo
                    </li>
                    <li>
                      <strong>Upscale 4K:</strong> Consumo variável conforme
                      resolução
                    </li>
                  </ul>
                  <p className="mt-2">
                    O custo em créditos é sempre exibido antes da confirmação de
                    cada operação.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Política de Não Reembolso
                  </h4>
                  <p>
                    Os créditos adquiridos <strong>não são reembolsáveis</strong>{" "}
                    após a compra, exceto nos casos previstos pelo Código de
                    Defesa do Consumidor. Recomendamos avaliar cuidadosamente
                    sua necessidade antes da aquisição.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 5. Conta de Usuário */}
          <AccordionItem value="item-5" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              5. Conta de Usuário
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>Para utilizar os serviços do Synergy AI, você deve:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Criar uma conta utilizando e-mail e senha ou autenticação via
                  Google OAuth;
                </li>
                <li>
                  Fornecer informações verdadeiras, atualizadas e completas;
                </li>
                <li>
                  Manter a confidencialidade de suas credenciais de acesso;
                </li>
                <li>
                  Responsabilizar-se por todas as atividades realizadas em sua
                  conta.
                </li>
              </ul>
              <p>
                Você deve notificar imediatamente o Synergy AI sobre qualquer
                uso não autorizado de sua conta ou qualquer outra violação de
                segurança.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* 6. Uso Permitido */}
          <AccordionItem value="item-6" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              6. Uso Permitido e Proibições
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Uso Permitido
                </h4>
                <p>
                  O conteúdo gerado através do Synergy AI pode ser utilizado
                  para fins pessoais e comerciais, respeitando as leis
                  aplicáveis e os direitos de terceiros.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Condutas Proibidas
                </h4>
                <p>
                  É expressamente proibido utilizar o Synergy AI para gerar:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Conteúdo ilegal, incluindo material que viole direitos
                    autorais;
                  </li>
                  <li>
                    Conteúdo difamatório, calunioso ou que prejudique a honra de
                    terceiros;
                  </li>
                  <li>
                    Conteúdo pornográfico, especialmente envolvendo menores;
                  </li>
                  <li>Conteúdo que incite violência, ódio ou discriminação;</li>
                  <li>
                    Deepfakes ou conteúdo que simule pessoas reais sem
                    consentimento;
                  </li>
                  <li>
                    Material fraudulento ou destinado a enganar terceiros;
                  </li>
                  <li>Qualquer conteúdo que viole leis brasileiras ou internacionais.</li>
                </ul>
              </div>

              <p>
                O Synergy AI reserva-se o direito de suspender ou encerrar
                contas que violem estas disposições, sem aviso prévio ou
                reembolso.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* 7. Propriedade Intelectual */}
          <AccordionItem value="item-7" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              7. Propriedade Intelectual
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Conteúdo Gerado pelo Usuário
                </h4>
                <p>
                  As imagens e vídeos gerados através do Synergy AI pertencem ao
                  usuário que os criou, sujeito aos termos de licença dos
                  modelos de IA utilizados.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Licença para o Synergy AI
                </h4>
                <p>
                  Ao utilizar nossos serviços, você concede ao Synergy AI uma
                  licença não exclusiva, mundial e livre de royalties para usar,
                  armazenar e processar seu conteúdo com o propósito de fornecer
                  e melhorar nossos serviços.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Tecnologias de Terceiros
                </h4>
                <p>
                  Os modelos de IA utilizados (Runware, OpenAI, Google,
                  ByteDance, Kling AI, MiniMax, Freepik, Ideogram) possuem suas
                  próprias licenças e termos de uso. O usuário deve estar ciente
                  de que o conteúdo gerado pode estar sujeito a restrições
                  adicionais conforme os termos de cada provedor.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 8. Limitação de Responsabilidade */}
          <AccordionItem value="item-8" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              8. Limitação de Responsabilidade
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                O Synergy AI é fornecido "como está" (as is), sem garantias de
                qualquer tipo, expressas ou implícitas.
              </p>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Não Garantimos
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Disponibilidade ininterrupta do serviço (24/7);
                  </li>
                  <li>
                    Que os resultados gerados atenderão expectativas específicas;
                  </li>
                  <li>
                    Ausência de erros, bugs ou falhas técnicas;
                  </li>
                  <li>
                    Estabilidade das APIs de terceiros utilizadas.
                  </li>
                </ul>
              </div>

              <p>
                Em nenhuma circunstância o Synergy AI será responsável por danos
                indiretos, incidentais, especiais ou consequenciais decorrentes
                do uso ou impossibilidade de uso dos serviços.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* 9. Pagamentos e Cancelamentos */}
          <AccordionItem value="item-9" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              9. Pagamentos e Cancelamentos
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Processamento de Pagamentos
                </h4>
                <p>
                  Todos os pagamentos são processados pela{" "}
                  <strong>Stripe, Inc.</strong>, uma plataforma de pagamentos
                  segura e certificada PCI-DSS. O Synergy AI não armazena dados
                  de cartão de crédito.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Política de Reembolso
                </h4>
                <p>
                  Reembolsos podem ser solicitados em até 7 (sete) dias após a
                  compra, desde que nenhum crédito tenha sido utilizado. Após o
                  uso de qualquer crédito, não será possível solicitar
                  reembolso.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Direito de Arrependimento
                </h4>
                <p>
                  Conforme o Art. 49 do Código de Defesa do Consumidor, você
                  pode exercer o direito de arrependimento em até 7 dias da
                  compra para contratações realizadas fora do estabelecimento
                  comercial.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 10. Modificações dos Termos */}
          <AccordionItem value="item-10" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              10. Modificações dos Termos
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                O Synergy AI reserva-se o direito de modificar estes Termos de
                Uso a qualquer momento. As alterações entrarão em vigor
                imediatamente após sua publicação nesta página.
              </p>
              <p>
                Para alterações significativas, enviaremos uma notificação para
                o e-mail cadastrado em sua conta. O uso continuado do serviço
                após as alterações constitui aceitação dos novos termos.
              </p>
              <p>
                Recomendamos revisar periodicamente esta página para estar
                ciente de quaisquer atualizações.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* 11. Legislação Aplicável e Foro */}
          <AccordionItem value="item-11" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                11. Legislação Aplicável e Foro
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                Estes Termos de Uso são regidos pelas leis da República
                Federativa do Brasil.
              </p>
              <p>
                Para dirimir quaisquer controvérsias oriundas destes Termos ou
                da utilização dos serviços do Synergy AI, as partes elegem o{" "}
                <strong>
                  Foro da Comarca de São Paulo, Estado de São Paulo
                </strong>
                , com exclusão de qualquer outro, por mais privilegiado que seja.
              </p>
              <p>
                Esta cláusula não impede que consumidores residentes em outras
                localidades exerçam seus direitos no foro de seu domicílio,
                conforme previsto no Código de Defesa do Consumidor.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* 12. Contato */}
          <AccordionItem value="item-12" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              12. Contato
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                Para dúvidas, sugestões ou reclamações relacionadas a estes
                Termos de Uso, entre em contato:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>E-mail:</strong> contato@synergyia.com.br
                </li>
                <li>
                  <strong>Site:</strong> synergyia.com.br
                </li>
              </ul>
              <p className="mt-4">
                Responderemos sua solicitação em até 5 (cinco) dias úteis.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer Link */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Consulte também nossa{" "}
            <Link
              to="/privacidade"
              className="text-primary hover:underline font-medium"
            >
              Política de Privacidade
            </Link>
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Voltar para o Início
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Database, Globe, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PrivacyPolicy: React.FC = () => {
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
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Política de Privacidade</h1>
              <p className="text-xs text-muted-foreground">
                Última atualização: 09 de Janeiro de 2026
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* LGPD Badge */}
        <div className="mb-8 p-6 bg-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg mb-2">Conformidade com a LGPD</h2>
              <p className="text-muted-foreground leading-relaxed">
                Esta Política de Privacidade está em conformidade com a{" "}
                <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>.
                Aqui você encontra informações claras sobre como coletamos,
                usamos, armazenamos e protegemos seus dados pessoais, bem como
                seus direitos como titular.
              </p>
            </div>
          </div>
        </div>

        {/* Intro */}
        <div className="mb-8 p-6 bg-muted/30 rounded-xl border border-border">
          <p className="text-muted-foreground leading-relaxed">
            O <strong>Synergy AI</strong> valoriza a privacidade e a proteção
            dos dados de seus usuários. Esta Política descreve nossas práticas
            de tratamento de dados pessoais quando você utiliza nossos serviços
            em <strong>synergyia.com.br</strong>.
          </p>
        </div>

        {/* Accordion Sections */}
        <Accordion type="multiple" className="space-y-4">
          {/* 1. Controlador dos Dados */}
          <AccordionItem value="item-1" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                1. Controlador dos Dados
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                O controlador responsável pelo tratamento dos seus dados
                pessoais é:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Nome:</strong> Synergy AI Hub
                </li>
                <li>
                  <strong>E-mail:</strong> contato@synergyia.com.br
                </li>
                <li>
                  <strong>Site:</strong> synergyia.com.br
                </li>
              </ul>
              <p>
                Para questões relacionadas à privacidade e proteção de dados,
                você pode entrar em contato através do e-mail acima.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* 2. Dados Pessoais Coletados */}
          <AccordionItem value="item-2" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                2. Dados Pessoais Coletados
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Dados de Identificação
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Nome completo</li>
                  <li>Endereço de e-mail</li>
                  <li>Número de telefone (opcional)</li>
                  <li>Foto de perfil/avatar</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Dados de Autenticação
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Senha (armazenada com hash criptográfico)</li>
                  <li>Tokens de sessão</li>
                  <li>Dados de autenticação Google OAuth (quando utilizado)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Dados de Pagamento
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Processados exclusivamente pela <strong>Stripe, Inc.</strong>
                  </li>
                  <li>
                    Não armazenamos dados de cartão de crédito em nossos
                    servidores
                  </li>
                  <li>
                    Mantemos apenas identificadores de transação para referência
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Dados de Uso do Serviço
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Prompts (descrições textuais) enviados para geração</li>
                  <li>Imagens e vídeos gerados</li>
                  <li>Histórico de uso de créditos</li>
                  <li>Histórico de conversas com assistentes de IA</li>
                  <li>Modelos de IA utilizados</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Dados Técnicos
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Endereço IP</li>
                  <li>Tipo e versão do navegador</li>
                  <li>Sistema operacional e dispositivo</li>
                  <li>Dados de cookies e armazenamento local</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 3. Finalidade do Tratamento */}
          <AccordionItem value="item-3" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              3. Finalidade do Tratamento
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                Utilizamos seus dados pessoais para as seguintes finalidades,
                conforme Art. 7º da LGPD:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Execução do Contrato:</strong> Prestação dos serviços
                  de geração de imagens e vídeos, edição e demais
                  funcionalidades contratadas.
                </li>
                <li>
                  <strong>Processamento de Pagamentos:</strong> Gestão de
                  transações financeiras e histórico de compras de créditos.
                </li>
                <li>
                  <strong>Comunicações Transacionais:</strong> Envio de
                  confirmações de compra, notificações de segurança e
                  atualizações importantes sobre sua conta.
                </li>
                <li>
                  <strong>Melhoria do Serviço:</strong> Análise de uso para
                  aprimoramento de funcionalidades e experiência do usuário.
                </li>
                <li>
                  <strong>Segurança:</strong> Prevenção de fraudes, proteção
                  contra acessos não autorizados e garantia da integridade dos
                  sistemas.
                </li>
                <li>
                  <strong>Cumprimento Legal:</strong> Atendimento a obrigações
                  legais e regulatórias aplicáveis.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* 4. Base Legal */}
          <AccordionItem value="item-4" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              4. Base Legal para Tratamento
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                O tratamento dos seus dados pessoais fundamenta-se nas seguintes
                bases legais previstas no Art. 7º da LGPD:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Execução de Contrato (Art. 7º, V):</strong> Para
                  fornecimento dos serviços contratados.
                </li>
                <li>
                  <strong>Consentimento (Art. 7º, I):</strong> Para envio de
                  comunicações de marketing e newsletter (quando aplicável).
                </li>
                <li>
                  <strong>Interesse Legítimo (Art. 7º, IX):</strong> Para
                  melhoria dos serviços e prevenção de fraudes.
                </li>
                <li>
                  <strong>Cumprimento de Obrigação Legal (Art. 7º, II):</strong>{" "}
                  Para atender determinações de autoridades competentes.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* 5. Compartilhamento de Dados */}
          <AccordionItem value="item-5" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                5. Compartilhamento de Dados
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                Seus dados pessoais podem ser compartilhados com os seguintes
                terceiros, exclusivamente para as finalidades descritas:
              </p>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Processadores de Pagamento
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Stripe, Inc.:</strong> Processamento seguro de
                    pagamentos com cartão de crédito
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Infraestrutura e Hospedagem
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Supabase:</strong> Banco de dados, autenticação e
                    armazenamento de arquivos (servidores nos EUA)
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Autenticação
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Google:</strong> Autenticação via OAuth (quando
                    escolhido pelo usuário)
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Comunicações
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Resend:</strong> Envio de e-mails transacionais e de
                    boas-vindas
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  APIs de Inteligência Artificial
                </h4>
                <p className="mb-2">
                  Os prompts e imagens enviados são processados por:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Runware (modelos de imagem)</li>
                  <li>OpenAI (Sora, GPT Image)</li>
                  <li>Google (Veo, Nano Banana)</li>
                  <li>ByteDance (Seedance)</li>
                  <li>Kling AI (Kling Video)</li>
                  <li>MiniMax (Hailuo)</li>
                  <li>Freepik (Upscale)</li>
                  <li>Ideogram (Ideogram 3.0)</li>
                </ul>
                <p className="mt-2 text-sm">
                  Cada provedor possui sua própria política de privacidade e
                  termos de uso.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 6. Transferência Internacional */}
          <AccordionItem value="item-6" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              6. Transferência Internacional de Dados
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                Seus dados pessoais podem ser transferidos e processados em
                servidores localizados fora do Brasil, principalmente nos
                Estados Unidos, onde estão hospedados os serviços da Supabase,
                Stripe e provedores de IA.
              </p>
              <p>
                Essas transferências são realizadas de acordo com o Art. 33 da
                LGPD, garantindo:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Cláusulas contratuais padrão de proteção de dados;</li>
                <li>
                  Destinatários que adotam níveis adequados de proteção de
                  dados;
                </li>
                <li>Medidas técnicas e organizacionais apropriadas.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* 7. Retenção de Dados */}
          <AccordionItem value="item-7" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              7. Retenção de Dados
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                Mantemos seus dados pessoais pelo tempo necessário para cumprir
                as finalidades descritas nesta Política:
              </p>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Limites de Armazenamento
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Imagens geradas:</strong> Até 8 imagens mais
                    recentes por usuário
                  </li>
                  <li>
                    <strong>Avatares:</strong> Até 20 avatares por usuário
                  </li>
                  <li>
                    <strong>Vídeos:</strong> Conforme limite definido por
                    usuário
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Conta Ativa
                </h4>
                <p>
                  Enquanto sua conta estiver ativa, manteremos seus dados de
                  perfil, histórico de uso e conteúdo gerado.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Após Exclusão da Conta
                </h4>
                <p>
                  Após solicitar a exclusão da conta, seus dados serão removidos
                  em até 30 (trinta) dias, exceto aqueles necessários para
                  cumprimento de obrigações legais ou exercício de direitos em
                  processos judiciais.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 8. Direitos do Titular */}
          <AccordionItem value="item-8" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                8. Seus Direitos (Art. 18 da LGPD)
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                Como titular de dados pessoais, você possui os seguintes
                direitos garantidos pela LGPD:
              </p>

              <div className="grid gap-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <strong className="text-foreground">
                    ✓ Confirmação e Acesso
                  </strong>
                  <p className="text-sm mt-1">
                    Confirmar a existência de tratamento e acessar seus dados.
                  </p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <strong className="text-foreground">✓ Correção</strong>
                  <p className="text-sm mt-1">
                    Solicitar a correção de dados incompletos, inexatos ou
                    desatualizados.
                  </p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <strong className="text-foreground">
                    ✓ Anonimização, Bloqueio ou Eliminação
                  </strong>
                  <p className="text-sm mt-1">
                    Solicitar tratamento de dados desnecessários, excessivos ou
                    tratados em desconformidade.
                  </p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <strong className="text-foreground">✓ Portabilidade</strong>
                  <p className="text-sm mt-1">
                    Solicitar a portabilidade dos dados a outro fornecedor de
                    serviço.
                  </p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <strong className="text-foreground">✓ Eliminação</strong>
                  <p className="text-sm mt-1">
                    Solicitar a eliminação dos dados tratados com base no
                    consentimento.
                  </p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <strong className="text-foreground">
                    ✓ Informação sobre Compartilhamento
                  </strong>
                  <p className="text-sm mt-1">
                    Saber com quais entidades públicas e privadas seus dados são
                    compartilhados.
                  </p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <strong className="text-foreground">
                    ✓ Revogação do Consentimento
                  </strong>
                  <p className="text-sm mt-1">
                    Revogar o consentimento a qualquer momento, de forma fácil e
                    gratuita.
                  </p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <strong className="text-foreground">
                    ✓ Oposição ao Tratamento
                  </strong>
                  <p className="text-sm mt-1">
                    Opor-se a tratamento realizado com base em interesse
                    legítimo.
                  </p>
                </div>
              </div>

              <p className="mt-4">
                Para exercer qualquer desses direitos, entre em contato pelo
                e-mail{" "}
                <strong className="text-foreground">
                  contato@synergyia.com.br
                </strong>
                . Responderemos sua solicitação em até 15 (quinze) dias úteis.
              </p>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 mt-4">
                <p className="text-sm">
                  <strong>Reclamação à ANPD:</strong> Caso considere que o
                  tratamento de seus dados viola a LGPD, você tem o direito de
                  apresentar reclamação à{" "}
                  <strong>
                    Autoridade Nacional de Proteção de Dados (ANPD)
                  </strong>
                  .
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 9. Segurança dos Dados */}
          <AccordionItem value="item-9" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                9. Segurança dos Dados
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                Implementamos medidas técnicas e organizacionais adequadas para
                proteger seus dados pessoais:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Criptografia em trânsito:</strong> Todas as
                  comunicações utilizam HTTPS/TLS.
                </li>
                <li>
                  <strong>Senhas protegidas:</strong> Armazenadas com hash
                  criptográfico (bcrypt).
                </li>
                <li>
                  <strong>Row Level Security (RLS):</strong> Controle de acesso
                  granular no banco de dados.
                </li>
                <li>
                  <strong>Autenticação JWT:</strong> Tokens seguros para
                  gerenciamento de sessões.
                </li>
                <li>
                  <strong>Infraestrutura segura:</strong> Hospedagem em
                  provedores com certificações de segurança.
                </li>
              </ul>
              <p>
                Apesar de nossos esforços, nenhum sistema é 100% seguro.
                Recomendamos que você também adote boas práticas de segurança,
                como utilizar senhas fortes e não compartilhar suas credenciais.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* 10. Cookies */}
          <AccordionItem value="item-10" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              10. Cookies e Tecnologias Similares
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>Utilizamos cookies e tecnologias similares para:</p>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Cookies Essenciais
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Autenticação:</strong> Manter sua sessão ativa
                    (Supabase Auth)
                  </li>
                  <li>
                    <strong>Segurança:</strong> Proteção contra ataques CSRF
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Armazenamento Local (LocalStorage)
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Preferências de tema (claro/escuro)</li>
                  <li>Configurações de interface</li>
                  <li>Cache temporário de dados</li>
                </ul>
              </div>

              <p>
                Você pode gerenciar cookies através das configurações do seu
                navegador. Note que desabilitar cookies essenciais pode afetar o
                funcionamento do serviço.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* 11. Menores de Idade */}
          <AccordionItem value="item-11" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              11. Menores de Idade
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                O Synergy AI não é destinado a menores de 18 (dezoito) anos. Não
                coletamos intencionalmente dados pessoais de crianças e
                adolescentes.
              </p>
              <p>
                Caso um menor deseje utilizar nossos serviços, deve fazê-lo
                mediante supervisão e consentimento de seu responsável legal,
                que assumirá integral responsabilidade por tal uso.
              </p>
              <p>
                Se tomarmos conhecimento de que coletamos dados de menor sem o
                consentimento adequado, tomaremos medidas para eliminar essas
                informações.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* 12. Alterações */}
          <AccordionItem value="item-12" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              12. Alterações nesta Política
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                Esta Política de Privacidade pode ser atualizada periodicamente
                para refletir mudanças em nossas práticas ou na legislação
                aplicável.
              </p>
              <p>
                Alterações significativas serão comunicadas através do e-mail
                cadastrado em sua conta. A data da última atualização será
                sempre indicada no topo desta página.
              </p>
              <p>
                Recomendamos revisar esta Política periodicamente para estar
                ciente de como protegemos seus dados.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* 13. Contato */}
          <AccordionItem value="item-13" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              13. Contato
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                Para dúvidas, solicitações ou exercício de seus direitos
                relacionados à privacidade e proteção de dados:
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
                Responderemos sua solicitação em até 15 (quinze) dias úteis,
                conforme previsto na LGPD.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer Link */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Consulte também nossos{" "}
            <Link
              to="/termos"
              className="text-primary hover:underline font-medium"
            >
              Termos de Uso
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

export default PrivacyPolicy;

#!/usr/bin/env node
/**
 * Fix ortografia — substitui apenas dentro de strings e JSX text.
 * NÃO altera identificadores TypeScript, nomes de variáveis, imports ou URLs.
 */
import { readFileSync, writeFileSync } from "fs";
import { globSync } from "glob";

const SUBSTITUICOES: [RegExp, string][] = [
  // Verbos
  [/\bcomeca\b/g, "começa"],
  [/\bComeca\b/g, "Começa"],
  [/\bcomecar\b/g, "começar"],
  [/\bComecar\b/g, "Começar"],
  [/\bFaca\b/g, "Faça"],
  [/\bfaca /g, "faça "],

  // Pronomes
  [/\bvoce\b/g, "você"],
  [/\bVoce\b/g, "Você"],
  [/\bNao /g, "Não "],
  [/\bnao /g, "não "],

  // Skincare
  [/\bdiagnostico\b/g, "diagnóstico"],
  [/\bDiagnostico\b/g, "Diagnóstico"],
  [/\banalise\b/g, "análise"],
  [/\bAnalise\b/g, "Análise"],
  [/\bavaliacao\b/g, "avaliação"],
  [/\bAvaliacao\b/g, "Avaliação"],
  [/\bavaliacoes\b/g, "avaliações"],
  [/\bcosmetica\b/g, "cosmética"],
  [/\bcosmeticas\b/g, "cosméticas"],
  [/\bcosmetico\b/g, "cosmético"],
  [/\bdermatologica\b/g, "dermatológica"],
  [/\bhidratacao\b/g, "hidratação"],
  [/\bHidratacao\b/g, "Hidratação"],
  [/\bsensivel\b/g, "sensível"],
  [/\bSensivel\b/g, "Sensível"],
  [/\bsensiveis\b/g, "sensíveis"],

  // UI / negócio
  [/\bselecao\b/g, "seleção"],
  [/\bSelecao\b/g, "Seleção"],
  [/\bselecoes\b/g, "seleções"],
  [/\bdecisao\b/g, "decisão"],
  [/\bDecisao\b/g, "Decisão"],
  [/\bdecisoes\b/g, "decisões"],
  [/\bcondicoes\b/g, "condições"],
  [/\bCondicoes\b/g, "Condições"],
  [/\binformacao\b/g, "informação"],
  [/\bInformacao\b/g, "Informação"],
  [/\binformacoes\b/g, "informações"],
  [/\bcriterio\b/g, "critério"],
  [/\bCriterio\b/g, "Critério"],
  [/\bcriterios\b/g, "critérios"],
  [/\bprocedencia\b/g, "procedência"],
  [/\bprotecao\b/g, "proteção"],
  [/\bProtecao\b/g, "Proteção"],
  [/\brecomendacao\b/g, "recomendação"],
  [/\bRecomendacao\b/g, "Recomendação"],
  [/\brecomendacoes\b/g, "recomendações"],
  [/\bsolicitacao\b/g, "solicitação"],
  [/\bSolicitacao\b/g, "Solicitação"],
  [/\bapresentacao\b/g, "apresentação"],
  [/\bApresentacao\b/g, "Apresentação"],
  [/\bedicao\b/g, "edição"],
  [/\bEdicao\b/g, "Edição"],
  [/\bconteudo\b/g, "conteúdo"],
  [/\bConteudo\b/g, "Conteúdo"],
  [/\bdevolucoes\b/g, "devoluções"],
  [/\bDevolucoes\b/g, "Devoluções"],
  [/\bexperiencia\b/g, "experiência"],
  [/\bExperiencia\b/g, "Experiência"],
  [/\bcirculo\b/g, "círculo"],
  [/\bCirculo\b/g, "Círculo"],
  [/\binteligencia\b/g, "inteligência"],

  // Adjetivos
  [/\bresponsavel\b/g, "responsável"],
  [/\bResponsavel\b/g, "Responsável"],
  [/\bconfiavel\b/g, "confiável"],
  [/\bConfiavel\b/g, "Confiável"],
  [/\binegociavel\b/g, "inegociável"],
  [/\bnitida\b/g, "nítida"],
  [/\bNitida\b/g, "Nítida"],
  [/\bproprio\b/g, "próprio"],
  [/\bproprios\b/g, "próprios"],
  [/\bpropria\b/g, "própria"],
  [/\bproprias\b/g, "próprias"],

  // Navegação / UI
  [/\bPolitica\b/g, "Política"],
  [/\bpolitica\b/g, "política"],
  [/\bPoliticas\b/g, "Políticas"],
  [/\bpoliticas\b/g, "políticas"],
  [/\bDuvidas\b/g, "Dúvidas"],
  [/\bduvidas\b/g, "dúvidas"],
  [/\bDicionario\b/g, "Dicionário"],
  [/\bdicionario\b/g, "dicionário"],
  [/\bPortugues\b/g, "Português"],
  [/\bportugues\b/g, "português"],
  [/\bIcones\b/g, "Ícones"],
  [/\bicones\b/g, "ícones"],
  [/\bproximos\b/g, "próximos"],
  [/\bProximos\b/g, "Próximos"],
  [/\bproximas\b/g, "próximas"],
  [/\batencao\b/g, "atenção"],
  [/\bAtencao\b/g, "Atenção"],
  [/\bposicao\b/g, "posição"],
  [/\brelacao\b/g, "relação"],
  [/\bsecao\b/g, "seção"],
  [/\bexcecao\b/g, "exceção"],
  [/\bopcao\b/g, "opção"],
  [/\bOpcao\b/g, "Opção"],
  [/\bopcoes\b/g, "opções"],
  [/\bconfiguracoes\b/g, "configurações"],
  [/\bnotificacao\b/g, "notificação"],
  [/\bautorizacao\b/g, "autorização"],
  [/\bautenticacao\b/g, "autenticação"],
  [/\bverificacao\b/g, "verificação"],
  [/\bValidacao\b/g, "Validação"],
  [/\bvalidacao\b/g, "validação"],
  [/\baprovacao\b/g, "aprovação"],
  [/\bAprovacao\b/g, "Aprovação"],
  [/\bexpedicao\b/g, "expedição"],
  [/\bhistorico\b/g, "histórico"],
  [/\bHistorico\b/g, "Histórico"],
  [/\boperacao\b/g, "operação"],
  [/\bOperacao\b/g, "Operação"],
  [/\boperacoes\b/g, "operações"],
  [/\bduracao\b/g, "duração"],
  [/\bpublicacao\b/g, "publicação"],
  [/\bcomunicacao\b/g, "comunicação"],
  [/\bComunicacao\b/g, "Comunicação"],
  [/\butilizacao\b/g, "utilização"],
  [/\bnavegacao\b/g, "navegação"],
  [/\bintegracao\b/g, "integração"],
  [/\bIntegracao\b/g, "Integração"],
  [/\bcriacao\b/g, "criação"],
  [/\blimitacao\b/g, "limitação"],
  [/\bLimitacao\b/g, "Limitação"],
  [/\bcancelamento\b/g, "cancelamento"], // already correct
  [/\bcontribuicao\b/g, "contribuição"],
  [/\bparticipacao\b/g, "participação"],
  [/\bproporcao\b/g, "proporção"],
  [/\bdefinicao\b/g, "definição"],
  [/\blocalizacao\b/g, "localização"],
  [/\bseparacao\b/g, "separação"],
  [/\bcomposicao\b/g, "composição"],
  [/\bcomposicoes\b/g, "composições"],
  [/\bfuncao\b/g, "função"],
  [/\bColecao\b/g, "Coleção"],
  [/\bcolecao\b/g, "coleção"],
  [/\bcolecoes\b/g, "coleções"],

  // Médico / clínico
  [/\bclinica\b/g, "clínica"],
  [/\bclinico\b/g, "clínico"],
  [/\bclinicos\b/g, "clínicos"],
  [/\bmedica\b/g, "médica"],
  [/\bmedico\b/g, "médico"],
  [/\bfisico\b/g, "físico"],
  [/\btecnica\b/g, "técnica"],
  [/\btecnico\b/g, "técnico"],
  [/\btecnicos\b/g, "técnicos"],
  [/\bjuridica\b/g, "jurídica"],
  [/\bjuridico\b/g, "jurídico"],
  [/\bbiópsia\b/g, "biópsia"], // already correct
  [/\bbiopsia\b/g, "biópsia"],
  [/\blesoes\b/g, "lesões"],
  [/\bmudancas\b/g, "mudanças"],

  // Frases-chave
  [/Skincare guided by your skin\./g, "Skincare guiado pela sua pele."],
  [/guided by your skin/g, "guiado pela sua pele"],
];

// Padrões de linhas que NÃO devem ser tocadas
const SKIP_LINE_PATTERNS = [
  /^\s*import\s/,
  /^\s*export\s+\*\s+from/,
  /^\s*\/\//,
  /^\s*\*\s/,
  /href=["']/,
  /src=["']/,
  /action=["']/,
  /name=["'][a-z_]/i,
  /id=["'][a-z_]/i,
  /key=["'][a-z_]/i,
  /\bconst\s+\w+\s*=/,
  /\blet\s+\w+\s*=/,
  /\bvar\s+\w+\s*=/,
  /\bfunction\s+\w+/,
  /\binterface\s+\w+/,
  /\btype\s+\w+\s*=/,
  /\benum\s+\w+/,
  /\bclass\s+\w+/,
  /require\(["']/,
  /from\s+["']/,
  /supabase\.|\.select\(|\.where\(|\.eq\(/,
  /column|table|schema/i,
  /\b[a-z]+_[a-z]+\b/,  // snake_case identifiers
];

// Linhas que SÃO seguras para alterar
const SAFE_LINE_PATTERNS = [
  /"[^"]*"/,   // contém string dupla
  /'[^']*'/,   // contém string simples
  /`[^`]*`/,   // template literal
  />\s*\w/,    // JSX text content
  /\\\w/,      // escaped chars
];

function shouldProcessLine(line: string): boolean {
  // Pular imports e comentários sempre
  for (const pattern of SKIP_LINE_PATTERNS) {
    if (pattern.test(line)) return false;
  }
  // Processar se tem conteúdo de string ou JSX
  return SAFE_LINE_PATTERNS.some((p) => p.test(line));
}

// Substituições que são SEMPRE seguras (não são identificadores)
const GLOBAL_SAFE: [RegExp, string][] = [
  [/Skincare guided by your skin\./g, "Skincare guiado pela sua pele."],
];

const arquivos = globSync("**/*.{tsx,ts}", {
  ignore: [
    "node_modules/**",
    ".next/**",
    "dist/**",
    "scripts/fix-ortografia.ts",
    "**/*.test.*",
    "**/__tests__/**",
    "**/generated/**",
  ],
  cwd: process.cwd(),
});

let totalArquivos = 0;
let totalSubstituicoes = 0;

for (const arquivo of arquivos) {
  const original = readFileSync(arquivo, "utf-8");
  const linhas = original.split("\n");
  const novasLinhas: string[] = [];
  let modificado = false;

  for (const linha of linhas) {
    let novaLinha = linha;

    // Substituições globais sempre seguras
    for (const [regex, correto] of GLOBAL_SAFE) {
      const antes = novaLinha;
      novaLinha = novaLinha.replace(regex, correto);
      if (novaLinha !== antes) modificado = true;
    }

    // Substituições condicionais (só em linhas seguras)
    if (shouldProcessLine(linha)) {
      for (const [regex, correto] of SUBSTITUICOES) {
        const antes = novaLinha;
        novaLinha = novaLinha.replace(regex, correto);
        if (novaLinha !== antes) {
          modificado = true;
          totalSubstituicoes++;
        }
      }
    }

    novasLinhas.push(novaLinha);
  }

  if (modificado) {
    const novoConteudo = novasLinhas.join("\n");
    writeFileSync(arquivo, novoConteudo, "utf-8");
    console.log(`✓ ${arquivo}`);
    totalArquivos++;
  }
}

console.log(`\n✅ ${totalArquivos} arquivo(s) corrigido(s), ${totalSubstituicoes} substituição(ões).`);

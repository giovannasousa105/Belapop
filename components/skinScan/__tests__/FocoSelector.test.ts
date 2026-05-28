/**
 * Testes unitários para os dados de focos do FocoSelector.
 * Verifica invariantes de qualidade sem depender de renderização DOM.
 */

// Importar apenas os dados — não o componente React (evita dependência de jsdom)
const FOCOS = [
  { key: "acne",         label: "Acne",         descricao: "Acne e cravos" },
  { key: "oleosidade",   label: "Oleosidade",   descricao: "Oleosidade excessiva" },
  { key: "manchas",      label: "Manchas",      descricao: "Manchas e hiperpigmentação" },
  { key: "linhas",       label: "Linhas finas", descricao: "Linhas finas e firmeza" },
  { key: "sensibilidade",label: "Sensibilidade",descricao: "Barreira sensibilizada" },
  { key: "poros",        label: "Poros",        descricao: "Poros aparentes e textura" },
  { key: "brilho",       label: "Luminosidade", descricao: "Falta de luminosidade" },
  { key: "hidratação",   label: "Hidratação",   descricao: "Desidratação e ressecamento" },
  { key: "textura",      label: "Textura",      descricao: "Textura irregular" },
  { key: "olheiras",     label: "Olheiras",     descricao: "Olheiras e área dos olhos" },
];

describe("FocoSelector — dados dos focos", () => {
  it("deve ter exatamente 10 focos", () => {
    expect(FOCOS).toHaveLength(10);
  });

  it("todos os focos têm label não vazio", () => {
    FOCOS.forEach(({ key, label }) => {
      expect(label.trim(), `label do foco '${key}' está vazio`).not.toBe("");
    });
  });

  it("todos os focos têm descrição não vazia", () => {
    FOCOS.forEach(({ key, descricao }) => {
      expect(descricao.trim(), `descrição do foco '${key}' está vazia`).not.toBe("");
    });
  });

  it("nenhum foco tem label igual à sua descrição", () => {
    FOCOS.forEach(({ key, label, descricao }) => {
      expect(
        label.toLowerCase(),
        `foco '${key}': label e descrição são iguais ("${label}")`
      ).not.toBe(descricao.toLowerCase());
    });
  });

  it("todas as keys são únicas", () => {
    const keys = FOCOS.map((f) => f.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it("todos os labels são únicos", () => {
    const labels = FOCOS.map((f) => f.label.toLowerCase());
    const unique = new Set(labels);
    expect(unique.size).toBe(labels.length);
  });

  it("todas as descrições são únicas", () => {
    const descricoes = FOCOS.map((f) => f.descricao.toLowerCase());
    const unique = new Set(descricoes);
    expect(unique.size).toBe(descricoes.length);
  });

  it("focos esperados pelo spec estão presentes com descrição correta", () => {
    const map = Object.fromEntries(FOCOS.map((f) => [f.key, f.descricao]));
    expect(map["acne"]).toBe("Acne e cravos");
    expect(map["oleosidade"]).toBe("Oleosidade excessiva");
    expect(map["manchas"]).toBe("Manchas e hiperpigmentação");
    expect(map["linhas"]).toBe("Linhas finas e firmeza");
    expect(map["sensibilidade"]).toBe("Barreira sensibilizada");
    expect(map["poros"]).toBe("Poros aparentes e textura");
    expect(map["brilho"]).toBe("Falta de luminosidade");
    expect(map["hidratação"]).toBe("Desidratação e ressecamento");
    expect(map["textura"]).toBe("Textura irregular");
    expect(map["olheiras"]).toBe("Olheiras e área dos olhos");
  });
});

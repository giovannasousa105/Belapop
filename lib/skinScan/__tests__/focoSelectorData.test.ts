/**
 * Testes de invariante dos dados de focos do FocoSelector.
 * Garante que label ↔ descrição estão corretamente mapeados.
 */

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

describe("FocoSelector — invariantes dos dados", () => {
  it("deve ter exatamente 10 focos", () => {
    expect(FOCOS.length).toBe(10);
  });

  it("todos têm label não vazio", () => {
    const vazios = FOCOS.filter((f) => f.label.trim() === "");
    expect(vazios).toEqual([]);
  });

  it("todos têm descrição não vazia", () => {
    const vazios = FOCOS.filter((f) => f.descricao.trim() === "");
    expect(vazios).toEqual([]);
  });

  it("nenhum label é igual à sua descrição", () => {
    const duplicados = FOCOS.filter(
      (f) => f.label.toLowerCase() === f.descricao.toLowerCase()
    );
    expect(duplicados).toEqual([]);
  });

  it("keys são únicas", () => {
    const keys = FOCOS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("descrições são únicas", () => {
    const desc = FOCOS.map((f) => f.descricao.toLowerCase());
    expect(new Set(desc).size).toBe(desc.length);
  });

  it("mapeamento correto conforme spec", () => {
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

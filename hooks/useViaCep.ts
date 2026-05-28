"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

type ViaCepFillState = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export function useViaCepFill<T extends ViaCepFillState>(
  cep: string,
  setForm: Dispatch<SetStateAction<T>>
) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) {
      setFilled(false);
      return;
    }

    let active = true;

    const timer = setTimeout(() => {
      fetch(`https://viacep.com.br/ws/${clean}/json/`)
        .then((response) => response.json() as Promise<ViaCepResponse>)
        .then((data) => {
          if (!active) return;
          if (data.erro) {
            setFilled(false);
            return;
          }

          setForm((current) => ({
            ...current,
            street: current.street || data.logradouro || "",
            neighborhood: current.neighborhood || data.bairro || "",
            city: current.city || data.localidade || "",
            state: current.state || data.uf || ""
          }));
          setFilled(true);
        })
        .catch(() => {
          if (active) setFilled(false);
        });
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [cep, setForm]);

  return filled;
}

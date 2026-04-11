"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/lib/AuthContext";
import {
  getCustomerNotificationPreferences,
  putCustomerNotificationPreferences
} from "@/lib/customer/api";

export default function ContaPrivacidadePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [emailUpdates, setEmailUpdates] = useState(true);
  const [whatsappUpdates, setWhatsappUpdates] = useState(false);
  const [marketingOffers, setMarketingOffers] = useState(false);
  const [pushUpdates, setPushUpdates] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const prefs = await getCustomerNotificationPreferences();
        if (!active) return;
        setEmailUpdates(Boolean(prefs.order_updates.email));
        setWhatsappUpdates(Boolean(prefs.order_updates.whatsapp));
        setPushUpdates(Boolean(prefs.push));
        setMarketingOffers(Boolean(prefs.marketing.email));
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error ? error.message : "Nao foi possivel carregar preferencias."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await putCustomerNotificationPreferences({
        order_updates: {
          email: emailUpdates,
          whatsapp: whatsappUpdates
        },
        support_updates: {
          email: emailUpdates,
          whatsapp: whatsappUpdates
        },
        marketing: {
          email: marketingOffers,
          whatsapp: marketingOffers
        },
        push: pushUpdates
      });
      setMessage("Preferencias atualizadas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/60">Privacidade e preferencias</p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">Consentimentos</h1>
        <p className="mt-3 text-sm text-bpGraphite/75">
          Comunicacoes transacionais e marketing com controles separados e historico de alteracoes.
        </p>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-bpGraphite/70">Carregando preferencias...</p>
        ) : (
          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-bpBlackSoft">Transacional por e-mail</p>
                <p className="text-xs text-bpGraphite/70">Pedido, pagamento, envio e suporte.</p>
              </div>
              <input
                type="checkbox"
                checked={emailUpdates}
                onChange={(event) => setEmailUpdates(event.target.checked)}
                className="h-4 w-4 accent-[#C2185B]"
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-bpBlackSoft">Transacional por WhatsApp</p>
                <p className="text-xs text-bpGraphite/70">Atualizacoes curtas de envio e protocolo.</p>
              </div>
              <input
                type="checkbox"
                checked={whatsappUpdates}
                onChange={(event) => setWhatsappUpdates(event.target.checked)}
                className="h-4 w-4 accent-[#C2185B]"
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-bpBlackSoft">Notificacoes push</p>
                <p className="text-xs text-bpGraphite/70">Para quando o app/PWA estiver ativo.</p>
              </div>
              <input
                type="checkbox"
                checked={pushUpdates}
                onChange={(event) => setPushUpdates(event.target.checked)}
                className="h-4 w-4 accent-[#C2185B]"
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-bpBlackSoft">Promocoes e ofertas</p>
                <p className="text-xs text-bpGraphite/70">Opcional e independente dos avisos transacionais.</p>
              </div>
              <input
                type="checkbox"
                checked={marketingOffers}
                onChange={(event) => setMarketingOffers(event.target.checked)}
                className="h-4 w-4 accent-[#C2185B]"
              />
            </label>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-2 rounded-full border border-bpPink/50 bg-bpPink px-6 py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar preferencias"}
            </button>
            {message ? <p className="text-sm text-bpPink">{message}</p> : null}
          </div>
        )}
      </section>
    </div>
  );
}

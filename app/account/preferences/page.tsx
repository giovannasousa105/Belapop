"use client";

import { useEffect, useState } from "react";

import { PageHeading } from "@/components/PageHeading";
import { useAuth } from "@/lib/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";

type PreferenceRow = {
  email_opt_in: boolean;
  whatsapp_opt_in: boolean;
  push_opt_in: boolean;
};

export default function AccountPreferencesPage() {
  const { ready, user } = useAuth();
  const [prefs, setPrefs] = useState<PreferenceRow>({
    email_opt_in: true,
    whatsapp_opt_in: false,
    push_opt_in: false
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    const supabase = getSupabaseClient();
    const load = async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("email_opt_in,whatsapp_opt_in,push_opt_in")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      if (data) {
        setPrefs({
          email_opt_in: data.email_opt_in ?? true,
          whatsapp_opt_in: data.whatsapp_opt_in ?? false,
          push_opt_in: data.push_opt_in ?? false
        });
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [ready, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        ...prefs
      });
    setSaving(false);
    setMessage(error ? error.message : "Preferências salvas.");
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Preferências"
        subtitle="Escolha como prefere receber novidades."
      />
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {[
            {
              label: "E-mail editorial",
              key: "email_opt_in",
              description: "Seleções, lançamentos e curadorias semanais."
            },
            {
              label: "WhatsApp concierge",
              key: "whatsapp_opt_in",
              description: "Atualizações rápidas e convites exclusivos."
            },
            {
              label: "Notificações push",
              key: "push_opt_in",
              description: "Alertas de pedidos e novidades premium."
            }
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between rounded-2xl border border-black/10 p-4 text-sm"
            >
              <div>
                <p className="font-semibold text-bpBlackSoft">{item.label}</p>
                <p className="text-xs text-bpGraphite/70">{item.description}</p>
              </div>
              <input
                type="checkbox"
                checked={prefs[item.key as keyof PreferenceRow]}
                onChange={(event) =>
                  setPrefs((prev) => ({
                    ...prev,
                    [item.key]: event.target.checked
                  }))
                }
                className="h-5 w-5 accent-[#B80F5A]"
              />
            </label>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 rounded-full bg-bpPink px-6 py-2 text-xs uppercase tracking-[0.3em] text-white shadow-bpSoft disabled:opacity-60"
        >
          Salvar preferências
        </button>
        {message && <p className="mt-3 text-xs text-bpPink">{message}</p>}
      </div>
    </div>
  );
}

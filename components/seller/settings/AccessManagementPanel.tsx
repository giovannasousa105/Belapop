"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Role = "ADMIN" | "OPERACAO" | "FINANCEIRO";
type Status = "active" | "inactive" | "pending";
type PermissionKey =
  | "finance.view_details"
  | "finance.export"
  | "finance.open_dispute"
  | "finance.approve_adjustment"
  | "promo.create"
  | "promo.pause"
  | "promo.max_discount_percent"
  | "ads.budget_change"
  | "users.manage_roles"
  | "audit.view"
  | "settings.edit_store"
  | "pii.view_full";

type PermissionValue = boolean | number;

type Member = {
  user_id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  is_owner: boolean;
  permissions: Record<PermissionKey, PermissionValue>;
  permission_overrides: Partial<Record<PermissionKey, PermissionValue>>;
};

type Invite = {
  id: string;
  email: string;
  role: Role;
  expires_at: string;
};

type AccessPayload = {
  access: {
    can_manage_roles: boolean;
    can_view_audit: boolean;
  };
  presets: Array<{ key: string; label: string; role: Role }>;
  members: Member[];
  pending_invites: Invite[];
  recent_changes: Array<{ id: string; action: string; created_at: string }>;
};

const PERMISSIONS: Array<{ key: PermissionKey; label: string; numeric?: boolean }> = [
  { key: "finance.view_details", label: "finance.view_details" },
  { key: "finance.export", label: "finance.export" },
  { key: "finance.open_dispute", label: "finance.open_dispute" },
  { key: "finance.approve_adjustment", label: "finance.approve_adjustment" },
  { key: "promo.create", label: "promo.create" },
  { key: "promo.pause", label: "promo.pause" },
  { key: "promo.max_discount_percent", label: "promo.max_discount_percent", numeric: true },
  { key: "ads.budget_change", label: "ads.budget_change" },
  { key: "users.manage_roles", label: "users.manage_roles" },
  { key: "audit.view", label: "audit.view" },
  { key: "settings.edit_store", label: "settings.edit_store" },
  { key: "pii.view_full", label: "pii.view_full" }
];

const formatDate = (v: string) =>
  new Date(v).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function AccessManagementPanel() {
  const [payload, setPayload] = useState<AccessPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [role, setRole] = useState<Role>("OPERACAO");
  const [status, setStatus] = useState<Status>("active");
  const [permissions, setPermissions] = useState<Partial<Record<PermissionKey, PermissionValue | null>>>({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("OPERACAO");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/seller/access/members", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error ?? "Falha ao carregar acessos.");
      setPayload(null);
      setLoading(false);
      return;
    }
    setPayload(json as AccessPayload);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const canManage = Boolean(payload?.access.can_manage_roles);
  const filtered = useMemo(() => {
    const members = payload?.members ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => `${m.name} ${m.email}`.toLowerCase().includes(q));
  }, [payload?.members, search]);

  const openMember = (member: Member) => {
    setSelected(member);
    setRole(member.role);
    setStatus(member.status);
    setPermissions({ ...member.permission_overrides });
    setMessage(null);
    setError(null);
  };

  const saveMember = async () => {
    if (!selected || !canManage) return;
    setSaving(true);
    const res = await fetch(`/api/seller/access/members/${selected.user_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, status, permissions })
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json?.error ?? "Falha ao salvar membro.");
      return;
    }
    setMessage("Alteracoes salvas.");
    await load();
  };

  const inviteMember = async () => {
    if (!canManage || !inviteEmail.trim()) return;
    setSaving(true);
    const res = await fetch("/api/seller/access/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole })
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json?.error ?? "Falha ao convidar membro.");
      return;
    }
    setInviteEmail("");
    setMessage(json?.mode === "invite_pending" ? "Convite pendente criado." : "Membro vinculado.");
    await load();
  };

  const resendInvite = async (id: string) => {
    if (!canManage) return;
    setSaving(true);
    const res = await fetch(`/api/seller/access/invites/${id}/resend`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json?.error ?? "Falha ao reenviar convite.");
      return;
    }
    setMessage("Convite reenviado.");
    await load();
  };

  if (loading) {
    return <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">Carregando...</section>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Settings</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">Equipe & Acessos</h1>
        <p className="mt-2 text-sm text-bpGraphite/80">Permissoes controlam acoes criticas. O restante e definido pela role.</p>
      </section>

      {message ? <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</section> : null}
      {error ? <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</section> : null}

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nome ou email" className="w-72 rounded-xl border border-black/10 px-3 py-2 text-sm" />
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="convidar@email.com" className="w-60 rounded-xl border border-black/10 px-3 py-2 text-sm" />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)} className="rounded-xl border border-black/10 px-3 py-2 text-sm">
            <option value="OPERACAO">Operacao</option>
            <option value="FINANCEIRO">Financeiro</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button disabled={!canManage || saving} onClick={inviteMember} className="rounded-full bg-bpPink px-4 py-2 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-50">
            Convidar
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-black/10">
          <table className="min-w-full text-sm">
            <thead className="bg-[#FAFAFB] text-left text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
              <tr><th className="px-3 py-3">Nome</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Acoes</th></tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.user_id} className="border-t border-black/5">
                  <td className="px-3 py-3">{m.name}{m.is_owner ? " (Dono)" : ""}</td>
                  <td className="px-3 py-3">{m.email}</td>
                  <td className="px-3 py-3">{m.role}</td>
                  <td className="px-3 py-3">{m.status}</td>
                  <td className="px-3 py-3"><button onClick={() => openMember(m)} className="rounded-full border border-black/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em]">Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">Convites pendentes</h2>
          <div className="mt-3 space-y-2">
            {(payload?.pending_invites ?? []).map((invite) => (
              <div key={invite.id} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-3 text-sm">
                <p className="font-medium">{invite.email}</p>
                <p className="text-xs text-bpGraphite/70">{invite.role} | expira {formatDate(invite.expires_at)}</p>
                <button disabled={!canManage || saving} onClick={() => resendInvite(invite.id)} className="mt-2 rounded-full border border-black/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] disabled:opacity-50">Reenviar</button>
              </div>
            ))}
            {(payload?.pending_invites ?? []).length === 0 ? <p className="text-sm text-bpGraphite/70">Sem convites pendentes.</p> : null}
          </div>
        </article>

        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">Ultimas 20 alteracoes</h2>
          <div className="mt-3 space-y-2">
            {(payload?.recent_changes ?? []).map((log) => (
              <div key={log.id} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-3 text-sm">
                <p className="font-medium">{log.action}</p>
                <p className="text-xs text-bpGraphite/70">{formatDate(log.created_at)}</p>
              </div>
            ))}
            {(payload?.recent_changes ?? []).length === 0 ? <p className="text-sm text-bpGraphite/70">Sem eventos recentes.</p> : null}
          </div>
        </article>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Membro</p>
                <h3 className="mt-1 font-display text-2xl text-bpBlack">{selected.name}</h3>
                <p className="text-sm text-bpGraphite/70">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-[0.2em]">Fechar</button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={!canManage || selected.is_owner} className="rounded-xl border border-black/10 px-3 py-2 text-sm disabled:opacity-50">
                <option value="ADMIN">Admin</option>
                <option value="OPERACAO">Operacao</option>
                <option value="FINANCEIRO">Financeiro</option>
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} disabled={!canManage || selected.is_owner} className="rounded-xl border border-black/10 px-3 py-2 text-sm disabled:opacity-50">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="pending">Pendente</option>
              </select>
            </div>
            <div className="mt-4 space-y-2 rounded-2xl border border-black/10 p-4">
              {PERMISSIONS.map((perm) =>
                perm.numeric ? (
                  <label key={perm.key} className="flex items-center justify-between gap-2 text-sm">
                    <span>{perm.label}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={Number(permissions[perm.key] ?? selected.permissions[perm.key] ?? 0)}
                      disabled={!canManage}
                      onChange={(e) => setPermissions((prev) => ({ ...prev, [perm.key]: Number(e.target.value || 0) }))}
                      className="w-24 rounded-xl border border-black/10 px-3 py-1.5 text-sm disabled:opacity-50"
                    />
                  </label>
                ) : (
                  <label key={perm.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(permissions[perm.key] ?? selected.permissions[perm.key])}
                      disabled={!canManage}
                      onChange={(e) => {
                        if (perm.key === "pii.view_full" && e.target.checked) {
                          const ok = window.confirm("Acesso a dados pessoais e auditado. Confirmar?");
                          if (!ok) return;
                        }
                        setPermissions((prev) => ({ ...prev, [perm.key]: e.target.checked }));
                      }}
                      className="h-4 w-4 accent-bpPink"
                    />
                    <span>{perm.label}</span>
                  </label>
                )
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button disabled={!canManage || saving} onClick={saveMember} className="rounded-full bg-bpPink px-5 py-2 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar alteracoes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

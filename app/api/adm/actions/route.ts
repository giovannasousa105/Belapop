import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { executeAdmAction, toAdmActionFailure } from "@/lib/adm/actions/service";
import type { AdmActionRequest } from "@/lib/adm/actions/types";
import { getCurrentAdmUser } from "@/lib/adm/auth/current-user";

type ActionRoutePayload = {
  request?: AdmActionRequest;
  contextPathname?: string;
};

const isActionRequest = (value: unknown): value is AdmActionRequest => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as { type?: unknown; entityId?: unknown };
  return typeof candidate.type === "string" && typeof candidate.entityId === "string";
};

export async function POST(request: Request) {
  const currentUser = await getCurrentAdmUser();
  if (!currentUser) {
    return NextResponse.json(
      {
        success: false,
        code: "UNAUTHENTICATED",
        message: "Sua sessao do ADM expirou. Entre novamente."
      },
      { status: 401 }
    );
  }

  const payload = (await request.json().catch(() => null)) as ActionRoutePayload | null;
  if (!isActionRequest(payload?.request)) {
    return NextResponse.json(
      {
        success: false,
        code: "INVALID_REQUEST",
        message: "O payload da acao do ADM e invalido."
      },
      { status: 400 }
    );
  }

  try {
    const result = await executeAdmAction(currentUser, payload.request, payload.contextPathname);
    result.revalidatedPaths.forEach((path) => {
      revalidatePath(path);
    });

    return NextResponse.json(result);
  } catch (error) {
    const failure = toAdmActionFailure(error);
    return NextResponse.json(failure.body, { status: failure.statusCode });
  }
}

import { Suspense } from "react";

import { LoginPreviewScreen } from "@/components/previews/belapop/login-screen";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPreviewScreen mode="live" />
    </Suspense>
  );
}

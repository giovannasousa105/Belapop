import { AtelierPreviewScreen } from "./atelier-screen";
import { CartPreviewScreen } from "./cart-screen";
import { CheckoutPreviewScreen } from "./checkout-screen";
import { ConciergePreviewScreen } from "./concierge-screen";
import { DiagnosticPreviewScreen } from "./diagnostic-screen";
import { FeedbackPreviewScreen } from "./feedback-screen";
import { HomePreviewScreen } from "./home-screen";
import { LoginPreviewScreen } from "./login-screen";
import { OrderPreviewScreen } from "./order-screen";
import { ProductPreviewScreen } from "./product-screen";
import { RewardsPreviewScreen } from "./rewards-screen";
import { ScanScreenOne } from "./scan-screen-1";
import { ScanScreenTwo } from "./scan-screen-2";
import { SkinBelaPreviewScreen } from "./skinbela-screen";
import { TrackingPreviewScreen } from "./tracking-screen";
import type { PreviewScreenSlug } from "./data";
import { getPreviewScreen } from "./data";
import { PreviewShell, ScreenPlaceholder } from "./preview-shell";

export function PreviewScreenRenderer({ slug }: { slug: PreviewScreenSlug }) {
  const screen = getPreviewScreen(slug);

  if (!screen) {
    return null;
  }

  if (slug === "home") {
    return <HomePreviewScreen />;
  }

  if (slug === "skincare") {
    return <AtelierPreviewScreen />;
  }

  if (slug === "scan") {
    return <ScanScreenOne />;
  }

  if (slug === "scan-2") {
    return <ScanScreenTwo />;
  }

  if (slug === "diagnostico") {
    return <DiagnosticPreviewScreen />;
  }

  if (slug === "concierge") {
    return <ConciergePreviewScreen />;
  }

  if (slug === "carrinho") {
    return <CartPreviewScreen />;
  }

  if (slug === "login") {
    return <LoginPreviewScreen />;
  }

  if (slug === "pedido") {
    return <OrderPreviewScreen />;
  }

  if (slug === "rastreio") {
    return <TrackingPreviewScreen />;
  }

  if (slug === "feedback") {
    return <FeedbackPreviewScreen />;
  }

  if (slug === "recompensas") {
    return <RewardsPreviewScreen />;
  }

  if (slug === "skinbela") {
    return <SkinBelaPreviewScreen />;
  }

  if (slug === "checkout") {
    return <CheckoutPreviewScreen />;
  }

  if (slug === "produto") {
    return <ProductPreviewScreen />;
  }

  return (
    <PreviewShell current={slug}>
      <ScreenPlaceholder
        title={screen.title}
        description={screen.description}
        finalPath={screen.finalPath}
      />
    </PreviewShell>
  );
}

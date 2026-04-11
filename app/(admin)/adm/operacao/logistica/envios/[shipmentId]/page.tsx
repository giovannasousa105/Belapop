import { ShipmentDetailPage } from "@/components/adm/pages/ShipmentDetailPage";

type PageProps = {
  params: Promise<{
    shipmentId: string;
  }>;
};

export default async function AdmShipmentDetailRoute({ params }: PageProps) {
  const { shipmentId } = await params;
  return <ShipmentDetailPage shipmentId={shipmentId} />;
}

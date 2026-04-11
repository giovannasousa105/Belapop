export default function PopClubLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-app-module="popclub"
      className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] selection:bg-[#ed93d5]/20 selection:text-[#1c1b1b]"
    >
      {children}
    </div>
  );
}

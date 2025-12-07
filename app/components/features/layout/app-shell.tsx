import DesktopLayout from "./desktop-layout";
import MobileLayout from "./mobile-layout";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="hidden md:block">
        <DesktopLayout>{children}</DesktopLayout>
      </div>
      <div className="md:hidden">
        <MobileLayout>{children}</MobileLayout>
      </div>
    </>
  );
}

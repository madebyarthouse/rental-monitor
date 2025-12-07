import { Link, useNavigation } from "react-router";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <>
      {/* Sticky top header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-1100 border-b border-border bg-background">
        <div className="flex items-center justify-between px-4 h-14 gap-4">
          <Link to="/" className="block h-full py-2">
            <img
              src="/momentum-institut-logo.png"
              alt="Momentum Institut"
              width={1700}
              height={441}
              className="h-full w-auto max-w-[220px]"
            />
          </Link>
          <div className="font-semibold tracking-tight text-base">
            Mietmonitor
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col min-h-screen pt-14">
        <main className="flex-1">
          {isLoading ? (
            <div
              className="flex items-center justify-center py-20"
              role="status"
              aria-label="Lädt"
            >
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </>
  );
}

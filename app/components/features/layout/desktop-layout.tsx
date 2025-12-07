import { Link, useNavigation } from "react-router";

export default function DesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-1000 flex h-16 items-center justify-between border-b border-border bg-background px-6">
        <Link to="/" className="block h-full py-2">
          <img
            src="/momentum-institut-logo.png"
            alt="Momentum Institut"
            width={1700}
            height={441}
            className="h-full w-auto max-w-[220px]"
          />
        </Link>
        <div className="font-semibold tracking-tight text-xl">Mietmonitor</div>
      </header>
      <main className="overflow-y-auto">
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
  );
}

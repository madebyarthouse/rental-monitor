import * as React from "react";

export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode | (() => React.ReactNode);
  fallback?: React.ReactNode;
}) {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) return <>{fallback}</>;
  return (
    <>
      {typeof children === "function"
        ? (children as () => React.ReactNode)()
        : children}
    </>
  );
}

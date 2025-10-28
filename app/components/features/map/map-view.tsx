import * as React from "react";

export default function MapViewBasic({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="p-8">
      <div className="text-2xl font-bold mb-4">MAP</div>
      {children ? (
        <div className="text-sm text-muted-foreground">{children}</div>
      ) : null}
    </div>
  );
}

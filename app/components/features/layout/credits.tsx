import { cn } from "@/lib/utils";

export const Credits = ({ className }: { className?: string }) => {
  return (
    <div className={cn("text-center text-gray-700", className)}>
      <p>
        Entwickelt von{" "}
        <a
          className="underline font-semibold"
          href="https://madebyarthouse.com"
          target="_blank"
          rel="noopener"
        >
          Arthouse
        </a>{" "}
      </p>
      <p>
        Code sowie Daten sind{" "}
        <a
          className="underline font-semibold"
          href="https://github.com/madebyarthouse/rental-monitor"
          target="_blank"
          rel="noopener"
        >
          open-source
        </a>{" "}
      </p>
    </div>
  );
};

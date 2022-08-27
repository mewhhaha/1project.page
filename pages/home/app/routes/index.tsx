import type { NodeTooltipProps } from "@nivo/network";
import { ResponsiveNetwork } from "@nivo/network";
import { Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useWebSocket } from "../hooks";

const useBag = () => {
  const [count, setCount] = useState<Record<string, number>>({});
  const [socket, status] = useWebSocket(
    "wss://home-counter.horrible.workers.dev/connect",
    {
      reconnect: true,
      retries: 3,
    }
  );

  useEffect(() => {
    if (socket === undefined) return;
    socket.onmessage = (event) => {
      const next = JSON.parse(event.data);
      setCount((p) => ({ ...p, ...next }));
    };
  }, [socket]);

  const increment = () => {
    if (status === "open") {
      socket?.send("ok");
    }
  };

  return [count, increment] as const;
};

export default function App() {
  const [bag, increment] = useBag();

  return (
    <>
      <header className="z-1 relative isolate w-full">
        <div className="absolute top-2 right-2 flex space-x-4">
          <Link to="x-ray" aria-label="x-ray">
            <div className="i-carbon:magnify color-white h-10 w-10 shadow-xl" />
          </Link>
          <a
            href="https://github.com/mewhhaha/1projectpage/tree/main/pages/home"
            aria-label="Github"
          >
            <div className="i-carbon:logo-github color-white h-10 w-10 shadow-xl" />
          </a>
        </div>
      </header>
      <main className="isolate flex h-full flex-col overflow-auto">
        <div className="relative isolate bg-gradient-to-b from-gray-800 via-black to-black pt-10">
          <div className="color-black -z-1 absolute inset-0 bg-[url(/floating-cogs.svg)]" />
          <h1 className="z-1 pb-16 text-center font-sans text-7xl font-extrabold text-white sm:text-8xl md:text-9xl">
            1 Page
            <br />
            <span className="bg-gradient-to-r from-pink-300 via-pink-400 to-pink-200 bg-clip-text text-transparent">
              1 Project
            </span>
          </h1>
        </div>

        <Divider />

        <article className="flex w-full flex-col items-center">
          <div className="mb-12 w-full max-w-3xl  px-16 font-extrabold text-gray-100">
            <h2 className="my-12 text-5xl sm:text-7xl">What are you doing?</h2>
            <p className="text-4xl sm:text-6xl">
              Every <Orange>page</Orange> will be its own little{" "}
              <Red>experiment</Red>. <br />
              Starting with <Green>this button.</Green>
            </p>
          </div>

          <div className="relative flex w-full max-w-3xl justify-center">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-transparent bg-black px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-95"
              onClick={increment}
              onKeyDown={(event) => {
                if (event.repeat) event.preventDefault();
              }}
            >
              <div
                className="i-carbon:cafe -ml-1 mr-3 h-5 w-5"
                aria-hidden="true"
              />
              Click me
            </button>
            <hr className="-z-1 absolute top-1/2 w-full" />
          </div>
          <div className="h-3xl w-full">
            <ResponsiveNetwork
              data={toNetwork(bag)}
              linkDistance={(l) => l.distance}
              centeringStrength={Math.random() * 0.5 + 1.5}
              repulsivity={Math.random() * 20 + 20}
              nodeSize={(n) => (n.id === "root" ? 50 : nodeShowSize(n))}
              activeNodeSize={(n) => nodeShowSize(n) * 1.5}
              inactiveNodeSize={12}
              nodeColor={(n) => n.color}
              nodeBorderWidth={1}
              nodeBorderColor={{
                from: "color",
                modifiers: [["darker", 0.8]],
              }}
              nodeTooltip={NodeTooltip}
              linkThickness={(l) => 2 + 2 * l.target.data.height}
              linkBlendMode="multiply"
              motionConfig="wobbly"
            />
          </div>
        </article>
      </main>
    </>
  );
}

const clamp = (min: number, max: number, value: number) =>
  Math.max(Math.min(max, value), min);
const nodeShowSize = (n: NetworkNode) => clamp(5, n.height * 10, n.size);

const NodeTooltip = ({
  node: {
    data: { id, size },
  },
}: NodeTooltipProps<NetworkNode>) => {
  return (
    <div className="bg-white px-4 py-2 text-black">
      {id.split(".").at(-1)}: {size}
    </div>
  );
};

type ColorProps = { children: React.ReactNode };

const Green = ({ children }: ColorProps) => {
  return <span className="color-green-500">{children}</span>;
};

const Red = ({ children }: ColorProps) => {
  return <span className="color-red-500">{children}</span>;
};

const Orange = ({ children }: ColorProps) => {
  return <span className="color-orange-500">{children}</span>;
};

const Divider = () => {
  return <span className="h-1 w-full bg-gray-900"></span>;
};

type NetworkNode = {
  id: string;
  height: number;
  size: number;
  color: `rgb(${number}, ${number}, ${number})`;
};

type NetworkLink = {
  source: string;
  target: string;
  distance: number;
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const toNetwork = (
  bag: Record<string, number>
): { nodes: NetworkNode[]; links: NetworkLink[] } => {
  const entries: [string, number][] = Object.entries(bag).map(
    ([key, value]) => {
      const segments = key.split(".");
      segments[0] = regionNames.of(segments[0]) ?? segments[0];

      return [segments.join("."), value];
    }
  );

  const nodes: NetworkNode[] = entries.map(([id, value]) => {
    const segments = id.split(".");
    const segment = segments.at(-1);

    return {
      id,
      height: 5 - segments.length,
      size: value,
      color:
        segment === "1"
          ? "rgb(239, 68, 68)"
          : segment === "0"
          ? "rgb(59, 130, 246)"
          : "rgb(249, 115, 22)",
    };
  });

  const links: NetworkLink[] = entries.map(([id]) => {
    const segments = id.split(".");
    const source = segments.slice(0, -1).join(".") || "root";
    return {
      source,
      target: id,
      distance: (6 - segments.length) * 20,
    };
  });

  const sum = nodes.reduce((acc, n) => {
    const x = n.id.split(".").length === 1 ? n.size : 0;
    return acc + x;
  }, 0);

  nodes.push({
    id: "root",
    height: 5,
    size: sum,
    color: "rgb(34, 197, 94)",
  });

  return {
    nodes,
    links,
  };
};

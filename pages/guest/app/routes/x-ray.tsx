import type { LinksFunction, LoaderFunction } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import theme from "prismjs/themes/prism-tomorrow.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: theme }];
};

type LoaderData = string;

export const loader: LoaderFunction = async ({
  request,
}): Promise<LoaderData> => {
  const response = await fetch(`${new URL(request.url).origin}/index.txt`, {
    headers: { "Content-Type": "text/plain" },
  });

  const text = await response.text();

  return Prism.highlight(text, Prism.languages.typescript, "typescript");
};

export default function App() {
  const code = useLoaderData<LoaderData>();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <header className="z-1 relative isolate h-40 w-full">
        <div className="absolute top-2 right-2 flex space-x-4">
          <Link to="/" aria-label="project">
            <div className="i-carbon:blog color-white h-10 w-10 shadow-xl" />
          </Link>
          <a
            href="https://github.com/mewhhaha/1projectpage/tree/main/pages/guest"
            aria-label="Github"
          >
            <div className="i-carbon:logo-github color-white h-10 w-10 shadow-xl" />
          </a>
        </div>
      </header>
      <main className="isolate flex flex-grow flex-col overflow-auto px-4 pb-4">
        <pre>
          <code dangerouslySetInnerHTML={{ __html: code }} />
        </pre>
      </main>
    </div>
  );
}

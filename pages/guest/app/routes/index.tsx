import type {
  ActionFunction,
  DataFunctionArgs,
  LoaderFunction,
} from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";

type Augment<T extends Record<any, any>, R extends Record<any, any>> = {
  [Key in keyof T]: Key extends keyof R ? R[Key] : T[Key];
} & Omit<R, keyof T>;

type Env = {
  CONTENT_KV: KVNamespace;
};

type CloudflareDataFunctionArgs = Augment<DataFunctionArgs, { context: Env }>;

type LoaderData = string;

export const loader: LoaderFunction = async ({
  context: { CONTENT_KV },
}: CloudflareDataFunctionArgs): Promise<LoaderData> => {
  const { keys } = await CONTENT_KV.list<string>({ limit: 10 });

  if (keys.length === 0) return "";

  const index = (Math.random() * keys.length) | 0;
  const key = keys[index];

  return (await CONTENT_KV.get(key.name)) ?? "";
};

const validate = (s: string): true | string => {
  const parser = new DOMParser();
  try {
    const document = parser.parseFromString(s, "text/html");
    const elements = document.getElementsByTagName("*");

    for (const element of elements) {
      for (const attribute of element.attributes) {
        if (attribute.name !== "class")
          return `non "class" attribute found for tag ${element.tagName}`;
      }
    }

    return true;
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
    return "unknown error";
  }
};

export const action: ActionFunction = async ({
  request,
  context: CONTENT_KV,
}: CloudflareDataFunctionArgs) => {
  const form = await request.formData();
  const field = form.get("content");

  if (field === null) return "missing content";
  const content = field.valueOf();
  if (typeof content !== "string") return "content must be of type string";

  const valid = validate(content);
  const date = (Number.MAX_SAFE_INTEGER - Date.now()).toString();

  const status = validate;
};

export default function App() {
  const userContent = useLoaderData<LoaderData>();
  const [mode, setMode] = useState();
  return (
    <>
      <header className="z-1 relative isolate w-full">
        <div className="absolute top-2 right-2">
          <Link to="x-ray" aria-label="x-ray">
            <div className="i-carbon:user-x-ray color-white h-10 w-10 shadow-xl" />
          </Link>
          <a
            href="https://github.com/mewhhaha/1projectpage"
            aria-label="Github"
          >
            <div className="i-carbon:logo-github color-white h-10 w-10 shadow-xl" />
          </a>
        </div>
      </header>
      <main className="isolate flex h-full flex-col overflow-auto">
        <h1 className="mb-12 p-4 text-6xl font-extrabold">
          This isn't <Red>my article</Red>
        </h1>

        <p>
          I wanted to create something for user-generated content. So, this is{" "}
          <i>your</i> article. I'm storing this in a{" "}
          <Href to="https://www.cloudflare.com/products/workers-kv/">
            Cloudflare KV
          </Href>{" "}
          store. This is built using <Href to="https://remix.run/">Remix</Href>.
        </p>
        <p>
          The implemention is simple, it looks like this.
          <code></code>
        </p>

        <article className="flex w-full flex-col items-center rounded-md border-black">
          <header className="space-x-4">
            <button>show</button>
            <button>code</button>
            <button>edit</button>
          </header>
          {userContent}
        </article>
      </main>
    </>
  );
}

type HrefProps = {
  children: React.ReactNode;
  to: string;
};

const Href = ({ children, to }: HrefProps) => {
  return (
    <a
      href={to}
      target="_blank"
      className="underline-dashed active:color-pink-500 visited:color-white color-pink-600 underline-offset-3 font-medium underline visited:font-normal"
      rel="noreferrer"
    >
      {children}
    </a>
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

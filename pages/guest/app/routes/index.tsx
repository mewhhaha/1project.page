import type {
  ActionFunction,
  DataFunctionArgs,
  LinksFunction,
  LoaderFunction,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import type { ChangeEventHandler, KeyboardEventHandler } from "react";
import { useEffect } from "react";
import { useMemo, useRef, useState } from "react";
import { DomUtils, parseDocument } from "htmlparser2";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import theme from "prismjs/themes/prism-tomorrow.css";
import clsx from "clsx";
import prettier from "prettier";
import unocss from "@unocss/runtime";

// @ts-ignore No types for the parsers
import htmlParser from "prettier/esm/parser-html.mjs";

const MAX_LENGTH = 2000;
const MIN_LENGTH = 140;
const CONTENT_KEY = "content";

type Augment<T extends Record<any, any>, R extends Record<any, any>> = {
  [Key in keyof T]: Key extends keyof R ? R[Key] : T[Key];
} & Omit<R, keyof T>;

type Env = {
  CONTENT_KV: KVNamespace;
};

type CloudflareDataFunctionArgs = Augment<DataFunctionArgs, { context: Env }>;

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: theme }];
};

type LoaderData = [[string, string], ...[string, string][]];

export const loader: LoaderFunction = async ({
  context: { CONTENT_KV },
}: CloudflareDataFunctionArgs): Promise<LoaderData> => {
  const { keys } = await CONTENT_KV.list<string>({ limit: 10 });

  const articles = await Promise.all(
    keys.map(async (key): Promise<[string, string]> => {
      const content = await CONTENT_KV.get(key.name);
      return [key.name, content ?? ""];
    })
  );

  const [first, ...rest] = articles;
  if (first === undefined)
    return [
      [
        "0",
        `
<div class="m-4 bg-white rounded shadow-lg p-4">
  <h1
    class="font-extrabold mb-10 text-4xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-red-500 to-purple-200"
  >
    I actually made this one article
  </h1>
  <p class="pb-4">
    I use the
    <span class="font-bold">@unocss/runtime</span>
    package for this to support some type of CSS. I use
    <span class="font-bold">prettier</span> for
    formatting. <br /><br />
    You should check out their documentation to learn
    more about what CSS classes you can use.
  </p>
  <h2 class="pb-2 text-xl animate-bounce">Restrictions</h2>
  <p class="pb-4">
    The minimum amount characters is 140 á la
    <span class="font-bold">Twitter</span> and the
    maximum amount is 2000.
  </p>
  <h2 class="pb-2 text-xl animate-bounce">Tips and tricks</h2>
  <p>
    Use
    <span class="font-mono font-bold">CTRL + S</span>
    to format your text. It also saves it to local
    storage for your next session!
  </p>
</div>
`,
      ],
    ];

  return [first, ...rest];
};

type ActionData = { message: string } | null;

export const action: ActionFunction = async ({
  request,
  context: { CONTENT_KV },
}: CloudflareDataFunctionArgs) => {
  const form = await request.formData();
  const field = form.get(CONTENT_KEY);

  if (field === null) return json({ message: "missing content" }, 422);

  const content = field.valueOf();
  if (typeof content !== "string")
    return json({ message: "content must be of type string" }, 422);

  if (content.length > MAX_LENGTH)
    return json(
      { message: `must be at most ${MAX_LENGTH} characters long` },
      422
    );

  if (content.length < MIN_LENGTH)
    return json({ message: `must be at least ${MIN_LENGTH} characters long` });
  const date = (Number.MAX_SAFE_INTEGER - Date.now()).toString();

  const valid = validate(content);

  if (typeof valid === "string") return json({ message: valid }, 422);

  await CONTENT_KV.put(date, content);
  return null;
};

export default function App() {
  const articles = useLoaderData<LoaderData>();

  useEffect(() => {
    unocss();
  }, []);

  return (
    <>
      <header className="z-1 relative isolate w-full">
        <div className="absolute top-2 right-2 flex space-x-4">
          <Link to="x-ray" aria-label="x-ray">
            <div className="i-carbon:magnify color-white h-10 w-10 shadow-xl" />
          </Link>
          <a
            href="https://github.com/mewhhaha/1projectpage/tree/main/pages/guest"
            aria-label="Github"
          >
            <div className="i-carbon:logo-github color-white h-10 w-10 shadow-xl" />
          </a>
        </div>
      </header>
      <main className="isolate flex h-full flex-col items-center overflow-auto">
        <h1 className="p-4 pt-24 text-6xl font-extrabold">
          This is not my article
        </h1>

        <p className="w-full max-w-2xl p-4 text-2xl">
          I accidentally made a site where users can post content. This can't
          end well. Straight from{" "}
          <Href to="https://www.cloudflare.com/products/workers-kv/">
            <Orange>Cloudflare KV</Orange>
          </Href>{" "}
          store and{" "}
          <Href to="https://remix.run/">
            <Red>Remix</Red>
          </Href>
          .
        </p>

        <Divider />

        <New />
        <ul className="flex w-full max-w-3xl flex-col items-center space-y-4 py-10">
          {articles.map(([id, html]) => {
            return (
              <li key={id} className="min-h-1xl flex h-full w-full max-w-2xl">
                <Article html={html} />
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}

const New = () => {
  const error = useActionData<ActionData>();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const [highlight, setHighlight] = useState("");

  useEffect(() => {
    if (textareaRef.current === null) return;
    const value = localStorage.getItem(CONTENT_KEY) ?? "";
    textareaRef.current.value = value;
    setHighlight(markup(value));
  }, []);

  const rows =
    Math.max(numberOfNewlines(textareaRef.current?.value ?? ""), 10) + 1;

  const format = () => {
    if (textareaRef.current === null) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const formatted = prettier.format(textareaRef.current.value, {
      parser: "html",
      plugins: [htmlParser],
      printWidth: 55,
    });
    if (formatted === "") return;
    console.log(formatted);
    document.execCommand("selectAll", false);
    document.execCommand("insertText", false, formatted);
    textareaRef.current.selectionStart = start;
    textareaRef.current.selectionEnd = end;
  };

  const sync = () => {
    if (textareaRef.current === null) return;
    if (preRef.current === null) return;
    preRef.current.scrollTop = textareaRef.current.scrollTop;
    preRef.current.scrollLeft = textareaRef.current.scrollLeft;
  };

  const handleOnChange: ChangeEventHandler<HTMLTextAreaElement> = ({
    currentTarget,
  }) => {
    setHighlight(markup(currentTarget.value));
    sync();
  };

  const handleOnKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    if (event.key.toUpperCase() === "S" && event.ctrlKey) {
      event.preventDefault();
      format();
      localStorage.setItem(CONTENT_KEY, event.currentTarget.value);
    }

    if (
      event.key === "ArrowDown" &&
      event.currentTarget.selectionStart === event.currentTarget.value.length
    ) {
      document.execCommand("insertText", false, "\n");
    }
  };

  console.log(error);

  return (
    <div className="mt-12 w-full max-w-3xl bg-gradient-to-b from-white via-red-300 to-pink-200 p-4 shadow-xl md:rounded-md xl:max-w-6xl">
      <div className="grid h-full w-full grid-cols-1 grid-rows-2 xl:grid-cols-2 xl:grid-rows-1">
        <Form method="post" className="relative">
          <div className="flex h-full w-full flex-col bg-black p-4">
            <div className="relative flex h-full w-full bg-gray-900">
              <textarea
                ref={textareaRef}
                className="z-1 w-full resize-none overflow-auto whitespace-pre bg-transparent px-2 font-mono text-transparent caret-white focus:outline-none"
                spellCheck={false}
                placeholder={"Type some HTML"}
                maxLength={MAX_LENGTH}
                rows={rows}
                name={CONTENT_KEY}
                onKeyDown={handleOnKeyDown}
                onScroll={sync}
                onChange={handleOnChange}
              />
              <pre
                ref={preRef}
                aria-hidden
                className="pointer-events-none absolute inset-0 select-none overflow-auto whitespace-pre px-2"
              >
                <code dangerouslySetInnerHTML={{ __html: highlight }} />
              </pre>
            </div>
            <button type="submit">Submit</button>
            {error && (
              <p className="text-red bg-black text-center font-medium">
                {error.message}
              </p>
            )}
          </div>
        </Form>
        <div
          className="isolate h-full w-full bg-opacity-50 bg-[url(/plus.svg)] p-4 text-black"
          dangerouslySetInnerHTML={{ __html: textareaRef.current?.value ?? "" }}
        />
      </div>
    </div>
  );
};

type ArticleProps = {
  html: string;
};

const Article = ({ html }: ArticleProps) => {
  const [show, setShow] = useState(false);

  const highlight = useMemo(
    () => Prism.highlight(html, Prism.languages.markup, "markup"),
    [html]
  );

  return (
    <article className="min-h-2xl relative isolate flex h-full w-full max-w-3xl flex-grow flex-col items-stretch rounded-md border-black bg-gradient-to-b from-white via-red-300 to-pink-200 p-4 text-black">
      <div className="-z-1 absolute inset-0 m-4 bg-[url(/plus.svg)]"></div>
      <div
        className="-z-1 h-full w-full"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <pre
        className={clsx(
          "relative m-4 overflow-auto whitespace-pre rounded-md bg-gradient-to-b from-gray-900 p-4 text-white",
          show ? "to-gray-900" : "h-24 overflow-hidden to-gray-900/0"
        )}
      >
        {!show && (
          <button
            className="opacity-1 absolute inset-0 h-24 w-full"
            onClick={() => setShow(true)}
          >
            s
          </button>
        )}
        <code dangerouslySetInnerHTML={{ __html: highlight }} />
      </pre>
    </article>
  );
};

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

const numberOfNewlines = (s: string) =>
  s.split("").filter((x) => x === "\n").length;

const Red = ({ children }: ColorProps) => {
  return <span className="color-red-500">{children}</span>;
};

const Orange = ({ children }: ColorProps) => {
  return <span className="color-orange-500">{children}</span>;
};

const Divider = () => {
  return <span className="h-1 w-full bg-gray-900"></span>;
};

const validate = (s: string): true | string => {
  try {
    const document = parseDocument(s);

    const elements = DomUtils.getElementsByTagName("*", document);

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

const markup = (value: string) => {
  return Prism.highlight(
    value[value.length - 1] === "\n" ? value + " " : value,
    Prism.languages.markup,
    "markup"
  );
};

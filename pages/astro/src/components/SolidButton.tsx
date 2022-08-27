import { children, createSignal, JSX } from "solid-js";

type ButtonProps = { children: JSX.Element };

export default function SolidButton(props: ButtonProps) {
  const [count, setCount] = createSignal(0);

  return (
    <button
      class="border border-gray-500 rounded-md px-4 py-2"
      onClick={() => setCount((p) => p + 1)}
    >
      {count()}
      {children(() => props.children)}
    </button>
  );
}

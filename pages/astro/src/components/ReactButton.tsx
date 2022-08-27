import { useState } from "react";

type ChildrenProps = { children: React.ReactNode };

export default function Reactbutton({ children }: ChildrenProps) {
  const [count, setCount] = useState(0);

  return (
    <button
      className="border border-gray-500 rounded-md px-4 py-2"
      onClick={() => setCount((p) => p + 1)}
    >
      {count}
      {children}
    </button>
  );
}

"use client";

type InteractionBubbleProps = {
  text: string;
};

export default function InteractionBubble({
  text,
}: InteractionBubbleProps) {
  if (!text) {
    return null;
  }

  return (
    <div
      className="
        pointer-events-none
        absolute
        bottom-[108px]
        left-1/2
        z-[5000]
        -translate-x-1/2
        whitespace-nowrap
      "
    >
      <div
        className="
          relative
          rounded-xl
          border
          border-zinc-200
          bg-white
          px-3
          py-2
          text-[11px]
          font-medium
          text-zinc-700
          shadow-lg
        "
      >
        {text}

        <div
          className="
            absolute
            left-1/2
            top-full
            h-[8px]
            w-[8px]
            -translate-x-1/2
            -translate-y-1/2
            rotate-45
            border-b
            border-r
            border-zinc-200
            bg-white
          "
        />
      </div>
    </div>
  );
}
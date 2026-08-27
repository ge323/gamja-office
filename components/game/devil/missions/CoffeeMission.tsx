"use client";

type Props = {
  onComplete: () => void;
};

export default function CoffeeMission({
  onComplete,
}: Props) {
  return (
    <div>
      Coffee Mission

      <button
        type="button"
        onClick={onComplete}
      >
        완료
      </button>
    </div>
  );
}
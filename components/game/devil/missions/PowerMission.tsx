"use client";

type Props = {
  onComplete: () => void;
};

export default function PowerMission({
  onComplete,
}: Props) {
  return (
    <div>
      Power Mission

      <button
        type="button"
        onClick={onComplete}
      >
        완료
      </button>
    </div>
  );
}
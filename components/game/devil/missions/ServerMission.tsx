"use client";

type Props = {
  onComplete: () => void;
};

export default function ServerMission({
  onComplete,
}: Props) {
  return (
    <div>
      Server Mission

      <button
        type="button"
        onClick={onComplete}
      >
        완료
      </button>
    </div>
  );
}
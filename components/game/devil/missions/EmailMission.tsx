"use client";

type Props = {
  onComplete: () => void;
};

export default function EmailMission({
  onComplete,
}: Props) {
  return (
    <div>
      Email Mission

      <button
        type="button"
        onClick={onComplete}
      >
        완료
      </button>
    </div>
  );
}
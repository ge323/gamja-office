"use client";

type Props = {
  onComplete: () => void;
};

export default function ArchiveMission({
  onComplete,
}: Props) {
  return (
    <div>
      Archive Mission

      <button
        type="button"
        onClick={onComplete}
      >
        완료
      </button>
    </div>
  );
}
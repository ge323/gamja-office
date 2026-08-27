"use client";

type Props = {
  onComplete: () => void;
};

export default function MeetingMission({
  onComplete,
}: Props) {
  return (
    <div>
      Meeting Mission

      <button
        type="button"
        onClick={onComplete}
      >
        완료
      </button>
    </div>
  );
}
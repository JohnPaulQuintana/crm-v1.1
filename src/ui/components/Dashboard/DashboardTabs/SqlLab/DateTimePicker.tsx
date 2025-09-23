import React, { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

type InputType = "date" | "datetime";

interface Props {
  type: InputType;
  value: string;
  onChange: (value: string) => void;
}

export const DateTimePicker: React.FC<Props> = ({ type, value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return; // Make sure ref is not null

    // Cast inputRef.current to 'HTMLElement' to satisfy Flatpickr types
    const fp = flatpickr(inputRef.current as HTMLElement, {
      enableTime: type === "datetime",
      time_24hr: true,
      enableSeconds: type === "datetime",
      dateFormat: type === "datetime" ? "Y-m-d H:i:S" : "Y-m-d",
      defaultDate: value || undefined,
      onChange: (_, dateStr) => onChange(dateStr),
    });

    return () => fp.destroy(); // cleanup on unmount
  }, [type, value, onChange]);

  return (
    <input
      ref={inputRef}
      type="text"
      className="border border-green-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-500"
    />
  );
};

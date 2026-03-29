import { PANTRY_ICON_OPTIONS } from "../hooks/usePantryIcons";

interface Props {
  value: string;
  onChange: (icon: string) => void;
}

export default function IconPicker({ value, onChange }: Props) {
  return (
    <div className="icon-picker">
      {PANTRY_ICON_OPTIONS.map((icon) => (
        <button
          key={icon}
          type="button"
          className={`icon-option ${value === icon ? "selected" : ""}`}
          onClick={() => onChange(icon)}
          title={icon}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

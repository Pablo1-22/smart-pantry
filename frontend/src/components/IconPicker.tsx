import { ICON_GROUPS } from "../hooks/usePantryIcons";

interface Props {
  value: string;
  onChange: (icon: string) => void;
}

export default function IconPicker({ value, onChange }: Props) {
  return (
    <div className="icon-picker-grouped">
      {ICON_GROUPS.map((group) => (
        <div key={group.label} className="icon-group">
          <div className="icon-group-label">{group.label}</div>
          <div className="icon-picker">
            {group.icons.map((icon) => (
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
        </div>
      ))}
    </div>
  );
}

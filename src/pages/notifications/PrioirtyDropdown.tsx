import Dropdown from "../../Components/Dropdown";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

const options = [
  {
    title: "All Priorities",
    value: "",
  },
  {
    title: "🟢 Low",
    value: "LOW",
  },
  {
    title: "🔵 Normal",
    value: "NORMAL",
  },
  {
    title: "🟠 High",
    value: "HIGH",
  },
  {
    title: "🔴 Urgent",
    value: "URGENT",
  },
];

export default function PrioirtyDropdown({ value, onChange }: Props) {
  return (
    <Dropdown
      title="Priority"
      icon="bi-funnel"
      value={value}
      onChange={(value) => onChange(value)}
      options={options}
    />
  );
}

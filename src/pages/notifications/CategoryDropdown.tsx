import Dropdown from "../../Components/Dropdown";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

const options = [
  {
    title: "All Categories",
    value: "",
  },
  {
    title: "⚡ Urgent",
    value: "URGENT",
  },
  {
    title: "ℹ️ Informational",
    value: "INFORMATIONAL",
  },
  {
    title: "🎯 Promotional",
    value: "PROMOTIONAL",
  },
  {
    title: "💳 Transactional",
    value: "TRANSACTIONAL",
  },
  {
    title: "⚙️ System",
    value: "SYSTEM",
  },
];

export default function CategoryDropdown({ value, onChange }: Props) {
  return (
    <Dropdown
      title="Category"
      icon="bi-tag"
      value={value}
      onChange={(value) => onChange(value)}
      options={options}
    />
  );
}

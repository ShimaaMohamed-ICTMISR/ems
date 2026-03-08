interface Props {
  title: string;
  icon: string;
  value: string;
  onChange: (val: string) => void;
  options: { title: string; value: string }[];
}

const Dropdown = ({ title, icon, value, onChange, options }: Props) => {
  return (
    <div className="filter-group">
      <label className="filter-label">
        <i className={`bi ${icon} me-2`}></i>
        {title}
      </label>
      <div className="">
        <select
          className="filter-select-modern"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map(({ title, value }) => (
            <option key={value} value={value}>
              {title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Dropdown;

export default function Input({ label, type = 'text', value, onChange, name, ...props }) {
  return (
    <label className="block mb-4">
      <span className="block mb-1 font-medium text-foreground-muted">{label}</span>
      <input
        className="input-field"
        type={type}
        value={value}
        onChange={onChange}
        name={name}
        {...props}
      />
    </label>
  );
}

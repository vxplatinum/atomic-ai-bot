export default function Alert({ children, type = 'error' }) {
  const colorClass = type === 'error' 
    ? 'bg-red-500/10 text-red-600 border-red-500/50 dark:text-red-400' 
    : 'bg-blue-500/10 text-blue-600 border-blue-500/50 dark:text-blue-400';
  return (
    <div className={`border-l-4 p-3 mb-4 rounded-r ${colorClass}`}>
      {children}
    </div>
  );
}

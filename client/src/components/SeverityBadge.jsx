const SEVERITY_CLASSES = {
  Critical: 'badge badge-critical',
  Major: 'badge badge-major',
  Minor: 'badge badge-minor',
  Trivial: 'badge badge-trivial',
};

function SeverityBadge({ value }) {
  return <span className={SEVERITY_CLASSES[value] || 'badge'}>{value}</span>;
}

export default SeverityBadge;

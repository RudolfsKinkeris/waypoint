const PRIORITY_CLASSES = {
  High: 'badge badge-priority-high',
  Medium: 'badge badge-priority-medium',
  Low: 'badge badge-priority-low',
};

function PriorityBadge({ value }) {
  return <span className={PRIORITY_CLASSES[value] || 'badge'}>{value}</span>;
}

export default PriorityBadge;

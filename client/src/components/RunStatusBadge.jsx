const RUN_STATUS_CLASSES = {
  'in-progress': 'badge badge-run-in-progress',
  completed: 'badge badge-run-completed',
};

function RunStatusBadge({ value }) {
  return <span className={RUN_STATUS_CLASSES[value] || 'badge'}>{value}</span>;
}

export default RunStatusBadge;

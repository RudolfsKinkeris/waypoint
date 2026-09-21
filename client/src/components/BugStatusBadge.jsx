const BUG_STATUS_CLASSES = {
  open: 'badge badge-bug-open',
  'in-progress': 'badge badge-bug-in-progress',
  resolved: 'badge badge-bug-resolved',
  closed: 'badge badge-bug-closed',
  reopened: 'badge badge-bug-reopened',
};

function BugStatusBadge({ value }) {
  return <span className={BUG_STATUS_CLASSES[value] || 'badge'}>{value}</span>;
}

export default BugStatusBadge;

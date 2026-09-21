const SUITE_STATUS_CLASSES = {
  draft: 'badge badge-suite-draft',
  ready: 'badge badge-suite-ready',
  'in-progress': 'badge badge-suite-in-progress',
  passed: 'badge badge-suite-passed',
  failed: 'badge badge-suite-failed',
};

function SuiteStatusBadge({ value }) {
  return <span className={SUITE_STATUS_CLASSES[value] || 'badge'}>{value}</span>;
}

export default SuiteStatusBadge;

const RESULT_CLASSES = {
  passed: 'badge badge-result-passed',
  failed: 'badge badge-result-failed',
  skipped: 'badge badge-result-skipped',
};

function ResultBadge({ value }) {
  if (!value) {
    return <span className="badge badge-result-pending">pending</span>;
  }
  return <span className={RESULT_CLASSES[value] || 'badge'}>{value}</span>;
}

export default ResultBadge;

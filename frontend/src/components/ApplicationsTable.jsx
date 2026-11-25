import StatusTag from './StatusTag.jsx'
import { withDefaultFlag } from '../lib/statusColors.js'

export default function ApplicationsTable({ applications, statuses, onOpen }) {
  function onKeyDown(e, application) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen(application)
    }
  }

  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th className="col-company">Company</th>
              <th>Role</th>
              <th className="col-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.application_id} tabIndex={0} onClick={() => onOpen(a)} onKeyDown={(e) => onKeyDown(e, a)}
                aria-label={`${a.company}, ${a.role}, ${a.status}. Open details`}>
                <td>
                  <span className="co">
                    <span className="mono" aria-hidden="true">{a.company.charAt(0).toUpperCase()}</span>
                    <span className="co-name">{a.company}</span>
                  </span>
                </td>
                <td>{a.role}</td>
                <td><StatusTag status={withDefaultFlag(statuses, a.status_id, a.status)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-foot">Newest first</div>
    </>
  )
}

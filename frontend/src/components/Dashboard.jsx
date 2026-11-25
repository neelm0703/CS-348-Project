import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../lib/api.js'
import { describeFilters, EMPTY_FILTERS, hasFilters } from '../lib/filters.js'
import TopBar from './TopBar.jsx'
import CountsPanel from './CountsPanel.jsx'
import FilterBar from './FilterBar.jsx'
import ApplicationsTable from './ApplicationsTable.jsx'
import EmptyState from './EmptyState.jsx'
import Modal from './Modal.jsx'
import DetailsModal from './DetailsModal.jsx'
import ApplicationFormModal from './ApplicationFormModal.jsx'
import EditStatusesPanel from './EditStatusesPanel.jsx'

// Owns all server data. Every change calls refresh(), which reloads the
// statuses, then the list and the counts together in one request (one
// REPEATABLE READ transaction on the server), so the two always agree.
export default function Dashboard({ user, onLoggedOut }) {
  const [applications, setApplications] = useState([])
  const [report, setReport] = useState([])
  const [statuses, setStatuses] = useState([])
  const [applied, setApplied] = useState(EMPTY_FILTERS)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [editingStatuses, setEditingStatuses] = useState(false)
  const [leftEditMode, setLeftEditMode] = useState(false)
  const [modal, setModal] = useState(null) // null | {type: 'details'|'create'|'edit', application?}

  const appliedRef = useRef(applied)
  const requestId = useRef(0)

  const refresh = useCallback(async (filters = appliedRef.current) => {
    const id = ++requestId.current
    try {
      // Statuses first, so a deleted status can be dropped from the filters
      // before the list and counts are fetched with them.
      const nextStatuses = await api.listStatuses()
      const known = new Set(nextStatuses.map((s) => s.status_id))
      const kept = filters.statuses.filter((s) => known.has(s))
      const nextFilters = kept.length === filters.statuses.length ? filters : { ...filters, statuses: kept }
      const { applications: nextApplications, report: nextReport } =
        await api.listApplicationsWithReport(nextFilters)
      if (id !== requestId.current) return // a newer refresh has started
      appliedRef.current = nextFilters
      setApplied(nextFilters)
      setStatuses(nextStatuses)
      setApplications(nextApplications)
      setReport(nextReport)
      setLoadError(null)
      setLoaded(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onLoggedOut()
      if (id === requestId.current) setLoadError("Couldn't load your applications. Check that the server is running, then try again.")
    }
  }, [onLoggedOut])

  useEffect(() => {
    refresh()
  }, [refresh])

  const applyFilters = (filters) => refresh(filters)
  const clearFilters = () => refresh(EMPTY_FILTERS)
  const openCreate = () => setModal({ type: 'create' })
  const openDetails = (application) => setModal({ type: 'details', application })
  const closeModal = () => setModal(null)
  const afterChange = () => {
    setModal(null)
    refresh()
  }

  const filtered = hasFilters(applied)
  const count = applications.length

  return (
    <div className="app">
      <TopBar user={user} onLoggedOut={onLoggedOut} />
      <main className="content">
        <div className="title-row">
          <div>
            <h1>Applications</h1>
            <p>{loaded ? `${count} ${count === 1 ? 'application' : 'applications'}` : ' '}</p>
          </div>
          {/* Needs the statuses (for the default "Applied"), so wait for the first load. */}
          <button type="button" className="btn btn-primary" onClick={openCreate} disabled={!loaded}>+ New application</button>
        </div>

        {loadError && (
          <div className="alert alert-row" role="alert">
            <span>{loadError}</span>
            <button type="button" className="btn" onClick={() => refresh()}>Try again</button>
          </div>
        )}

        {loaded && (
          <>
            {editingStatuses ? (
              <EditStatusesPanel
                statuses={statuses}
                onDone={() => { setEditingStatuses(false); setLeftEditMode(true) }}
                onChanged={() => refresh()}
                onSessionExpired={onLoggedOut}
              />
            ) : (
              <CountsPanel report={report} statuses={statuses} focusEdit={leftEditMode}
                onEdit={() => setEditingStatuses(true)} />
            )}

            <section className="panel">
              {(count > 0 || filtered) && (
                <FilterBar statuses={statuses} applied={applied} onApply={applyFilters} onClear={clearFilters} />
              )}
              {count > 0 ? (
                <ApplicationsTable applications={applications} statuses={statuses} onOpen={openDetails} />
              ) : (
                <EmptyState
                  variant={filtered ? 'filtered' : 'none'}
                  summary={describeFilters(applied, statuses)}
                  onCreate={openCreate}
                  onClear={clearFilters}
                />
              )}
            </section>
          </>
        )}
      </main>

      {modal && (
        <Modal onClose={closeModal} labelledBy="modal-title" contentKey={modal.type}>
          {modal.type === 'details' && (
            <DetailsModal
              application={modal.application}
              statuses={statuses}
              onClose={closeModal}
              onEdit={() => setModal({ type: 'edit', application: modal.application })}
              onDeleted={afterChange}
              onSessionExpired={onLoggedOut}
            />
          )}
          {(modal.type === 'create' || modal.type === 'edit') && (
            <ApplicationFormModal
              key={modal.type}
              mode={modal.type}
              application={modal.application}
              statuses={statuses}
              onClose={closeModal}
              onCancel={() => setModal({ type: 'details', application: modal.application })}
              onSaved={afterChange}
              onStatusesChanged={() => refresh()}
              onSessionExpired={onLoggedOut}
            />
          )}
        </Modal>
      )}
    </div>
  )
}

/**
 * UploadPage — Assignment Files Hub
 * Upload PDF / DOCX / images → AI extracts info → time estimate sidebar
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { documentsAPI } from '../lib/api'
import client from '../api/client'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  Upload, FileText, Image, File as FileIcon, CheckCircle, XCircle,
  Clock, RefreshCw, Trash2, ArrowRight, BookOpen, Zap, Target,
  TrendingUp, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────

const FILE_ICON = {
  pdf:   <FileText size={22} className="text-red-400" />,
  image: <Image    size={22} className="text-blue-400" />,
  doc:   <FileText size={22} className="text-blue-300" />,
  txt:   <FileIcon  size={22} className="text-slate-400" />,
}

const STATUS_CFG = {
  pending:    { label: 'Queued',     cls: 'text-slate-400 bg-slate-700',         spin: false },
  processing: { label: 'Extracting', cls: 'text-blue-400 bg-blue-400/10',        spin: true  },
  done:       { label: 'Done',       cls: 'text-emerald-400 bg-emerald-400/10',   spin: false },
  failed:     { label: 'Failed',     cls: 'text-red-400 bg-red-400/10',           spin: false },
}

const COMPLEXITY_COLOR = {
  simple:  'text-emerald-400 bg-emerald-400/10',
  medium:  'text-amber-400   bg-amber-400/10',
  complex: 'text-red-400    bg-red-400/10',
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.cls}`}>
      {cfg.spin
        ? <RefreshCw size={10} className="animate-spin" />
        : status === 'done' ? <CheckCircle size={10} />
        : status === 'failed' ? <XCircle size={10} />
        : <Clock size={10} />}
      {cfg.label}
    </span>
  )
}

function TimeBar({ minutes, max }) {
  const pct = max > 0 ? Math.min(100, (minutes / max) * 100) : 0
  return (
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
      <div
        className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ─── Document Card ───────────────────────────────────────────────────────────

function DocCard({ doc, onSave, onReprocess, onRemove, savedIds, maxMinutes }) {
  const [expanded, setExpanded] = useState(true)
  const ext = doc.extracted_data || {}
  const te  = ext.time_estimate
  const conf = Math.round((ext.confidence ?? 0) * 100)
  const isSaved = savedIds.has(doc.id)
  const isProcessing = doc.extraction_status === 'processing' || doc.extraction_status === 'pending'

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all">
      {/* Header */}
      <button
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-800/30 transition-all text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
          {FILE_ICON[doc.file_type] || FILE_ICON.txt}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate">
            {ext.title || doc.original_filename || 'Unknown file'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.original_filename}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {te && (
            <div className="hidden sm:flex items-center gap-1.5 text-amber-400 text-sm font-bold">
              <Clock size={13} />
              {te.estimated_hours}h
            </div>
          )}
          <StatusBadge status={doc.extraction_status} />
          {expanded ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-800/60">
          {isProcessing && (
            <div className="mt-4 flex items-center gap-2 text-blue-400 text-xs bg-blue-400/5 rounded-lg px-3 py-2.5">
              <RefreshCw size={12} className="animate-spin" />
              Extracting content with AI — this takes a few seconds...
            </div>
          )}

          {doc.extraction_status === 'failed' && (
            <div className="mt-4 flex items-center justify-between bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2.5">
              <span className="text-xs text-red-400">{doc.extraction_error || 'Extraction failed'}</span>
              <button
                onClick={() => onReprocess(doc.id)}
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-all"
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {doc.extraction_status === 'done' && (
            <div className="mt-4 space-y-4">
              {/* Extracted fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Subject',   value: ext.subject },
                  { label: 'Type',      value: ext.task_type },
                  { label: 'Deadline',  value: (() => { try { return ext.deadline ? format(new Date(ext.deadline), 'MMM d, yyyy') : null } catch { return ext.deadline || null } })() },
                  { label: 'Confidence',value: conf > 0 ? `${conf}%` : null },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-800 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-sm font-medium ${value ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                      {value || '—'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time estimate */}
              {te && (
                <div className="bg-slate-800/60 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-amber-400" />
                      <span className="text-sm font-semibold text-white">Time Estimate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-amber-400">{te.estimated_hours}</span>
                      <span className="text-sm text-slate-500">hours</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${COMPLEXITY_COLOR[te.complexity] || COMPLEXITY_COLOR.medium}`}>
                        {te.complexity}
                      </span>
                    </div>
                  </div>

                  <TimeBar minutes={te.estimated_minutes} max={maxMinutes} />

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Reading</p>
                      <p className="text-xs font-semibold text-blue-400 mt-0.5">{te.reading_time_minutes}m</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Work</p>
                      <p className="text-xs font-semibold text-amber-400 mt-0.5">{te.work_time_minutes}m</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Confidence</p>
                      <p className="text-xs font-semibold text-emerald-400 mt-0.5">{Math.round((te.confidence_score ?? 0) * 100)}%</p>
                    </div>
                  </div>

                  {te.has_mathematical_content && (
                    <div className="mt-2 flex gap-2">
                      <span className="text-[10px] px-2 py-1 rounded bg-blue-400/10 text-blue-400">📐 Math content</span>
                    </div>
                  )}
                  {te.has_code_content && (
                    <div className="mt-2 flex gap-2">
                      <span className="text-[10px] px-2 py-1 rounded bg-green-400/10 text-green-400">💻 Code content</span>
                    </div>
                  )}
                  {te.recommended_sessions?.recommendation && (
                    <div className="mt-3 p-2.5 bg-blue-400/5 border border-blue-400/10 rounded-lg flex items-start gap-2">
                      <TrendingUp size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-blue-300">{te.recommended_sessions.recommendation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {isSaved ? (
                  <div className="flex-1 flex items-center justify-center gap-2 py-2.5 text-emerald-400 text-sm font-medium bg-emerald-400/5 rounded-xl border border-emerald-400/20">
                    <CheckCircle size={15} /> Saved to Assignments
                  </div>
                ) : (
                  <button
                    onClick={() => onSave(doc.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-400 text-slate-900 font-semibold rounded-xl hover:bg-amber-300 transition-all text-sm"
                  >
                    Save as Assignment <ArrowRight size={14} />
                  </button>
                )}
                <button
                  onClick={() => onRemove(doc.id)}
                  title="Remove from list"
                  className="p-2.5 text-slate-600 hover:text-red-400 border border-slate-800 rounded-xl transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function UploadPage() {
  const [docs, setDocs] = useState([])
  const [savedIds, setSavedIds] = useState(new Set())
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const inputRef = useRef()
  const pollRef = useRef(null)

  // Load existing documents on mount
  useEffect(() => {
    documentsAPI.list()
      .then(r => setDocs(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingExisting(false))
  }, [])

  // Auto-poll documents that are still processing
  useEffect(() => {
    const needsPoll = docs.some(d => d.extraction_status === 'processing' || d.extraction_status === 'pending')
    clearInterval(pollRef.current)
    if (!needsPoll) return
    pollRef.current = setInterval(async () => {
      const updated = await Promise.all(
        docs.map(async d => {
          if (d.extraction_status !== 'processing' && d.extraction_status !== 'pending') return d
          try { const { data } = await client.get(`/documents/${d.id}`); return data }
          catch { return d }
        })
      )
      setDocs(updated)
    }, 2500)
    return () => clearInterval(pollRef.current)
  }, [docs])

  const uploadFiles = useCallback(async (files) => {
    const list = Array.from(files)
    if (!list.length) return
    setUploading(true)
    const results = []
    for (const file of list) {
      try {
        const { data } = await documentsAPI.upload(file)
        results.push(data)
        toast.success(`${file.name} uploaded`)
      } catch (err) {
        toast.error(`${file.name}: ${err.response?.data?.detail || 'Upload failed'}`)
      }
    }
    setDocs(prev => {
      const ids = new Set(prev.map(d => d.id))
      return [...results.filter(d => !ids.has(d.id)), ...prev]
    })
    setUploading(false)
  }, [])

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    uploadFiles(e.dataTransfer.files)
  }

  async function handleSave(docId) {
    try {
      const { data } = await documentsAPI.saveAsAssignment(docId)
      setSavedIds(prev => new Set([...prev, docId]))
      toast.success(`"${data.title}" added to Assignments`)
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed') }
  }

  async function handleReprocess(docId) {
    try {
      await documentsAPI.reprocess(docId)
      setDocs(prev => prev.map(d => d.id === docId
        ? { ...d, extraction_status: 'pending', extraction_error: null }
        : d
      ))
      toast.success('Re-processing started...')
    } catch { toast.error('Reprocess failed') }
  }

  function handleRemove(docId) {
    setDocs(prev => prev.filter(d => d.id !== docId))
    setSavedIds(prev => { const s = new Set(prev); s.delete(docId); return s })
  }

  async function handleSaveAll() {
    const unsaved = docs.filter(d => d.extraction_status === 'done' && !savedIds.has(d.id))
    if (!unsaved.length) { toast('All done files are already saved'); return }
    await Promise.all(unsaved.map(d => handleSave(d.id)))
  }

  // Sidebar derived values
  const doneDocs     = docs.filter(d => d.extraction_status === 'done')
  const withEstimate = doneDocs.filter(d => d.extracted_data?.time_estimate)
  const totalMinutes = withEstimate.reduce((sum, d) => sum + (d.extracted_data.time_estimate.estimated_minutes || 0), 0)
  const totalHours   = (totalMinutes / 60).toFixed(1)
  const maxMinutes   = Math.max(...withEstimate.map(d => d.extracted_data.time_estimate.estimated_minutes || 0), 1)
  const processingCount = docs.filter(d => d.extraction_status === 'processing' || d.extraction_status === 'pending').length
  const unsavedCount    = docs.filter(d => d.extraction_status === 'done' && !savedIds.has(d.id)).length

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl text-white">Assignment Files</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload PDF, DOCX, or images — AI extracts info and estimates completion time
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* ── LEFT: drop zone + doc list ── */}
        <div className="space-y-5">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
              ${dragging ? 'border-amber-400 bg-amber-400/5' : 'border-slate-700 bg-slate-900 hover:border-slate-600'}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
              onChange={e => { uploadFiles(e.target.files); e.target.value = '' }}
            />
            <Upload size={36} className={`mx-auto mb-3 ${dragging ? 'text-amber-400' : 'text-slate-600'}`} />
            {uploading
              ? <p className="text-amber-400 font-medium text-sm animate-pulse">Uploading…</p>
              : <>
                  <p className="text-slate-300 font-medium">Drop files here or click to browse</p>
                  <p className="text-slate-500 text-xs mt-1">PDF · DOC · DOCX · PNG · JPG · TXT — multiple files supported</p>
                </>
            }
          </div>

          {/* Processing banner */}
          {processingCount > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-400/5 border border-blue-400/20 rounded-xl text-sm text-blue-300">
              <RefreshCw size={14} className="animate-spin flex-shrink-0" />
              Extracting {processingCount} document{processingCount > 1 ? 's' : ''}… auto-refreshing
            </div>
          )}

          {/* Loading skeleton */}
          {loadingExisting && (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loadingExisting && docs.length === 0 && (
            <div className="text-center py-16 text-slate-600">
              <FileIcon size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No documents yet — upload your first assignment file above</p>
            </div>
          )}

          {/* Doc cards */}
          {docs.map(doc => (
            <DocCard
              key={doc.id}
              doc={doc}
              onSave={handleSave}
              onReprocess={handleReprocess}
              onRemove={handleRemove}
              savedIds={savedIds}
              maxMinutes={maxMinutes}
            />
          ))}
        </div>

        {/* ── RIGHT: sticky sidebar ── */}
        <div className="mt-6 lg:mt-0 space-y-4 lg:sticky lg:top-6">
          {/* Total workload card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Total Workload</h3>
            </div>

            {withEstimate.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4">
                Upload documents to see time estimates
              </p>
            ) : (
              <>
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-amber-400">{totalHours}</p>
                  <p className="text-xs text-slate-500 mt-0.5">hours total</p>
                  <p className="text-[10px] text-slate-600 mt-1">{totalMinutes} min across {withEstimate.length} file{withEstimate.length !== 1 ? 's' : ''}</p>
                </div>

                <div className="space-y-2.5">
                  {withEstimate.map(doc => {
                    const te = doc.extracted_data.time_estimate
                    const pct = Math.min(100, Math.round((te.estimated_minutes / maxMinutes) * 100))
                    return (
                      <div key={doc.id}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-slate-400 truncate max-w-[160px]">
                            {doc.extracted_data?.title || doc.original_filename}
                          </p>
                          <p className="text-xs font-bold text-amber-400 flex-shrink-0 ml-2">{te.estimated_hours}h</p>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Workload breakdown */}
                <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-slate-800">
                  {[
                    {
                      label: 'Reading',
                      val: withEstimate.reduce((s, d) => s + (d.extracted_data.time_estimate.reading_time_minutes || 0), 0),
                      cls: 'text-blue-400',
                    },
                    {
                      label: 'Work',
                      val: withEstimate.reduce((s, d) => s + (d.extracted_data.time_estimate.work_time_minutes || 0), 0),
                      cls: 'text-amber-400',
                    },
                    {
                      label: 'Questions',
                      val: withEstimate.reduce((s, d) => s + (d.extracted_data.time_estimate.question_count || 0), 0),
                      cls: 'text-emerald-400',
                      suffix: '',
                    },
                  ].map(({ label, val, cls, suffix }) => (
                    <div key={label} className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                      <p className={`text-sm font-bold mt-0.5 ${cls}`}>{val}{suffix ?? 'm'}</p>
                    </div>
                  ))}
                </div>

                {/* Complexity mix */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {['simple', 'medium', 'complex'].map(level => {
                    const count = withEstimate.filter(d => d.extracted_data.time_estimate.complexity === level).length
                    if (!count) return null
                    return (
                      <span key={level} className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${COMPLEXITY_COLOR[level]}`}>
                        {count} {level}
                      </span>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Save all CTA */}
          {unsavedCount > 0 && (
            <button
              onClick={handleSaveAll}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-400 text-slate-900 font-bold rounded-xl hover:bg-amber-300 transition-all text-sm"
            >
              <BookOpen size={15} />
              Save {unsavedCount} assignment{unsavedCount !== 1 ? 's' : ''} to Planner
            </button>
          )}

          {/* Tips */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400 mb-2">What gets extracted</p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              {['Subject & task type', 'Deadline dates', 'Number of questions', 'Math / code content', 'Time estimate with breakdown'].map(t => (
                <li key={t} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-amber-400 rounded-full flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

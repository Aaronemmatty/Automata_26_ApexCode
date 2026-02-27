import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { uploadDocument, saveAsAssignment } from '../api/documents'
import client from '../api/client'
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import TimeEstimateCard from '../components/assignments/TimeEstimateCard'
import ManualTimeEstimate from '../components/assignments/ManualTimeEstimate'

export default function UploadPage() {
  const [searchParams] = useSearchParams()
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)  // extraction result
  const [saved, setSaved] = useState(false)
  const [timeEstimate, setTimeEstimate] = useState(null)
  const [uploadMode, setUploadMode] = useState('extract')
  const [estimateProgress, setEstimateProgress] = useState(0)
  const inputRef = useRef()

  useEffect(() => {
    const docId = searchParams.get('doc')
    if (!docId) return

    let cancelled = false
    ;(async () => {
      try {
        const { data } = await client.get(`/documents/${docId}`)
        if (cancelled) return
        setResult(data)
        setTimeEstimate(data?.extracted_data?.time_estimate || null)
        setSaved(false)
      } catch {
        if (!cancelled) toast.error('Unable to load selected document')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams])

  function resetForNewUpload() {
    setFile(null)
    setResult(null)
    setSaved(false)
    setTimeEstimate(null)
    setUploading(false)
    setEstimateProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) {
      setFile(f)
      setResult(null)
      setSaved(false)
      setTimeEstimate(null)
      setEstimateProgress(0)
    }
  }

  useEffect(() => {
    let progressTimer
    const shouldTrackEstimateProgress =
      uploadMode === 'estimate' &&
      (uploading || result?.extraction_status === 'processing' || result?.extraction_status === 'pending')

    if (shouldTrackEstimateProgress) {
      progressTimer = setInterval(() => {
        setEstimateProgress((prev) => (prev >= 92 ? prev : prev + 4))
      }, 350)
    }

    return () => clearInterval(progressTimer)
  }, [uploading, result?.extraction_status, uploadMode])

  useEffect(() => {
    let timer;
    if (result && (uploading || result.extraction_status === 'processing' || result.extraction_status === 'pending')) {
      timer = setInterval(async () => {
        try {
          const { data } = await client.get(`/documents/${result.id}`)
          setResult(data)
          setTimeEstimate(data?.extracted_data?.time_estimate || null)
          if (data.extraction_status === 'done' || data.extraction_status === 'failed') {
            clearInterval(timer)
            if (data.extraction_status === 'failed') toast.error('Extraction failed: ' + data.extraction_error)
            if (uploadMode === 'estimate' && data.extraction_status === 'done') {
              setEstimateProgress(100)
            }
            setUploading(false)
          }
        } catch (err) {
          clearInterval(timer)
          setUploading(false)
          setEstimateProgress(0)
        }
      }, 2000)
    }
    return () => clearInterval(timer)
  }, [result, uploading, uploadMode])

  async function handleUpload(mode = 'extract') {
    if (!file) return
    setUploadMode(mode)
    setUploading(true); setResult(null); setSaved(false); setTimeEstimate(null)
    setEstimateProgress(mode === 'estimate' ? 8 : 0)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await uploadDocument(formData)
      setResult(data)
      setTimeEstimate(data?.extracted_data?.time_estimate || null)
      toast.success(mode === 'estimate' ? 'File uploaded for time estimation...' : 'Document uploaded, processing...')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
      setUploading(false)
    } finally {
      // Keep uploading true until extraction is done or failed? 
      // Actually, let useEffect handle it.
    }
  }

  async function handleSaveAsAssignment() {
    if (!result) return
    try {
      const { data } = await saveAsAssignment(result.id)
      setSaved(true)
      toast.success(`Saved: "${data.title}"`)
    } catch { toast.error('Failed to save assignment') }
  }

  const ext = result?.extracted_data || {}
  const confPct = Math.round((result?.extracted_data?.confidence ?? 0) * 100)

  return (
    <div className="w-full max-w-6xl mx-auto p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl text-white">Upload Document</h1>
        <p className="text-slate-400 text-sm mt-1">Upload a PDF, image, or text file — AI will extract academic info automatically</p>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-10 lg:p-12 text-center transition-all cursor-pointer ${dragging ? 'border-amber-400 bg-amber-400/5' : 'border-slate-700 bg-slate-900 hover:border-slate-600'}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
          onChange={e => {
            const selectedFile = e.target.files[0]
            if (selectedFile) {
              setFile(selectedFile)
              setResult(null)
              setSaved(false)
              setTimeEstimate(null)
              setEstimateProgress(0)
            }
          }} />
        <Upload size={36} className={`mx-auto mb-4 ${dragging ? 'text-amber-400' : 'text-slate-600'}`} />
        {file
          ? <div>
            <p className="text-white font-medium">{file.name}</p>
            <p className="text-slate-500 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
          </div>
          : <div>
            <p className="text-slate-300 font-medium">Drop your file here</p>
            <p className="text-slate-500 text-sm mt-1">or click to browse · PDF, DOC, DOCX, PNG, JPG, TXT</p>
          </div>
        }
      </div>

      {file && !result && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => handleUpload('extract')} disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-400 text-slate-900 font-semibold rounded-xl hover:bg-amber-300 transition-all disabled:opacity-50">
            {uploading && uploadMode === 'extract'
              ? <><div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> Extracting...</>
              : <><Upload size={16} /> Extract Academic Data</>}
          </button>

          <button onClick={() => handleUpload('estimate')} disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 text-slate-100 font-semibold rounded-xl hover:bg-slate-700 transition-all border border-slate-700 disabled:opacity-50">
            {uploading && uploadMode === 'estimate'
              ? <><div className="w-4 h-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin" /> Estimating...</>
              : <><FileText size={16} /> Upload for Time Estimation</>}
          </button>
          </div>

          {uploadMode === 'estimate' && uploading && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">Analyzing assignment for time estimate...</p>
                <p className="text-xs text-amber-400 font-medium">{estimateProgress}%</p>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${estimateProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={`grid gap-6 items-stretch ${(timeEstimate || (uploadMode === 'estimate' && uploading)) ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-white">Extraction Results</h2>
              <div className={`flex items-center gap-1.5 text-sm font-medium ${confPct >= 60 ? 'text-emerald-400' : confPct >= 30 ? 'text-amber-400' : 'text-red-400'}`}>
                {confPct >= 60 ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {confPct}% confidence
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Subject', value: ext.subject },
                { label: 'Task Type', value: ext.task_type },
                { label: 'Deadline', value: ext.deadline },
                { label: 'Title', value: ext.title },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-800 rounded-xl p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                  <p className={`text-sm font-medium ${value ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                    {value || 'Not detected'}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-2">
              {!saved
                ? <button onClick={handleSaveAsAssignment}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-semibold rounded-xl hover:bg-emerald-400/20 transition-all text-sm">
                  Save as Assignment <ArrowRight size={15} />
                </button>
                : <div className="flex items-center justify-center gap-2 py-3 text-emerald-400 text-sm font-medium">
                  <CheckCircle size={16} /> Saved to Assignments
                </div>
              }

              <button onClick={resetForNewUpload}
                className="w-full mt-3 py-2.5 text-slate-500 hover:text-slate-300 text-sm transition-all">
                Upload another file
              </button>
            </div>
          </div>

          {timeEstimate && <TimeEstimateCard estimate={timeEstimate} />}

          {!timeEstimate && uploadMode === 'estimate' && uploading && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col justify-center">
              <div className="mb-4">
                <h3 className="text-white font-semibold">Time Estimation In Progress</h3>
                <p className="text-xs text-slate-400 mt-1">Analyzing document content and generating estimate...</p>
              </div>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${estimateProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-slate-500">{result?.extraction_status || 'processing'}</span>
                <span className="text-amber-400 font-medium">{estimateProgress}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">What gets extracted?</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
          {['Subject name (Physics, CS, Math...)', 'Task type (assignment, exam, quiz)', 'Deadline dates (any format)', 'Document title / heading'].map(t => (
            <div key={t} className="flex items-center gap-2"><div className="w-1 h-1 bg-amber-400 rounded-full" />{t}</div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <ManualTimeEstimate />
      </div>
    </div>
  )
}

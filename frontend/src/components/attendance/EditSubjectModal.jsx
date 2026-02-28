import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Input, Modal } from '../ui/components'

export function EditSubjectModal({ open, onClose, subject, onSave, loading }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => {
    if (!subject) return
    setName(subject.subject_name || '')
    setCode(subject.subject_code || '')
  }, [subject])

  function handleSubmit(event) {
    event.preventDefault()

    if (!name.trim()) {
      toast.error('Subject name is required')
      return
    }

    onSave({ name: name.trim(), code: code.trim() || null })
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Subject">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Subject Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Data Structures"
          required
        />

        <Input
          label="Subject Code (Optional)"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="e.g. CS301"
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}

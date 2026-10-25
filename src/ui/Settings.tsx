import { useState, type ChangeEvent } from 'react'
import { Download, Sparkles, Upload } from 'lucide-react'
import { todayIso } from '../domain/dates'
import { actions } from '../store/store'
import { Modal } from './components'

const row = 'flex w-full items-center gap-3 rounded-2xl bg-white/[0.05] px-4 py-3.5 text-left font-medium ring-1 ring-white/10 hover:bg-white/10'

export function Settings({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  function exportData() {
    const blob = new Blob([actions.exportData()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `muno-${todayIso()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function importData(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !confirm('Remplacer toutes les données actuelles par ce fichier ?')) return
    try {
      actions.importData(await file.text())
      setMessage({ ok: true, text: 'Données importées.' })
    } catch {
      setMessage({ ok: false, text: 'Fichier invalide, rien n’a été modifié.' })
    }
  }

  function loadDemo() {
    if (!confirm('Remplacer toutes les données actuelles par les exemples ?')) return
    actions.loadDemo()
    setMessage({ ok: true, text: 'Exemples chargés.' })
  }

  return (
    <Modal title="Réglages" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-white/50">Tout reste dans ce navigateur. Exporte de temps en temps pour ne rien perdre.</p>
        <button type="button" onClick={exportData} className={row}>
          <Download size={18} className="text-white/50" /> Exporter mes données
        </button>
        <label className={`cursor-pointer ${row}`}>
          <Upload size={18} className="text-white/50" /> Importer un fichier JSON
          <input type="file" accept="application/json,.json" onChange={importData} className="hidden" />
        </label>
        <button type="button" onClick={loadDemo} className={row}>
          <Sparkles size={18} className="text-fuchsia-300" /> Charger des exemples
        </button>
        {message && <p className={`text-sm ${message.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{message.text}</p>}
      </div>
    </Modal>
  )
}

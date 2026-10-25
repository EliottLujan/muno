import { useState, type ChangeEvent } from 'react'
import { todayIso } from '../domain/dates'
import { actions } from '../store/store'
import { Modal } from './components'

export function Settings({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  function exportData() {
    const blob = new Blob([actions.exportData()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `nuno-${todayIso()}.json`
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

  return (
    <Modal title="Réglages" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-slate-500">Les données sont stockées uniquement dans ce navigateur. Exporte-les pour les sauvegarder.</p>
        <button type="button" onClick={exportData} className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white">
          Exporter (JSON)
        </button>
        <label className="block w-full cursor-pointer rounded-xl bg-slate-100 py-2.5 text-center font-semibold">
          Importer un fichier JSON
          <input type="file" accept="application/json,.json" onChange={importData} className="hidden" />
        </label>
        <button
          type="button"
          onClick={() => {
            if (!confirm('Remplacer toutes les données actuelles par les exemples ?')) return
            actions.loadDemo()
            setMessage({ ok: true, text: 'Exemples chargés.' })
          }}
          className="w-full rounded-xl py-2.5 text-sm text-indigo-600 underline"
        >
          Charger des exemples
        </button>
        {message && <p className={`text-sm ${message.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{message.text}</p>}
      </div>
    </Modal>
  )
}

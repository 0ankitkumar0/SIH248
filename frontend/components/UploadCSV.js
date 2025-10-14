import React, { useState } from 'react'

function parseCSV(text) {
  if (!text) return []
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return []
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const cols = line.split(',')
    const obj = {}
    headers.forEach((h, i) => {
      let val = cols[i] ? cols[i].trim() : ''
      // convert numeric where possible
      if (val !== '' && !isNaN(val)) val = Number(val)
      obj[h] = val
    })
    return obj
  })
}

export default function UploadCSV({ onGenerate }) {
  const [fileText, setFileText] = useState(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const txt = ev.target.result
      setFileText(txt)
      const parsed = parseCSV(txt)
      onGenerate({ orders: parsed })
    }
    reader.readAsText(file)
  }

  const loadSample = async () => {
    try {
      const res = await fetch('/sample_dataset.csv')
      if (!res.ok) {
        const msg = `Failed to load sample_dataset.csv: ${res.status} ${res.statusText}`
        console.error(msg)
        alert(msg)
        return
      }
      const txt = await res.text()
      setFileText(txt)
      const parsed = parseCSV(txt)
      onGenerate({ orders: parsed })
    } catch (err) {
      console.error('Failed to load sample', err)
      alert('Failed to load sample_dataset.csv. Please check the console for details.')
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h4 className="font-semibold mb-2">Upload Input Data</h4>
      <input type="file" accept=".csv" onChange={handleFile} className="mb-4" />
      <div className="flex gap-2">
        <button onClick={loadSample} className="px-3 py-2 bg-gray-200 rounded">Load Sample</button>
      </div>
    </div>
  )
}

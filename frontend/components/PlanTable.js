import React from 'react'

export default function PlanTable({ plan }) {
  if (!plan) return null
  const downloadCSV = () => {
    const headers = ['rake_id','wagons','destination','material','cost']
    const lines = [headers.join(',')]
    plan.forEach(p => {
      const wagons = Array.isArray(p.wagons) ? p.wagons.join('|') : p.wagons
      lines.push([p.rake_id, `"${wagons}"`, p.destination, p.material, p.cost].join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rake_plan.csv'
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="bg-white rounded shadow p-4">
      <h4 className="font-semibold mb-2">Optimized Rake Plan</h4>
      <div className="mb-2">
        <button onClick={downloadCSV} className="px-3 py-1 bg-gray-200 rounded text-sm">Download CSV</button>
      </div>
      <table className="min-w-full table-auto">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left">Rake ID</th>
            <th className="px-2 py-1 text-left">Wagons</th>
            <th className="px-2 py-1 text-left">Destination</th>
            <th className="px-2 py-1 text-left">Material</th>
            <th className="px-2 py-1 text-left">Cost</th>
          </tr>
        </thead>
        <tbody>
          {plan.map((r) => (
            <tr key={r.rake_id}>
              <td className="px-2 py-1">{r.rake_id}</td>
              <td className="px-2 py-1">{r.wagons.join(',')}</td>
              <td className="px-2 py-1">{r.destination}</td>
              <td className="px-2 py-1">{r.material}</td>
              <td className="px-2 py-1">{r.cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

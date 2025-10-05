import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Billing, Clinic } from './types'
import dayjs from 'dayjs'
import { exportCSV } from './utils/csv'

const CLINICS: Clinic[] = ['Hemac','MM Balwyn','FNMC','NovaBody']

function currency(n: number){
  return new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n||0)
}

export default function App(){
  const today = dayjs().format('YYYY-MM-DD')

  // Form state
  const [billDate, setBillDate] = useState<string>(today)
  const [clinic, setClinic] = useState<Clinic>('Hemac')
  const [gross, setGross] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Report filters
  const [from, setFrom] = useState<string>(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [to, setTo] = useState<string>(today)
  const [filterClinic, setFilterClinic] = useState<string>('All')

  const [rows, setRows] = useState<Billing[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  async function load(){
    setLoading(true); setError('')
    const query = supabase.from('billings').select('*').gte('bill_date', from).lte('bill_date', to).order('bill_date', { ascending: true })
    const { data, error } = await (filterClinic==='All' ? query : query.eq('clinic', filterClinic))
    if(error){ setError(error.message); setRows([]) } else { setRows((data||[]) as Billing[]) }
    setLoading(false)
  }

  useEffect(()=>{ load() }, [from,to,filterClinic])

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault()
    const grossVal = Number(gross)
    if(isNaN(grossVal)){ alert('Enter a valid gross billing number'); return }

    if(editingId){
      const { error } = await supabase.from('billings').update({ bill_date: billDate, clinic, gross_billing: grossVal, notes }).eq('id', editingId)
      if(error) return alert(error.message)
      setEditingId(null)
    } else {
      const { error } = await supabase.from('billings').insert({ user_name: 'Dr Premila Hewage', bill_date: billDate, clinic, gross_billing: grossVal, notes })
      if(error) return alert(error.message)
    }
    setGross(''); setNotes(''); setClinic('Hemac'); setBillDate(today)
    await load()
  }

  async function editRow(r: Billing){
    setEditingId(r.id)
    setBillDate(r.bill_date)
    setClinic(r.clinic)
    setGross(String(r.gross_billing))
    setNotes(r.notes || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteRow(id: string){
    if(!confirm('Delete this entry?')) return
    const { error } = await supabase.from('billings').delete().eq('id', id)
    if(error) return alert(error.message)
    await load()
  }

  const total = useMemo(()=> rows.reduce((s,r)=> s + Number(r.gross_billing||0), 0), [rows])

  function exportReport(){
    exportCSV(`novabody-billing-${from}_to_${to}.csv`, rows.map(r=>({
      date: r.bill_date, clinic: r.clinic, gross: r.gross_billing, notes: r.notes ?? ''
    })))
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto max-w-4xl p-6 flex items-center gap-4">
        <img src="/novabody-logo.png" alt="NovaBody" className="h-10 w-auto" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}} />
        <div>
          <h1 className="text-2xl font-bold">NovaBody — Daily Billing</h1>
          <p className="text-sm text-slate-600">Dr Premila Hewage</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        {/* Entry form */}
        <section className="bg-white rounded-2xl shadow p-4 md:p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit entry' : 'Add entry'}</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Date</label>
              <input type="date" value={billDate} onChange={e=>setBillDate(e.target.value)} className="border rounded-xl px-3 py-2" required />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Clinic</label>
              <select value={clinic} onChange={e=>setClinic(e.target.value as Clinic)} className="border rounded-xl px-3 py-2">
                {CLINICS.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Gross billing (AUD)</label>
              <input type="number" step="0.01" inputMode="decimal" placeholder="0.00" value={gross} onChange={e=>setGross(e.target.value)} className="border rounded-xl px-3 py-2" required />
            </div>
            <div className="md:col-span-2 flex flex-col">
              <label className="text-sm font-medium mb-1">Notes (optional)</label>
              <input type="text" value={notes} onChange={e=>setNotes(e.target.value)} className="border rounded-xl px-3 py-2" placeholder="e.g., session details" />
            </div>
            <div className="md:col-span-5 flex gap-3">
              <button type="submit" className="px-4 py-2 rounded-xl bg-novablue text-white hover:opacity-90">{editingId ? 'Save changes' : 'Add entry'}</button>
              {editingId && (
                <button type="button" onClick={()=>{ setEditingId(null); setGross(''); setNotes(''); setClinic('Hemac'); setBillDate(today) }} className="px-4 py-2 rounded-xl border">Cancel edit</button>
              )}
            </div>
          </form>
        </section>

        {/* Filters */}
        <section className="bg-white rounded-2xl shadow p-4 md:p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">Reports</h2>
          <div className="grid gap-4 md:grid-cols-5 items-end">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">From</label>
              <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded-xl px-3 py-2" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">To</label>
              <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded-xl px-3 py-2" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Clinic</label>
              <select value={filterClinic} onChange={e=>setFilterClinic(e.target.value)} className="border rounded-xl px-3 py-2">
                <option>All</option>
                {CLINICS.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button onClick={load} className="px-4 py-2 rounded-xl border">Refresh</button>
              <button onClick={exportReport} className="px-4 py-2 rounded-xl bg-novared text-white hover:opacity-90">Export CSV</button>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="bg-white rounded-2xl shadow p-2 md:p-4">
          {loading ? (
            <div className="p-6">Loading…</div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Clinic</th>
                    <th className="text-right p-2">Gross</th>
                    <th className="text-left p-2">Notes</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2">{dayjs(r.bill_date).format('DD MMM YYYY')}</td>
                      <td className="p-2">{r.clinic}</td>
                      <td className="p-2 text-right">{currency(Number(r.gross_billing))}</td>
                      <td className="p-2">{r.notes}</td>
                      <td className="p-2 flex gap-2">
                        <button onClick={()=>editRow(r)} className="px-3 py-1 rounded-lg border">Edit</button>
                        <button onClick={()=>deleteRow(r.id)} className="px-3 py-1 rounded-lg border">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="p-2" colSpan={2}>Total</td>
                    <td className="p-2 text-right">{currency(total)}</td>
                    <td className="p-2" colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-4xl p-6 text-xs text-slate-500">
        © {new Date().getFullYear()} NovaBody Medical — Simple daily billing tracker
      </footer>
    </div>
  )
}

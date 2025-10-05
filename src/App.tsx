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
    const query = supabase
      .from('billings')
      .select('*')
      .gte('bill_date', from)
      .lte('bill_date', to)
      .order('bill_date', { ascending: true })

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
      const { error } = await supabase.from('billings')
        .update({ bill_date: billDate, clinic, gross_billing: grossVal, notes })
        .eq('id', editingId)
      if(error) return alert(error.message)
      setEditingId(null)
    } else {
      const { error } = await supabase.from('billings')
        .insert({ user_name: 'Dr Premila Hewage', bill_date: billDate, clinic, gross_billing: grossVal, notes })
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
    <div className="min-h-screen text-slate-900">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white">
        <header className="mx-auto max-w-5xl px-6 py-5 flex items-center gap-4">
          <img
            src="/novabody-logo.png"
            alt="NovaBody"
            className="h-10 w-auto"
            onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}
          />
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">NovaBody — Daily Billing</h1>
            <p className="text-xs md:text-sm text-slate-200">Dr Premila Hewage</p>
          </div>
          {/* Install button appears here if you added the optional code in App earlier */}
        </header>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-6 space-y-6">
        {/* Entry form */}
        <section className="card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editingId ? 'Edit entry' : 'Add entry'}
            </h2>
            <span className="tag">Simple · Fast</span>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Date</label>
              <input type="date" value={billDate} onChange={e=>setBillDate(e.target.value)} className="input" required />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Clinic</label>
              <select value={clinic} onChange={e=>setClinic(e.target.value as Clinic)} className="select">
                {CLINICS.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Gross billing (AUD)</label>
              <input type="number" step="0.01" inputMode="decimal" placeholder="0.00" value={gross} onChange={e=>setGross(e.target.value)} className="input" required />
            </div>
            <div className="md:col-span-2 flex flex-col">
              <label className="text-sm font-medium mb-1">Notes (optional)</label>
              <input type="text" value={notes} onChange={e=>setNotes(e.target.value)} className="input" placeholder="e.g., session details" />
            </div>
            <div className="md:col-span-5 flex gap-3">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Save changes' : 'Add entry'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={()=>{
                    setEditingId(null); setGross(''); setNotes(''); setClinic('Hemac'); setBillDate(today)
                  }}
                  className="btn btn-ghost"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Reports */}
        <section className="card p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Reports</h2>
          <div className="grid gap-4 md:grid-cols-5 items-end">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">From</label>
              <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="input" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">To</label>
              <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="input" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Clinic</label>
              <select value={filterClinic} onChange={e=>setFilterClinic(e.target.value)} className="select">
                <option>All</option>
                {CLINICS.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button onClick={load} className="btn btn-ghost">Refresh</button>
              <button onClick={exportReport} className="btn bg-accent-500 text-white hover:opacity-90">Export CSV</button>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="card p-0">
          {loading ? (
            <div className="p-6">Loading…</div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : (
            <div className="overflow-auto">
              <table className="table min-w-full text-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Clinic</th>
                    <th className="text-right">Gross</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(odd)]:bg-slate-50">
                  {rows.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2">{dayjs(r.bill_date).format('DD MMM YYYY')}</td>
                      <td className="p-2">
                        <span className="tag">{r.clinic}</span>
                      </td>
                      <td className="p-2 text-right font-medium">{currency(Number(r.gross_billing))}</td>
                      <td className="p-2">{r.notes}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button onClick={()=>editRow(r)} className="btn btn-ghost">Edit</button>
                          <button onClick={()=>deleteRow(r.id)} className="btn btn-ghost">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold bg-slate-100">
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

      <footer className="mx-auto max-w-5xl px-6 py-6 text-xs text-slate-500">
        © {new Date().getFullYear()} NovaBody Medical — Simple daily billing tracker
      </footer>
    </div>
  )
}

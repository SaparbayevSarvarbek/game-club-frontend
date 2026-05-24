import { FormEvent, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'

const AdminProfilePage = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState('')

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errorMsg = setStatus('')
    try {
      await api.updateProfile({ current_password: currentPassword, new_username: newUsername || undefined, new_password: newPassword || undefined })
      setStatus('Profil muvaffaqiyatli yangilandi')
    } catch (err: any) {
      setStatus(err?.response?.data?.detail || 'Profilni yangilashda xatolik')
    }
  }

  return (
    <Layout>
      <section className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-slate-900">Admin sozlamalari</h2>
        <p className="mt-2 text-sm text-slate-500">Joriy admin akkauntning foydalanuvchi nomini va parolini oʻzgartiring.</p>
        <form className="mt-6 grid gap-4 max-w-xl" onSubmit={handleUpdate}>
          <label className="block">
            <span className="text-sm text-slate-600">Joriy parol</span>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" required />
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Yangi foydalanuvchi nomi</span>
            <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Yangi parol</span>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <button className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">Profilni yangilash</button>
          {status && <p className={`mt-2 text-sm ${status.includes('muvaffaq') ? 'text-emerald-600' : 'text-rose-600'}`}>{status}</p>}
        </form>
      </section>
    </Layout>
  )
}

export default AdminProfilePage

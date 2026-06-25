import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import IconButton from '../components/common/IconButton'
import api from '../services/api'

const AdminUsersPage = () => {
  const [users, setUsers] = useState<any[]>([])
  const [payload, setPayload] = useState({ username: '', password: '', full_name: '', role: 'user', is_active: true })
  const [message, setMessage] = useState('')

  const load = async () => {
    const data = await api.fetchUsers()
    setUsers(data)
  }

  useEffect(() => {
    load().catch(console.error)
  }, [])

  const create = async () => {
    try {
      await api.createUser(payload)
      setPayload({ username: '', password: '', full_name: '', role: 'user', is_active: true })
      await load()
      setMessage('Foydalanuvchi muvaffaqiyatli yaratildi')
    } catch (error: any) {
      const detail = error?.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => item?.msg || JSON.stringify(item)).join('; ')
        : detail || 'Foydalanuvchini yaratishda xatolik'
      setMessage(message)
    }
  }

  const remove = async (id: number) => {
    if (window.confirm("Haqiqatdan ham bu foydalanuvchini o'chirmoqchimisiz?")) {
      await api.deleteUser(id)
      load()
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-900">Foydalanuvchi boshqaruvi</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <input
              required
              minLength={3}
              value={payload.username}
              onChange={(e) => setPayload((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="Foydalanuvchi nomi"
              className="rounded-2xl border border-slate-300 px-4 py-3"
            />
            <input
              type="password"
              required
              minLength={4}
              value={payload.password}
              onChange={(e) => setPayload((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Parol"
              className="rounded-2xl border border-slate-300 px-4 py-3"
            />
            <input
              required
              minLength={2}
              value={payload.full_name}
              onChange={(e) => setPayload((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="Toʻli ism"
              className="rounded-2xl border border-slate-300 px-4 py-3"
            />
            <select
              value={payload.role}
              onChange={(e) => setPayload((prev) => ({ ...prev, role: e.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="user">Foydalanuvchi</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={create}
              disabled={!payload.username || !payload.password || !payload.full_name || payload.username.length < 3 || payload.password.length < 4}
              className="col-span-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Foydalanuvchi yaratish
            </button>
          </div>
          {message && <p className={`mt-4 text-sm ${message.includes('muvaffaq') ? 'text-emerald-600' : 'text-rose-600'}`}>{message}</p>}
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-slate-900">Foydalanuvchilar roʻyxati</h3>
          <div className="mt-6 space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{user.username}</p>
                  <p className="text-sm text-slate-500">{user.full_name ?? 'Ism yoʻq'}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{user.role === 'admin' ? 'Admin' : 'Foydalanuvchi'} {user.is_active ? '• faol' : '• nofaol'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <IconButton onClick={() => remove(user.id)} title="O'chirish" variant="danger" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H10a1 1 0 00-1 1v3M4 7h16" /></svg>} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default AdminUsersPage

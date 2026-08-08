import { useEffect, useState } from 'react'
import Layout from '../components/common/Layout'
import IconButton from '../components/common/IconButton'
import api from '../services/api'
import { useToast } from '../components/common/Toast'
import { TrashIcon } from '@heroicons/react/24/outline'
import Card from '../components/ui/Card'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

const AdminUsersPage = () => {
  const toast = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [payload, setPayload] = useState({ username: '', password: '', full_name: '', role: 'user', is_active: true })

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
      toast.success('Foydalanuvchi muvaffaqiyatli yaratildi')
    } catch (error: any) {
      const detail = error?.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => item?.msg || JSON.stringify(item)).join('; ')
        : detail || 'Foydalanuvchini yaratishda xatolik'
      toast.error(message)
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
        <Card title="Foydalanuvchi boshqaruvi">
          <div className="mt-2 grid gap-4 md:grid-cols-3">
            <Field
              as="input"
              inputProps={{
                required: true,
                minLength: 3,
                value: payload.username,
                onChange: (e: any) => setPayload((prev) => ({ ...prev, username: e.target.value })),
                placeholder: 'Foydalanuvchi nomi',
              }}
            />
            <Field
              as="input"
              inputProps={{
                type: 'password',
                required: true,
                minLength: 4,
                value: payload.password,
                onChange: (e: any) => setPayload((prev) => ({ ...prev, password: e.target.value })),
                placeholder: 'Parol',
              }}
            />
            <Field
              as="input"
              inputProps={{
                required: true,
                minLength: 2,
                value: payload.full_name,
                onChange: (e: any) => setPayload((prev) => ({ ...prev, full_name: e.target.value })),
                placeholder: 'Toʻli ism',
              }}
            />
            <Field
              as="select"
              inputProps={{ value: payload.role, onChange: (e: any) => setPayload((prev) => ({ ...prev, role: e.target.value })) }}
            >
              <option value="user">Foydalanuvchi</option>
              <option value="admin">Admin</option>
            </Field>
            <Button
              onClick={create}
              className="md:col-span-2"
              disabled={!payload.username || !payload.password || !payload.full_name || payload.username.length < 3 || payload.password.length < 4}
            >
              Foydalanuvchi yaratish
            </Button>
          </div>
        </Card>

        <Card title="Foydalanuvchilar roʻyxati">
          {users.length === 0 ? (
            <EmptyState message="Hozircha foydalanuvchilar yo'q." />
          ) : (
            <div className="mt-2 space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{user.username}</p>
                      <Badge tone={user.role === 'admin' ? 'amber' : 'emerald'}>{user.role === 'admin' ? 'Admin' : 'Foydalanuvchi'}</Badge>
                      <Badge tone={user.is_active ? 'emerald' : 'slate'}>{user.is_active ? 'faol' : 'nofaol'}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.full_name ?? 'Ism yoʻq'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <IconButton onClick={() => remove(user.id)} title="O'chirish" variant="danger" icon={<TrashIcon className="h-4 w-4" />} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}

export default AdminUsersPage

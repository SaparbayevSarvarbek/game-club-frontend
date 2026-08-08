import { FormEvent, useState } from 'react'
import Layout from '../components/common/Layout'
import api from '../services/api'
import Card from '../components/ui/Card'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'

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
      <Card
        title="Admin sozlamalari"
        subtitle="Joriy admin akkauntning foydalanuvchi nomini va parolini oʻzgartiring."
        className="max-w-xl"
      >
        <form className="mt-2 grid gap-4" onSubmit={handleUpdate}>
          <Field
            as="input"
            label="Joriy parol"
            inputProps={{ type: 'password', value: currentPassword, onChange: (e: any) => setCurrentPassword(e.target.value), required: true }}
          />
          <Field
            as="input"
            label="Yangi foydalanuvchi nomi"
            inputProps={{ value: newUsername, onChange: (e: any) => setNewUsername(e.target.value) }}
          />
          <Field
            as="input"
            label="Yangi parol"
            inputProps={{ type: 'password', value: newPassword, onChange: (e: any) => setNewPassword(e.target.value) }}
          />
          <Button type="submit" className="w-fit">Profilni yangilash</Button>
          {status && <p className={`text-sm ${status.includes('muvaffaq') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{status}</p>}
        </form>
      </Card>
    </Layout>
  )
}

export default AdminProfilePage

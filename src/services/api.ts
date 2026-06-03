import axios, { AxiosError } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const instance = axios.create({ baseURL: BASE_URL })

let token: string | null = null

instance.interceptors.request.use((config) => {
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem('gameclub_auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

const setToken = (jwt: string) => {
  token = jwt
}

const clearToken = () => {
  token = null
}

const login = async (username: string, password: string) => (await instance.post('/api/auth/login', { username, password })).data
const me = async () => (await instance.get('/api/auth/me')).data

const fetchUsers = async () => (await instance.get('/api/users')).data
const createUser = async (payload: any) => (await instance.post('/api/users', payload)).data
const updateUser = async (id: number, payload: any) => (await instance.put(`/api/users/${id}`, payload)).data
const toggleUser = async (id: number) => (await instance.patch(`/api/users/${id}/status`)).data

const createIncome = async (payload: any) => (await instance.post('/api/incomes', payload)).data
const fetchMyIncomes = async (month?: string) => (await instance.get('/api/incomes/my', { params: month ? { month } : {} })).data
const fetchIncomes = async (params?: any) => (await instance.get('/api/incomes', { params })).data
const updateIncome = async (id: number, payload: any) => (await instance.put(`/api/incomes/${id}`, payload)).data
const deleteIncome = async (id: number) => (await instance.delete(`/api/incomes/${id}`)).data

const createClosing = async (payload: { total_amount: number; comment?: string; image: File }) => {
  const formData = new FormData()
  formData.append('total_amount', String(payload.total_amount))
  if (payload.comment) formData.append('comment', payload.comment)
  formData.append('image', payload.image)
  return (await instance.post('/api/daily-closings', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}
const fetchMyClosings = async () => (await instance.get('/api/daily-closings/my')).data
const fetchClosings = async () => (await instance.get('/api/daily-closings')).data

const createExpense = async (payload: any) => (await instance.post('/api/expenses', payload)).data
const fetchExpenses = async () => (await instance.get('/api/expenses')).data
const deleteExpense = async (id: number) => (await instance.delete(`/api/expenses/${id}`)).data

const dailyStats = async (date: string) => (await instance.get('/api/statistics/daily', { params: { date } })).data
const monthlyStats = async (month: string) => (await instance.get('/api/statistics/monthly', { params: { month } })).data
const userMonthlyStats = async (userId: number, month: string) => (await instance.get(`/api/statistics/user/${userId}/monthly`, { params: { month } })).data
const fetchUserStatistics = async () => (await instance.get('/api/statistics/user/me')).data
const fetchAdminStatistics = async (tab: 'daily' | 'monthly' | 'yearly', params: any) => {
  if (tab === 'daily') {
    const query = params.start_date && params.end_date ? { start_date: params.start_date, end_date: params.end_date } : { date: params.date }
    return (await instance.get('/api/statistics/daily', { params: query })).data
  }
  if (tab === 'monthly') {
    return (await instance.get('/api/statistics/monthly', { params: { month: `${params.year}-${String(params.month).padStart(2, '0')}` } })).data
  }
  return (await instance.get('/api/statistics/yearly', { params: { year: params.year } })).data
}

const fetchComputers = async () => (await instance.get('/api/computers')).data
const fetchProducts = async () => (await instance.get('/api/products')).data
const createProduct = async (payload: any) => (await instance.post('/api/products', payload)).data
const updateProduct = async (id: number, payload: any) => (await instance.put(`/api/products/${id}`, payload)).data
const deleteProduct = async (id: number) => (await instance.delete(`/api/products/${id}`)).data

const startSession = async (payload: any) => (await instance.post('/api/sessions', payload)).data
const fetchActiveSession = async (computerId: number) => (await instance.get(`/api/computers/${computerId}/active-session`)).data
const saveSession = async (sessionId: number) => (await instance.post(`/api/sessions/${sessionId}/save`)).data
const completeSession = async (sessionId: number, payload: any) => (await instance.post(`/api/sessions/${sessionId}/complete`, payload)).data
const addProductsToSession = async (sessionId: number, payload: any) => (await instance.post(`/api/sessions/${sessionId}/products`, payload)).data

const listDebtors = async (search?: string) => (await instance.get('/api/debtors', { params: search ? { search } : {} })).data
const createDebtor = async (payload: any) => (await instance.post('/api/debtors', payload)).data
const payDebtor = async (id: number, payload: any) => (await instance.post(`/api/debtors/${id}/pay`, payload)).data
const debtorHistory = async (id: number) => (await instance.get(`/api/debtors/${id}/history`)).data
const fetchAllDebtors = async (search?: string) => (await instance.get('/api/admin/debtors', { params: search ? { search } : {} })).data
const createAdminDebtor = async (payload: any) => (await instance.post('/api/admin/debtors', payload)).data
const deleteAdminDebtor = async (id: number) => (await instance.delete(`/api/admin/debtors/${id}`)).data

const uploadImage = async (file: File) => {
  const formData = new FormData()
  formData.append('image', file)
  return (await instance.post('/api/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}

const fetchDailyReports = async () => (await instance.get('/api/daily-reports')).data
const fetchDailyReport = async (id: number) => (await instance.get(`/api/daily-reports/${id}`)).data
const createDailyReport = async (payload: any) => (await instance.post('/api/daily-reports', payload)).data
const productSale = async (payload: any) => (await instance.post('/api/productsales', payload)).data
const fetchProductSales = async (params?: any) => (await instance.get('/api/productsales', { params })).data
const fetchDebtTransactions = async (params?: any) => (await instance.get('/api/debt-transactions', { params })).data

const unavailable = async (..._args: any[]): Promise<any> => {
  throw new Error('Bu eski modul yangi finance panelda ishlatilmaydi')
}

export default {
  setToken,
  clearToken,
  login,
  me,
  fetchUsers,
  createUser,
  updateUser,
  toggleUser,
  createIncome,
  fetchMyIncomes,
  fetchIncomes,
  updateIncome,
  deleteIncome,
  createClosing,
  fetchMyClosings,
  fetchClosings,
  createExpense,
  fetchExpenses,
  deleteExpense,
  dailyStats,
  monthlyStats,
  userMonthlyStats,
  fetchUserStatistics,
  fetchAdminStatistics,
  deleteUser: async (id: number) => (await instance.delete(`/api/users/${id}`)).data,
  fetchAllDebtors,
  createAdminDebtor,
  updateAdminDebtor: async (id: number, payload: any) => (await instance.put(`/api/admin/debtors/${id}`, payload)).data,
  deleteAdminDebtor,
  fetchDailyReports,
  fetchDailyReport,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProfile: async (payload: any) => (await instance.patch('/api/users/me', payload)).data,
  fetchComputers,
  startSession,
  fetchActiveSession,
  addProductsToSession,
  saveSession,
  completeSession,
  listDebtors,
  createDebtor,
  payDebtor,
  debtorHistory,
  uploadImage,
  createDailyReport,
  productSale,
  fetchProductSales,
  fetchDebtTransactions,
}

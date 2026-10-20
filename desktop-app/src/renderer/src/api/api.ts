import axios from 'axios'
import { useAppStore } from '@/store/use-store'
import {
  CategoryDetail,
  CategoryResponse,
  CategorySummary,
  Process,
  ProcessResponse
} from '@/types/types-api'

export async function getHelloMom(): Promise<string> {
  const { apiUrl } = useAppStore.getState()
  const response = await axios.get<string>(`${apiUrl}/`)
  return response.data
}

export async function getProcess(limit: number = 10): Promise<ProcessResponse> {
  const { apiUrl } = useAppStore.getState()
  const response = await axios.get<ProcessResponse>(`${apiUrl}/process`, {
    params: { limit }
  })

  return response.data
}

export async function getCategories(): Promise<CategorySummary[]> {
  const { apiUrl } = useAppStore.getState()
  const response = await axios.get<CategorySummary[]>(`${apiUrl}/catalogs`)

  return response.data
}

export async function getCategory(id: number): Promise<CategoryDetail> {
  const { apiUrl } = useAppStore.getState()
  const response = await axios.get<CategoryDetail>(`${apiUrl}/catalogs/${id}`)

  return response.data
}

export async function saveCategory(
  name: string,
  processes: Process[]
): Promise<'success' | 'conflict'> {
  const { apiUrl } = useAppStore.getState()
  try {
    await axios.post<CategoryResponse>(`${apiUrl}/catalogs`, {
      name,
      processes
    })

    return 'success'
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      return 'conflict'
    }

    throw error
  }
}

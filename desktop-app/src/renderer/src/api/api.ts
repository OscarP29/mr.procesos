import axios from 'axios'
import { useAppStore } from '@/store/use-store'
import { CategoryResponse, CategorySummary, Process, ProcessResponse } from '@/types/types-api'

const { apiURl } = useAppStore.getState()

export async function getHelloMom(): Promise<string> {
  const response = await axios.get<string>(`${apiURl}/`)
  return response.data
}

export async function getProcess(limit: number = 10): Promise<ProcessResponse> {
  const response = await axios.get<ProcessResponse>(`${apiURl}/process`, {
    params: { limit }
  })

  return response.data
}

export async function getCategories(): Promise<CategorySummary[]> {
  const response = await axios.get<CategorySummary[]>(`${apiURl}/catalogs`)

  return response.data
}

export async function saveCategory(
  name: string,
  processes: Process[]
): Promise<'success' | 'conflict'> {
  try {
    await axios.post<CategoryResponse>(`${apiURl}/catalogs`, {
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

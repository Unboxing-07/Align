import { useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { ReactFlow, Background, Controls, Node, Edge } from 'reactflow'
import axios from 'axios'
import 'reactflow/dist/style.css'

const queryClient = new QueryClient()

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start Node' },
    position: { x: 250, y: 25 },
  },
  {
    id: '2',
    data: { label: 'Process Node' },
    position: { x: 250, y: 125 },
  },
  {
    id: '3',
    type: 'output',
    data: { label: 'End Node' },
    position: { x: 250, y: 225 },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
]

interface Post {
  userId: number
  id: number
  title: string
  body: string
}

function FlowExample() {
  const [nodes] = useState<Node[]>(initialNodes)
  const [edges] = useState<Edge[]>(initialEdges)

  return (
    <div style={{ width: '100%', height: '384px' }} className="border-2 border-gray-300 rounded-lg">
      <ReactFlow nodes={nodes} edges={edges}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}

function DataFetcher() {
  const { data, isLoading, error } = useQuery<Post>({
    queryKey: ['example'],
    queryFn: async () => {
      const response = await axios.get<Post>('https://jsonplaceholder.typicode.com/posts/1')
      return response.data
    },
  })

  if (isLoading) return <div className="text-blue-600">Loading...</div>
  if (error) return <div className="text-red-600">Error: {error.message}</div>

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Fetched Data:</h3>
      <p className="text-gray-700">{data?.title}</p>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
            Vite + React + TypeScript + ReactFlow + React Query + Tailwind
          </h1>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">ReactFlow Example</h2>
              <FlowExample />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">React Query + Axios Example</h2>
              <DataFetcher />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Tailwind CSS Example</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-500 text-white p-4 rounded-lg text-center">Primary</div>
                <div className="bg-green-500 text-white p-4 rounded-lg text-center">Success</div>
                <div className="bg-red-500 text-white p-4 rounded-lg text-center">Danger</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App

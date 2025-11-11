import { Link } from 'react-router-dom'

export default function WorkspaceList() {
  // Mock data - replace with actual data fetching
  const workspaces = [
    { id: '1', name: 'Personal Workspace', members: 1 },
    { id: '2', name: 'Team Project', members: 5 },
    { id: '3', name: 'Client Work', members: 3 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Workspaces</h1>
          <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Create Workspace
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              to={`/workspace/${workspace.id}`}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                {workspace.name}
              </h2>
              <p className="text-gray-600">
                {workspace.members} member{workspace.members !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useParams, Link } from 'react-router-dom'

export default function WorkspaceDetail() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link to="/workspace" className="text-blue-500 hover:text-blue-600 mb-4 inline-block">
            ← Back to Workspaces
          </Link>
          <h1 className="text-4xl font-bold text-gray-800">Workspace {id}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to={`/workspace/${id}/members`}
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Members</h2>
            <p className="text-gray-600">Manage workspace members</p>
          </Link>

          <Link
            to={`/workspace/${id}/me`}
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">My Profile</h2>
            <p className="text-gray-600">View your workspace profile</p>
          </Link>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Projects</h2>
            <p className="text-gray-600">Recent projects</p>
          </div>
        </div>
      </div>
    </div>
  )
}

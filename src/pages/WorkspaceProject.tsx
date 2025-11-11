import { useParams, Link } from 'react-router-dom'

export default function WorkspaceProject() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link to={`/workspace/${workspaceId}`} className="text-blue-500 hover:text-blue-600 mb-4 inline-block">
            ← Back to Workspace
          </Link>
          <h1 className="text-4xl font-bold text-gray-800">Project {projectId}</h1>
          <p className="text-gray-600 mt-2">Workspace {workspaceId}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Project Details</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Status</h3>
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm">
                Active
              </span>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600">
                This is a placeholder for project {projectId} details.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Tasks</h3>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg">Task 1</div>
                <div className="p-3 bg-gray-50 rounded-lg">Task 2</div>
                <div className="p-3 bg-gray-50 rounded-lg">Task 3</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Logo } from "../components/Logo"
import { LineButton } from "../components/LineButton"
import { Input } from "../components/Input"
import { Button } from "../components/Button"
import { MemberItem } from "../components/MemberItem"
import { workspaceService } from "../services/workspace"
import type { AssigneeType, WorkspaceType } from "../types/workspace"

export const WorkspaceMembers = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [workspace, setWorkspace] = useState<WorkspaceType | null>(null)
  const [members, setMembers] = useState<AssigneeType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (id) {
      loadWorkspaceAndMembers()
    }
  }, [id])

  const loadWorkspaceAndMembers = async () => {
    if (!id) return

    try {
      setLoading(true)
      const [workspaceData, membersData] = await Promise.all([
        workspaceService.getWorkspace(id),
        workspaceService.getMembers(id)
      ])
      setWorkspace(workspaceData)
      setMembers(membersData)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members")
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!id || !email.trim() || !role.trim()) return

    try {
      const newMember = await workspaceService.addMember(id, { email, role })
      setMembers([...members, newMember])
      setEmail("")
      setRole("")
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member")
    }
  }

  const handleDeleteMember = async (member: AssigneeType) => {
    if (!id) return

    try {
      // Use userId for members, inviteId for pending invites
      const idToRemove = member.isPending ? member.inviteId! : member.userId!
      await workspaceService.removeMember(id, idToRemove)
      setMembers(members.filter((m) => {
        if (m.isPending && member.isPending) {
          return m.inviteId !== member.inviteId
        }
        return m.userId !== member.userId
      }))
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member")
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white relative flex items-center justify-center">
        <Logo absolute />
        <p className="text-gray-200">Loading members...</p>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="w-full min-h-screen bg-white relative flex items-center justify-center">
        <Logo absolute />
        <p className="text-red-500">Workspace not found</p>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-white relative">
      <div className="flex justify-between px-6 pt-3.5">
        <Logo />

        <LineButton onClick={() => navigate(`/workspace/${id}`)} isThin>
          Back to Workspace
        </LineButton>
      </div>

      <div className="flex flex-col items-center pt-6.5">
        <h1 className="text-black text-[28px] mb-14">Members in {workspace.name}</h1>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        {/* Add member form */}
        <div className="flex items-center gap-1 mb-3">
          <Input
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            width={280}
          />
          <Input
            placeholder="role (e.g., frontend, backend)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            width={240}
          />
          <Button
            size="medium"
            onClick={handleAddMember}
            disabled={!email.trim() || !role.trim()}
          >
            Add
          </Button>
        </div>

        {/* Member list */}
        <div className="w-145.5 flex flex-col gap-3">
          {members.map((member) => (
            <MemberItem
              key={member.isPending ? member.inviteId : member.userId}
              email={member.email}
              name={member.isPending ? `${member.name} (Invited)` : member.name}
              role={member.role}
              onDelete={() => handleDeleteMember(member)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

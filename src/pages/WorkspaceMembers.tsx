import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Logo } from "../components/Logo"
import { LineButton } from "../components/LineButton"
import { Input } from "../components/Input"
import { Button } from "../components/Button"
import { MemberItem } from "../components/MemberItem"
import type { AssigneeType } from "../types/workspace"

export const WorkspaceMembers = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("")

  // Mock data - 나중에 API로 대체
  const workspace = {
    id,
    name: "workspace name",
  }

  const [members, setMembers] = useState<AssigneeType[]>([
    { email: "emailemailemail", name: "name", role: "role" },
    { email: "emailemailemail", name: "name", role: "role" },
    { email: "emailemailemail", name: "name", role: "role" },
  ])

  const handleAddMember = () => {
    if (email.trim() && name.trim() && role.trim()) {
      const newMember: AssigneeType = { email, name, role }
      setMembers([...members, newMember])
      setEmail("")
      setName("")
      setRole("")
      console.log("Adding member:", newMember)
      // TODO: API 호출로 멤버 추가
    }
  }

  const handleDeleteMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
    console.log("Deleting member at index:", index)
    // TODO: API 호출로 멤버 삭제
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

        {/* Add member form */}
        <div className="flex items-center gap-1 mb-3">
          <Input
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            width={280}
          />
          <Input
            placeholder="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            width={120}
          />
          <Input
            placeholder="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            width={120}
          />
          <Button
            size="medium"
            onClick={handleAddMember}
            disabled={!email.trim() || !name.trim() || !role.trim()}
          >
            Add
          </Button>
        </div>

        {/* Member list */}
        <div className="w-145.5 flex flex-col gap-3">
          {members.map((member, index) => (
            <MemberItem
              key={index}
              email={member.email}
              name={member.name}
              role={member.role}
              onDelete={() => handleDeleteMember(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

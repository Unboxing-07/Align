# Align Project Guidelines

## Figma Design Implementation

When implementing designs from Figma using the Figma MCP server:

### Design System Reference
- **ALWAYS** reference `src/style/color.css` for color values
- **ALWAYS** check `src/components/` for existing reusable components
- **DO NOT** hardcode color values - use Tailwind color classes defined in color.css
- **DO NOT** create duplicate components - reuse existing ones

### Color System
The project uses a custom color system defined in `src/style/color.css`:
- `--color-blue`: #2b34d9 (Primary color)
- `--color-white`: #ffffff
- `--color-gray-100`: #d9d9d9 (Borders)
- `--color-gray-200`: #828282 (Secondary text)
- `--color-gray-300`: #4d4d4d
- `--color-black`: #101010 (Primary text)

Use Tailwind classes: `bg-blue`, `text-gray-200`, `border-gray-100`, etc.

### Existing Components
Before creating new components, check if these exist:
- `Button` - Configurable button with size variants
- `Input` - Standard input field
- `FatInput` - Larger input field with flexible width
- `LineButton` - Button with line style
- `Logo` - Align logo component
- `Assignee` - User avatar with initial
- `WorkspaceCard` - Workspace list item
- `AddWorkspaceCard` - Add workspace button

### Implementation Workflow
1. Call Figma MCP tool to get design context
2. Review `src/style/color.css` for color mappings
3. Check `src/components/` for reusable components
4. Implement using existing components and color system
5. Only create new components if necessary

### Icon Usage
- Use `lucide-react` for all icons
- Keep icon sizes consistent (typically 24px)
- Match icon colors to design system

### Type System
Reference existing types in `src/types/`:
- `task.ts` - Task and status types
- `workspace.ts` - Workspace, workflow, and assignee types
- `sign.ts` - Authentication types

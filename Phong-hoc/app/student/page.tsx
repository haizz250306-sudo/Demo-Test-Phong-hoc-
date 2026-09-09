import { RoomLookup } from "@/components/room-lookup"
import { PortalShell } from "@/components/portal-shell"

export default function StudentPage() {
  return (
    <PortalShell role="student">
      <RoomLookup />
    </PortalShell>
  )
}

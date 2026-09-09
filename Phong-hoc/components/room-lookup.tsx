"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Building2,
  Users,
  Clock,
  RotateCcw,
  DoorOpen,
  BookOpen,
  KeyRound,
  X,
  AlertTriangle,
  CheckCircle2,
  Ban,
  ListFilter,
  CalendarDays,
} from "lucide-react"

type RoomStatus = "available" | "in-class" | "booked"

type ClassBlock = { start: string; end: string; name: string }

type RoomBase = {
  id: string
  capacity: number
  blocks: ClassBlock[]
}

type Booking = { until: string; borrower: string }

type RoomView = {
  id: string
  capacity: number
  status: RoomStatus
  className?: string
  classEnd?: string
  nextClass: string | null
  borrower?: string
  bookedUntil?: string
}

const BUFFER_MINUTES = 15
const END_OF_DAY = "22:00"
const DURATION_OPTIONS = [30, 60, 75, 90]

const WEEKDAY_LABELS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]

/**
 * Thời khóa biểu chính khóa trong NGÀY của từng phòng.
 * Trạng thái phòng (trống / đang có lớp) được tính theo GIỜ THỰC hiện tại
 * so với các khối giờ này.
 */
function createRoomSchedules(): RoomBase[] {
  return [
    { id: "A101", capacity: 40, blocks: [{ start: "07:00", end: "08:40", name: "Tiếng Anh chuyên ngành 1" }, { start: "13:00", end: "14:40", name: "Phương pháp NCKH" }] },
    { id: "A102", capacity: 60, blocks: [{ start: "08:40", end: "10:20", name: "Tin học văn phòng" }, { start: "14:40", end: "16:20", name: "Thống kê ứng dụng" }] },
    { id: "A103", capacity: 100, blocks: [{ start: "07:00", end: "09:30", name: "Triết học Mác - Lênin" }, { start: "13:00", end: "15:30", name: "Chính sách công" }] },
    { id: "A104", capacity: 40, blocks: [{ start: "09:30", end: "11:10", name: "Kỹ năng soạn thảo văn bản" }, { start: "18:00", end: "19:40", name: "Anh văn B1 (VB2)" }] },
    { id: "A105", capacity: 60, blocks: [{ start: "07:00", end: "08:40", name: "Quản trị Văn phòng" }, { start: "15:30", end: "17:10", name: "Quản lý dự án công" }] },
    { id: "A106", capacity: 100, blocks: [{ start: "07:50", end: "10:20", name: "Kinh tế chính trị" }, { start: "13:50", end: "16:20", name: "Luật Hành chính" }] },
    { id: "A107", capacity: 40, blocks: [{ start: "13:00", end: "14:40", name: "Văn bản & Lưu trữ học" }] },
    { id: "A108", capacity: 60, blocks: [{ start: "07:00", end: "09:30", name: "Tư tưởng Hồ Chí Minh" }, { start: "18:00", end: "20:30", name: "Bồi dưỡng nghiệp vụ" }] },
    { id: "A109", capacity: 100, blocks: [{ start: "08:40", end: "11:10", name: "Khoa học quản lý" }] },
    { id: "A110", capacity: 40, blocks: [{ start: "09:30", end: "11:10", name: "Đạo đức công vụ" }, { start: "13:00", end: "14:40", name: "Kỹ năng giao tiếp công vụ" }] },
    { id: "B101", capacity: 60, blocks: [{ start: "07:00", end: "08:40", name: "Lịch sử Đảng CSVN" }, { start: "14:40", end: "16:20", name: "Quản lý nhân sự khu vực công" }] },
    { id: "B102", capacity: 100, blocks: [{ start: "07:50", end: "10:20", name: "Chính trị học đại cương" }, { start: "13:00", end: "15:30", name: "Tài chính công" }] },
    { id: "B103", capacity: 40, blocks: [{ start: "15:30", end: "17:10", name: "Kinh tế học công cộng" }] },
    { id: "B104", capacity: 60, blocks: [{ start: "07:00", end: "08:40", name: "Nhập môn Hành chính học" }, { start: "18:00", end: "19:40", name: "Anh văn B1 (VB2)" }] },
    { id: "B105", capacity: 100, blocks: [{ start: "07:00", end: "09:30", name: "Xã hội học đại cương" }, { start: "13:50", end: "16:20", name: "Chuyên đề thực tế" }] },
    { id: "B106", capacity: 40, blocks: [{ start: "09:30", end: "11:10", name: "Tiếng Anh chuyên ngành 2" }] },
    { id: "B107", capacity: 60, blocks: [{ start: "13:00", end: "14:40", name: "Quản lý dự án công" }] },
    { id: "B108", capacity: 100, blocks: [{ start: "07:50", end: "10:20", name: "Luật Hiến pháp" }, { start: "13:00", end: "15:30", name: "Tổ chức bộ máy nhà nước" }] },
    { id: "B109", capacity: 40, blocks: [{ start: "18:00", end: "19:40", name: "Anh văn B1 (VB2)" }] },
    { id: "B110", capacity: 60, blocks: [{ start: "07:00", end: "08:40", name: "Tâm lý học quản lý" }, { start: "13:00", end: "14:40", name: "Kỹ năng soạn thảo văn bản" }] },
  ]
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

function addMinutes(hhmm: string, minutes: number): string {
  const total = toMinutes(hhmm) + minutes
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h} tiếng ${m} phút`
  if (h > 0) return `${h} tiếng`
  return `${m} phút`
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

/** Tính trạng thái phòng theo giờ thực (số phút trong ngày) + lượt mượn tạm. */
function computeRoomView(base: RoomBase, nowMin: number, booking?: Booking): RoomView {
  // Lượt mượn tạm còn hiệu lực -> ưu tiên hiển thị "đang mượn".
  if (booking && nowMin < toMinutes(booking.until)) {
    return {
      id: base.id,
      capacity: base.capacity,
      status: "booked",
      borrower: booking.borrower,
      bookedUntil: booking.until,
      nextClass: nextClassAfter(base, nowMin),
    }
  }

  const current = base.blocks.find((b) => nowMin >= toMinutes(b.start) && nowMin < toMinutes(b.end))
  if (current) {
    return {
      id: base.id,
      capacity: base.capacity,
      status: "in-class",
      className: current.name,
      classEnd: current.end,
      nextClass: nextClassAfter(base, nowMin),
    }
  }

  return {
    id: base.id,
    capacity: base.capacity,
    status: "available",
    nextClass: nextClassAfter(base, nowMin),
  }
}

function nextClassAfter(base: RoomBase, nowMin: number): string | null {
  const upcoming = base.blocks
    .filter((b) => toMinutes(b.start) > nowMin)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  return upcoming[0]?.start ?? null
}

type Filter = "all" | "available" | "in-class" | "booked"

export function RoomLookup() {
  const schedules = useMemo(() => createRoomSchedules(), [])
  const [now, setNow] = useState<Date | null>(null)
  const [bookings, setBookings] = useState<Record<string, Booking>>({})
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("all")

  // Đồng hồ thời gian thực: cập nhật mỗi giây.
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : 0

  const views = useMemo(
    () => schedules.map((r) => computeRoomView(r, nowMin, bookings[r.id])),
    [schedules, nowMin, bookings],
  )

  const stats = useMemo(
    () => ({
      total: views.length,
      available: views.filter((r) => r.status === "available").length,
      inClass: views.filter((r) => r.status === "in-class").length,
      booked: views.filter((r) => r.status === "booked").length,
    }),
    [views],
  )

  const visibleRooms = useMemo(
    () => (filter === "all" ? views : views.filter((r) => r.status === filter)),
    [views, filter],
  )

  const activeRoom = activeRoomId ? views.find((r) => r.id === activeRoomId) ?? null : null

  function handleReset() {
    setBookings({})
    setActiveRoomId(null)
    setFilter("all")
  }

  function handleCancelBooking(id: string) {
    setBookings((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function handleConfirmBooking(id: string, minutes: number) {
    if (!now) return
    const nowHM = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    setBookings((prev) => ({
      ...prev,
      [id]: { until: addMinutes(nowHM, minutes), borrower: "Bạn (Giảng viên / SV)" },
    }))
    setActiveRoomId(null)
  }

  if (!now) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/60 py-16 text-sm text-muted-foreground">
        <Clock className="size-4 animate-pulse" />
        Đang đồng bộ thời gian thực…
      </div>
    )
  }

  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const dateLabel = `${WEEKDAY_LABELS[now.getDay()]}, ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="size-5" />
          </div>
          <div className="leading-none">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {dateLabel} · giờ thực
            </span>
            <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-foreground">{clock}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-muted-foreground md:block">
            Hiện có <span className="font-bold text-red-600">{stats.inClass}</span> lớp đang diễn ra ·{" "}
            <span className="font-bold text-emerald-600">{stats.available}</span> phòng trống
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Khôi phục</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>

      <section aria-label="Thống kê nhanh" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard icon={<Building2 className="size-5" />} label="Tổng số phòng" value={stats.total} tone="navy" />
        <StatCard icon={<DoorOpen className="size-5" />} label="Phòng trống" value={stats.available} tone="green" />
        <StatCard icon={<BookOpen className="size-5" />} label="Đang có lớp" value={stats.inClass} tone="red" />
        <StatCard icon={<KeyRound className="size-5" />} label="Đang mượn" value={stats.booked} tone="amber" />
      </section>

      {/* Bộ lọc trạng thái phòng */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <ListFilter className="size-4" />
          Lọc:
        </span>
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} dot="bg-primary" count={stats.total}>
          Tất cả
        </FilterChip>
        <FilterChip
          active={filter === "available"}
          onClick={() => setFilter("available")}
          dot="bg-emerald-500"
          count={stats.available}
        >
          Phòng trống
        </FilterChip>
        <FilterChip
          active={filter === "in-class"}
          onClick={() => setFilter("in-class")}
          dot="bg-red-500"
          count={stats.inClass}
        >
          Đang có lớp
        </FilterChip>
        <FilterChip
          active={filter === "booked"}
          onClick={() => setFilter("booked")}
          dot="bg-amber-500"
          count={stats.booked}
        >
          Đang mượn
        </FilterChip>
      </div>

      <section aria-label="Lưới phòng học" className="mt-4">
        {visibleRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-white/40 py-14 text-center">
            <DoorOpen className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Không có phòng nào ở trạng thái này tại thời điểm hiện tại.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 xl:grid-cols-5">
            {visibleRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onOpen={() => setActiveRoomId(room.id)}
                onCancel={() => handleCancelBooking(room.id)}
              />
            ))}
          </div>
        )}
      </section>

      {activeRoom && activeRoom.status === "available" && (
        <BookingModal
          room={activeRoom}
          now={clock.slice(0, 5)}
          buffer={BUFFER_MINUTES}
          onClose={() => setActiveRoomId(null)}
          onConfirm={handleConfirmBooking}
        />
      )}
    </>
  )
}

const STAT_TONES = {
  navy: "text-primary bg-primary/10",
  green: "text-emerald-600 bg-emerald-500/10",
  red: "text-red-600 bg-red-500/10",
  amber: "text-amber-600 bg-amber-500/10",
} as const

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: keyof typeof STAT_TONES
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 p-4 shadow-[0_8px_30px_rgb(15,23,42,0.05)] backdrop-blur-xl">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${STAT_TONES[tone]}`}>{icon}</div>
      <div className="leading-tight">
        <div className="text-2xl font-bold tabular-nums text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  dot,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  dot: string
  count: number
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent",
      ].join(" ")}
    >
      <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
      {children}
      <span
        className={[
          "flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums",
          active ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  )
}

const ROOM_STYLES: Record<RoomStatus, { card: string; badge: string; badgeText: string; dot: string }> = {
  available: {
    card: "border-emerald-200 bg-emerald-50/80 hover:border-emerald-300 hover:shadow-emerald-500/10 cursor-pointer",
    badge: "bg-emerald-500/15 text-emerald-700",
    badgeText: "Trống",
    dot: "bg-emerald-500",
  },
  "in-class": {
    card: "border-red-200 bg-red-50/80",
    badge: "bg-red-500/15 text-red-700",
    badgeText: "Đang có lớp",
    dot: "bg-red-500",
  },
  booked: {
    card: "border-amber-200 bg-amber-50/80",
    badge: "bg-amber-500/15 text-amber-700",
    badgeText: "Đang mượn",
    dot: "bg-amber-500",
  },
}

function RoomCard({ room, onOpen, onCancel }: { room: RoomView; onOpen: () => void; onCancel: () => void }) {
  const style = ROOM_STYLES[room.status]
  const isAvailable = room.status === "available"

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xl font-bold text-foreground">{room.id}</div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            {room.capacity} chỗ
          </div>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
          <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
          {style.badgeText}
        </span>
      </div>

      <div className="mt-3 min-h-[42px] text-sm">
        {room.status === "available" && (
          <p className="font-medium text-emerald-700">
            {room.nextClass ? (
              <>
                Trống đến <span className="font-bold">{room.nextClass}</span>
              </>
            ) : (
              <>Trống đến hết ngày</>
            )}
          </p>
        )}
        {room.status === "in-class" && (
          <p className="text-red-700">
            <span className="line-clamp-1 font-semibold">{room.className}</span>
            <span className="text-xs text-red-600/80">đang học đến {room.classEnd}</span>
          </p>
        )}
        {room.status === "booked" && (
          <p className="text-amber-700">
            <span className="line-clamp-1 font-semibold">{room.borrower}</span>
            <span className="text-xs text-amber-600/90">mượn đến {room.bookedUntil}</span>
          </p>
        )}
      </div>

      {isAvailable && (
        <div className="mt-1 flex items-center justify-end text-xs font-semibold text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
          Bấm để mượn phòng →
        </div>
      )}

      {room.status === "booked" && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1"
        >
          <Ban className="size-3.5" />
          Hủy mượn
        </button>
      )}
    </>
  )

  const baseClass =
    "group flex flex-col rounded-2xl border p-4 shadow-[0_6px_20px_rgb(15,23,42,0.05)] backdrop-blur-sm transition-all duration-200"

  if (isAvailable) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`${baseClass} ${style.card} text-left hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2`}
      >
        {content}
      </button>
    )
  }

  return <div className={`${baseClass} ${style.card}`}>{content}</div>
}

function BookingModal({
  room,
  now,
  buffer,
  onClose,
  onConfirm,
}: {
  room: RoomView
  now: string
  buffer: number
  onClose: () => void
  onConfirm: (id: string, minutes: number) => void
}) {
  const nextClass = room.nextClass ?? END_OF_DAY
  const gapMinutes = toMinutes(nextClass) - toMinutes(now)
  const usableMinutes = gapMinutes - buffer
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border bg-primary px-5 py-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/15">
              <DoorOpen className="size-5" />
            </div>
            <div>
              <h2 id="booking-title" className="text-lg font-bold leading-tight">
                Mượn phòng {room.id}
              </h2>
              <p className="text-xs text-primary-foreground/80">
                Sức chứa {room.capacity} chỗ · bắt đầu lúc {now}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1.5 text-primary-foreground/80 transition-colors hover:bg-white/15 hover:text-primary-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <p className="text-amber-800">
              Phòng <span className="font-bold">{room.id}</span> đang trống.{" "}
              {room.nextClass ? (
                <>
                  Lớp chính khóa tiếp theo bắt đầu lúc <span className="font-bold">{room.nextClass}</span>.
                </>
              ) : (
                <>Không còn lớp chính khóa nào trong hôm nay.</>
              )}{" "}
              <span className="text-amber-700">
                (Bạn còn {gapMinutes > 0 ? formatDuration(gapMinutes) : "0 phút"} tính từ bây giờ.)
              </span>
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">Chọn thời gian mượn (tính từ hiện tại)</p>
            <div className="grid grid-cols-2 gap-2.5">
              {DURATION_OPTIONS.map((minutes) => {
                const locked = minutes > usableMinutes
                const active = selected === minutes
                return (
                  <button
                    key={minutes}
                    type="button"
                    disabled={locked}
                    onClick={() => setSelected(minutes)}
                    className={[
                      "relative flex flex-col items-center gap-0.5 rounded-xl border px-3 py-3 text-sm font-semibold transition-all",
                      locked
                        ? "cursor-not-allowed border-dashed border-border bg-muted text-muted-foreground/60"
                        : active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent",
                    ].join(" ")}
                  >
                    <span>{minutes} phút</span>
                    {locked && (
                      <span className="text-[10px] font-medium text-muted-foreground/70">Khóa · trừ 15&apos; dọn phòng</span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              Hệ thống tự động trừ <span className="font-semibold">15 phút buffer</span> để dọn phòng trước giờ lớp chính
              khóa.
            </p>
          </div>

          <button
            type="button"
            disabled={selected === null}
            onClick={() => selected !== null && onConfirm(room.id, selected)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            <CheckCircle2 className="size-5" />
            Xác nhận mượn phòng ngay
          </button>
        </div>
      </div>
    </div>
  )
}

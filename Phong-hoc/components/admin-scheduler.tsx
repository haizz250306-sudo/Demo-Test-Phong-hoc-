"use client"

import { useMemo, useState } from "react"
import {
  Wand2,
  Plus,
  Users,
  CalendarDays,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Trash2,
  RotateCcw,
  Pencil,
  Sun,
  CloudSun,
  Moon,
} from "lucide-react"
import {
  type ClassInfo,
  type ScheduleResult,
  type Shift,
  type AltSlot,
  DAYS,
  DAY_LABELS,
  DAY_SHORT,
  SHIFTS,
  SHIFT_LABELS,
  SHIFT_PERIODS,
  createRooms,
  createInitialClasses,
  createClassId,
  autoSchedule,
  findAlternatives,
  rangeTime,
} from "@/lib/scheduling"

const ROOMS = createRooms()

const SHIFT_ICON: Record<Shift, React.ReactNode> = {
  morning: <Sun className="size-4" />,
  afternoon: <CloudSun className="size-4" />,
  evening: <Moon className="size-4" />,
}

const SHIFT_TONE: Record<Shift, string> = {
  morning: "border-amber-200 bg-amber-50/70 text-amber-700",
  afternoon: "border-sky-200 bg-sky-50/70 text-sky-700",
  evening: "border-indigo-200 bg-indigo-50/70 text-indigo-700",
}

function capacityTone(capacity: number): string {
  if (capacity >= 100) return "bg-primary/10 text-primary"
  if (capacity >= 60) return "bg-sky-500/10 text-sky-700"
  return "bg-emerald-500/10 text-emerald-700"
}

export function AdminScheduler() {
  const [classes, setClasses] = useState<ClassInfo[]>(createInitialClasses)
  const [result, setResult] = useState<ScheduleResult | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(2)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)

  const roomById = useMemo(() => {
    const map = new Map(ROOMS.map((r) => [r.id, r]))
    return map
  }, [])

  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes])

  function handleSchedule() {
    setResult(autoSchedule(classes, ROOMS))
  }

  function handleAddClass(cls: Omit<ClassInfo, "id">) {
    const nextClasses = [...classes, { ...cls, id: createClassId() }]
    setClasses(nextClasses)
    setResult(autoSchedule(nextClasses, ROOMS))
  }

  function handleRemoveClass(id: string) {
    setClasses((prev) => prev.filter((c) => c.id !== id))
    setResult(null)
    setEditingClassId(null)
  }

  function handleResetData() {
    setClasses(createInitialClasses())
    setResult(null)
    setEditingClassId(null)
  }

  // Xếp thủ công 1 lớp bị đẩy ra ngoài vào phòng đủ điều kiện đã chọn.
  function handlePlaceClass(cls: ClassInfo, alt: AltSlot) {
    setClasses((prev) => prev.map((c) => (c.id === cls.id ? { ...c, day: alt.day, shift: alt.shift } : c)))
    setResult((prev) => {
      if (!prev) return prev
      return {
        assignments: [
          ...prev.assignments,
          {
            classId: cls.id,
            roomId: alt.roomId,
            day: alt.day,
            shift: alt.shift,
            startPeriod: alt.startPeriod,
            endPeriod: alt.endPeriod,
          },
        ],
        unassigned: prev.unassigned.filter((u) => u.classInfo.id !== cls.id),
      }
    })
    setSelectedDay(alt.day)
    setEditingClassId(null)
  }

  function handleMoveClass(classId: string, alt: AltSlot) {
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, day: alt.day, shift: alt.shift } : c)),
    )
    setResult((prev) => {
      if (!prev) return prev
      return {
        assignments: prev.assignments.map((assignment) =>
          assignment.classId === classId
            ? {
                ...assignment,
                roomId: alt.roomId,
                day: alt.day,
                shift: alt.shift,
                startPeriod: alt.startPeriod,
                endPeriod: alt.endPeriod,
              }
            : assignment,
        ),
        unassigned: prev.unassigned,
      }
    })
    setSelectedDay(alt.day)
    setEditingClassId(null)
  }

  const dayAssignments = useMemo(() => {
    if (!result) return []
    return result.assignments.filter((a) => a.day === selectedDay)
  }, [result, selectedDay])

  const assignedCountByDay = useMemo(() => {
    const map = new Map<number, number>()
    if (result) for (const a of result.assignments) map.set(a.day, (map.get(a.day) ?? 0) + 1)
    return map
  }, [result])

  return (
    <div className="space-y-6">
      <AddClassForm onAdd={handleAddClass} />

      {/* Điều khiển & tổng quan */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/60 bg-white/60 p-5 shadow-[0_8px_30px_rgb(15,23,42,0.05)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {classes.length} lớp trong thời khóa biểu · {ROOMS.length} phòng khả dụng
            </p>
            <p className="text-xs text-muted-foreground">
              Thuật toán: xếp Thứ 2 → Thứ 7, ưu tiên sĩ số lớn, phòng vừa đủ (best-fit) theo 3 ca.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <RotateCcw className="size-4" />
            Khôi phục TKB mẫu
          </button>
          <button
            type="button"
            onClick={handleSchedule}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Wand2 className="size-4" />
            Sắp xếp tự động
          </button>
        </div>
      </div>

      {result && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" aria-label="Kết quả sắp xếp">
          <ResultStat icon={<Layers className="size-5" />} label="Tổng lớp" value={classes.length} tone="navy" />
          <ResultStat
            icon={<CheckCircle2 className="size-5" />}
            label="Đã xếp phòng"
            value={result.assignments.length}
            tone="green"
          />
          <ResultStat
            icon={<AlertTriangle className="size-5" />}
            label="Bị đẩy ra ngoài"
            value={result.unassigned.length}
            tone="red"
          />
          <ResultStat
            icon={<Users className="size-5" />}
            label="Sĩ số đã bố trí"
            value={result.assignments.reduce((s, a) => s + (classById.get(a.classId)?.size ?? 0), 0)}
            tone="amber"
          />
        </section>
      )}

      {!result && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-white/40 py-14 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays className="size-7" />
          </div>
          <p className="max-w-md text-balance text-sm text-muted-foreground">
            Thêm lớp mới nếu cần, rồi bấm <span className="font-semibold text-foreground">Sắp xếp tự động</span> để hệ
            thống phân bổ phòng học theo thời khóa biểu và hiển thị lịch tuần bên dưới.
          </p>
        </div>
      )}

      {result && (
        <>
          {/* Bộ chọn thứ trong tuần */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Thứ trong tuần">
            {DAYS.map((day) => {
              const active = day === selectedDay
              const count = assignedCountByDay.get(day) ?? 0
              return (
                <button
                  key={day}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedDay(day)}
                  className={[
                    "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent",
                  ].join(" ")}
                >
                  <CalendarDays className="size-4" />
                  {DAY_LABELS[day]}
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
            })}
          </div>

          {/* Lịch tuần theo ca */}
          <section aria-label={`Lịch ${DAY_LABELS[selectedDay]}`} className="grid gap-4 lg:grid-cols-3">
            {SHIFTS.map((shift) => {
              const shiftItems = dayAssignments
                .filter((a) => a.shift === shift)
                .sort((a, b) => a.startPeriod - b.startPeriod)
              return (
                <div
                  key={shift}
                  className="flex flex-col rounded-2xl border border-white/60 bg-white/60 p-4 shadow-[0_8px_30px_rgb(15,23,42,0.05)] backdrop-blur-xl"
                >
                  <div className={`mb-3 flex items-center justify-between rounded-xl border px-3 py-2 ${SHIFT_TONE[shift]}`}>
                    <span className="flex items-center gap-2 text-sm font-bold">
                      {SHIFT_ICON[shift]}
                      Ca {SHIFT_LABELS[shift]}
                    </span>
                    <span className="text-xs font-medium">
                      Tiết {SHIFT_PERIODS[shift][0]}–{SHIFT_PERIODS[shift][SHIFT_PERIODS[shift].length - 1]}
                    </span>
                  </div>

                  {shiftItems.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">Chưa có lớp nào trong ca này.</p>
                  ) : (
                    <ul className="flex flex-col gap-2.5">
                      {shiftItems.map((a) => {
                        const cls = classById.get(a.classId)
                        const room = roomById.get(a.roomId)
                        if (!cls || !room) return null
                        return (
                          <li
                            key={a.classId}
                            className="rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-pretty text-sm font-semibold leading-tight text-foreground">
                                {cls.name}
                              </p>
                              <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${capacityTone(room.capacity)}`}>
                                {room.name}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Users className="size-3.5" />
                                {cls.size}/{room.capacity} chỗ
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="size-3.5" />
                                Tiết {a.startPeriod}
                                {a.endPeriod !== a.startPeriod ? `–${a.endPeriod}` : ""}
                              </span>
                              <span className="font-mono">{rangeTime(a.startPeriod, a.endPeriod)}</span>
                            </div>
                            <AssignmentEditor
                              assignment={a}
                              classInfo={cls}
                              assignments={result.assignments}
                              open={editingClassId === cls.id}
                              onToggle={() => setEditingClassId((current) => (current === cls.id ? null : cls.id))}
                              onMove={handleMoveClass}
                            />
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
          </section>

          <UnassignedPanel result={result} onPlace={handlePlaceClass} />
        </>
      )}

      {/* Danh sách lớp trong TKB */}
      <ClassListPanel classes={classes} onRemove={handleRemoveClass} />
    </div>
  )
}

function ResultStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: "navy" | "green" | "red" | "amber"
}) {
  const tones = {
    navy: "text-primary bg-primary/10",
    green: "text-emerald-600 bg-emerald-500/10",
    red: "text-red-600 bg-red-500/10",
    amber: "text-amber-600 bg-amber-500/10",
  } as const
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 p-4 shadow-[0_8px_30px_rgb(15,23,42,0.05)] backdrop-blur-xl">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</div>
      <div className="leading-tight">
        <div className="text-2xl font-bold tabular-nums text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

function AddClassForm({ onAdd }: { onAdd: (cls: Omit<ClassInfo, "id">) => void }) {
  const [name, setName] = useState("")
  const [size, setSize] = useState("50")
  const [day, setDay] = useState<number>(2)
  const [shift, setShift] = useState<Shift>("morning")
  const [periods, setPeriods] = useState("2")

  const maxPeriods = SHIFT_PERIODS[shift].length

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedSize = Number.parseInt(size, 10)
    const parsedPeriods = Number.parseInt(periods, 10)
    if (!name.trim() || !Number.isFinite(parsedSize) || parsedSize <= 0) return
    onAdd({
      name: name.trim(),
      size: parsedSize,
      day,
      shift,
      periods: Math.min(Math.max(parsedPeriods || 1, 1), maxPeriods),
    })
    setName("")
    setSize("50")
    setPeriods("2")
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/40"

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/60 bg-white/60 p-5 shadow-[0_8px_30px_rgb(15,23,42,0.05)] backdrop-blur-xl"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Plus className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Thêm lớp mới vào thời khóa biểu</h2>
          <p className="text-xs text-muted-foreground">Nhập thông tin lớp học phần cần bố trí phòng.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <label htmlFor="cls-name" className="mb-1 block text-xs font-semibold text-foreground">
            Tên lớp / học phần
          </label>
          <input
            id="cls-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Luật Hành chính"
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="cls-size" className="mb-1 block text-xs font-semibold text-foreground">
            Sĩ số
          </label>
          <input
            id="cls-size"
            type="number"
            min={1}
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="cls-day" className="mb-1 block text-xs font-semibold text-foreground">
            Thứ
          </label>
          <select id="cls-day" value={day} onChange={(e) => setDay(Number(e.target.value))} className={inputClass}>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {DAY_LABELS[d]}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="cls-shift" className="mb-1 block text-xs font-semibold text-foreground">
            Ca học
          </label>
          <select
            id="cls-shift"
            value={shift}
            onChange={(e) => setShift(e.target.value as Shift)}
            className={inputClass}
          >
            {SHIFTS.map((s) => (
              <option key={s} value={s}>
                {SHIFT_LABELS[s]} (tiết {SHIFT_PERIODS[s][0]}–{SHIFT_PERIODS[s][SHIFT_PERIODS[s].length - 1]})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="cls-periods" className="mb-1 block text-xs font-semibold text-foreground">
            Số tiết (tối đa {maxPeriods})
          </label>
          <input
            id="cls-periods"
            type="number"
            min={1}
            max={maxPeriods}
            value={periods}
            onChange={(e) => setPeriods(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          <Plus className="size-4" />
          Thêm lớp
        </button>
      </div>
    </form>
  )
}

function AssignmentEditor({
  assignment,
  classInfo,
  assignments,
  open,
  onToggle,
  onMove,
}: {
  assignment: import("@/lib/scheduling").Assignment
  classInfo: ClassInfo
  assignments: import("@/lib/scheduling").Assignment[]
  open: boolean
  onToggle: () => void
  onMove: (classId: string, alt: AltSlot) => void
}) {
  const alternatives = useMemo(
    () =>
      findAlternatives(
        classInfo,
        ROOMS,
        assignments.filter((item) => item.classId !== assignment.classId),
        12,
      ),
    [assignment.classId, assignments, classInfo],
  )

  return (
    <div className="mt-3 border-t border-dashed border-border pt-2.5">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Pencil className="size-3.5" />
        {open ? "Đóng chỉnh sửa" : "Đổi phòng / lịch học"}
      </button>
      {open && (
        <div className="mt-2 rounded-lg bg-muted/50 p-2.5">
          <p className="mb-2 text-xs font-semibold text-foreground">
            Chọn phòng, ngày và ca mới cho lớp này:
          </p>
          {alternatives.length === 0 ? (
            <p className="text-xs text-red-700">Không còn slot phù hợp khác.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {alternatives.map((alt, index) => (
                <button
                  key={`${alt.day}-${alt.shift}-${alt.roomId}-${index}`}
                  type="button"
                  onClick={() => onMove(classInfo.id, alt)}
                  className="rounded-lg border border-primary/20 bg-card px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-bold">{alt.roomId}</span>
                  {" · "}
                  {DAY_SHORT[alt.day]} · {SHIFT_LABELS[alt.shift]}
                  <span className="block text-muted-foreground">
                    Tiết {alt.startPeriod}
                    {alt.endPeriod !== alt.startPeriod ? `–${alt.endPeriod}` : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function UnassignedPanel({
  result,
  onPlace,
}: {
  result: ScheduleResult
  onPlace: (classInfo: ClassInfo, alt: AltSlot) => void
}) {
  if (result.unassigned.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
        <CheckCircle2 className="size-6 shrink-0 text-emerald-600" />
        <p className="text-sm font-semibold text-emerald-800">
          Tất cả lớp đã được bố trí phòng thành công. Không có lớp nào bị đẩy ra ngoài.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="size-5 text-red-600" />
        <h3 className="text-base font-bold text-red-800">
          {result.unassigned.length} lớp chưa xếp được (bị đẩy ra ngoài)
        </h3>
      </div>
      <ul className="flex flex-col gap-3">
        {result.unassigned.map((u) => (
          <UnassignedItem
            key={u.classInfo.id}
            classInfo={u.classInfo}
            reason={u.reason}
            assignments={result.assignments}
            onPlace={onPlace}
          />
        ))}
      </ul>
    </div>
  )
}

function UnassignedItem({
  classInfo,
  reason,
  assignments,
  onPlace,
}: {
  classInfo: ClassInfo
  reason: string
  assignments: import("@/lib/scheduling").Assignment[]
  onPlace: (classInfo: ClassInfo, alt: AltSlot) => void
}) {
  const [alts, setAlts] = useState<AltSlot[] | null>(null)

  function handleFind() {
    setAlts(findAlternatives(classInfo, ROOMS, assignments))
  }

  return (
    <li className="rounded-xl border border-red-200 bg-white/80 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-foreground">{classInfo.name}</p>
            <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-700">
              {classInfo.size} SV
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {DAY_SHORT[classInfo.day]} · {SHIFT_LABELS[classInfo.shift]} · {classInfo.periods} tiết
            </span>
          </div>
          <p className="mt-1 text-xs text-red-700">{reason}</p>
        </div>
        <button
          type="button"
          onClick={handleFind}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Sparkles className="size-4" />
          Tìm slot thay thế
        </button>
      </div>

      {alts !== null && (
        <div className="mt-3 border-t border-dashed border-red-200 pt-3">
          {alts.length === 0 ? (
            <p className="text-xs font-medium text-red-700">
              Không tìm thấy thứ/ca/phòng nào còn trống đủ khả năng cho lớp này trong tuần.
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs font-semibold text-foreground">
                Gợi ý {alts.length} vị trí còn trống đủ sức chứa:
              </p>
              <div className="flex flex-wrap gap-2">
                {alts.map((alt, i) => (
                  <button
                    key={`${alt.day}-${alt.shift}-${alt.roomId}-${i}`}
                    type="button"
                    onClick={() => onPlace(classInfo, alt)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:border-emerald-400 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    {DAY_SHORT[alt.day]}
                    <ArrowRight className="size-3" />
                    {SHIFT_LABELS[alt.shift]}
                    <ArrowRight className="size-3" />
                    <span className="font-bold">{alt.roomId}</span>
                    <span className="text-emerald-600">
                      (tiết {alt.startPeriod}
                      {alt.endPeriod !== alt.startPeriod ? `–${alt.endPeriod}` : ""})
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </li>
  )
}

function ClassListPanel({ classes, onRemove }: { classes: ClassInfo[]; onRemove: (id: string) => void }) {
  const grouped = useMemo(() => {
    return DAYS.map((day) => ({
      day,
      items: classes.filter((c) => c.day === day).sort((a, b) => b.size - a.size),
    })).filter((g) => g.items.length > 0)
  }, [classes])

  return (
    <div className="rounded-2xl border border-white/60 bg-white/60 p-5 shadow-[0_8px_30px_rgb(15,23,42,0.05)] backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays className="size-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">Thời khóa biểu hiện tại ({classes.length} lớp)</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {grouped.map((g) => (
          <div key={g.day} className="rounded-xl border border-border bg-card/60 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{DAY_LABELS[g.day]}</p>
            <ul className="flex flex-col gap-2">
              {g.items.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-background/60 px-2.5 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.size} SV · {SHIFT_LABELS[c.shift]} · {c.periods} tiết
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(c.id)}
                    aria-label={`Xóa lớp ${c.name}`}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

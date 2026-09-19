// Mô hình dữ liệu và thuật toán sắp xếp phòng học theo thời khóa biểu.

export type Shift = "morning" | "afternoon" | "evening"

export type RoomInfo = {
  id: string
  name: string
  capacity: number
  building?: string
  campus?: "36 Xuân La" | "371 Nguyễn Hoàng Tôn"
  kind?: "classroom" | "hall"
}

export type ClassInfo = {
  id: string
  /** Tên môn / lớp học phần */
  name: string
  /** Sĩ số */
  size: number
  /** Thứ trong tuần: 2 = Thứ Hai ... 7 = Thứ Bảy */
  day: number
  /** Ca học */
  shift: Shift
  /** Số tiết học liên tục (mỗi tiết 50 phút) */
  periods: number
  /** TKB ban hành: khi có, thuật toán bắt buộc giữ nguyên khung tiết này. */
  startPeriod?: number
  endPeriod?: number
  cohort?: "K23" | "K24" | "K25" | "K26"
  courseCode?: string
  major?: string
  className?: string
  section?: string
}

export type Assignment = {
  classId: string
  roomId: string
  day: number
  shift: Shift
  startPeriod: number
  endPeriod: number
  shortage?: number
}

export type Unassigned = {
  classInfo: ClassInfo
  reason: string
}

export type ScheduleResult = {
  assignments: Assignment[]
  unassigned: Unassigned[]
  reserveBySlot: Record<string, number>
  reserveWarnings: string[]
}

export type AltSlot = {
  day: number
  shift: Shift
  roomId: string
  startPeriod: number
  endPeriod: number
}

export const DAYS = [2, 3, 4, 5, 6, 7] as const

export const DAY_LABELS: Record<number, string> = {
  2: "Thứ Hai",
  3: "Thứ Ba",
  4: "Thứ Tư",
  5: "Thứ Năm",
  6: "Thứ Sáu",
  7: "Thứ Bảy",
}

export const DAY_SHORT: Record<number, string> = {
  2: "T2",
  3: "T3",
  4: "T4",
  5: "T5",
  6: "T6",
  7: "T7",
}

export const SHIFTS: Shift[] = ["morning", "afternoon", "evening"]

export const SHIFT_LABELS: Record<Shift, string> = {
  morning: "Sáng",
  afternoon: "Chiều",
  evening: "Tối",
}

export const CAMPUS_LABELS = {
  all: "Tất cả cơ sở",
  "36 Xuân La": "Cơ sở 36 Xuân La",
  "371 Nguyễn Hoàng Tôn": "Cơ sở 371 Nguyễn Hoàng Tôn",
} as const

export type CampusFilter = keyof typeof CAMPUS_LABELS

export type CohortFilter = "all" | "K23" | "K24" | "K25" | "K26"

export const COHORT_LABELS: Record<CohortFilter, string> = {
  all: "Tất cả khóa",
  K23: "Khóa 23",
  K24: "Khóa 24",
  K25: "Khóa 25",
  K26: "Khóa 26",
}

/** Các tiết thuộc từng ca. Sáng 1-5, Chiều 6-10, Tối 11-13. */
export const SHIFT_PERIODS: Record<Shift, number[]> = {
  morning: [1, 2, 3, 4, 5],
  afternoon: [6, 7, 8, 9, 10],
  evening: [11, 12, 13],
}

const PERIOD_MINUTES = 50

/** Giờ bắt đầu của tiết 1, tiết 6, tiết 11 (đầu mỗi ca). */
const SHIFT_START: Record<Shift, string> = {
  morning: "07:00",
  afternoon: "13:00",
  evening: "18:00",
}

function shiftOfPeriod(period: number): Shift {
  if (period <= 5) return "morning"
  if (period <= 10) return "afternoon"
  return "evening"
}

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number)
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

/** Khoảng giờ thực tế của 1 tiết, ví dụ tiết 1 -> "07:00 - 07:50". */
export function periodTime(period: number): string {
  const shift = shiftOfPeriod(period)
  const indexInShift = SHIFT_PERIODS[shift].indexOf(period)
  const start = addMinutes(SHIFT_START[shift], indexInShift * PERIOD_MINUTES)
  const end = addMinutes(start, PERIOD_MINUTES)
  return `${start} - ${end}`
}

/** Khoảng giờ từ tiết bắt đầu đến tiết kết thúc. */
export function rangeTime(startPeriod: number, endPeriod: number): string {
  const shift = shiftOfPeriod(startPeriod)
  const startIndex = SHIFT_PERIODS[shift].indexOf(startPeriod)
  const endIndex = SHIFT_PERIODS[shift].indexOf(endPeriod)
  const start = addMinutes(SHIFT_START[shift], startIndex * PERIOD_MINUTES)
  const end = addMinutes(SHIFT_START[shift], (endIndex + 1) * PERIOD_MINUTES)
  return `${start} - ${end}`
}

/** 20 phòng học: sức chứa 40 / 60 / 100. */
export function createRooms(): RoomInfo[] {
  return [
    { id: "A101", name: "A101", capacity: 40 },
    { id: "A102", name: "A102", capacity: 60 },
    { id: "A103", name: "A103", capacity: 100 },
    { id: "A104", name: "A104", capacity: 40 },
    { id: "A105", name: "A105", capacity: 60 },
    { id: "A106", name: "A106", capacity: 100 },
    { id: "A107", name: "A107", capacity: 40 },
    { id: "A108", name: "A108", capacity: 60 },
    { id: "A109", name: "A109", capacity: 100 },
    { id: "A110", name: "A110", capacity: 40 },
    { id: "B101", name: "B101", capacity: 60 },
    { id: "B102", name: "B102", capacity: 100 },
    { id: "B103", name: "B103", capacity: 40 },
    { id: "B104", name: "B104", capacity: 60 },
    { id: "B105", name: "B105", capacity: 100 },
    { id: "B106", name: "B106", capacity: 40 },
    { id: "B107", name: "B107", capacity: 60 },
    { id: "B108", name: "B108", capacity: 100 },
    { id: "B109", name: "B109", capacity: 40 },
    { id: "B110", name: "B110", capacity: 60 },
  ]
}

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `cls-${idCounter}`
}

/**
 * Thời khóa biểu mẫu có sẵn. Cố tình tạo nhiều lớp sĩ số lớn trong cùng ca
 * để minh họa trường hợp thiếu phòng -> lớp bị "đẩy ra ngoài".
 */
export function createInitialClasses(): ClassInfo[] {
  idCounter = 0
  const raw: Omit<ClassInfo, "id">[] = [
    // Thứ Hai - sáng: nhiều lớp sĩ số lớn (chỉ có 6 phòng 100 chỗ)
    { name: "Triết học Mác - Lênin", size: 95, day: 2, shift: "morning", periods: 3 },
    { name: "Kinh tế chính trị", size: 92, day: 2, shift: "morning", periods: 3 },
    { name: "Tư tưởng Hồ Chí Minh", size: 90, day: 2, shift: "morning", periods: 2 },
    { name: "Lịch sử Đảng CSVN", size: 88, day: 2, shift: "morning", periods: 2 },
    { name: "Pháp luật đại cương", size: 85, day: 2, shift: "morning", periods: 3 },
    { name: "Nhập môn Hành chính học", size: 82, day: 2, shift: "morning", periods: 2 },
    { name: "Kỹ năng giao tiếp công vụ", size: 78, day: 2, shift: "morning", periods: 2 },
    { name: "Xã hội học đại cương", size: 91, day: 2, shift: "morning", periods: 3 },
    { name: "Tâm lý học quản lý", size: 89, day: 2, shift: "morning", periods: 3 },
    { name: "Hành chính học so sánh", size: 87, day: 2, shift: "morning", periods: 3 },
    { name: "Chính trị học đại cương", size: 90, day: 2, shift: "morning", periods: 3 },
    { name: "Luật Dân sự", size: 86, day: 2, shift: "morning", periods: 2 },
    { name: "Tin học văn phòng", size: 55, day: 2, shift: "morning", periods: 3 },
    { name: "Tiếng Anh chuyên ngành 1", size: 38, day: 2, shift: "morning", periods: 2 },
    // Thứ Hai - chiều
    { name: "Luật Hành chính", size: 90, day: 2, shift: "afternoon", periods: 3 },
    { name: "Quản trị Văn phòng", size: 58, day: 2, shift: "afternoon", periods: 2 },
    { name: "Văn bản & Lưu trữ học", size: 36, day: 2, shift: "afternoon", periods: 2 },
    // Thứ Hai - tối
    { name: "Anh văn B1 (VB2)", size: 42, day: 2, shift: "evening", periods: 2 },
    // Thứ Ba
    { name: "Khoa học quản lý", size: 95, day: 3, shift: "morning", periods: 3 },
    { name: "Tổ chức bộ máy nhà nước", size: 84, day: 3, shift: "morning", periods: 2 },
    { name: "Kinh tế học công cộng", size: 56, day: 3, shift: "morning", periods: 2 },
    { name: "Thống kê ứng dụng", size: 39, day: 3, shift: "afternoon", periods: 3 },
    { name: "Quản lý nhân sự khu vực công", size: 60, day: 3, shift: "afternoon", periods: 2 },
    // Thứ Tư
    { name: "Chính sách công", size: 92, day: 4, shift: "morning", periods: 3 },
    { name: "Luật Hiến pháp", size: 80, day: 4, shift: "morning", periods: 2 },
    { name: "Phương pháp NCKH", size: 44, day: 4, shift: "afternoon", periods: 2 },
    // Thứ Năm
    { name: "Tài chính công", size: 86, day: 5, shift: "morning", periods: 3 },
    { name: "Quản lý dự án công", size: 58, day: 5, shift: "afternoon", periods: 2 },
    // Thứ Sáu
    { name: "Đạo đức công vụ", size: 75, day: 6, shift: "morning", periods: 2 },
    { name: "Kỹ năng soạn thảo văn bản", size: 40, day: 6, shift: "afternoon", periods: 2 },
    // Thứ Bảy
    { name: "Chuyên đề thực tế", size: 100, day: 7, shift: "morning", periods: 3 },
  ]
  return raw.map((c) => ({ ...c, id: nextId() }))
}

export function createClassId(): string {
  return nextId()
}

type OccupancyMap = Map<string, Set<number>>

function occKey(day: number, roomId: string): string {
  return `${day}::${roomId}`
}

/** Tìm khối `periods` tiết liên tục còn trống trong ca; trả về tiết bắt đầu hoặc null. */
function findFreeBlock(used: Set<number>, shiftPeriods: number[], periods: number): number | null {
  for (let i = 0; i + periods <= shiftPeriods.length; i++) {
    let ok = true
    for (let k = 0; k < periods; k++) {
      if (used.has(shiftPeriods[i + k])) {
        ok = false
        break
      }
    }
    if (ok) return shiftPeriods[i]
  }
  return null
}

/**
 * Thuật toán sắp xếp:
 * 1. Duyệt lần lượt từ Thứ Hai -> Thứ Bảy.
 * 2. Trong mỗi ngày, ưu tiên lớp sĩ số LỚN nhất trước.
 * 3. Chọn phòng nhỏ nhất mà vẫn đủ sức chứa (best-fit) để dành phòng lớn cho lớp đông.
 * 4. Lớp không đủ phòng / hết chỗ -> đẩy ra danh sách "ngoài".
 */
export function autoSchedule(classes: ClassInfo[], rooms: RoomInfo[]): ScheduleResult {
  const sorted = [...classes].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day
    if (a.shift !== b.shift) return SHIFTS.indexOf(a.shift) - SHIFTS.indexOf(b.shift)
    if (a.size >= 150 !== b.size >= 150) return a.size >= 150 ? -1 : 1
    return b.size - a.size
  })

  const roomsByCapAsc = [...rooms].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "hall" ? -1 : 1
    return a.capacity - b.capacity
  })
  const occupancy: OccupancyMap = new Map()

  const assignments: Assignment[] = []
  const unassigned: Unassigned[] = []

  for (const cls of sorted) {
    const shiftPeriods = SHIFT_PERIODS[cls.shift]
    const startPeriod = cls.startPeriod ?? shiftPeriods[0]
    const endPeriod = cls.endPeriod ?? startPeriod + cls.periods - 1
    if (
      cls.periods > shiftPeriods.length ||
      startPeriod < shiftPeriods[0] ||
      endPeriod > shiftPeriods[shiftPeriods.length - 1] ||
      endPeriod - startPeriod + 1 !== cls.periods
    ) {
      unassigned.push({
        classInfo: cls,
        reason: `Khung tiết ${startPeriod}-${endPeriod} không hợp lệ trong ca ${SHIFT_LABELS[cls.shift]}.`,
      })
      continue
    }

    const availableRooms = roomsByCapAsc.filter((room) => {
      if (cls.size < 150 && room.kind === "hall") return false
      return true
    })
    const fitRooms = availableRooms.filter((room) => room.capacity >= cls.size)
    const candidates = fitRooms.length > 0 ? fitRooms : availableRooms.slice().sort((a, b) => b.capacity - a.capacity)
    let placed = false
    for (const room of candidates) {
      const key = occKey(cls.day, room.id)
      const used = occupancy.get(key) ?? new Set<number>()
      const start = cls.startPeriod ?? findFreeBlock(used, shiftPeriods, cls.periods)
      const end = cls.endPeriod ?? (start === null ? null : start + cls.periods - 1)
      if (start !== null && end !== null && [...Array(end - start + 1)].every((_, index) => !used.has(start + index))) {
        for (let p = start; p <= end; p++) used.add(p)
        occupancy.set(key, used)
        assignments.push({
          classId: cls.id,
          roomId: room.id,
          day: cls.day,
          shift: cls.shift,
          startPeriod: start,
          endPeriod: end,
          shortage: Math.max(0, cls.size - room.capacity) || undefined,
        })
        placed = true
        break
      }
    }

    if (!placed) {
      unassigned.push({
        classInfo: cls,
        reason: fitRooms.length === 0
          ? `Không còn phòng phù hợp trong ${SHIFT_LABELS[cls.shift]} ${DAY_LABELS[cls.day]} — đã hết cả phòng dự phòng.`
          : `Hết phòng trống ${SHIFT_LABELS[cls.shift]} ${DAY_LABELS[cls.day]} theo đúng khung tiết TKB.`,
      })
    }
  }

  const reserveBySlot: Record<string, number> = {}
  const reserveWarnings: string[] = []
  for (const day of DAYS) {
    for (const shift of ["morning", "afternoon"] as Shift[]) {
      const usedRooms = new Set(
        assignments.filter((a) => a.day === day && a.shift === shift).map((a) => a.roomId),
      )
      const key = `${day}::${shift}`
      reserveBySlot[key] = rooms.length - usedRooms.size
      if (reserveBySlot[key] < 18) {
        reserveWarnings.push(`${DAY_LABELS[day]} ca ${SHIFT_LABELS[shift]} chỉ còn ${reserveBySlot[key]} phòng dự trù (mục tiêu ≥ 18).`)
      }
    }
  }

  return { assignments, unassigned, reserveBySlot, reserveWarnings }
}

/** Dựng lại bản đồ occupancy từ danh sách assignment hiện có. */
function buildOccupancy(assignments: Assignment[]): OccupancyMap {
  const occupancy: OccupancyMap = new Map()
  for (const a of assignments) {
    const key = occKey(a.day, a.roomId)
    const used = occupancy.get(key) ?? new Set<number>()
    for (let p = a.startPeriod; p <= a.endPeriod; p++) used.add(p)
    occupancy.set(key, used)
  }
  return occupancy
}

/**
 * Với 1 lớp bị đẩy ra ngoài, chỉ quét phòng còn trống trong đúng Thứ + ca + tiết
 * của TKB ban hành. Không gợi ý đổi lịch; trả về tối đa `limit` phòng thay thế.
 */
export function findAlternatives(
  cls: ClassInfo,
  rooms: RoomInfo[],
  assignments: Assignment[],
  limit = 6,
): AltSlot[] {
  const occupancy = buildOccupancy(assignments)
  const fitRooms = [...rooms].filter((r) => r.capacity >= cls.size).sort((a, b) => a.capacity - b.capacity)
  const results: AltSlot[] = []

  const day = cls.day
  const shift = cls.shift
  const shiftPeriods = SHIFT_PERIODS[shift]
  const fixedStart = cls.startPeriod
  if (cls.periods > shiftPeriods.length) return results
  for (const room of fitRooms) {
    const used = occupancy.get(occKey(day, room.id)) ?? new Set<number>()
    const start = fixedStart ?? findFreeBlock(used, shiftPeriods, cls.periods)
    const end = cls.endPeriod ?? (start === null ? null : start + cls.periods - 1)
    if (start !== null && end !== null && [...Array(end - start + 1)].every((_, index) => !used.has(start + index))) {
      results.push({
        day,
        shift,
        roomId: room.id,
        startPeriod: start,
        endPeriod: end,
      })
      }
    if (results.length >= limit) return results
  }
  return results
}

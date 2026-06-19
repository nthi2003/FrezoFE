import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, addMonths, subMonths,
} from 'date-fns'

interface TicketCalendarProps {
  tickets: any[]
  priorityColorMap: Record<string, string>
  priorityOptionsData: any[]
  personOptions: { value: string; label: string }[]
  onEditTicket: (ticket: any) => void
  onDropTicket?: (ticketId: string, date: string) => void
}

export function TicketCalendar({
  tickets,
  priorityColorMap,
  priorityOptionsData,
  personOptions,
  onEditTicket,
  onDropTicket,
}: TicketCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const ticketsByDate = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const t of tickets) {
      if (t.dueDate) {
        const key = format(new Date(t.dueDate), 'yyyy-MM-dd')
        if (!map[key]) map[key] = []
        map[key].push(t)
      }
    }
    return map
  }, [tickets])

  const dayHeaders = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

  const handleDragStart = (id: string) => setDraggedTicketId(id)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (dateStr: string) => {
    if (draggedTicketId && onDropTicket) {
      onDropTicket(draggedTicketId, dateStr)
    }
    setDraggedTicketId(null)
  }

  return (
    <div className="border border-border rounded-xl bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-neutral-600" />
        </button>
        <span className="text-sm font-semibold text-neutral-700">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-neutral-600" />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {dayHeaders.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-neutral-400 py-2 border-b border-border">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayTickets = ticketsByDate[dateStr] || []
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const today = isToday(day)

          return (
            <div
              key={dateStr}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(dateStr)}
              className={`min-h-[100px] border-b border-r border-border p-1 transition-colors ${
                !isCurrentMonth ? 'bg-neutral-50' : ''
              } ${today ? 'bg-primary-50/40' : ''} ${
                draggedTicketId ? 'bg-blue-50/30' : ''
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 text-[11px] font-medium rounded-full ${
                  today
                    ? 'bg-primary-500 text-white'
                    : isCurrentMonth
                    ? 'text-neutral-600'
                    : 'text-neutral-300'
                }`}
              >
                {format(day, 'd')}
              </span>
              <div className="space-y-0.5 mt-0.5">
                {dayTickets.slice(0, 3).map((ticket: any) => (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={() => handleDragStart(ticket.id)}
                    onClick={() => onEditTicket(ticket)}
                    className="text-[10px] px-1 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 cursor-pointer truncate leading-tight"
                  >
                    {ticket.code && (
                      <span className="font-mono text-neutral-400 mr-1">{ticket.code}</span>
                    )}
                    <span className="text-neutral-700">{ticket.title}</span>
                  </div>
                ))}
                {dayTickets.length > 3 && (
                  <p className="text-[10px] text-neutral-400 pl-1">+{dayTickets.length - 3} thêm</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

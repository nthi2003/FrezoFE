// ============================================================
// MeetingsPage — list + create (startAt/endAt)
// ============================================================

import { useMemo, useState } from 'react'
import { Plus, Calendar, Loader2 } from 'lucide-react'
import { Button, PageHeader, AppModal, EmptyState } from '@frezo/ui'
import {
  useMeetings,
  useCreateMeeting,
  useCancelMeeting,
} from '../hooks/useMeetings'

export function MeetingsPage() {
  const { data: list = [], isLoading } = useMeetings()
  const create = useCreateMeeting()
  const cancel = useCancelMeeting()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    startAt: '',
    endAt: '',
    location: '',
    dealId: '',
    customerId: '',
    notes: '',
  })

  const sorted = useMemo(
    () =>
      [...list].sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    [list],
  )

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Lịch họp"
        description="Cuộc họp CRM liên kết cơ hội bán / khách hàng."
        actions={
          <Button className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus size={14} /> Tạo họp
          </Button>
        }
      />

      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Calendar}
            title="Chưa có cuộc họp"
            description="Tạo cuộc họp gắn với cơ hội bán hoặc khách hàng."
            action={{ label: 'Tạo họp', onClick: () => setOpen(true) }}
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((m) => (
            <li
              key={m.id}
              className="bg-white border rounded-xl px-4 py-3 flex items-start justify-between gap-3 shadow-sm"
            >
              <div>
                <div className="font-semibold text-neutral-900">{m.title}</div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {m.startAt ? new Date(m.startAt).toLocaleString('vi-VN') : '—'}
                  {m.endAt
                    ? ` → ${new Date(m.endAt).toLocaleTimeString('vi-VN')}`
                    : ''}
                  {m.location ? ` · ${m.location}` : ''}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {[m.dealId, m.customerId].filter(Boolean).join(' · ') || '—'}
                  {' · '}
                  {m.status}
                </p>
              </div>
              {(m.status || '').toUpperCase() !== 'CANCELLED' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={cancel.isPending}
                  onClick={() => cancel.mutate(m.id)}
                >
                  Huỷ
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <AppModal isOpen={open} onClose={() => setOpen(false)} title="Tạo cuộc họp">
        <div className="space-y-3">
          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Tiêu đề"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-neutral-500 space-y-1">
              Bắt đầu
              <input
                type="datetime-local"
                className="w-full border rounded-md px-2 py-1.5 text-sm"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              />
            </label>
            <label className="text-xs text-neutral-500 space-y-1">
              Kết thúc
              <input
                type="datetime-local"
                className="w-full border rounded-md px-2 py-1.5 text-sm"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              />
            </label>
          </div>
          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Địa điểm"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <input
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder="ID cơ hội bán (tuỳ chọn)"
            value={form.dealId}
            onChange={(e) => setForm({ ...form, dealId: e.target.value })}
          />
          <input
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder="Customer ID (tuỳ chọn)"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          />
          <textarea
            rows={2}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Ghi chú"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button
              disabled={!form.title.trim() || !form.startAt || create.isPending}
              onClick={() =>
                create.mutate(
                  {
                    title: form.title,
                    startAt: form.startAt.includes('T')
                      ? form.startAt.length === 16
                        ? `${form.startAt}:00`
                        : form.startAt
                      : form.startAt,
                    endAt: form.endAt
                      ? form.endAt.length === 16
                        ? `${form.endAt}:00`
                        : form.endAt
                      : undefined,
                    location: form.location || undefined,
                    dealId: form.dealId || undefined,
                    customerId: form.customerId || undefined,
                    notes: form.notes || undefined,
                  },
                  { onSuccess: () => setOpen(false) },
                )
              }
            >
              Tạo
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}

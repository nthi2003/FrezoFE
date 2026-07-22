// ============================================================
// ContractSignPage — OTP + status/confirm DTO BE
// ============================================================

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShieldCheck, Send, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { Button, PageHeader, EmptyState } from '@frezo/ui'
import {
  useContractSignStatus,
  useRequestSignOtp,
  useConfirmSignOtp,
} from '../hooks/useContractSign'
import type { ConfirmSignResult, SignStatusDto } from '../services/contractSignApi'

function isSigned(status?: SignStatusDto | null, confirm?: ConfirmSignResult | null) {
  if (confirm?.status === 'SIGNED') return true
  if (status?.signed) return true
  return (status?.status || '').toUpperCase() === 'SIGNED'
}

export function ContractSignPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: status, isLoading, isError } = useContractSignStatus(id)
  const requestOtp = useRequestSignOtp()
  const confirm = useConfirmSignOtp(id || '')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [lastConfirm, setLastConfirm] = useState<ConfirmSignResult | null>(null)

  if (!id) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Thiếu mã hợp đồng"
        description="URL phải có /qlns/contract/sign/:id"
      />
    )
  }

  const signed = isSigned(status, lastConfirm)
  const signedAt = lastConfirm?.signedAt || status?.signedAt
  const signedBy = lastConfirm?.signedBy || status?.signedBy
  const audit = lastConfirm?.audit || status?.audit

  return (
    <div className="p-6 space-y-4 animate-fade-in max-w-2xl">
      <PageHeader
        title="Ký hợp đồng điện tử"
        description={`Hợp đồng #${id} — xác thực OTP + audit.`}
        actions={
          <Button variant="outline" onClick={() => nav('/qlns/contract')}>
            Quay lại
          </Button>
        }
      />

      {isLoading && (
        <div className="p-8 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-400" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Không tải được trạng thái ký. Vẫn có thể thử gửi OTP.
        </p>
      )}

      {signed ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3">
          <CheckCircle2 className="text-emerald-600 shrink-0" size={22} />
          <div>
            <div className="font-semibold text-emerald-900">Đã ký thành công</div>
            <p className="text-sm text-emerald-800 mt-0.5">
              Bởi {signedBy || '—'} ·{' '}
              {signedAt ? new Date(signedAt).toLocaleString('vi-VN') : ''}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
            <ShieldCheck size={16} className="text-primary-600" /> Xác thực OTP
          </div>
          {status?.sessionId && status?.expiresAt && (
            <p className="text-xs text-neutral-500">
              Session {status.sessionId.slice(0, 8)}… · hết hạn{' '}
              {new Date(status.expiresAt).toLocaleString('vi-VN')}
            </p>
          )}
          <Button
            className="gap-1.5"
            disabled={requestOtp.isPending}
            onClick={() =>
              requestOtp.mutate(id, { onSuccess: () => setOtpSent(true) })
            }
          >
            <Send size={14} />
            {requestOtp.isPending ? 'Đang gửi…' : 'Gửi OTP'}
          </Button>
          {otpSent && (
            <div className="space-y-2">
              <input
                className="w-full border rounded-md px-3 py-2 text-sm font-mono tracking-widest"
                placeholder="Nhập OTP 6 số"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
              <Button
                disabled={confirm.isPending || otp.length < 4}
                onClick={() =>
                  confirm.mutate(otp, {
                    onSuccess: (res) => setLastConfirm(res),
                  })
                }
              >
                Xác nhận ký
              </Button>
            </div>
          )}
        </div>
      )}

      <section className="bg-white border rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-1.5">
          <Clock size={14} /> Audit
        </h3>
        {!audit && !signedAt ? (
          <p className="text-xs text-neutral-400">Chưa có sự kiện.</p>
        ) : (
          <ul className="space-y-1.5 text-sm text-neutral-700">
            {signedAt && (
              <li>
                <span className="text-neutral-400 text-xs mr-2">
                  {new Date(signedAt).toLocaleString('vi-VN')}
                </span>
                SIGNED · {signedBy || '—'}
              </li>
            )}
            {audit && (
              <li className="text-xs text-neutral-500">
                IP: {audit.ip || '—'} · Device: {audit.device || '—'}
              </li>
            )}
            {status?.status && !signed && (
              <li className="text-xs text-neutral-500">
                Status hiện tại: {status.status}
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  )
}

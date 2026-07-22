// ============================================================
// BankStatementImportPage — wizard 3 bước (FZ-001 / FE-4)
// 1. Chọn TK 112x + upload CSV
// 2. Preview + map cột (auto-detect)
// 3. Confirm import
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, ChevronRight, ChevronLeft, Check, Landmark } from 'lucide-react'
import { Button, PageHeader } from '@frezo/ui'
import { formatCurrency } from '@frezo/utils'
import { useAccounts } from '../hooks/useAccounting'
import { useImportBankStatement } from '../hooks/useBankStatement'
import { parseBankCsv } from '../services/bankApi'
import type { Account } from '../services/accountingApi'

type Step = 1 | 2 | 3

interface PreviewLine {
  txnDate: string
  description: string
  refCode?: string
  debit: number
  credit: number
  balance?: number
}

export function BankStatementImportPage() {
  const nav = useNavigate()
  const { data: accounts } = useAccounts()
  const importMut = useImportBankStatement()

  const bankAccounts = useMemo(() => {
    const list = (accounts as Account[] | undefined) ?? []
    const filtered = list.filter((a) => String(a.code || '').startsWith('112'))
    return filtered.length > 0 ? filtered : list.slice(0, 8)
  }, [accounts])

  const [step, setStep] = useState<Step>(1)
  const [accountId, setAccountId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewLine[]>([])
  const [parseError, setParseError] = useState('')

  const selected = bankAccounts.find((a) => a.id === accountId)

  const onFile = async (f: File) => {
    setFile(f)
    setParseError('')
    try {
      const text = await f.text()
      const rows = parseBankCsv(text)
      if (rows.length === 0) {
        setParseError('Không parse được dòng nào — kiểm tra header CSV.')
        setPreview([])
        return
      }
      setPreview(rows)
    } catch {
      setParseError('Đọc file thất bại')
      setPreview([])
    }
  }

  const canNext1 = !!accountId && !!file && preview.length > 0
  const canConfirm = canNext1

  const onConfirm = () => {
    if (!file || !accountId) return
    importMut.mutate(
      {
        accountId,
        accountCode: selected?.code,
        accountName: selected?.name,
        file,
      },
      {
        onSuccess: (stmt) => {
          nav(`/accounting/bank-reconciliation?statementId=${stmt.id}`)
        },
      },
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in max-w-4xl">
      <PageHeader
        title="Import sao kê ngân hàng"
        description="Wizard 3 bước — CSV, khớp exact amount + date (MVP)."
        actions={
          <Button variant="outline" onClick={() => nav('/accounting/bank-reconciliation')}>
            Quay lại
          </Button>
        }
      />

      <StepBar step={step} />

      {step === 1 && (
        <div className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
          <Field label="Tài khoản ngân hàng (112x) *">
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              <option value="">— Chọn TK —</option>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.name}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-200 rounded-xl p-10 cursor-pointer hover:border-primary-300 hover:bg-primary-50/20">
            <Upload size={28} className="text-neutral-400" />
            <span className="text-sm text-neutral-600">
              {file ? file.name : 'Upload file CSV sao kê'}
            </span>
            <span className="text-[11px] text-neutral-400">
              Header gợi ý: date,description,ref,debit,credit,balance
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onFile(f)
              }}
            />
          </label>
          {parseError && (
            <p className="text-sm text-rose-600">{parseError}</p>
          )}
          <div className="flex justify-end">
            <Button disabled={!canNext1} onClick={() => setStep(2)} className="gap-1.5">
              Tiếp <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white border rounded-xl p-5 space-y-3 shadow-sm">
          <p className="text-sm text-neutral-600">
            Preview <b>{preview.length}</b> dòng · TK{' '}
            <b>
              {selected?.code} {selected?.name}
            </b>
          </p>
          <div className="overflow-x-auto border rounded-lg max-h-80">
            <table className="w-full text-xs">
              <thead className="bg-neutral-50 sticky top-0">
                <tr>
                  <th className="p-2 text-left">Ngày</th>
                  <th className="p-2 text-left">Mô tả</th>
                  <th className="p-2 text-left">Ref</th>
                  <th className="p-2 text-right">Nợ</th>
                  <th className="p-2 text-right">Có</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.slice(0, 50).map((r, i) => (
                  <tr key={i}>
                    <td className="p-2 font-mono">{r.txnDate}</td>
                    <td className="p-2 max-w-[240px] truncate">{r.description}</td>
                    <td className="p-2 font-mono text-neutral-500">{r.refCode || '—'}</td>
                    <td className="p-2 text-right tabular-nums">
                      {r.debit ? formatCurrency(r.debit) : '—'}
                    </td>
                    <td className="p-2 text-right tabular-nums text-emerald-700">
                      {r.credit ? formatCurrency(r.credit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 50 && (
            <p className="text-[11px] text-neutral-400">
              Hiển thị 50/{preview.length} dòng
            </p>
          )}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
              <ChevronLeft size={14} /> Quay lại
            </Button>
            <Button onClick={() => setStep(3)} className="gap-1.5">
              Tiếp <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3 p-4 bg-primary-50/50 border border-primary-100 rounded-xl">
            <Landmark size={20} className="text-primary-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-neutral-900">Xác nhận import</div>
              <ul className="mt-1 text-neutral-600 space-y-0.5 list-disc pl-4">
                <li>
                  Tài khoản: {selected?.code} · {selected?.name}
                </li>
                <li>File: {file?.name}</li>
                <li>Số dòng: {preview.length}</li>
                <li>Match tự động: exact amount + date (MVP)</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
              <ChevronLeft size={14} /> Quay lại
            </Button>
            <Button
              className="gap-1.5"
              disabled={!canConfirm || importMut.isPending}
              onClick={onConfirm}
            >
              <Check size={14} />
              {importMut.isPending ? 'Đang import…' : 'Import ngay'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepBar({ step }: { step: Step }) {
  const items = [
    { n: 1 as const, label: 'Chọn TK + Upload' },
    { n: 2 as const, label: 'Preview' },
    { n: 3 as const, label: 'Confirm' },
  ]
  return (
    <div className="flex items-center gap-2">
      {items.map((it, i) => (
        <div key={it.n} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
              step >= it.n
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-400'
            }`}
          >
            {it.n}
          </div>
          <span
            className={`text-xs font-medium hidden sm:inline ${
              step >= it.n ? 'text-neutral-800' : 'text-neutral-400'
            }`}
          >
            {it.label}
          </span>
          {i < items.length - 1 && (
            <ChevronRight size={14} className="text-neutral-300 mx-1" />
          )}
        </div>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-neutral-700 mb-1 block">{label}</label>
      {children}
    </div>
  )
}

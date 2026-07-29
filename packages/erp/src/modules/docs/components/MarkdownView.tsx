// ============================================================
// Simple Markdown → React (không thêm dependency)
// ============================================================

import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ZoomableImage } from '@frezo/ui'

/** Inline code: path chip vs neutral chip (DOC-02, DOC-06). */
function CodeChip({ text }: { text: string }) {
  const isPath = text.startsWith('/') || text.startsWith('http')
  return (
    <code
      className={
        isPath
          ? 'inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary-50 text-primary-800 text-[12px] font-mono border border-primary-100'
          : 'inline-flex items-center px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-800 text-[12px] font-mono border border-neutral-200'
      }
    >
      {text}
    </code>
  )
}

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re =
    /(`[^`]+`|!\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index))
    }
    const token = m[0]
    if (token.startsWith('`')) {
      nodes.push(<CodeChip key={`${keyPrefix}-c-${i++}`} text={token.slice(1, -1)} />)
    } else if (token.startsWith('![')) {
      const im = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(token)
      if (im) {
        nodes.push(
          <ZoomableImage
            key={`${keyPrefix}-img-${i++}`}
            inline
            src={im[2]}
            alt={im[1] || 'Hình minh họa'}
            caption={im[1] || undefined}
            className="my-3 rounded-lg"
          />,
        )
      }
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i++}`}>{token.slice(2, -2)}</strong>,
      )
    } else if (token.startsWith('*')) {
      nodes.push(<em key={`${keyPrefix}-i-${i++}`}>{token.slice(1, -1)}</em>)
    } else if (token.startsWith('[')) {
      const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      if (lm) {
        const href = lm[2]
        const label = lm[1]
        if (href.startsWith('/')) {
          nodes.push(
            <Link
              key={`${keyPrefix}-a-${i++}`}
              to={href}
              className="text-primary-700 underline underline-offset-2 hover:text-primary-800"
            >
              {label}
            </Link>,
          )
        } else {
          nodes.push(
            <a
              key={`${keyPrefix}-a-${i++}`}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary-700 underline underline-offset-2"
            >
              {label}
            </a>,
          )
        }
      }
    }
    last = m.index + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function splitTableCells(line: string): string[] {
  const parts = line.split('|').map((c) => c.trim())
  if (parts[0] === '') parts.shift()
  if (parts.length && parts[parts.length - 1] === '') parts.pop()
  return parts
}

export function MarkdownView({
  source,
  skipFirstH1 = false,
}: {
  source: string
  /** DOC-05: tránh trùng H1 với PageHeader */
  skipFirstH1?: boolean
}) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let key = 0
  let skippedH1 = false

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i++
      continue
    }

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i])
        i++
      }
      i++
      blocks.push(
        <pre
          key={key++}
          className="my-4 overflow-x-auto rounded-lg bg-neutral-900 text-neutral-100 text-[13px] p-4 font-mono"
          data-lang={lang || undefined}
        >
          <code>{code.join('\n')}</code>
        </pre>,
      )
      continue
    }

    const hm = /^(#{1,3})\s+(.+)$/.exec(line)
    if (hm) {
      const level = hm[1].length
      const text = hm[2]
      if (skipFirstH1 && level === 1 && !skippedH1) {
        skippedH1 = true
        i++
        continue
      }
      const cls =
        level === 1
          ? 'text-2xl font-bold text-neutral-900 mt-2 mb-4'
          : level === 2
            ? 'text-xl font-semibold text-neutral-900 mt-8 mb-3 border-b border-neutral-200 pb-2'
            : 'text-base font-semibold text-neutral-800 mt-6 mb-2'
      const Tag = (`h${level}` as 'h1' | 'h2' | 'h3')
      blocks.push(
        <Tag key={key++} className={cls}>
          {inline(text, `h-${key}`)}
        </Tag>,
      )
      i++
      continue
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="my-8 border-neutral-200" />)
      i++
      continue
    }

    const imgBlock = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line.trim())
    if (imgBlock) {
      blocks.push(
        <figure key={key++} className="my-5">
          <ZoomableImage
            src={imgBlock[2]}
            alt={imgBlock[1] || 'Hình minh họa'}
            caption={imgBlock[1] || undefined}
          />
          {imgBlock[1] ? (
            <figcaption className="mt-2 text-xs text-neutral-500 text-center">
              {imgBlock[1]} · Bấm vào ảnh để phóng to
            </figcaption>
          ) : null}
        </figure>,
      )
      i++
      continue
    }

    if (
      line.includes('|') &&
      i + 1 < lines.length &&
      /^\|?[\s-:|]+\|?$/.test(lines[i + 1])
    ) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].includes('|')) {
        const cells = splitTableCells(lines[i])
        const isSep = cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c))
        if (!isSep) rows.push(cells)
        i++
      }
      if (rows.length > 0) {
        const [head, ...body] = rows
        blocks.push(
          <div
            key={key++}
            className="my-5 overflow-x-auto rounded-xl border border-neutral-200 shadow-sm"
          >
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-100/90 text-left">
                  {head.map((c, ci) => (
                    <th
                      key={ci}
                      className="px-4 py-3 font-semibold text-neutral-700 text-xs uppercase tracking-wide border-b border-neutral-200"
                    >
                      {inline(c, `th-${key}-${ci}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {body.map((row, ri) => (
                  <tr key={ri} className="hover:bg-primary-50/30">
                    {row.map((c, ci) => (
                      <td key={ci} className="px-4 py-3 text-neutral-800 align-top">
                        {inline(c, `td-${ri}-${ci}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        )
      }
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i++
      }
      blocks.push(
        <ul key={key++} className="my-3 list-disc pl-6 space-y-1.5 text-neutral-700">
          {items.map((it, ii) => (
            <li key={ii}>{inline(it, `ul-${key}-${ii}`)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push(
        <ol key={key++} className="my-3 list-decimal pl-6 space-y-1.5 text-neutral-700">
          {items.map((it, ii) => (
            <li key={ii}>{inline(it, `ol-${key}-${ii}`)}</li>
          ))}
        </ol>,
      )
      continue
    }

    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('```') &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim()) &&
      !(
        lines[i].includes('|') &&
        i + 1 < lines.length &&
        /^\|?[\s-:|]+\|?$/.test(lines[i + 1])
      )
    ) {
      para.push(lines[i])
      i++
    }
    blocks.push(
      <p key={key++} className="my-3 text-neutral-700 leading-relaxed">
        {inline(para.join(' '), `p-${key}`)}
      </p>,
    )
  }

  return <Fragment>{blocks}</Fragment>
}

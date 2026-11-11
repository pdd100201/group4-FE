import { useId, useState } from 'react'
import './ReportChart.css'

export interface ChartPoint {
  label: string
  value: number
}

const colors = ['#2859df', '#008477', '#8051d0', '#c46917', '#ba3f72', '#297897', '#63738b']
const number = new Intl.NumberFormat('vi-VN')
const percent = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 })

interface ReportChartProps {
  title: string
  points: readonly ChartPoint[]
  scope?: string
  formatValue?: (value: number) => string
}

export function ReportChart({ title, points, scope, formatValue = number.format }: ReportChartProps) {
  const [view, setView] = useState<'bar' | 'pie'>('bar')
  const titleId = useId()
  const ranked = points.filter(point => Number.isFinite(point.value) && point.value > 0)
    .sort((a, b) => b.value - a.value)
  const visible = ranked.length > colors.length
    ? [...ranked.slice(0, colors.length - 1), {
      label: 'Các mục còn lại',
      value: ranked.slice(colors.length - 1).reduce((sum, point) => sum + point.value, 0),
    }]
    : ranked
  const total = visible.reduce((sum, point) => sum + point.value, 0)
  const max = Math.max(...visible.map(point => point.value), 1)
  let cumulative = 0
  const segments = visible.map(({ value }, index) => {
    const start = cumulative / total * 100
    cumulative += value
    return `${colors[index]} ${start}% ${cumulative / total * 100}%`
  })

  return <section className="report-chart" aria-labelledby={titleId}>
    <header className="report-chart-header">
      <div>
        <h2 id={titleId}>{title}</h2>
        {scope && <p>{scope}</p>}
      </div>
      <div className="report-chart-switch" role="group" aria-label="Dạng biểu đồ">
        <button type="button" aria-pressed={view === 'bar'} onClick={() => setView('bar')}>Cột</button>
        <button type="button" aria-pressed={view === 'pie'} onClick={() => setView('pie')}>Tròn</button>
      </div>
    </header>
    {total > 0 ? <div className={`report-chart-body report-chart-body--${view}`}>
      {view === 'bar' ? <div className="report-chart-bars" aria-hidden="true">
        {visible.map(({ label, value }, index) => <div className="report-chart-column" key={index} title={`${label} · ${formatValue(value)}`}>
          <span style={{ height: `${value / max * 100}%`, backgroundColor: colors[index] }} />
        </div>)}
      </div> : <div className="report-chart-pie" aria-hidden="true" style={{ backgroundImage: `conic-gradient(${segments.join(', ')})` }} />}
      <ul className="report-chart-legend">
        {visible.map(({ label, value }, index) => <li key={index}>
          <span className="report-chart-swatch" style={{ backgroundColor: colors[index] }} aria-hidden="true" />
          <span className="report-chart-label">{label}</span>
          <strong>{formatValue(value)}</strong>
          {view === 'pie' && <span className="report-chart-percent">{percent.format(value / total)}</span>}
        </li>)}
      </ul>
    </div> : <p className="report-chart-empty">Chưa có số liệu để hiển thị.</p>}
  </section>
}

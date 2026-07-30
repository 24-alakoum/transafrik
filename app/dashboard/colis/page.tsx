'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Package, QrCode, Search, Plus, CheckCircle2,
  Truck, Clock, MapPin, Phone, User, ChevronRight,
  ArrowRight, Filter, Download, X, AlertCircle, RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useColis } from '@/lib/queries/hooks'
import { CardGridSkeleton } from '@/components/ui/Skeleton'

// ── Types & Constants ─────────────────────────────────
type PackageStatus = 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned' | 'lost'

interface Colis {
  id: string
  reference: string
  qr_code: string
  recipient_name: string
  recipient_phone: string
  recipient_address: string | null
  weight_kg: number | null
  status: PackageStatus
  estimated_delivery: string | null
  trip_ref: string | null
  created_at: string
}

const STATUS_CONFIG: Record<PackageStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:          { label: 'En attente',        color: 'text-text-muted',  bg: 'bg-bg-raised',       icon: <Clock className="w-3.5 h-3.5" /> },
  picked_up:        { label: 'Collecté',           color: 'text-warning',     bg: 'bg-warning/10',      icon: <Package className="w-3.5 h-3.5" /> },
  in_transit:       { label: 'En transit',         color: 'text-accent',      bg: 'bg-accent/10',       icon: <Truck className="w-3.5 h-3.5" /> },
  out_for_delivery: { label: 'En livraison',       color: 'text-blue-400',    bg: 'bg-blue-400/10',     icon: <ArrowRight className="w-3.5 h-3.5" /> },
  delivered:        { label: 'Livré',              color: 'text-success',     bg: 'bg-success/10',      icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  returned:         { label: 'Retourné',           color: 'text-orange-400',  bg: 'bg-orange-400/10',   icon: <RefreshCw className="w-3.5 h-3.5" /> },
  lost:             { label: 'Perdu',              color: 'text-danger',      bg: 'bg-danger/10',       icon: <AlertCircle className="w-3.5 h-3.5" /> },
}

const MOCK_COLIS: Colis[] = [
  { id: '1', reference: 'COL-2024-001', qr_code: 'QR-COL-001-TRANSAFRIK', recipient_name: 'Fatoumata Diallo', recipient_phone: '+223 76 12 34 56', recipient_address: 'Dakar, Plateau', weight_kg: 12.5, status: 'in_transit', estimated_delivery: '2024-06-15', trip_ref: 'TRP-2024-001', created_at: '2024-06-10T08:00:00Z' },
  { id: '2', reference: 'COL-2024-002', qr_code: 'QR-COL-002-TRANSAFRIK', recipient_name: 'Ibrahima Coulibaly', recipient_phone: '+221 77 98 76 54', recipient_address: 'Abidjan, Cocody', weight_kg: 5.2, status: 'delivered', estimated_delivery: '2024-06-12', trip_ref: 'TRP-2024-002', created_at: '2024-06-08T10:00:00Z' },
  { id: '3', reference: 'COL-2024-003', qr_code: 'QR-COL-003-TRANSAFRIK', recipient_name: 'Aminata Traoré', recipient_phone: '+226 70 11 22 33', recipient_address: 'Ouagadougou, Wemtenga', weight_kg: 28.0, status: 'pending', estimated_delivery: '2024-06-18', trip_ref: null, created_at: '2024-06-11T14:00:00Z' },
  { id: '4', reference: 'COL-2024-004', qr_code: 'QR-COL-004-TRANSAFRIK', recipient_name: 'Moussa Keïta', recipient_phone: '+224 62 55 44 33', recipient_address: 'Conakry, Kaloum', weight_kg: 8.7, status: 'out_for_delivery', estimated_delivery: '2024-06-14', trip_ref: 'TRP-2024-003', created_at: '2024-06-09T09:00:00Z' },
  { id: '5', reference: 'COL-2024-005', qr_code: 'QR-COL-005-TRANSAFRIK', recipient_name: 'Kadiatou Barry', recipient_phone: '+225 05 30 40 50', recipient_address: 'Bamako, ACI 2000', weight_kg: 3.1, status: 'picked_up', estimated_delivery: '2024-06-20', trip_ref: 'TRP-2024-001', created_at: '2024-06-12T11:00:00Z' },
]

// ── QR Scanner Modal ──────────────────────────────────
function QRScanModal({ onClose }: { onClose: () => void }) {
  const [scanned, setScanned] = useState(false)
  const [qrInput, setQrInput] = useState('')

  const handleScan = () => {
    if (qrInput.trim()) setScanned(true)
  }

  const found = MOCK_COLIS.find(c => c.qr_code === qrInput.trim() || c.reference === qrInput.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-bg-card border border-border-base rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-border-base flex items-center justify-between">
          <h3 className="font-syne font-bold text-text-primary flex items-center gap-2">
            <QrCode className="w-5 h-5 text-accent" /> Scanner QR Code
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-bg-raised flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Camera viewfinder */}
          <div className="relative bg-bg-surface rounded-xl aspect-square max-h-52 flex items-center justify-center border-2 border-dashed border-border-base overflow-hidden">
            <div className="absolute inset-4 border-2 border-accent/60 rounded-xl">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-accent rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-accent rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-accent rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-accent rounded-br-lg" />
              <div className="absolute inset-0 flex items-center overflow-hidden">
                <div className="w-full h-0.5 bg-accent/70 animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
            </div>
            <div className="text-center z-10">
              <QrCode className="w-12 h-12 text-text-muted/40 mx-auto mb-2" />
              <p className="text-xs text-text-muted">Caméra (nécessite permission)</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-px bg-border-base" />
            <p className="text-center text-xs text-text-muted py-3">— ou saisir manuellement —</p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={qrInput}
              onChange={e => setQrInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="COL-2024-001 ou QR-COL-001-TRANSAFRIK"
              className="flex-1 px-3 py-2 bg-bg-surface border border-border-base rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60"
            />
            <button onClick={handleScan} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Result */}
          {scanned && (
            found ? (
              <div className="bg-success/10 border border-success/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="font-semibold text-success">Colis trouvé !</span>
                </div>
                <p className="text-sm text-text-primary font-medium">{found.reference}</p>
                <p className="text-sm text-text-secondary">Destinataire : {found.recipient_name}</p>
                <div className={`inline-flex items-center gap-1.5 mt-2 text-xs px-2 py-1 rounded-full font-medium ${STATUS_CONFIG[found.status].color} ${STATUS_CONFIG[found.status].bg}`}>
                  {STATUS_CONFIG[found.status].icon} {STATUS_CONFIG[found.status].label}
                </div>
              </div>
            ) : (
              <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-danger shrink-0" />
                <p className="text-sm text-danger">Aucun colis trouvé pour ce code</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────
function StatusBadge({ status }: { status: PackageStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color} ${cfg.bg}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────
export default function ColisPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<PackageStatus | 'all'>('all')
  const [showScanner, setShowScanner] = useState(false)
  const [selected, setSelected] = useState<Colis | null>(null)

  const { data: response, isLoading } = useColis({
    q: search,
    status: filterStatus === 'all' ? '' : filterStatus
  })

  const filtered = response?.data || []

  const stats = {
    total: filtered.length,
    in_transit: filtered.filter((c: any) => c.status === 'in_transit').length,
    delivered: filtered.filter((c: any) => c.status === 'delivered').length,
    pending: filtered.filter((c: any) => c.status === 'pending').length,
  }

  return (
    <>
      {showScanner && <QRScanModal onClose={() => setShowScanner(false)} />}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                <Package className="w-5 h-5 text-accent" />
              </div>
              Tracking Colis
            </h1>
            <p className="text-text-secondary mt-1">Suivi des colis avec QR Code</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-all text-sm font-medium"
            >
              <QrCode className="w-4 h-4" /> Scanner QR
            </button>
            <Link
              href="/dashboard/colis/nouveau"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent/90 transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Nouveau colis
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total colis', value: stats.total, color: 'text-text-primary', icon: Package },
            { label: 'En transit', value: stats.in_transit, color: 'text-accent', icon: Truck },
            { label: 'Livrés', value: stats.delivered, color: 'text-success', icon: CheckCircle2 },
            { label: 'En attente', value: stats.pending, color: 'text-warning', icon: Clock },
          ].map((s, i) => (
            <div key={i} className="bg-bg-card border border-border-base rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-bg-raised flex items-center justify-center shrink-0">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-text-muted">{s.label}</p>
                <p className={`text-2xl font-bold font-syne ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Rechercher par référence, destinataire, téléphone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-bg-card border border-border-base rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as PackageStatus | 'all')}
              className="px-3 py-2.5 bg-bg-card border border-border-base rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent/60 transition-colors cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Colis Table */}
        <div className="bg-bg-card border border-border-base rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border-base flex items-center justify-between">
            <p className="text-sm text-text-muted"><span className="font-semibold text-text-primary">{filtered.length}</span> colis trouvés</p>
            <button className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors">
              <Download className="w-4 h-4" /> Exporter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-base/50">
                  {['Référence', 'Destinataire', 'Statut', 'Livraison estimée', 'Voyage', 'Poids'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8">
                      <div className="flex flex-col gap-3 items-center justify-center">
                        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-text-muted">Chargement des colis...</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-text-muted text-sm">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Aucun colis trouvé
                    </td>
                  </tr>
                ) : filtered.map((c: any) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="hover:bg-bg-raised transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-text-primary text-sm">{c.reference}</p>
                        <p className="text-xs text-text-muted font-mono">{c.qr_code.slice(0, 20)}…</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                          {c.recipient_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm text-text-primary">{c.recipient_name}</p>
                          <p className="text-xs text-text-muted">{c.recipient_phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {c.estimated_delivery ? new Date(c.estimated_delivery).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-accent">{c.trip_ref ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{c.weight_kg ? `${c.weight_kg} kg` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

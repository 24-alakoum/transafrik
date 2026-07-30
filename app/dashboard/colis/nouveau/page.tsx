'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ArrowLeft, QrCode, User, Phone, MapPin, Weight, Calendar, Truck, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

function generateQRCode(ref: string) {
  return `QR-${ref}-TRANSAFRIK-${Date.now().toString(36).toUpperCase()}`
}
function generateRef() {
  const y = new Date().getFullYear()
  const n = Math.floor(Math.random() * 900 + 100)
  return `COL-${y}-${n.toString().padStart(3, '0')}`
}

interface FormData {
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  description: string
  weight_kg: string
  estimated_delivery: string
  notes: string
}

const INITIAL: FormData = {
  recipient_name: '', recipient_phone: '', recipient_address: '',
  description: '', weight_kg: '', estimated_delivery: '', notes: '',
}

export default function NouveauColisPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [success, setSuccess] = useState(false)
  const [generatedRef] = useState(generateRef())

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs: Partial<FormData> = {}
    if (!form.recipient_name.trim()) errs.recipient_name = 'Nom requis'
    if (!form.recipient_phone.trim()) errs.recipient_phone = 'Téléphone requis'
    if (form.recipient_phone && form.recipient_phone.trim().length < 8) errs.recipient_phone = 'Numéro invalide'
    return errs
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    startTransition(async () => {
      const { createColis } = await import('../actions')
      const result = await createColis({
        ...form,
        reference: generatedRef,
        qr_code: generateQRCode(generatedRef)
      })

      if (result?.error) {
        setErrors({ notes: result.error }) // Display error in notes area for now or use a global error state
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/dashboard/colis'), 1800)
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-success/20 border-2 border-success flex items-center justify-center animate-scale-in">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <div>
          <h2 className="text-2xl font-syne font-bold text-text-primary">Colis créé !</h2>
          <p className="text-text-secondary mt-1">Référence : <strong className="text-accent">{generatedRef}</strong></p>
          <p className="text-sm text-text-muted mt-0.5">Redirection vers la liste…</p>
        </div>
      </div>
    )
  }

  const InputField = ({
    label, field, placeholder, icon: Icon, type = 'text', required = false
  }: {
    label: string; field: keyof FormData; placeholder: string;
    icon: React.ElementType; type?: string; required?: boolean
  }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary flex items-center gap-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type={type}
          value={form[field]}
          onChange={set(field)}
          placeholder={placeholder}
          className={`w-full pl-9 pr-4 py-2.5 bg-bg-surface border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 transition-all ${
            errors[field] ? 'border-danger focus:ring-danger/20' : 'border-border-base focus:border-accent/60 focus:ring-accent/10'
          }`}
        />
      </div>
      {errors[field] && <p className="text-xs text-danger">{errors[field]}</p>}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/colis"
          className="w-9 h-9 rounded-xl border border-border-base bg-bg-card flex items-center justify-center hover:border-accent/40 hover:bg-accent/5 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-2xl font-syne font-bold text-text-primary flex items-center gap-2">
            <Package className="w-6 h-6 text-accent" /> Nouveau Colis
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">Un QR Code unique sera généré automatiquement</p>
        </div>
      </div>

      {/* QR Preview Card */}
      <div className="bg-gradient-to-r from-accent/10 to-purple-500/10 border border-accent/20 rounded-2xl p-5 flex items-center gap-5">
        <div className="w-16 h-16 bg-bg-card rounded-xl border border-accent/20 flex items-center justify-center shrink-0">
          <QrCode className="w-9 h-9 text-accent" />
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">Référence auto-générée</p>
          <p className="text-lg font-bold font-syne text-text-primary">{generatedRef}</p>
          <p className="text-xs text-text-muted font-mono mt-0.5 truncate max-w-xs">
            {generateQRCode(generatedRef)}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destinataire */}
        <div className="bg-bg-card border border-border-base rounded-2xl p-5 space-y-4">
          <h3 className="font-syne font-semibold text-text-primary flex items-center gap-2">
            <User className="w-4 h-4 text-accent" /> Destinataire
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Nom complet" field="recipient_name" placeholder="Fatoumata Diallo" icon={User} required />
            <InputField label="Téléphone" field="recipient_phone" placeholder="+223 76 12 34 56" icon={Phone} required />
          </div>
          <InputField label="Adresse de livraison" field="recipient_address" placeholder="Dakar, Plateau — Rue 12" icon={MapPin} />
        </div>

        {/* Colis */}
        <div className="bg-bg-card border border-border-base rounded-2xl p-5 space-y-4">
          <h3 className="font-syne font-semibold text-text-primary flex items-center gap-2">
            <Package className="w-4 h-4 text-accent" /> Détails du colis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Description" field="description" placeholder="Électroniques, vêtements…" icon={FileText} />
            <InputField label="Poids (kg)" field="weight_kg" placeholder="12.5" icon={Weight} type="number" />
          </div>
          <InputField label="Livraison estimée" field="estimated_delivery" placeholder="" icon={Calendar} type="date" />
        </div>

        {/* Notes */}
        <div className="bg-bg-card border border-border-base rounded-2xl p-5 space-y-3">
          <label className="text-sm font-medium text-text-primary">Notes internes</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={3}
            placeholder="Instructions particulières, fragile, prioritaire…"
            className="w-full px-4 py-2.5 bg-bg-surface border border-border-base rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10 transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Link
            href="/dashboard/colis"
            className="px-6 py-2.5 rounded-xl border border-border-base text-text-secondary hover:bg-bg-raised hover:text-text-primary transition-all text-sm font-medium"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-glow-sm"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
            ) : (
              <><Package className="w-4 h-4" /> Créer le colis</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

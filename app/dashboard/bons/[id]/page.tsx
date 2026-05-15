import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatFCFA, formatDate } from '@/lib/utils'
import { BON_STATUSES } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FileDown, Send, CheckCircle2 } from 'lucide-react'

export default async function BonDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const { data: bon } = await supabase
    .from('delivery_notes')
    .select(`
      *,
      trips (
        reference, origin, destination, cargo_type, cargo_weight_kg,
        clients (name, address, phone, email),
        trip_lines (*)
      )
    `)
    .eq('id', id)
    .single()

  if (!bon) notFound()

  const statusInfo = BON_STATUSES[bon.status as keyof typeof BON_STATUSES]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">
              Facture {bon.reference}
            </h1>
            <Badge variant={statusInfo.color as any}>{statusInfo.label}</Badge>
          </div>
          <p className="text-text-secondary">
            Créée le {formatDate(bon.issued_date)} • Échéance : {bon.due_date ? formatDate(bon.due_date) : '-'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" asChild>
            <a href={`/api/bons/${bon.id}/pdf`} target="_blank" rel="noopener noreferrer">
              <FileDown className="w-4 h-4 mr-2" /> Télécharger PDF
            </a>
          </Button>
          <form action={`/api/bons/${bon.id}/email`} method="POST">
             {/* This would actually be a client component or server action in prod to handle state */}
             <Button variant="secondary" type="submit">
               <Send className="w-4 h-4 mr-2" /> Envoyer au client
             </Button>
          </form>
          {bon.status !== 'paid' && (
            <Button variant="success">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Marquer comme payé
            </Button>
          )}
        </div>
      </div>

      <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm p-8 max-w-4xl mx-auto">
         {/* Prévisualisation simplifiée du bon */}
         <div className="flex justify-between items-start mb-8 pb-8 border-b border-border-base">
            <div>
               <h3 className="font-syne font-bold text-lg text-text-primary mb-2">Facturé à</h3>
               <p className="text-text-primary font-medium">{bon.trips?.clients?.name}</p>
               <p className="text-text-secondary text-sm">{bon.trips?.clients?.address}</p>
               <p className="text-text-secondary text-sm">{bon.trips?.clients?.email}</p>
            </div>
            <div className="text-right">
               <h3 className="font-syne font-bold text-lg text-text-primary mb-2">Détails du voyage</h3>
               <p className="text-text-secondary text-sm">Réf : {bon.trips?.reference}</p>
               <p className="text-text-secondary text-sm">Trajet : {bon.trips?.origin} → {bon.trips?.destination}</p>
               <p className="text-text-secondary text-sm">Marchandise : {bon.trips?.cargo_type}</p>
            </div>
         </div>

         <div className="space-y-4">
            <div className="flex justify-between text-sm font-medium text-text-secondary pb-2 border-b border-border-base">
               <span>Description</span>
               <div className="flex gap-12 w-1/2 justify-end">
                 <span>Prix Unitaire</span>
                 <span>Total</span>
               </div>
            </div>

            {bon.trips?.trip_lines?.map((line: any, i: number) => (
               <div key={i} className="flex justify-between text-sm py-2">
                 <span className="text-text-primary">{line.description}</span>
                 <div className="flex gap-12 w-1/2 justify-end text-right">
                   <span>{formatFCFA(line.unit_price_fcfa)}</span>
                   <span className="font-medium text-text-primary">{formatFCFA(line.total_fcfa)}</span>
                 </div>
               </div>
            ))}
         </div>

         <div className="mt-8 pt-8 border-t border-border-base flex justify-end">
            <div className="w-64 space-y-3 text-sm">
               <div className="flex justify-between text-text-secondary">
                 <span>Sous-total HT</span>
                 <span>{formatFCFA(bon.subtotal_fcfa)}</span>
               </div>
               <div className="flex justify-between text-text-secondary">
                 <span>TVA ({bon.tax_rate}%)</span>
                 <span>{formatFCFA(bon.tax_amount_fcfa)}</span>
               </div>
               <div className="flex justify-between text-lg font-syne font-bold text-accent pt-3 border-t border-border-base">
                 <span>Total TTC</span>
                 <span>{formatFCFA(bon.total_fcfa)}</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}

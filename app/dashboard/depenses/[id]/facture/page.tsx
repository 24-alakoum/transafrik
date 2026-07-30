'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Printer, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatFCFA, formatDate } from '@/lib/utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

export default function FactureDepensePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading } = useQuery({
    queryKey: ['depense', id],
    queryFn: async () => {
      // Pour une vraie appli, on pourrait créer un endpoint API dédié
      // ou utiliser le Supabase client ici pour récupérer la dépense avec les relations
      const res = await fetch(`/api/data/depenses?id=${id}`) // Supposons que notre API supporte le filtrage
      if (!res.ok) throw new Error('Erreur')
      const json = await res.json()
      // Si on n'a pas de endpoint par id, on filtre côté client temporairement
      return json.data?.find((d: any) => d.id === id)
    },
  })

  // Dans un cas réel, vous auriez les détails de l'entreprise
  const companyInfo = {
    name: 'TransAfrik Logistics',
    address: '123 Route des Hydrocarbures, Dakar',
    email: 'contact@transafrik.sn',
    phone: '+221 33 800 00 00',
    ninea: '0123456789'
  }

  React.useEffect(() => {
    // Si on veut lancer l'impression automatiquement à la fin du chargement
    if (!isLoading && data) {
      // setTimeout(() => window.print(), 500)
    }
  }, [isLoading, data])

  if (isLoading) return <div className="p-8 text-center">Chargement de la facture...</div>
  if (!data) return <div className="p-8 text-center text-danger">Facture introuvable</div>

  const catInfo = EXPENSE_CATEGORIES[data.category as keyof typeof EXPENSE_CATEGORIES] || { label: data.category }

  return (
    <div className="min-h-screen bg-bg-base print:bg-white text-text-primary p-4 sm:p-8">
      {/* Contrôles d'impression - Masqués lors de l'impression */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Imprimer
        </Button>
      </div>

      {/* Feuille A4 */}
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 shadow-sm border border-border-base rounded-lg print:shadow-none print:border-none print:p-0">
        
        {/* Header de la facture */}
        <div className="flex justify-between items-start mb-12 border-b border-gray-200 pb-8">
          <div>
            <h1 className="text-3xl font-syne font-bold text-gray-900 tracking-tight">TransAfrik</h1>
            <p className="text-gray-500 text-sm mt-1">Logistique & Transport</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest mb-1">Facture / Reçu</h2>
            <p className="text-gray-500 font-mono">N° {data.id.substring(0, 8).toUpperCase()}</p>
            <p className="text-gray-500">Date : {formatDate(data.date)}</p>
          </div>
        </div>

        {/* Coordonnées */}
        <div className="flex justify-between mb-12">
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Émetteur</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <p className="font-medium text-gray-800">{companyInfo.name}</p>
              <p>{companyInfo.address}</p>
              <p>{companyInfo.email}</p>
              <p>{companyInfo.phone}</p>
              <p>NINEA: {companyInfo.ninea}</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-gray-800 mb-2">Imputation Interne</h3>
            <div className="text-gray-600 text-sm space-y-1">
              {data.trips?.reference && <p>Voyage : <span className="font-medium text-gray-800">{data.trips.reference}</span></p>}
              {data.trucks?.plate && <p>Camion : <span className="font-medium text-gray-800">{data.trucks.plate}</span></p>}
              {!data.trips?.reference && !data.trucks?.plate && <p>Type : <span className="font-medium text-gray-800">Dépense Générale</span></p>}
              <p>Statut : <span className="font-medium text-gray-800">{data.is_reimbursed ? 'Remboursé' : 'Non remboursé'}</span></p>
            </div>
          </div>
        </div>

        {/* Lignes de facture */}
        <table className="w-full mb-12 text-left">
          <thead>
            <tr className="border-b-2 border-gray-800 text-gray-800">
              <th className="py-3 px-2 font-bold uppercase text-sm">Description</th>
              <th className="py-3 px-2 font-bold uppercase text-sm">Catégorie</th>
              <th className="py-3 px-2 font-bold uppercase text-sm text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-2 text-gray-700">{data.description || 'Dépense opérationnelle'}</td>
              <td className="py-4 px-2 text-gray-700">{catInfo.label}</td>
              <td className="py-4 px-2 text-right font-medium text-gray-800">{formatFCFA(data.amount_fcfa)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totaux */}
        <div className="flex justify-end mb-16">
          <div className="w-1/2">
            <div className="flex justify-between py-2 text-gray-600">
              <span>Sous-total</span>
              <span>{formatFCFA(data.amount_fcfa)}</span>
            </div>
            <div className="flex justify-between py-2 text-gray-600 border-b border-gray-200">
              <span>TVA (0%)</span>
              <span>0 FCFA</span>
            </div>
            <div className="flex justify-between py-3 font-bold text-xl text-gray-900 border-b-2 border-gray-800">
              <span>Total TTC</span>
              <span>{formatFCFA(data.amount_fcfa)}</span>
            </div>
          </div>
        </div>

        {/* Footer / Signatures */}
        <div className="grid grid-cols-2 gap-8 text-center text-gray-500 text-sm pt-8">
          <div>
            <p className="font-bold text-gray-800 mb-8">Signature Auteur</p>
            <div className="border-b border-gray-300 w-48 mx-auto"></div>
          </div>
          <div>
            <p className="font-bold text-gray-800 mb-8">Validation Direction</p>
            <div className="border-b border-gray-300 w-48 mx-auto"></div>
          </div>
        </div>
        
        <div className="mt-16 text-center text-xs text-gray-400 border-t border-gray-200 pt-8">
          Document généré automatiquement par TransAfrik OS le {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  )
}

'use client'

import * as React from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatFCFA } from '@/lib/utils'

export function LignesForm() {
  const { control, register, watch } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  })

  const lines = watch('lines') || []

  const total = lines.reduce((acc: number, line: any) => {
    return acc + ((line.quantity || 0) * (line.unit_price_fcfa || 0))
  }, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-syne font-semibold text-text-primary">Lignes de facturation</h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => append({ description: '', quantity: 1, unit: 'unité', unit_price_fcfa: 0, sort_order: fields.length })}
        >
          <Plus className="w-4 h-4 mr-1" /> Ajouter une ligne
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-3 items-start bg-bg-surface p-3 rounded-lg border border-border-base">
            <div className="flex-1 grid grid-cols-12 gap-3">
              <div className="col-span-12 sm:col-span-5">
                <Input 
                  {...register(`lines.${index}.description` as const)} 
                  placeholder="Description..." 
                  className="bg-bg-card"
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input 
                  {...register(`lines.${index}.quantity` as const)} 
                  type="number" 
                  placeholder="Qté" 
                  className="bg-bg-card"
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input 
                  {...register(`lines.${index}.unit` as const)} 
                  placeholder="Unité" 
                  className="bg-bg-card"
                />
              </div>
              <div className="col-span-4 sm:col-span-3">
                <Input 
                  {...register(`lines.${index}.unit_price_fcfa` as const)} 
                  type="number" 
                  placeholder="Prix unitaire" 
                  className="bg-bg-card"
                />
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="text-text-muted hover:text-danger hover:bg-danger/10 px-2"
              onClick={() => remove(index)}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        ))}
        
        {fields.length === 0 && (
          <div className="text-center p-6 border border-dashed border-border-base rounded-lg text-text-muted">
            Aucune ligne pour le moment
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-border-base">
        <div className="bg-bg-surface px-6 py-3 rounded-xl border border-border-base flex items-center gap-4">
          <span className="text-text-secondary font-medium">Total estimé :</span>
          <span className="text-xl font-syne font-bold text-accent">{formatFCFA(total)}</span>
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Création des styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4361EE', // accent color
  },
  companyInfo: {
    marginTop: 10,
    color: '#555',
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: 'bold',
    color: '#555',
    width: 100,
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 8,
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  totals: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    paddingVertical: 4,
  },
  totalAmount: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#4361EE',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#888',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  }
})

interface BonPDFProps {
  bon: any
  company: any
}

export function BonPDF({ bon, company }: BonPDFProps) {
  const isInvoice = bon.type === 'invoice' || bon.total_fcfa > 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{company?.name || 'TransAfrik'}</Text>
            <View style={styles.companyInfo}>
              <Text>{company?.address}</Text>
              <Text>{company?.phone}</Text>
              <Text>{company?.email}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 20, color: '#333', marginBottom: 5 }}>
              {isInvoice ? 'FACTURE' : 'BON DE LIVRAISON'}
            </Text>
            <Text style={{ fontWeight: 'bold' }}>{bon.reference}</Text>
            <Text style={{ marginTop: 5, color: '#555' }}>Date: {new Date(bon.issued_date).toLocaleDateString()}</Text>
            {bon.due_date && (
              <Text style={{ color: '#555' }}>Échéance: {new Date(bon.due_date).toLocaleDateString()}</Text>
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5, color: '#555' }}>FACTURÉ À :</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{bon.trips?.clients?.name}</Text>
            <Text>{bon.trips?.clients?.address}</Text>
            <Text>{bon.trips?.clients?.phone}</Text>
            <Text>{bon.trips?.clients?.email}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5, color: '#555' }}>DÉTAILS DU VOYAGE :</Text>
            <Text>Réf: {bon.trips?.reference}</Text>
            <Text>Trajet: {bon.trips?.origin} - {bon.trips?.destination}</Text>
            <Text>Marchandise: {bon.trips?.cargo_type}</Text>
            <Text>Poids: {bon.trips?.cargo_weight_kg} kg</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Quantité</Text>
            <Text style={styles.colPrice}>Prix U. (FCFA)</Text>
            <Text style={styles.colTotal}>Total (FCFA)</Text>
          </View>

          {bon.trips?.trip_lines?.map((line: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDesc}>{line.description}</Text>
              <Text style={styles.colQty}>{line.quantity} {line.unit}</Text>
              <Text style={styles.colPrice}>{Number(line.unit_price_fcfa).toLocaleString()}</Text>
              <Text style={styles.colTotal}>{Number(line.total_fcfa).toLocaleString()}</Text>
            </View>
          ))}
          
          {!bon.trips?.trip_lines?.length && (
            <View style={styles.tableRow}>
              <Text style={styles.colDesc}>Prestation de transport</Text>
              <Text style={styles.colQty}>1 forfait</Text>
              <Text style={styles.colPrice}>{Number(bon.subtotal_fcfa).toLocaleString()}</Text>
              <Text style={styles.colTotal}>{Number(bon.subtotal_fcfa).toLocaleString()}</Text>
            </View>
          )}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Sous-total HT:</Text>
            <Text>{Number(bon.subtotal_fcfa).toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>TVA ({bon.tax_rate}%):</Text>
            <Text>{Number(bon.tax_amount_fcfa).toLocaleString()}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 5, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 5 }]}>
            <Text style={{ fontWeight: 'bold' }}>TOTAL TTC:</Text>
            <Text style={styles.totalAmount}>{Number(bon.total_fcfa).toLocaleString()} FCFA</Text>
          </View>
        </View>

        {bon.notes && (
          <View style={{ marginTop: 40 }}>
            <Text style={{ fontWeight: 'bold', color: '#555', marginBottom: 5 }}>Notes & Conditions :</Text>
            <Text style={{ color: '#555' }}>{bon.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Document généré par TransAfrik - {company?.name} • NIF: {company?.nif || '-'} • RCCM: {company?.rccm || '-'}
        </Text>
      </Page>
    </Document>
  )
}

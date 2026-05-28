import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { QuoteRow } from '@/types';

// ── Formatting helpers ──────────────────────────────────────────────────────
// Duplicated here (rather than re-using src/lib/utils) so this module stays
// importable in both the browser bundle and the API-route (Node.js) bundle.

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function fmtPercent(rate: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rate);
}

function fmtDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111111',
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
    lineHeight: 1.4,
  },

  // Header
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#555555',
    marginBottom: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
    marginBottom: 24,
  },
  thinDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    marginBottom: 16,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },

  // Key-value rows (Customer Info & Installation Details)
  kvRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  kvLabel: {
    fontFamily: 'Helvetica-Bold',
    width: 150,
  },
  kvValue: {
    flex: 1,
  },

  // Financing Options table
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
    paddingBottom: 5,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
  },
  colTerm: { width: '25%' },
  colApr: { width: '20%' },
  colMonthly: { width: '27.5%' },
  colTotal: { width: '27.5%', textAlign: 'right' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc',
    paddingTop: 8,
    fontSize: 9,
    color: '#777777',
    textAlign: 'center',
  },
});

// ── Component ────────────────────────────────────────────────────────────────
interface QuotePdfProps {
  quote: QuoteRow;
}

export function QuotePdf({ quote }: QuotePdfProps) {
  return (
    <Document title={`GreenQuote — ${quote.fullName}`} author="GreenQuote">
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <Text style={styles.headerTitle}>Green Quote</Text>
        <Text style={styles.headerSubtitle}>Solar Panel Installation Quote</Text>
        <View style={styles.divider} />

        {/* ── Customer Information ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Name:</Text>
            <Text style={styles.kvValue}>{quote.fullName}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Email:</Text>
            <Text style={styles.kvValue}>{quote.email}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Address:</Text>
            <Text style={styles.kvValue}>{quote.address}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Quote Date:</Text>
            <Text style={styles.kvValue}>{fmtDate(quote.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.thinDivider} />

        {/* ── Installation Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Installation Details</Text>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>System Size:</Text>
            <Text style={styles.kvValue}>{quote.systemSizeKw} kW</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Monthly Consumption:</Text>
            <Text style={styles.kvValue}>{quote.monthlyConsumptionKwh} kWh</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>System Price:</Text>
            <Text style={styles.kvValue}>{fmtCurrency(quote.systemPrice)}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Down Payment:</Text>
            <Text style={styles.kvValue}>{fmtCurrency(quote.downPayment)}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Principal Amount:</Text>
            <Text style={styles.kvValue}>{fmtCurrency(quote.principalAmount)}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Risk Band:</Text>
            <Text style={styles.kvValue}>{quote.riskBand}</Text>
          </View>
        </View>

        <View style={styles.thinDivider} />

        {/* ── Financing Options ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financing Options</Text>

          {/* Table header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colTerm, styles.tableHeaderCell]}>Term</Text>
            <Text style={[styles.colApr, styles.tableHeaderCell]}>APR</Text>
            <Text style={[styles.colMonthly, styles.tableHeaderCell]}>Monthly Payment</Text>
            <Text style={[styles.colTotal, styles.tableHeaderCell]}>Total Cost</Text>
          </View>

          {/* Table rows */}
          {quote.offers.map((offer) => {
            const totalCost = offer.monthlyPayment * offer.termYears * 12;
            return (
              <View key={offer.termYears} style={styles.tableRow}>
                <Text style={styles.colTerm}>{offer.termYears} Years</Text>
                <Text style={styles.colApr}>{fmtPercent(offer.apr)}</Text>
                <Text style={styles.colMonthly}>{fmtCurrency(offer.monthlyPayment)}</Text>
                <Text style={styles.colTotal}>{fmtCurrency(totalCost)}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Footer ── */}
        <Text style={styles.footer}>
          For questions or assistance, contact us at info@greenquote.com
        </Text>
      </Page>
    </Document>
  );
}

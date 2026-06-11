import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// ── Calendrier mensuel (semaine commençant le lundi) ──────────
export function Calendar({ value, onSelect, minDate }) {
  const today = startOfDay(new Date());
  const min = minDate ? startOfDay(minDate) : today;
  const base = value || new Date();
  const [view, setView] = useState({ year: base.getFullYear(), month: base.getMonth() });

  const firstWeekday = (new Date(view.year, view.month, 1).getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Ne pas revenir avant le mois de la date minimale
  const atMinMonth = view.year === min.getFullYear() && view.month === min.getMonth();

  const prev = () => setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }));
  const next = () => setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }));

  return (
    <View style={styles.calendar}>
      <View style={styles.calHeader}>
        <TouchableOpacity
          onPress={prev}
          disabled={atMinMonth}
          style={[styles.navBtn, atMinMonth && styles.navBtnDisabled]}
        >
          <Text style={[styles.navText, atMinMonth && styles.navTextDisabled]}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.calMonth}>{MONTHS[view.month]} {view.year}</Text>
        <TouchableOpacity onPress={next} style={styles.navBtn}>
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={styles.weekday}>{w}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (d === null) return <View key={i} style={styles.cell} />;
          const cellDate = startOfDay(new Date(view.year, view.month, d));
          const disabled = cellDate < min;
          const selected = sameDay(cellDate, value);
          const isToday = sameDay(cellDate, today);
          return (
            <TouchableOpacity
              key={i}
              style={styles.cell}
              disabled={disabled}
              onPress={() => onSelect(cellDate)}
            >
              <View style={[
                styles.dayCircle,
                selected && styles.daySelected,
                !selected && isToday && styles.dayToday,
              ]}>
                <Text style={[
                  styles.dayText,
                  disabled && styles.dayDisabled,
                  selected && styles.daySelectedText,
                ]}>
                  {d}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Créneaux horaires ────────────────────────────────────────
function buildSlots(start = 9, end = 19, step = 30) {
  const slots = [];
  for (let mins = start * 60; mins <= end * 60; mins += step) {
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
}

export function TimeSlots({ value, onSelect, start, end, step }) {
  const slots = buildSlots(start, end, step);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.slotsRow}
    >
      {slots.map((t) => {
        const active = t === value;
        return (
          <TouchableOpacity
            key={t}
            style={[styles.slot, active && styles.slotActive]}
            onPress={() => onSelect(t)}
          >
            <Text style={[styles.slotText, active && styles.slotTextActive]}>{t}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  calendar: { backgroundColor: colors.bgInput, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgCard },
  navBtnDisabled: { opacity: 0.3 },
  navText: { color: colors.purple, fontSize: 22, fontWeight: '700', lineHeight: 24 },
  navTextDisabled: { color: colors.grayDark },
  calMonth: { color: colors.white, fontSize: 15, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', color: colors.grayDark, fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.purple },
  dayToday: { borderWidth: 1, borderColor: colors.purple },
  dayText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  daySelectedText: { color: colors.white, fontWeight: '800' },
  dayDisabled: { color: colors.grayDark, opacity: 0.4, fontWeight: '400' },
  slotsRow: { gap: 8, paddingVertical: 2 },
  slot: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  slotActive: { backgroundColor: colors.purpleFade, borderColor: colors.purple },
  slotText: { color: colors.gray, fontSize: 14, fontWeight: '600' },
  slotTextActive: { color: colors.purple, fontWeight: '700' },
});

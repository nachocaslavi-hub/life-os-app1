import React, { useEffect, useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { CalendarEvent } from '../../types/database';
import { NeoCard } from '../ui/NeoPrimitives';

interface Props {
  userId: string;
  syncTick: number;
  onNavigateEvent: (module: 'estudios' | 'deporte' | 'grupo', entityId: string) => void;
}

const MODULE_STYLES: Record<
  CalendarEvent['module'],
  { label: string; hex: string }
> = {
  estudios: { label: 'ESTUDIOS', hex: '#39FF14' }, // Verde fosforito
  deporte: { label: 'DEPORTE', hex: '#FF5F1F' },   // Naranja fosforito
  grupo: { label: 'GRUPO', hex: '#FF10F0' }        // Rosa fosforito
};

export const CalendarModule: React.FC<Props> = ({ userId, syncTick, onNavigateEvent }) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [cursorDate, setCursorDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from('calendar_events_view')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        setEvents((data as CalendarEvent[]) || []);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, syncTick]);

  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(cursorDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(cursorDate), { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    const start = startOfWeek(cursorDate, { weekStartsOn: 1 });
    const end = endOfWeek(cursorDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursorDate, viewMode]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((ev) => {
      const list = map.get(ev.event_date) || [];
      list.push(ev);
      map.set(ev.event_date, list);
    });
    return map;
  }, [events]);

  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayEvents = eventsByDate.get(selectedKey) || [];

  const stepBackward = () =>
    setCursorDate((d) => (viewMode === 'month' ? subMonths(d, 1) : subWeeks(d, 1)));
  const stepForward = () =>
    setCursorDate((d) => (viewMode === 'month' ? addMonths(d, 1) : addWeeks(d, 1)));

  return (
    <div className="p-4 md:p-6 space-y-5 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 border-2 border-black shadow-[3px_3px_0px_#000] bg-white">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 text-xs font-extrabold uppercase ${
              viewMode === 'month' ? 'bg-black text-white' : 'bg-white text-black'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 text-xs font-extrabold uppercase border-l-2 border-black ${
              viewMode === 'week' ? 'bg-black text-white' : 'bg-white text-black'
            }`}
          >
            Agenda Semanal
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={stepBackward}
            className="w-10 h-10 flex items-center justify-center bg-white border-2 border-black shadow-[2px_2px_0px_#000] neo-press"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const now = new Date();
              setCursorDate(now);
              setSelectedDate(now);
            }}
            className="px-3.5 h-10 bg-[#39FF14] border-2 border-black shadow-[2px_2px_0px_#000] neo-press text-xs font-extrabold uppercase"
          >
            Hoy
          </button>
          <button
            onClick={stepForward}
            className="w-10 h-10 flex items-center justify-center bg-white border-2 border-black shadow-[2px_2px_0px_#000] neo-press"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
        <h2 className="text-xl md:text-2xl font-extrabold uppercase">
          {format(cursorDate, viewMode === 'month' ? 'MMMM yyyy' : "'Semana' w · MMM yyyy", {
            locale: es
          })}
        </h2>
        <div className="flex gap-2 text-[11px] font-mono-brutal font-extrabold">
          <span className="px-2 py-0.5 border-2 border-black bg-[#39FF14]">ESTUDIOS</span>
          <span className="px-2 py-0.5 border-2 border-black bg-[#FF5F1F]">DEPORTE</span>
          <span className="px-2 py-0.5 border-2 border-black bg-[#FF10F0]">GRUPO</span>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <NeoCard className="p-3 md:col-span-7 bg-white">
            <div className="grid grid-cols-7 text-center text-xs font-mono-brutal font-extrabold pb-2 border-b-2 border-black">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {calendarDays.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate.get(key) || [];
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const inMonth = isSameMonth(day, cursorDate);

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[58px] md:min-h-[72px] p-1.5 flex flex-col items-center justify-between border-2 transition-all ${
                      isSelected
                        ? 'border-black bg-black text-white shadow-[3px_3px_0px_#39FF14]'
                        : isToday
                          ? 'border-black bg-neutral-100'
                          : 'border-transparent hover:border-black'
                    } ${!inMonth ? 'opacity-35' : ''}`}
                  >
                    <span className="text-xs font-mono-brutal font-extrabold">
                      {format(day, 'd')}
                    </span>

                    <div className="flex flex-wrap justify-center gap-1 w-full">
                      {dayEvents.slice(0, 4).map((ev) => (
                        <span
                          key={`${ev.module}-${ev.entity_id}`}
                          style={{ backgroundColor: MODULE_STYLES[ev.module].hex }}
                          className="w-3 h-3 border border-black"
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </NeoCard>

          <div className="md:col-span-5 space-y-3">
            <h3 className="text-xs font-mono-brutal font-extrabold uppercase bg-black text-white inline-block px-3 py-1.5">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </h3>

            {loading ? (
              <p className="text-xs font-mono-brutal">Sincronizando desde Supabase...</p>
            ) : selectedDayEvents.length === 0 ? (
              <NeoCard className="p-5 text-center text-xs font-mono-brutal text-neutral-600 bg-white">
                Día libre. Crea exámenes, entrenos o conciertos desde sus secciones.
              </NeoCard>
            ) : (
              selectedDayEvents.map((ev) => (
                <div
                  key={`${ev.module}-${ev.entity_id}`}
                  onClick={() => onNavigateEvent(ev.module, ev.entity_id)}
                  style={{ backgroundColor: MODULE_STYLES[ev.module].hex }}
                  className="p-4 border-2 border-black shadow-[4px_4px_0px_#000] neo-press cursor-pointer flex items-center justify-between text-black"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-black text-white text-[10px] font-mono-brutal font-extrabold">
                        {MODULE_STYLES[ev.module].label}
                      </span>
                      {ev.start_time && (
                        <span className="text-xs font-mono-brutal font-extrabold">
                          {ev.start_time.slice(0, 5)}
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-base mt-1 truncate">{ev.title}</h4>
                    <p className="text-xs font-bold truncate">{ev.subtitle}</p>
                  </div>
                  <div className="w-9 h-9 bg-white border-2 border-black flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calendarDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate.get(key) || [];
            const isToday = isSameDay(day, new Date());

            return (
              <NeoCard key={key} bg="bg-white" className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                  <span className="font-extrabold text-xs uppercase">
                    {format(day, 'EEEE d MMM', { locale: es })}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-mono-brutal font-extrabold bg-[#39FF14] text-black border border-black px-1.5">
                      HOY
                    </span>
                  )}
                </div>

                {dayEvents.length === 0 ? (
                  <p className="text-xs text-neutral-500 font-mono-brutal">Sin actividades</p>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map((ev) => (
                      <button
                        key={`${ev.module}-${ev.entity_id}`}
                        onClick={() => onNavigateEvent(ev.module, ev.entity_id)}
                        style={{ backgroundColor: MODULE_STYLES[ev.module].hex }}
                        className="w-full text-left p-2.5 border-2 border-black shadow-[2px_2px_0px_#000] neo-press flex items-center justify-between text-black"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-[10px] font-mono-brutal font-extrabold">
                            {MODULE_STYLES[ev.module].label}{' '}
                            {ev.start_time ? `· ${ev.start_time.slice(0, 5)}` : ''}
                          </div>
                          <div className="font-extrabold text-sm truncate">{ev.title}</div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </NeoCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
import type { Config } from '@netlify/functions'
import ical from 'node-ical'

const BASE_ROW_COLOR = '#d8dff7'

// Order also determines display order when multiple meetings start at the same time
// (the final sort below is stable, so ties keep this array's order).
const ROOMS = [
  {
    name: 'Vergaderzaal 0',
    color: BASE_ROW_COLOR,
    textColor: 'rgba(0, 0, 0, 0.55)',
    url: 'https://outlook.office365.com/owa/calendar/771306f149984dfd94e54323563b9e3e@ambrassade.be/cab9ece3ab484beba425e8e5076ec4b86818166263702150334/calendar.ics',
  },
  {
    name: 'Groene zaal',
    color: '#9ed9c5',
    textColor: 'rgba(0, 0, 0, 0.75)',
    url: 'https://outlook.office365.com/owa/calendar/039618f6fad24fe2bcc9f915b7ad0681@ambrassade.be/a8f766c3a320413494eed26ff6e5f9215950969688613793149/calendar.ics',
  },
  {
    name: 'Blauwe zaal',
    color: '#0071ba',
    textColor: '#ffffff',
    url: 'https://outlook.office365.com/owa/calendar/039618f6fad24fe2bcc9f915b7ad0681@ambrassade.be/b14bdb4b2e36441e8f72fda0d58279a611419572348433509130/calendar.ics',
  },
  {
    name: 'Rode zaal',
    color: '#ea504c',
    textColor: '#ffffff',
    url: 'https://outlook.office365.com/owa/calendar/039618f6fad24fe2bcc9f915b7ad0681@ambrassade.be/9e31225e6ac341b1b87b5b0ef9fa59f1972845886487091059/calendar.ics',
  },
  {
    name: 'Vergaderzaal 2',
    color: BASE_ROW_COLOR,
    textColor: 'rgba(0, 0, 0, 0.55)',
    url: 'https://outlook.office365.com/owa/calendar/99833df504464288a1ed660d390c9709@ambrassade.be/8780c1cd724848129a0dddf338c48375840893147153502840/calendar.ics',
  },
  {
    name: 'Vergaderzaal 3',
    color: BASE_ROW_COLOR,
    textColor: 'rgba(0, 0, 0, 0.55)',
    url: 'https://outlook.office365.com/owa/calendar/5f5f79ee5a7940e28a55ade334faa54a@ambrassade.be/a81433e008634232bcd51e4a4e484f7d15805656605632373843/calendar.ics',
  },
  {
    name: 'Vergaderzaal 4',
    color: BASE_ROW_COLOR,
    textColor: 'rgba(0, 0, 0, 0.55)',
    url: 'https://outlook.office365.com/owa/calendar/be11d598e30645efbe485b1a0472fb7c@ambrassade.be/ec1b71f70c8c4ce686ca75c90e4de91014320642069724182012/calendar.ics',
  },
]

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function expandRecurrence(event: any, dayStart: Date, dayEnd: Date) {
  const occurrences: { start: Date; end: Date }[] = []

  if (event.rrule) {
    const dates = event.rrule.between(
      new Date(dayStart.getTime() - 24 * 60 * 60 * 1000),
      new Date(dayEnd.getTime() + 24 * 60 * 60 * 1000),
      true,
    )
    const duration = event.end.getTime() - event.start.getTime()
    for (const date of dates) {
      const start = new Date(date)
      const end = new Date(start.getTime() + duration)
      const dateKey = start.toISOString().slice(0, 10)
      if (event.recurrences && event.recurrences[dateKey]) continue
      if (event.exdate && event.exdate[dateKey]) continue
      occurrences.push({ start, end })
    }
  } else {
    occurrences.push({ start: event.start, end: event.end })
  }

  if (event.recurrences) {
    for (const key of Object.keys(event.recurrences)) {
      const rec = event.recurrences[key]
      occurrences.push({ start: rec.start, end: rec.end })
    }
  }

  return occurrences.filter((o) => isSameDay(o.start, dayStart) || isSameDay(o.end, dayStart))
}

export default async () => {
  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const results = await Promise.all(
    ROOMS.map(async (room) => {
      try {
        const data = await ical.async.fromURL(room.url)
        const meetings: {
          room: string
          roomColor: string
          roomTextColor: string
          title: string
          start: string
          end: string
          allDay: boolean
        }[] = []

        for (const key of Object.keys(data)) {
          const event = data[key]
          if (event.type !== 'VEVENT') continue

          const occurrences = expandRecurrence(event, dayStart, dayEnd)
          for (const occ of occurrences) {
            meetings.push({
              room: room.name,
              roomColor: room.color,
              roomTextColor: room.textColor,
              title: event.summary || '(Geen titel)',
              start: occ.start.toISOString(),
              end: occ.end.toISOString(),
              allDay: Boolean(event.datetype === 'date'),
            })
          }
        }

        return meetings
      } catch (err) {
        console.error(`Failed to fetch calendar for ${room.name}`, err)
        return []
      }
    }),
  )

  const meetings = results
    .flat()
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  return Response.json({
    generatedAt: now.toISOString(),
    meetings,
  })
}

export const config: Config = {
  path: '/api/meetings',
}

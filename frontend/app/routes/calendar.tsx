import { useEffect, useState } from "react"
import { getActivities } from "~/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatDate, getStatusColor } from "~/lib/utils"
import { Badge } from "~/components/ui/badge"
import type { Activity } from "~/lib/types"

export function meta() {
  return [{ title: "Calendario - Gecko" }]
}

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: Date[] = []
  
  // Add days from previous month to fill first week
  const startDay = firstDay.getDay()
  for (let i = startDay - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i))
  }
  
  // Add days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day))
  }
  
  // Add days from next month to fill last week
  const remainingDays = 42 - days.length // 6 weeks * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    days.push(new Date(year, month + 1, day))
  }
  
  return days
}

function getActivitiesForDate(activities: Activity[], date: Date): Activity[] {
  return activities.filter((activity) => {
    const activityDate = new Date(activity.scheduledStart)
    return (
      activityDate.getDate() === date.getDate() &&
      activityDate.getMonth() === date.getMonth() &&
      activityDate.getFullYear() === date.getFullYear()
    )
  })
}

export default function Calendar() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActivities()
      .then(setActivities)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = getDaysInMonth(year, month)
  
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]
  
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(new Date(year, month + (direction === "next" ? 1 : -1), 1))
  }
  
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month
  }
  
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calendario</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold min-w-[200px] text-center">
            {monthNames[month]} {year}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
            {days.map((date, index) => {
              const dayActivities = getActivitiesForDate(activities, date)
              const isCurrentMonthDay = isCurrentMonth(date)
              const isTodayDay = isToday(date)
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] border p-2 ${
                    isCurrentMonthDay ? "bg-background" : "bg-muted/30"
                  } ${isTodayDay ? "ring-2 ring-primary" : ""}`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isCurrentMonthDay ? "text-foreground" : "text-muted-foreground"
                    } ${isTodayDay ? "text-primary font-bold" : ""}`}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayActivities.slice(0, 3).map((activity) => (
                      <div
                        key={activity.id}
                        className="text-xs p-1 rounded truncate"
                        style={{
                          backgroundColor: activity.status === "DONE" 
                            ? "#dcfce7" 
                            : activity.status === "UNASSIGNED"
                            ? "#fee2e2"
                            : "#f3f4f6"
                        }}
                        title={`${activity.title} - ${activity.client?.name}`}
                      >
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(activity.status)}`}
                        >
                          {activity.title}
                        </Badge>
                      </div>
                    ))}
                    {dayActivities.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayActivities.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


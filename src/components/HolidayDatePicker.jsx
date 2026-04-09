import React from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

export default function HolidayDatePicker({ holidays = {}, selected, onChange, placeholderText, className, ...rest }) {

    const toLocalYYYYMMDD = (d) => {
        if (!d) return ''
        const offset = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
        return offset.toISOString().split('T')[0]
    }

    const renderDayContents = (day, date) => {
        const dateStr = toLocalYYYYMMDD(date)
        const holName = holidays[dateStr]
        const isSunday = date.getDay() === 0

        // Explicitly render national holiday styling directly inside the calendar grid with tooltips!
        if (holName) {
            return (
                <div title={holName} style={{ color: '#dc2626', fontWeight: '800', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {day}
                </div>
            )
        }

        // Slightly softer red for default Sundays
        if (isSunday) {
            return (
                <div title="Minggu / Weekend" style={{ color: '#f87171', fontWeight: '600', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {day}
                </div>
            )
        }

        return day
    }

    return (
        <DatePicker
            selected={selected}
            onChange={onChange}
            dateFormat="dd/MM/yyyy"
            className={className || "form-input"}
            placeholderText={placeholderText}
            renderDayContents={renderDayContents}
            {...rest}
        />
    )
}

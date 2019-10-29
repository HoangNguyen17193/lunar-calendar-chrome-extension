import React from 'react';
import LunarCalendar from './lib/lunar-calendar.jsx';

export default class Calendar extends React.Component {
  render() {
    const lunarCalendar = new LunarCalendar();
    const calendarHtmlContent = {__html: lunarCalendar.getCalendar()}
    return (
      <div className="lunar-calendar" dangerouslySetInnerHTML={calendarHtmlContent} />
    );
  }
}

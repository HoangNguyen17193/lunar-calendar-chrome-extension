import React from 'react';

export default class Calendar extends React.Component {
  render() {
    const { lunarDate, solarDate, solarMonth, solarYear } = this.props;
    let cellClass, solarClass, lunarClass, solarColor;
    cellClass = "lunar-calendar__month-table__cell";
    solarClass = "t2t6";
    lunarClass = "am lunar-calendar__month-table__cell__lunar";
    solarColor = "black";
    return (
      <td className="lunar-calendar__month-table__cell">
        <div className="cn">&nbsp;</div>
        <div className="am">&nbsp;</div>
      </td>
    );
  }
}

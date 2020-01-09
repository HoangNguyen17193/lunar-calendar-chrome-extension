import React from 'react';

export default class Calendar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <td className="lunar-calendar__month-table__cell">
        <div className="cn">&nbsp;</div>
        <div className="am">&nbsp;</div>
      </td>
    );
  }
}

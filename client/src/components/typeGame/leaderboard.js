import React from "react";

import ReactTable from "react-table-v6"; // v6 instead of v7 (v7 is kinda overkill)
import "react-table-v6/react-table.css"; // https://github.com/tannerlinsley/react-table/tree/v6#installation

// Simply pass the data prop anything that resembles an array or object.

class Leaderboard extends React.Component {
  constructor() {
    super();
    this.state = {
      data: [
        { Username: "John Doe", userScore: 100 },
        { Username: "Jane Doe", userScore: 190 },
      ],
    };
  }
  render() {
    const { data } = this.state;
    return (
      <div
        style={{
          width: "100%",
          textAlign: "center",
        }}
      >
        <h2>Leaderboards</h2>
        <div className="reactTableDiv">
          <ReactTable
            data={data}
            columns={[
              {
                Header: "Rankings",
                columns: [
                  {
                    Header: "Username",
                    accessor: "Username",
                  },
                  {
                    Header: "Score",
                    accessor: "userScore",
                  },
                ],
              },
            ]}
            defaultSorted={[
              /// automatically sorts by highest score
              {
                id: "userScore",
                desc: true,
              },
            ]}
            defaultPageSize={10}
            className="-striped -highlight"
          />
        </div>
      </div>
    );
  }
}
export default Leaderboard;

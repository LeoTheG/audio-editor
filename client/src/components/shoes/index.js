import React from "react";
import ReactDOM from "react-dom";
import "./style.css";
import metamask from "./static/metamask.svg";
import logo from "./static/logo.png";
import coin from "./static/coin.gif";

class Shoes extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      account: "",
      imgURLs: [
        "https://assets.supremenewyork.com/190345/ma/bzgwWYHW_J4.jpg",
        "https://assets.supremenewyork.com/190337/ma/1qqThTKANrM.jpg",
        "https://assets.supremenewyork.com/190347/ma/bTs7ISgCC0s.jpg",
        "https://assets.supremenewyork.com/190348/ma/YEh72SsLDFQ.jpg",
        "https://assets.supremenewyork.com/190350/ma/De1GN47hlJU.jpg",
        "https://assets.supremenewyork.com/190351/ma/f-i7999mp68.jpg",
        "https://assets.supremenewyork.com/190354/ma/3GavnUSn2LI.jpg",
        "https://assets.supremenewyork.com/190355/ma/MvAIu0Mvb5o.jpg",
        "https://assets.supremenewyork.com/190356/ma/_llTc-Kz-Y0.jpg",
        "https://assets.supremenewyork.com/190360/ma/ML2h8N3En5U.jpg",
      ],
      curID: 0,
    };
    this.connectAcoount = this.connectAcoount.bind(this);
    this.handleTransaction = this.handleTransaction.bind(this);
    this.jumpNext = this.jumpNext.bind(this);
    this.jumpPrev = this.jumpPrev.bind(this);
  }

  async connectAcoount() {
    let accounts = await window.ethereum.enable();
    localStorage.setItem("account", accounts);
    this.setState({
      account: accounts[0],
    });
  }

  handleTransaction() {
    fetch("https://adventure-eth-api.herokuapp.com/transfer-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ticker: "BEAR",
        amount: 11,
        to: this.state.account,
      }),
    })
      .then((res) => {
        if (res.status === 200) {
          alert("You have recieved one token!");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  jumpNext() {
    if (this.state.curID < 9) {
      this.setState({
        curID: this.state.curID + 1,
      });
    }
  }

  jumpPrev() {
    if (this.state.curID > 0) {
      this.setState({
        curID: this.state.curID - 1,
      });
    }
  }

  render() {
    return (
      <div id="container">
        <img src={metamask} id="metamask" onClick={this.connectAcoount}></img>
        <img src={logo} id="logo"></img>
        <div>
          <img src={this.state.imgURLs[this.state.curID]} id="shoes"></img>
        </div>
        <p>
          {" "}
          <span id="prev" onClick={this.jumpPrev}>
            &lt;
          </span>{" "}
          {this.state.curID + 1} of 10{" "}
          <span id="next" onClick={this.jumpNext}>
            &gt;
          </span>{" "}
        </p>
        <p>vans, supreme sk8-hi pro</p>
        <img src={coin} id="coin" onClick={this.handleTransaction}></img>
        <p>11</p>
        <p>bear tokens</p>
        <div
          id="credits"
          title="version number: v.1.0  credits: yiyun, mike, leo"
        >
          credits
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Shoes />, document.getElementById("root"));

export default Shoes;

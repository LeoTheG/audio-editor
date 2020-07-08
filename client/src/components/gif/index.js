import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import "./style.css";

class Gif extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      categories: new Set(),
      category: "",
      imgs: [],
      img: "",
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ category: event.target.value });
  }

  handleSubmit(event) {
    axios
      .get("https://powerful-woodland-02557.herokuapp.com/", {
        params: {
          type: this.state.category,
        },
      })
      .then((res) => {
        let imgList = res.data.data;
        let temp = [];
        imgList.forEach((img) => {
          temp.push(img.imageURL);
        });
        this.setState({
          imgs: temp,
        });
        this.nextGiphy();
      });
    event.preventDefault();
  }

  async nextGiphy() {
    for (let i = 0; i < this.state.imgs.length; i++) {
      this.setState({ img: this.state.imgs[i] });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  buildOptions() {
    let arr = [];
    this.state.categories.forEach((element) => {
      arr.push(<option value={element}>{element}</option>);
    });
    return arr;
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label>
            Choose one type
            <select value={this.state.value} onChange={this.handleChange}>
              <option value=""></option>
              {this.buildOptions()}
            </select>
          </label>
          <input type="submit" value="Submit" className="button" />
        </form>

        <div className="imgback">
          <img style={{ marginTop: "50px" }} src={this.state.img} alt="" />
        </div>
      </div>
    );
  }

  componentDidMount() {
    axios
      .get("https://powerful-woodland-02557.herokuapp.com/getTypes")
      .then((res) => {
        let typeList = res.data.data;
        let set = new Set();
        typeList.forEach((img) => {
          if (!set.has(img.category)) set.add(img.category);
        });
        this.setState({
          categories: set,
        });
      });
  }
}

ReactDOM.render(<Gif />, document.getElementById("root"));

export default Gif;

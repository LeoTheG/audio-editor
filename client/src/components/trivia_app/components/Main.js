import React, { Component } from 'react';
import questions_array from '../questions'
import './css/Main.css'
import axios from 'axios';

const ethereum = window.ethereum;

class Main extends Component {
    constructor(props) {
        super(props)
        this.state = {
            account: null,
            hasMM: true,
            total_q : questions_array.length,
            current_q : 0,
            score : 0,
            user_choice : null,
            user_choice_check : false,
            submit_clicked : false,
            classNames : ['choicesbtn','choicesbtn','choicesbtn','choicesbtn'],
            correct_check: false
        };

        let updatedClass = [];

        this.submitRef = React.createRef();
        this.optionRef1 = React.createRef();
        this.optionRef2 = React.createRef();
        this.optionRef3 = React.createRef();
        this.optionRef4 = React.createRef();

        this.DisplayQuestion = this.DisplayQuestion.bind(this)
        this.DisplayOptions = this.DisplayOptions.bind(this)
        this.DisplaySubmit = this.DisplaySubmit.bind(this)
        this.DisplayAnswer = this.DisplayAnswer.bind(this)
        this.DisplayNext = this.DisplayNext.bind(this)
        
        this.handleChoice = this.handleChoice.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleNext = this.handleNext.bind(this)
        
    }

    async connectMM() {
        try {
            this.setState({account: await ethereum.enable()}, () => {
                console.log(this.state.account);
            });
        }
        catch{
            this.componentDidCatch();
        }
        
    }
    componentDidCatch(error, errorInfo) {
        console.log(errorInfo)
        this.setState({
            hasMM: false
        });
    }

    handleChoice(props) {
        this.setState({user_choice_check : true})
        this.state.user_choice = props
    }

    handleSubmit () {
        this.checkAnswer();
        this.setState({
            submit_clicked : true,
            classNames : this.updatedClass
        })
        this.submitRef.current.setAttribute("disabled", "disabled");
        this.optionRef1.current.setAttribute("disabled", "disabled");
        this.optionRef2.current.setAttribute("disabled", "disabled");
        this.optionRef3.current.setAttribute("disabled", "disabled");
        this.optionRef4.current.setAttribute("disabled", "disabled");
        
    }

    handleNext () {
        this.setState((state) => {
            return {current_q: state.current_q + 1, user_choice_check : false, correct_check : false,
                submit_clicked : false, classNames: ['choicesbtn','choicesbtn','choicesbtn','choicesbtn']};
          });
          this.submitRef.current.removeAttribute("disabled");
          this.optionRef1.current.removeAttribute("disabled");
          this.optionRef2.current.removeAttribute("disabled");
          this.optionRef3.current.removeAttribute("disabled");
          this.optionRef4.current.removeAttribute("disabled");
    }


    DisplayQuestion () {
        return (
            <div className = "question">
                {questions_array[this.state.current_q]['question']}
            </div>
        )
    }

    DisplayOptions () {
        return (
            <div className = "a1">
                <div className = "a1">
                    <button ref = {this.optionRef1} className={this.state.classNames[0]} onClick={() => this.handleChoice(0)}>
                    {questions_array[this.state.current_q]['choices'][0]}
                    </button>
                

                    <button ref = {this.optionRef2} className={this.state.classNames[1]} onClick={() => this.handleChoice(1)}>
                    {questions_array[this.state.current_q]['choices'][1]}
                    </button>
                </div>

                <div className = "a2">
                    <button ref = {this.optionRef3} className={this.state.classNames[2]} onClick={() => this.handleChoice(2)}>
                    {questions_array[this.state.current_q]['choices'][2]}
                    </button>

                    <button ref = {this.optionRef4} className={this.state.classNames[3]} onClick={() => this.handleChoice(3)}>
                    {questions_array[this.state.current_q]['choices'][3]}
                    </button>

                </div>
            </div>
            
        )
    }


    DisplaySubmit () {
        return (
            <div>
                <button ref = {this.submitRef} className="submit" onClick={() => this.handleSubmit()}>
                Submit Answer
                </button>
            </div>
        )
    }

    DisplayNext() {
        return (
            <div>
                <button className="submit" onClick={() => this.handleNext()}>
                Next Question
                </button>
            </div>
        )
    }

    checkAnswer () {
        if (questions_array[this.state.current_q]['choices'][this.state.user_choice] === questions_array[this.state.current_q]['answer'])
        {
            this.updatedClass[this.state.user_choice] = 'right';
            this.setState({
                correct_check : true
            })
        }
        else
        {
            this.updatedClass[this.state.user_choice] = 'wrong' 
        }
    }

    DisplayAnswer () {
        this.updatedClass = this.state.classNames
        if (this.state.submit_clicked === false)
        {
            return ( <div></div> )
        }
        else if (questions_array[this.state.current_q]['choices'][this.state.user_choice] === questions_array[this.state.current_q]['answer'])
        {
            if (this.state.current_q === this.state.total_q - 1)
            {
                this.state.score += 1
                return (
                    <div className = "answer">
                        <h4>Correct!</h4>
                        <h4>Final Score: {this.state.score}</h4>
                        {this.sendToken()}
                    </div>
                )
            }
            else
            {
                this.state.score += 1
                return (
                <div className = "answer"> 
                    <h4>Correct!</h4>
                    <this.DisplayNext />
                </div>)
            }
        }
        else
        {
            if (this.state.current_q === this.state.total_q - 1)
            {
                return (
                    <div className = "answer">
                        <h4>Sorry, the correct answer is {questions_array[this.state.current_q]['answer']}</h4>
                        <h4>Final Score: {this.state.score}</h4>
                        {this.sendToken()}
                    </div>)
            }
            else
            {
                return (
                    <div className = "answer">
                        <h4>Sorry, the correct answer is {questions_array[this.state.current_q]['answer']}</h4>
                        <this.DisplayNext />
                    </div>)
            }
        }
        
    }

    componentDidMount() {
        this.connectMM();
    }
    
    sendToken() {
        var apiAddress = "http://13.56.163.182:8000/transfer-token";
        axios.post(apiAddress, {
            ticker: "BEAR",
            amount: (this.state.score),
            to: this.state.account[0],
            hookUrl: "done",
        })
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });
            return (
                <div>
                    <h4> You have been awarded {this.state.score} Rawr Tokens</h4>
                </div>
            )
    }



    render() {
        return <>
            <div>
                <div className = 'qArea'>
                     <p>Question {this.state.current_q + 1} :</p>
                    <this.DisplayQuestion />
                </div>
                <this.DisplayOptions />

                {this.state.user_choice_check ? <div> <this.DisplaySubmit /></div> : <div></div> }
                <this.DisplayAnswer />
                
                <div className = "advLogo">
                        <img className = "logo" src = "http://13.57.47.139/adventure-logo.png"/>
                </div>    
            </div>
        </>
    }
}

export default Main;


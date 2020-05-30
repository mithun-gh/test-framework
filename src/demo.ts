import { html, render } from "../old/old-framework/template";

/*

@Component("my-addition")
export class AdditionComponent {
}

@Component("my-greeter")
export class GreeterComponent {
  @Property name: string;

  render() {
    return html`<h4>Hello, ${this.name}</h4>`;
  }
}

@Component("my-timer")
export class TimerComponent {
  @Property seconds: number = 0;

  private interval: number;

  tick() {
    this.seconds = this.seconds + 1;
  }

  onConnected() {
    this.interval = setInterval(() => this.tick(), 1000);
  }

  onDisconnected() {
    clearInterval(this.interval);
  }

  style() {
    return css`
      div {
        color: red;
      }
    `;
  }

  render() {
    return html`
      <div>
        Seconds: ${this.seconds}
      </div>
    `;
  }
}

render(html`<my-timer />`, "#root");
*/

/*
class Timer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { seconds: 0 };
  }

  tick() {
    this.setState(state => ({
      seconds: state.seconds + 1
    }));
  }

  componentDidMount() {
    this.interval = setInterval(() => this.tick(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <div>
        Seconds: {this.state.seconds}
      </div>
    );
  }
}

ReactDOM.render(
  <Timer />,
  document.getElementById('timer-example')
);
*/

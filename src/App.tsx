import { action, observable } from "mobx";
import { observer } from "mobx-react";
import { Component, createRef, Fragment } from "react";
import * as React from "react";
import * as fluence from "fluence";
import styles from "./App.module.css";
import palette from "./palette/1000.json";

const boxW = 10;

const boxH = 10;

// const scale = 1000;

@observer
class App extends Component {
  canvasRef = createRef<HTMLCanvasElement>();

  currentPosition = { x: 0, y: 0 };

  ctx: CanvasRenderingContext2D | null = null;

  session: fluence.AppSession | null = null;

  pushed: boolean = false;

  async componentDidMount() {
    if (this.canvasRef.current === null) {
      return;
    }
    this.ctx = this.canvasRef.current.getContext("2d");

    if (this.ctx === null) {
      return null;
    }

    const ethUrl = "http://rinkeby.fluence.one:8545/";
    const appId = "75";
    let contractAddress = "0xeFF91455de6D4CF57C141bD8bF819E5f873c1A01";

    const session = await fluence.connect(contractAddress, appId, ethUrl);
    this.session = session;

    setInterval(async () => {
      const response = session.request(JSON.stringify({action: "Get"}));
      const _result = await response.result();
      const result: {
        state: { colour: string; x: number; y: number }[];
      } = JSON.parse(_result.asString());
      console.log(result);
      result.state.forEach(({colour, x, y}) => {
        this.ctx!.fillStyle = colour;
        this.ctx!.fillRect(x, y, boxW, boxH);
      });
    }, 5000);

    setInterval(() => {
      if (this.pushed) {
        this.draw();
      }
    }, 50);
  }

  onMouseMove = (e: any) => {
    this.currentPosition = { x: e.pageX, y: e.pageY };
  };

  draw = async () => {
    if (this.ctx === null) {
      return;
    }

    const posX = this.currentPosition.x - (this.currentPosition.x % 10);
    const posY = this.currentPosition.y - (this.currentPosition.y % 10);

    if (this.session === null) {
      return null;
    }
    this.ctx.fillStyle = this.selectedColor;
    this.ctx.fillRect(posX, posY, 10, 10);
    this.session.request(
      JSON.stringify({
        action: "Set",
        colour: this.selectedColor,
        x_coord: posX,
        y_coord: posY
      })
    );
    // const _result = response.result();
    // const result: { ok: true } = JSON.parse(_result.asString());
    // if (!result.ok) {
    //   return;
    // }
  };

  @observable
  selectedColor: string = "#000000";

  selectColor = (color: string) =>
    action(() => {
      this.selectedColor = color;
    });

  onMouseDown = () => {
    this.pushed = true;
  };

  onMouseUp = () => {
    this.pushed = false;
  };

  render() {
    const flatPalette: any[] = [];
    palette.forEach(p =>
      p.forEach(color => {
        flatPalette.push(color);
      })
    );
    const result: any = [];
    const _flatPalette = new Set(flatPalette);
    _flatPalette.forEach(color => result.push(color));
    return (
      <Fragment>
        <div className={styles.App}>
          <canvas
            onMouseMove={this.onMouseMove}
            ref={this.canvasRef}
            width={"1000px"}
            height={"1000px"}
            style={{ border: "1px solid", cursor: "pointer" }}
            // onClick={this.onCanvasClick}
            onMouseDown={this.onMouseDown}
            onMouseUp={this.onMouseUp}
          />
          <div className={styles.paletteWrapper}>
            <div className={styles.palette}>
              {result.map((color: string) => {
                return (
                  <div
                    onClick={this.selectColor(color)}
                    key={color}
                    className={styles.color}
                    style={{ backgroundColor: color }}
                  />
                );
              })}
            </div>
            <div
              style={{
                height: "30px",
                backgroundColor: this.selectedColor,
                position: "sticky",
                bottom: "0",
                display: "inline-flex",
                alignItems: "center"
              }}
            >
              <span
                style={{
                  display: "block",
                  margin: "0 40px"
                }}
              >
                {this.selectedColor}
              </span>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default App;

import {
  Children,
  cloneElement,
  Component,
  Fragment,
  type ReactElement,
  type ReactNode,
} from "react";

type LooseProps = {
  /** 中身。 */
  children: ReactNode;
  /** 複製するアイコン。 */
  icon: ReactElement;
};

/** class で書いた部品。 */
export class Old extends Component {
  render(): ReactNode {
    return null;
  }
}

/** 厳しくした React のルールに当たる書き方を並べた部品。 */
export function Loose({ children, icon }: LooseProps): ReactNode {
  return (
    <Fragment>
      <div class="box"></div>
      <input disabled={true} />
      <span>{"波括弧で包んだ文言"}</span>
      <span>直接書いた文言</span>
      <img alt="直接書いた alt" className="block" src="/a.avif" />
      {Children.count(children)}
      {cloneElement(icon)}
      <ul>
        <li>
          <a href="/">
            <b>
              <i>
                <u>
                  <s>{children}</s>
                </u>
              </i>
            </b>
          </a>
        </li>
      </ul>
    </Fragment>
  );
}

# 決めたことと理由(フォーム)

フォームの値と検証は TanStack Form で管理する(ユーザーが決めた)。部品は次の3層に分ける。

- `TextInput` は入力欄とその見た目を持つ。単独で使うときは呼び出し元がアクセシブルな名前を付ける。
- `TextField` は `TextInput` にラベル・補足・誤りの知らせを結び付ける。関連付けには React Aria Components の slot を使う。単独の呼び出し元は `defaultValue` と `validate` を使える。外から状態を管理するときは `value`・`onChange`・`onBlur`・`errorMessage` を使う。
- `@/components/forms` の `useAppForm` は TanStack Form の `createFormHook` で部品を登録する。feature は `form.AppField` の中で、field の値の型に合う部品を選ぶ。`field.TextField` は文字列の field の値・変更・blur と、validator が返した文字列の誤りの知らせを `TextField` に渡す。
- 入力欄が出す決まった文言(「必須」、Select の placeholder と「選択なし」、日付が未完のときの知らせ、数値の増減のボタンの名前)は、`field.*` の部品が訳から引いて、`ui/` の入力欄に渡す。feature は `isRequired` を渡すだけでよい。必須でない欄には、「任意」を渡す(Checkbox を除く)。`ui/` の入力欄を直に使う部品(パスキーの名前の入力欄など)は、自分で文言を渡す。

フォームは `form.AppForm` の中に `form.Form` を置いて組む。`form.Form` は、送ったときに `form.handleSubmit` を呼び、送信の検証と `onSubmit` の間は Enter で送り直させない。`onSubmit` が応答を待たずに終わるときは、送っている間を `isPending` で渡す。server が断った入力は `validationErrors` で渡す。`field.TextField` は React Aria Components の `validationBehavior="aria"` を指定する。必須の状態を伝えながら、ブラウザが送信を先に止めるのを防ぎ、TanStack Form の validator が出す誤りの知らせを入力欄に結び付ける。blur で出た誤りを直した直後の Enter でも、現在の値を検証して送れるように `canSubmitWhenInvalid` を使う。

```tsx
import { useAppForm } from "@/components/forms";
import { Button } from "@/ui/primitives/button";

const form = useAppForm({
  canSubmitWhenInvalid: true,
  defaultValues: { title: "" },
  onSubmit,
});

return (
  <form.AppForm>
    <form.Form>
      <form.AppField name="title">
        {(field) => <field.TextField isRequired label={titleLabel} />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            isPending={isSubmitting}
            pendingLabel={pendingLabel}
            type="submit"
          >
            {saveLabel}
          </Button>
        )}
      </form.Subscribe>
    </form.Form>
  </form.AppForm>
);
```

blur で出る誤りと、送信時に受け取る誤りと、入力すると送信時の誤りが消えることを試せる story は、`__stories__/form.stories.tsx` に置く。

## 送信の検証で止めたときの focus

送信の検証で止めたら、`form.Form` が、最初の誤りの欄を見える位置まで scroll し、その欄に focus を移す(ユーザーが決めた)。画面ごとに書かず、どのフォームにも効かせる。

- 最初の欄は、画面の上にある欄(DOM の並び)にする。TanStack Form の field を登録した順は、並べ替えた repeat などで画面の並びと食い違う。
- 誤りの欄を探して focus を移すのは、primitives の `focusFirstInvalidField`。誤りの欄の外枠に React Aria Components が付ける `data-invalid` を読むので、primitives に置く。欄の中の、Tab で届く要素(Select のボタン、日付の最初の欄など)に移し、Select の隠れた `select` や、数値の入力欄の増減のボタンには移さない。
- TanStack Form の状態が変わってから、React が誤りを描き終えるのを待つため、次の描画の前(`requestAnimationFrame`)に探す。
- scroll は、欄の外枠(ラベルから誤りの知らせまで)が見えるだけ動かす(`block: "nearest"`)。見えている欄では動かさない。focus を移すときの scroll は止める(`preventScroll`)。入力欄だけが見える位置で止まり、ラベルが画面の外に残るため。
- 送ってから server が断った誤りは、送信の検証ではないので、`form.Form` は focus を移さない。`form.Form` の `validationErrors` で欄に出し、応答を受けた画面が `focusFirstInvalidField` を呼ぶ(固定ページの編集の画面)。どう知らせるかは `apps/admin/DECISIONS.md` の「知らせの出し分け」。

## 送った後に始める検証

Dialog の名前の入力(パスキーの追加と名前の変更、トークンの発行)は、`checkAfterSubmit` で、最初に送るまでは誤りを出さず、送った後は入力のたびに確かめる。focus が外れたとき(onBlur)に誤りを出すと、入力欄の下に知らせが増えて、その下のボタンが押下の途中で下へずれ、「キャンセル」を押しても押せないことがある。送ってから出すなら、押したボタンは動かない。TanStack Form の `revalidateLogic` でも同じことができるが、features は TanStack Form を直に import できない(`apps/admin/DECISIONS.md` の「features の依存」)ので、`@/components/forms` が validator を作る関数を持つ。

## 送信の途中の入力

`form.handleSubmit` を呼んでから、送信の検証と `onSubmit` が終わるまで(TanStack Form の `isSubmitting`)、`field.*` の部品は入力を受け付けない。送信の検証は、onChange・onBlur・onSubmit の validator を、その時点の値ですべて流し直す。止めないと、応答を待つ間に変えた入力が、検証した値と異なる値として `onSubmit` に渡る。`isSubmitting` は送信の検証の間も立つので、上の例の `Button` の `isPending` も、検証の応答を待つ間から送信中になる。

止めるときは、部品ごとに読み取り専用(`isReadOnly`)を渡す。`isDisabled`・`fieldset` の `disabled`・`inert` は、focus を外すので使わない。React Aria Components の context で `Form` からまとめて渡す案もあるが、primitives は `isReadOnly` の既定値の `false` を渡し、その `false` が context の値より勝つ。まとめて渡すには primitives が既定値を渡さないように直す必要があり、部品ごとに渡すより差分が大きい。読み取り専用だけでは止まらない `field.Select` と `field.NumberField` は、送信の途中の変更を受け取らない。React Aria Components の Select は読み取り専用を持たず、NumberField は読み取り専用でも、全選択して貼り付けた値を確定する。読み取り専用の見た目は primitives のまま変えない(NumberField の増減のボタンは無効の色になる)。

入力や blur で流れる非同期の validator(`onChangeAsync`・`onBlurAsync`)が答えるまでの間は、入力を止めない。止めると、打つたびに入力欄が止まり、続けて打てなくなる。送信のときに検証を流し直すので、送信の途中だけ止めれば、検証した値と `onSubmit` に渡る値はそろう。送信の途中に6種の部品が入力を受け付けないことを試せる story は `__stories__/submitting.stories.tsx` に置く。

## Checkbox、Select、DateField

`CheckboxInput`・`SelectInput`・`DateInput` は、単独で使うときのアクセシブルな名前を呼び出し元から受け取る。ラベル付きの部品も同じ React Aria Components の root と入力の部品を組み合わせる。Checkbox のラベルはクリックして切り替えられるように CheckboxButton の中に置く。

`field.Checkbox` はチェックを外した値を `false` として渡す。値は boolean だけを受け取る(固定ページの真偽値の項目は、いつも値を持つ)。`field.Select` は選択を解除した値を `null` で渡す。任意の Select では `null` のときも「選択なし」を選択中として表示し、その選択肢から矢印キーで移れるようにする。`field.DateField` は入力した日付を `YYYY-MM-DD` で渡す。

日付が未完の間は、React Aria Components の確定値に直前の日付が残る。単独の DateInput とラベル付きの DateField は、focus が外れた時点で同じ処理で年・月・日の状態を調べ、未完のときだけ React Aria Components の native の検証で送信を止める。TanStack Form が受け取った誤りは、ほかの入力と同じように表示する。呼び出し元が別の日付を渡したら、前の日付の未完の状態は引き継がない。

## NumberField、TextArea

`field.NumberField` は空の欄を `null` として渡す。React Aria Components の NumberField は空を `NaN` で表すので、入力欄に渡すときは `null` を `NaN` に、受け取るときは `NaN` を `null` に替える。`0` は入力した値として残る。`field.TextArea` は `field.TextField` と同じく、空の欄を空の文字列として渡す。

## 割り切ったこと

- **送信の検証で同期の validator が throw するとき**。TanStack Form 1.33.5 は、送信の検証で同期の validator が throw すると、`isSubmitting` を戻さない。フォームを作り直す(画面を開き直す)まで、入力欄は変更を受け付けない。上の例のようにボタンにも `isSubmitting` を渡していると、ボタンの表示も送信中のままになる。非同期の validator の reject は誤りとして受け取るので、入力を再開できる。今の validator は誤りを文言で返し(zod の `safeParse` など)、throw しない。直すには、送信の状態を戻す処理を `form.Form` に足す必要がある。
- **日付の欄へ移す focus のテスト**。送信の検証で止めたときに日付の欄へ focus を移すことは、happy-dom では、日付の欄(contenteditable)の selection の扱いで event の再帰が起き、テストのログが崩れるので、テストで確かめない。focus 自体は移るので、ほかの欄はテストで確かめ、日付の欄は Storybook で見る。
- **年 `0000` の日付**。contract が受け付ける年 `0000` は、日付の入力欄では扱わない(ユーザーが決めた)。React Aria Components が日付に使う `CalendarDate` で扱うには、別の入力表現を決める必要がある。

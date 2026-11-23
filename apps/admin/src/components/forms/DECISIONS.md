# 決めたことと理由(フォーム)

フォームの値と検証は TanStack Form で管理する(ユーザーが決めた)。部品は次の3層に分ける。

- `TextInput` は入力欄とその見た目を持つ。単独で使うときは呼び出し元がアクセシブルな名前を付ける。
- `TextField` は `TextInput` にラベル・補足・誤りの知らせを結び付ける。関連付けには React Aria Components の slot を使う。単独の呼び出し元は `defaultValue` と `validate` を使える。外から状態を管理するときは `value`・`onChange`・`onBlur`・`errorMessage` を使う。
- `@/components/forms` の `useAppForm` は TanStack Form の `createFormHook` で部品を登録する。feature は `form.AppField` の中で、field の値の型に合う部品を選ぶ。`field.TextField` は文字列の field の値・変更・blur と、validator が返した文字列の誤りの知らせを `TextField` に渡す。

`Form` の送信には `form.handleSubmit` を渡し、`form.Subscribe` で送信中の状態を反映する。`field.TextField` は React Aria Components の `validationBehavior="aria"` を指定する。必須の状態を伝えながら、ブラウザが送信を先に止めるのを防ぎ、TanStack Form の validator が出す誤りの知らせを入力欄に結び付ける。blur で出た誤りを直した直後の Enter でも、現在の値を検証して送れるように `canSubmitWhenInvalid` を使う。

```tsx
import { useAppForm } from "@/components/forms";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";

const form = useAppForm({
  canSubmitWhenInvalid: true,
  defaultValues: { title: "" },
  onSubmit,
});

return (
  <form.Subscribe selector={(state) => state.isSubmitting}>
    {(isSubmitting) => (
      <Form
        isPending={isSubmitting}
        onSubmit={() => {
          void form.handleSubmit();
        }}
      >
        <form.AppField name="title">
          {(field) => <field.TextField label={titleLabel} />}
        </form.AppField>
        <Button isPending={isSubmitting} type="submit">
          {saveLabel}
        </Button>
      </Form>
    )}
  </form.Subscribe>
);
```

blur で出る誤りと、送信時に受け取る誤りと、入力すると送信時の誤りが消えることを試せる story は、`__stories__/form.stories.tsx` に置く。

## 送信の途中の入力

`form.handleSubmit` を呼んでから、送信の検証と `onSubmit` が終わるまで(TanStack Form の `isSubmitting`)、`field.*` の部品は入力を受け付けない。送信の検証は、onChange・onBlur・onSubmit の validator を、その時点の値ですべて流し直す。止めないと、応答を待つ間に変えた入力が、検証した値と異なる値として `onSubmit` に渡る。`isSubmitting` は送信の検証の間も立つので、上の例の `Button` の `isPending` も、検証の応答を待つ間から送信中になる。

止めるときは、部品ごとに読み取り専用(`isReadOnly`)を渡す。`isDisabled`・`fieldset` の `disabled`・`inert` は、focus を外すので使わない。React Aria Components の context で `Form` からまとめて渡す案もあるが、primitives は `isReadOnly` の既定値の `false` を渡し、その `false` が context の値より勝つ。まとめて渡すには primitives が既定値を渡さないように直す必要があり、部品ごとに渡すより差分が大きい。読み取り専用だけでは止まらない `field.Select` と `field.NumberField` は、送信の途中の変更を受け取らない。React Aria Components の Select は読み取り専用を持たず、NumberField は読み取り専用でも、全選択して貼り付けた値を確定する。読み取り専用の見た目は primitives のまま変えない(NumberField の増減のボタンは無効の色になる)。

入力や blur で流れる非同期の validator(`onChangeAsync`・`onBlurAsync`)が答えるまでの間は、入力を止めない。止めると、打つたびに入力欄が止まり、続けて打てなくなる。送信のときに検証を流し直すので、送信の途中だけ止めれば、検証した値と `onSubmit` に渡る値はそろう。6種の部品を送信の途中に操作できる story は `__stories__/submitting.stories.tsx` に置く。

## Checkbox、Select、DateField

`CheckboxInput`・`SelectInput`・`DateInput` は、単独で使うときのアクセシブルな名前を呼び出し元から受け取る。ラベル付きの部品も同じ React Aria Components の root と入力の部品を組み合わせる。Checkbox のラベルはクリックして切り替えられるように CheckboxButton の中に置く。

`field.Checkbox` はチェックを外した値を `false` として渡す。初期値が `null` なら未操作の間はその値を保つ。`field.Select` は選択を解除した値を `null` で渡す。任意の Select では `null` のときも「選択なし」を選択中として表示し、その選択肢から矢印キーで移れるようにする。`field.DateField` は入力した日付を `YYYY-MM-DD` で渡す。

日付が未完の間は、React Aria Components の確定値に直前の日付が残る。単独の DateInput とラベル付きの DateField は、focus が外れた時点で同じ処理で年・月・日の状態を調べ、未完のときだけ React Aria Components の native の検証で送信を止める。TanStack Form が受け取った誤りは、ほかの入力と同じように表示する。呼び出し元が別の日付を渡したら、前の日付の未完の状態は引き継がない。

## NumberField、TextArea

`field.NumberField` は空の欄を `null` として渡す。React Aria Components の NumberField は空を `NaN` で表すので、入力欄に渡すときは `null` を `NaN` に、受け取るときは `NaN` を `null` に替える。`0` は入力した値として残る。`field.TextArea` は `field.TextField` と同じく、空の欄を空の文字列として渡す。

## 割り切ったこと

- **年 `0000` の日付**。contract が受け付ける年 `0000` は、日付の入力欄では扱わない(ユーザーが決めた)。React Aria Components が日付に使う `CalendarDate` で扱うには、別の入力表現を決める必要がある。

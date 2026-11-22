# 決めたことと理由(フォーム)

フォームの値と検証は TanStack Form で管理する(ユーザーが決めた)。部品は次の3層に分ける。

- `TextInput` は入力欄とその見た目を持つ。単独で使うときは呼び出し元がアクセシブルな名前を付ける。
- `TextField` は `TextInput` にラベル・補足・誤りの知らせを結び付ける。関連付けには React Aria Components の slot を使う。単独の呼び出し元は `defaultValue` と `validate` を使える。外から状態を管理するときは `value`・`onChange`・`onBlur`・`errorMessage` を使う。
- `@/components/forms` の `useAppForm` は TanStack Form の `createFormHook` で部品を登録する。feature は `form.AppField` の中で、項目の値の型に対応する部品を選ぶ。`field.TextField` は文字列の項目の値・変更・blur と、validator が返した文字列の誤りの知らせを `TextField` に渡す。

`Form` の送信には `form.handleSubmit` を渡し、`form.Subscribe` で送信中の状態を反映する。`field.TextField` は React Aria Components の `validationBehavior="aria"` を指定する。必須の状態を伝えながら、ブラウザが送信を先に止めるのを防ぎ、TanStack Form の validator が出す誤りの知らせを入力欄に結び付ける。

```tsx
import { useAppForm } from "@/components/forms";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";

const form = useAppForm({ defaultValues: { title: "" }, onSubmit });

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

入力、blur、送信時に受け取った項目ごとの誤りの知らせを試せる見本は `__stories__/form.stories.tsx` に置く。

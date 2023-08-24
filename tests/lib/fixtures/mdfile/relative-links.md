# Relative links

This is a valid [relative link](./absolute-links.md).

This is a valid [relative link](./absolute-links) without extension.

This is a valid [relative link](../assets/not-md.txt) to a file without `.md` extension.

![This is an image](../assets/pixel.png)

This is a valid [relative link](./folder-link) to a folder with an `index.md` file.

This is a valid [root link](/fixtures/mdfile/absolute-links.md).

This is a valid relative link with a valid [hash](./valid-internal.md#elementelement-type).

This is a valid relative link with an invalid [hash](./valid-internal.md#canevaluatescript).

This is a valid relative [label link][relative link].

This is an invalid relative [label link][relative link2].

This is a valid relative label link with a valid [hash][relative link3].

This is a valid relative label link with an invalid [hash][relative link4].

This is a valid root [label link][root link5].

This is an invalid root [label link][root link6].

[relative link]: ./invalid-internal.md
[relative link2]: ./invalid.md
[relative link3]: ../mdfile/valid-internal.md#elementelement-type
[relative link4]: ../mdfile/valid-internal.md#canevaluatescript
[root link5]: /fixtures/mdfile/valid-internal.md
[root link6]: /invalid-root.md
[empty link]: ../link/empty.md

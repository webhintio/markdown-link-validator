# Links

This is a file with all the possible links:

* [Absolute Links](#absolute-links)
* [Relative Links](#relative-links)

## Absolute Links

This link will not be detected as a link: http://example.com.

This is an absolute [link](http://example.com).

This is the same absolute [link](http://example.com).

This is an absolute link with [hash](http://example.com#title)

This is an absolute link using [link label][absolute link]

This is an absolute link with hash using [link label][absolute link2]

This is an absolute link using [link label][absolute link3]

This is a repeated absolute link using [link label][absolute link4]

This is a repetead absolute link using [link label][absolute link5]

## Relative Links

This is a relative [link](./doc1.md)

This is a repeated relative [link](./doc1.md)

This is a relative [link](./doc2/)

This is a relative [link](../docs/doc3.md)

This is a relative link with [hash](../docs/doc4.md#title)

![This is an image](../assets/pixel.png)

This is a relative link using [link label][relative link]

This is a relative link with hash using [link label][relative link2]

This is a relative link using [link label][relative link3]

This is a repeated relative link using [link label][relative link4]

This is a repeated relative link using [link label][relative link5]

[absolute link]: http://example2.com
[absolute link2]:http://example3.com#title
[absolute link3]:   http://example4.com
[absolute link4]:http://example4.com
[absolute link5]:  http://example.com
[relative link]: ../docs/d1.md
[relative link2]:../../more-docs/d1.md#title
[relative link3]:    ../docs/d2.md
[relative link4]: ../docs/d2.md
[relative link5]:  ../docs/doc3.md

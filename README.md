# query-nownownow

Search profiles from http://nownownow.com!

### Why?

http://nownownow.com has a lot of interesting profiles. I wanted to be able to be able to search them :).

### Usage

Pass `query-nownownow` regexs to match against profile fields.

```js
const queryNow = require('query-nownownow');

queryNow({
    location: /Canada/i,
    name: /Tom/i,
    title: /Engineer/i, // Professional title
    do: /Software/i, // What do you do?
    why: /People/i, // Why?,
    read: /Sivers/i, // What should we read?
});
```

### Test

```
npm test
```

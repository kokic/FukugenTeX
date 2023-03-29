
export const proxy = f => function (...xs) {
  return f(this, ...xs)
}

/* --- --- Link --- --- */

const defined = x => x != undefined
const point = (x, f) => ({ x: x, y: f(x) })

const Link = function (run, chain = true) {
  this.run = run
  this.chain = chain
  this.suspend = () => this.chain = false
  this.transfer = () => defined(this.next)
    ? (this.next.chain = this.chain) : true
  this.transphism = f => x => this.transfer() ? f(x) : undefined

  this.check = (predicate = defined) => this.next = new Link((...xs) =>
    (x => x.y ? x.x : (this.next.suspend(), undefined))
      (point(this.run(...xs), this.transphism(predicate))))

  this.pip = next => this.next = new Link((...xs) =>
    (x => defined(x.y) ? [x.x, x.y] : (this.next.suspend(), undefined))
      (point(this.run(...xs), this.transphism(next.run))))

  this.map = morph => this.next = new Link((...xs) =>
    this.transphism(morph)(this.run(...xs)))
}

export const link = run => new Link(run).check()

/* --- --- Parser --- --- */


const ParserState = function (input = '') {
  this.buffer = [...input]
  this.offset = -1
  this.source = input
  this.maximalindex = input.length - 1
  this.curr = () => this.buffer[this.offset]
  this.peek = () => this.buffer[this.offset + 1]
  this.next = () => this.buffer[++this.offset]
  this.hasNext = () => this.offset < this.maximalindex
  this.length = () => this.maximalindex - this.offset
  this.jump = n => this.offset += n
}


ParserState.prototype.update = function (data) {
  this.source = data.source
  this.buffer = data.buffer
  this.offset = data.offset
  this.maximalindex = data.maximalindex
}

ParserState.prototype.clone = function () {
  let copied = new ParserState()
  copied.source = this.source
  copied.buffer = this.buffer
  copied.offset = this.offset
  copied.maximalindex = this.maximalindex
  return copied
}

ParserState.prototype.substring = function (start = 0, end) {
  const index = this.offset + 1;
  start = index + start;
  (defined(end)) && (end = index + end)

  // console.log(start, end)
  return this.source.substring(start, end)
}



const state = s => new ParserState(s)


// console.log(new ParserState('𝔸 over 𝕜 in KᴬTᴇX' ))
// parse: ParserState -> [A, stub: String]

// Parse<A>.parse: String -> [A, String]
// 
const Parser = function (parse) {
  this.parse = parse
}

export default Parser

Parser.prototype.many = function () {
  return new Parser(state => {
    let [list, tuple] = [[]]
    while (tuple = this.parse(state)) {
      list.push(tuple[0])
      // residue = tuple[1]
    }
    return [list, '#stub_many']
  })
}

Parser.prototype.some = function () {
  return new Parser(source => {
    let tuple = this.many().parse(source)
    return tuple[0].length >= 1 ? tuple : undefined
  })
}

Parser.prototype.asterisk = function () {
  return new Parser(state => {
    let [buffer, tuple] = ['']
    // TODO: mark
    while (tuple = this.parse(state)) {
      // console.log(tuple)
      buffer += tuple[0]
      // residue = tuple[1]
    }
    return [buffer, '#stub_asterisk']
  })
}

Parser.prototype.plus = function () {
  return new Parser(state => {
    let tuple = this.asterisk().parse(state)
    return tuple[0].length >= 1 ? tuple : undefined
  })
}



/*
 *  tuple? -> [a, residue]
 *         -> [morph a, residue]
 */
Parser.prototype.map = function (morph) {
  return new Parser(state =>
    link(() => this.parse(state))
      .map(xs => [morph(xs[0]), xs[1]])
      .run()
  )
}


Parser.prototype.extend = function (append) {
  return this.follow(append).or(this)
}

Parser.prototype.first = proxy(x => x.map(tuple => tuple[0]))
Parser.prototype.second = proxy(x => x.map(tuple => tuple[1]))


Function.prototype.parse = proxy((x, s) => x().parse(s))

/*
 *  tuple1? -> [a, phase1]                 (check)
 *          -> [[a, phase1], tuple2?]      (glue )
 *          -> [[a, phase1], [b, phase2]]  (check)
 *          -> [[a, b], phase2]
 */
Parser.prototype.follow = function (next) {
  return new Parser(state => {
    let copied = state.clone()
    // console.log(state)
    return link(() => this.parse(copied))
      .pip(link(() => next.parse(copied)))
      .map(xs => (state.update(copied), [[xs[0][0], xs[1][0]], xs[1][1]]))
      .run()
  })
}

Parser.prototype.append = function (next) {
  return this.follow(next).map(xs => xs[0] + xs[1])
}

/*
 *  tuple1? -> [a, phase1]                 (check)
 *          -> [[a, phase1], tuple2?]      (glue )
 *          -> [[a, phase1], [b, phase2]]  (check)
 *          -> [a, phase2]
 */
Parser.prototype.skip = function (next) {
  return new Parser(state =>
    link(() => this.parse(state))
      .pip(link(() => next.parse(state)))
      .map(xs => [xs[0][0], xs[1][1]])
      .run()
  )
}


/*
 *  tuple1? -> [a, phase1]                 (check)
 *          -> [[a, phase1], tuple2?]      (glue )
 *          -> [[a, phase1], [b, phase2]]  (check)
 *          -> [b, phase2]
 */
Parser.prototype.move = function (next) {
  return new Parser(state =>
    link(() => this.parse(state))
      .pip(link(() => next.parse(state)))
      .map(xs => xs[1])
      .run()
  )
}

/*
 *  tuple? -> [a, residue]
 *         -> [a, residue] (check predicate)
 */
Parser.prototype.check = function (predicate) {
  return new Parser(state =>
    link(() => this.parse(state))
      .check(x => predicate(...x))
      .run()
  )
}

/*
 *  tuple1? -> tuple1 (check)
 *        ! -> tuple2
 */
Parser.prototype.or = function (next) {
  return new Parser(state => {
    return this.parse(state) || next.parse(state)
  })
}



Parser.prototype.log = function (s) {
  return this.map(x => (console.log(s + x), x))
}


/* Parser Builder & Basic Parser */

// const empty = new Parser(source => ['', source])

const token = predicate => new Parser(
  function (state) {
    // let x = [][+[]]
    // console.log(state.curr())
    return state.hasNext()
      ? predicate(state.peek())
        ? [state.next(), '#stub_token']
        : undefined
      : undefined
  }
)

const tokens = (n, predicate) => new Parser(
  function (state) {
    if (state.length() < n) return undefined

    const str = state.substring(0, n)
    // console.log(state)
    if (!predicate(str)) return undefined

    state.jump(n)
    return [str, '#stub_tokens']
  }
)
const inclusive = (n, ...xs) => tokens(n, x => xs.includes(x))

const character = char => token(x => x == char)
const includes = (...xs) => token(x => xs.includes(x))

// 

const string = str => new Parser(
  state => {
    let segment = state.substring()
    // console.log(segment)
    return state.hasNext()
      ? segment.startsWith(str)
        ? [(state.jump(str.length), str), '#stub_string']
        : undefined
      : undefined
  }
)


const space = character(' ')
const spacea = space.asterisk()
const spaces = space.plus()

const loose = x => spacea.follow(x).second()
const soft = x => loose(x).skip(spacea)

Number.prototype.boundedIn = proxy((x, a, b) => a <= x && x <= b)
String.prototype.code = proxy(x => x.codePointAt(0))
String.prototype.boundedIn = proxy((x, a, b) => x.code().boundedIn(a.code(), b.code()))

const digit = token(x => x.boundedIn('0', '9'))
const digits = digit.plus()

const letter = token(x => x.boundedIn('a', 'z') || x.boundedIn('A', 'Z'))
const letters = letter.plus()

export { Parser, ParserState, state }

export { token, tokens, character, includes, inclusive, string }
export { space, spacea, spaces, loose, soft }
export { digit, digits, letter, letters }

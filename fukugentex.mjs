
import {
  token,
  character,
  includes,
  inclusive,
  soft,
  string,
  digit,
  letter,
  letters,
  Parser,
  state,
  digits,
} from "./src/parsec.mjs"



const backslash = character('\\')

const lbrace = character('{')
const rbrace = character('}')
const braceWrap = x => lbrace.move(x).skip(rbrace)

const macroname = letters.append(digit.asterisk()).plus()
const macroh = backslash.move(macroname)
const macrohc = backslash.append(macroname)

const valueRef = () => newcommand_value
const unarymacro = macrohc.follow(valueRef)
const binarymacro = macrohc.follow(valueRef).follow(valueRef)

const newcommand_holder = braceWrap(macrohc)
const newcommand_value = braceWrap(valueRef)
  .or(binarymacro)
  .or(unarymacro)
  .or(macrohc)
  .or(letters)



const paramsc = new Parser(state => {
  if (state.peek() != '{') return undefined
  state.jump(2) // jump to '{', then jump to next

  let [start, counter] = [state.offset, 1]
  while (state.hasNext() && counter) {
    let curr = state.next();
    ((curr == '{') && counter++) ||
      ((curr == '}') && counter--)
  }
  
  return [
    state.source.substring(start, state.offset), 
    '#stub_paramsc'
  ]
})

const newcommand = macroh.check(x => x == "newcommand")
  .move(newcommand_holder)
  .follow(paramsc)
  .map(xs => lookup_map[xs[0]] = xs[1])

const lookup_map = new Object()

newcommand.parse(state('\\newcommand{\\CC}{\\mathbb}'))
newcommand.parse(state('\\newcommand{\\Ob}{\\operatorname{Ob}}'))
newcommand.parse(state('\\newcommand{\\defeq}{\\overset{\\text{def}}{=}}'))

console.log(lookup_map)



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

const macro_name = letters.append(digit.asterisk()).plus()
const macroh = backslash.move(macro_name)
const macrohc = backslash.append(macro_name)

const valueRef = () => newcommand_value
const unary_macro = macrohc.follow(valueRef)
const binary_macro = macrohc.follow(valueRef).follow(valueRef)

const newcommand_holder = braceWrap(macrohc)
const newcommand_value = braceWrap(valueRef)
  .or(binary_macro)
  .or(unary_macro)
  .or(macrohc)
  .or(letters)



const param_scanner = new Parser(state => {
  // console.log(state.curr())
  if (state.peek() != '{') return undefined
  let [position, counter, len] = [1, 1, state.source.length]
  while (position < len && counter) {
    let curr = state.source.charAt(position++);
    ((curr == '{') && counter++) ||
      ((curr == '}') && counter--)
  }
  return [
    state.source.substring(1, position - 1),
    // state.substring(position)
  ]
})

const newcommand = macroh.check(x => x == "newcommand")
  .move(newcommand_holder)
  .follow(param_scanner)
  // .map(xs => {
  //   console.log(xs)
  //   lookup_map[xs[0]] = xs[1]
  // })

const lookup_map = new Object()

let x = newcommand.parse(state('\\newcommand{\\CC}{\\mathbb}'))

console.log(x)

// newcommand.parse(state('\\newcommand{\\Ob}{\\operatorname{Ob}}'))
// newcommand.parse('\\newcommand{\\defeq}{\\overset{\\text{def}}{=}}')



// console.log(
//   character('a')
//     .move(character('b'))
//     .skip(character('c'))
//     .parse(state('abc'))
// )



console.log(lookup_map)


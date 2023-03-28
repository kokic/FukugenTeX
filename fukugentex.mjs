
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
} from "./src/parsec.mjs"



const backslash = character('\\')

const lbrace = character('{')
const rbrace = character('}')
const braceWrap = x => lbrace.move(x).skip(rbrace)

const macroName = letters.append(digit.asterisk()).plus()
const macroh = backslash.move(macroName)
const macrohc = backslash.append(macroName)

const valueRef = () => newcommandValue
const unaryMacro = macrohc.follow(valueRef)
const binaryMacro = macrohc.follow(valueRef).follow(valueRef)

const newcommandHolder = braceWrap(macrohc)
const newcommandValue = braceWrap(valueRef)
  .or(binaryMacro)
  .or(unaryMacro)
  .or(macrohc)
  .or(letters)



const bsscanner = new Parser(source => {
  if (source.charAt(0) != '{') return undefined
  let [position, counter, len] = [1, 1, source.length]
  while (position < len && counter) {
    let curr = source.charAt(position++);
    ((curr == '{') && counter++) ||
      ((curr == '}') && counter--)
  }
  return [
    source.substring(1, position - 1),
    source.substring(position)
  ]
})

const newcommand = macroh.check(x => x == "newcommand")
  .move(newcommandHolder)
  .follow(bsscanner)
  .map(xs => lookupMap[xs[0]] = xs[1])

const lookupMap = new Object()


// newcommand.parse(state('\\newcommand{\\CC}{\\mathbb}'))
// newcommand.parse('\\newcommand{\\Ob}{\\operatorname{Ob}}')
// newcommand.parse('\\newcommand{\\defeq}{\\overset{\\text{def}}{=}}')

console.log(
  character('a')
    .follow(character('b'))
    .map(x => x)
    .parse(state('abc'))
)


console.log(lookupMap)



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
} from "./src/parsec.mjs"

const backslash = character('\\')

const lbrace = character('{')
const rbrace = character('}')
const braceWrap = x => lbrace.move(x).skip(rbrace)

const macroName = letters.append(digit.asterisk()).plus()
const macroh = backslash.move(macroName)
const macrohc = backslash.append(macroName)

const valueRef = () => value
const unaryMacro = macrohc.append(macroName).append(valueRef)
const value = braceWrap(valueRef).or(unaryMacro).or(macrohc).or(letters)

const newcommand = macroh.check(x => x == "newcommand")
  .move(value).follow(value)
  .map(xs => lookupMap[xs[0]] = xs[1])

const lookupMap = new Object()

newcommand.parse('\\newcommand{\\CC}{\\mathbb}')

console.log(lookupMap)


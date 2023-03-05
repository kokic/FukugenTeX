
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

const newcommand = macroh.check(x => x == "newcommand")
  // .follow(value)
  // .follow(value)

console.log(newcommand.parse('\\newcommand'))

